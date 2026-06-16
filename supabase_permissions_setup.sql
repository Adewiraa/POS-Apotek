-- SQL Script to setup dynamic role-based permissions
-- Run this in your Supabase SQL Editor

-- 1. Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL,
    menu_key VARCHAR(100) NOT NULL,
    is_allowed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(role, menu_key)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 3. Set policies
DROP POLICY IF EXISTS "Allow public read access on permissions" ON public.role_permissions;
CREATE POLICY "Allow public read access on permissions" ON public.role_permissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all access on permissions for authenticated users" ON public.role_permissions;
CREATE POLICY "Allow all access on permissions for authenticated users" ON public.role_permissions FOR ALL USING (true) WITH CHECK (true);

-- 4. Seed default permissions for Admin, Apoteker (pharmacist), and Kasir (cashier)
INSERT INTO public.role_permissions (role, menu_key, is_allowed) VALUES
-- Admin permissions
('admin', 'pos', true),
('admin', 'inventory', true),
('admin', 'controlled_logs', true),
('admin', 'reports', true),
('admin', 'discounts', true),
('admin', 'users', true),
-- Pharmacist permissions
('pharmacist', 'pos', true),
('pharmacist', 'inventory', true),
('pharmacist', 'controlled_logs', true),
('pharmacist', 'reports', false),
('pharmacist', 'discounts', false),
('pharmacist', 'users', false),
-- Cashier permissions
('cashier', 'pos', true),
('cashier', 'inventory', false),
('cashier', 'controlled_logs', false),
('cashier', 'reports', false),
('cashier', 'discounts', false),
('cashier', 'users', false)
ON CONFLICT (role, menu_key) DO UPDATE SET is_allowed = EXCLUDED.is_allowed;

-- 5. Grant API privileges to the role_permissions table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO anon, authenticated, service_role;
