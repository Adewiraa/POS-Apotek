import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoice_number, prescription_id, discount, tax, items, payments } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Keranjang belanja kosong.' }, { status: 400 });
    }

    if (!payments || payments.length === 0) {
      return NextResponse.json({ error: 'Metode pembayaran belum ditentukan.' }, { status: 400 });
    }

    // 1. Hitung total belanja dari items
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.quantity * item.price;
    }
    const total_amount = subtotal - (discount || 0) + (tax || 0);

    // 2. Hitung total uang pembayaran yang masuk
    let total_payment_entered = 0;
    for (const pay of payments) {
      total_payment_entered += pay.amount;
    }

    // Toleransi desimal kecil
    if (Math.abs(total_payment_entered - total_amount) > 1) {
      return NextResponse.json({
        error: `Jumlah pembayaran (${total_payment_entered}) tidak sama dengan total tagihan (${total_amount}).`
      }, { status: 400 });
    }

    // 3. Validasi stok batch sebelum melakukan insert
    for (const item of items) {
      const { data: batch, error: batchError } = await supabase
        .from('drug_batches')
        .select('stock, batch_number')
        .eq('id', item.batch_id)
        .single();

      if (batchError || !batch) {
        return NextResponse.json({ error: `Batch obat tidak ditemukan.` }, { status: 400 });
      }

      if (batch.stock < item.quantity) {
        return NextResponse.json({
          error: `Stok untuk batch ${batch.batch_number} tidak mencukupi. Sisa stok: ${batch.stock}, diminta: ${item.quantity}.`
        }, { status: 400 });
      }
    }

    // 4. Daftarkan penjualan utama (Sales)
    // Ambil cashier_id. Di sini kita menggunakan fallback UUID untuk demo jika belum ada autentikasi aktif
    let cashier_id = '00000000-0000-0000-0000-000000000000';
    
    // Periksa user aktif dari Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      cashier_id = user.id;
    } else {
      // Cari profil admin/cashier pertama untuk demo
      const { data: profile } = await supabase.from('profiles').select('id').limit(1).single();
      if (profile) cashier_id = profile.id;
    }

    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([{
        invoice_number,
        cashier_id,
        prescription_id: prescription_id || null,
        total_amount,
        discount: discount || 0,
        tax: tax || 0
      }])
      .select()
      .single();

    if (saleError || !sale) {
      return NextResponse.json({ error: `Gagal mencatat invoice: ${saleError?.message}` }, { status: 500 });
    }

    // 5. Masukkan item penjualan & update stok batch (looping)
    for (const item of items) {
      // Insert sale_items
      const { error: itemInsertError } = await supabase
        .from('sale_items')
        .insert([{
          sale_id: sale.id,
          drug_id: item.drug_id,
          batch_id: item.batch_id,
          quantity: item.quantity,
          price: item.price
        }]);

      if (itemInsertError) {
        return NextResponse.json({ error: `Gagal mencatat item penjualan: ${itemInsertError.message}` }, { status: 500 });
      }

      // Update stok di drug_batches (Pengurangan stok)
      const { data: currentBatch } = await supabase
        .from('drug_batches')
        .select('stock')
        .eq('id', item.batch_id)
        .single();
      
      const newStock = (currentBatch?.stock || 0) - item.quantity;
      await supabase
        .from('drug_batches')
        .update({ stock: newStock })
        .eq('id', item.batch_id);

      // Cek kategori obat. Jika Narkotika / Psikotropika, tulis log pengeluaran otomatis
      const { data: drugInfo } = await supabase
        .from('drugs')
        .select('category')
        .eq('id', item.drug_id)
        .single();

      if (drugInfo && (drugInfo.category === 'Psikotropika' || drugInfo.category === 'Narkotika')) {
        await supabase
          .from('controlled_drug_logs')
          .insert([{
            drug_id: item.drug_id,
            batch_id: item.batch_id,
            user_id: cashier_id,
            type: 'out',
            quantity: item.quantity,
            notes: `Penjualan resep via invoice ${invoice_number}`
          }]);
      }
    }

    // 6. Masukkan rincian metode pembayaran (Multi-Payment)
    for (const pay of payments) {
      const { error: payInsertError } = await supabase
        .from('sale_payments')
        .insert([{
          sale_id: sale.id,
          payment_method: pay.payment_method,
          amount: pay.amount,
          reference_number: pay.reference_number || null
        }]);

      if (payInsertError) {
        return NextResponse.json({ error: `Gagal mencatat metode pembayaran: ${payInsertError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Transaksi checkout berhasil diselesaikan.',
      invoice: invoice_number,
      sale_id: sale.id
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Terjadi kesalahan internal.' }, { status: 500 });
  }
}
