-- SQL Script to setup drug returns table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.drug_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('customer', 'supplier')),
    invoice_number VARCHAR(100),
    drug_id UUID NOT NULL REFERENCES public.drugs(id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES public.drug_batches(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.drug_returns ENABLE ROW LEVEL SECURITY;

-- Set policies
DROP POLICY IF EXISTS "Allow public read access on returns" ON public.drug_returns;
CREATE POLICY "Allow public read access on returns" ON public.drug_returns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all access on returns for authenticated users" ON public.drug_returns;
CREATE POLICY "Allow all access on returns for authenticated users" ON public.drug_returns FOR ALL USING (true) WITH CHECK (true);

-- Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drug_returns TO anon, authenticated, service_role;
