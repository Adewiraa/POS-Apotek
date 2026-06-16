-- SQL Script to set up the discounts table in Supabase
-- Run this in your Supabase SQL Editor

-- -------------------------------------------------------------
-- JIKA ANDA SUDAH MEMBUAT TABEL SEBELUMNYA:
-- Jalankan perintah ALTER TABLE di bawah ini untuk menambahkan kolom tanggal:
--
-- ALTER TABLE public.discounts 
-- ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE,
-- ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;
-- -------------------------------------------------------------

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    min_purchase NUMERIC NOT NULL DEFAULT 0,
    discount_percent NUMERIC NOT NULL DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies to allow read/write access for authenticated users
-- Allow read access for anyone
DROP POLICY IF EXISTS "Allow public read access" ON public.discounts;
CREATE POLICY "Allow public read access" ON public.discounts
    FOR SELECT USING (true);

-- Allow full access for authenticated users (Admin/Pharmacist/Cashier)
DROP POLICY IF EXISTS "Allow write access for authenticated users" ON public.discounts;
CREATE POLICY "Allow write access for authenticated users" ON public.discounts
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Seed default discount events with date ranges (e.g. Active from 2026 to 2030)
INSERT INTO public.discounts (name, min_purchase, discount_percent, start_date, end_date, is_active) VALUES
('Diskon Grosir 5%', 75000, 5, '2026-01-01T00:00:00Z', '2030-12-31T23:59:59Z', true),
('Mega Promo 10%', 150000, 10, '2026-06-01T00:00:00Z', '2026-08-31T23:59:59Z', true)
ON CONFLICT DO NOTHING;
