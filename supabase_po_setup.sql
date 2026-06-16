-- SQL Script to setup purchase orders tables
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_number VARCHAR(100) NOT NULL UNIQUE,
    supplier_name VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('draft', 'sent', 'received')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    received_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    po_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    drug_id UUID NOT NULL REFERENCES public.drugs(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    received_quantity INTEGER DEFAULT 0 CHECK (received_quantity >= 0)
);

-- Enable RLS
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow public read on PO" ON public.purchase_orders;
CREATE POLICY "Allow public read on PO" ON public.purchase_orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write on PO" ON public.purchase_orders;
CREATE POLICY "Allow write on PO" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on PO items" ON public.purchase_order_items;
CREATE POLICY "Allow public read on PO items" ON public.purchase_order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write on PO items" ON public.purchase_order_items;
CREATE POLICY "Allow write on PO items" ON public.purchase_order_items FOR ALL USING (true) WITH CHECK (true);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO anon, authenticated, service_role;
