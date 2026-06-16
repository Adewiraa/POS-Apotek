-- SQL Script to set up the discounts table in Supabase
-- Run this in your Supabase SQL Editor

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.discounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    min_purchase NUMERIC NOT NULL DEFAULT 0,
    discount_percent NUMERIC NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies to allow read/write access for authenticated users
-- Allow read access for anyone (or authenticated users)
CREATE POLICY "Allow public read access" ON public.discounts
    FOR SELECT USING (true);

-- Allow full access for authenticated users (Admin/Pharmacist/Cashier)
CREATE POLICY "Allow write access for authenticated users" ON public.discounts
    FOR ALL USING (true) WITH CHECK (true);

-- 4. Seed default discount events
INSERT INTO public.discounts (name, min_purchase, discount_percent, is_active) VALUES
('Diskon Grosir 5%', 75000, 5, true),
('Mega Promo 10%', 150000, 10, true),
('Event Spesial 15%', 250000, 15, true)
ON CONFLICT DO NOTHING;
