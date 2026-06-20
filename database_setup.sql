-- ==========================================
-- 💊 DATABASE SETUP SCRIPT FOR APOTEK APOGO
-- ==========================================
-- Run this script in the Supabase SQL Editor to initialize all tables, 
-- triggers, policies, and seed data for the Apotek ApoGo application.

-- ------------------------------------------
-- 1. PROFILES TABLE & AUTH SYNC TRIGGER
-- ------------------------------------------

-- Create profiles table linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    full_name TEXT,
    email VARCHAR(255),
    role VARCHAR(50) DEFAULT 'cashier' CHECK (role IN ('admin', 'pharmacist', 'cashier')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Allow public read access on profiles" ON public.profiles;
CREATE POLICY "Allow public read access on profiles" ON public.profiles 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all access on profiles for authenticated users" ON public.profiles;
CREATE POLICY "Allow all access on profiles for authenticated users" ON public.profiles 
    FOR ALL USING (true) WITH CHECK (true);

-- Sync function from auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Staf Baru'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'cashier')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute the sync function on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ------------------------------------------
-- 2. ROLE PERMISSIONS TABLE
-- ------------------------------------------

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'pharmacist', 'cashier')),
    menu_key VARCHAR(100) NOT NULL,
    is_allowed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(role, menu_key)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Permissions Policies
DROP POLICY IF EXISTS "Allow public read access on permissions" ON public.role_permissions;
CREATE POLICY "Allow public read access on permissions" ON public.role_permissions 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all access on permissions for authenticated users" ON public.role_permissions;
CREATE POLICY "Allow all access on permissions for authenticated users" ON public.role_permissions 
    FOR ALL USING (true) WITH CHECK (true);

-- Seed default permissions
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


-- ------------------------------------------
-- 3. DISCOUNTS TABLE
-- ------------------------------------------

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

-- Enable RLS
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- Discounts Policies
DROP POLICY IF EXISTS "Allow public read access" ON public.discounts;
CREATE POLICY "Allow public read access" ON public.discounts 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write access for authenticated users" ON public.discounts;
CREATE POLICY "Allow write access for authenticated users" ON public.discounts 
    FOR ALL USING (true) WITH CHECK (true);

-- Seed default discounts
INSERT INTO public.discounts (name, min_purchase, discount_percent, start_date, end_date, is_active) VALUES
('Diskon Grosir 5%', 75000, 5, '2026-01-01T00:00:00Z', '2030-12-31T23:59:59Z', true),
('Mega Promo 10%', 150000, 10, '2026-06-01T00:00:00Z', '2026-08-31T23:59:59Z', true)
ON CONFLICT DO NOTHING;


-- ------------------------------------------
-- 4. ALERT SETTINGS TABLE
-- ------------------------------------------

CREATE TABLE IF NOT EXISTS public.alert_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_enabled BOOLEAN DEFAULT false,
    email_recipient VARCHAR(255),
    whatsapp_enabled BOOLEAN DEFAULT false,
    whatsapp_recipient VARCHAR(50),
    low_stock_threshold INTEGER DEFAULT 10,
    expiry_months_threshold INTEGER DEFAULT 3,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.alert_settings ENABLE ROW LEVEL SECURITY;

-- Alert Settings Policies
DROP POLICY IF EXISTS "Allow public read on alert settings" ON public.alert_settings;
CREATE POLICY "Allow public read on alert settings" ON public.alert_settings 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write on alert settings" ON public.alert_settings;
CREATE POLICY "Allow write on alert settings" ON public.alert_settings 
    FOR ALL USING (true) WITH CHECK (true);

-- Seed default settings row if not present
INSERT INTO public.alert_settings (email_enabled, email_recipient, whatsapp_enabled, whatsapp_recipient, low_stock_threshold, expiry_months_threshold)
VALUES (false, 'apoteker@example.com', false, '081234567890', 10, 3)
ON CONFLICT DO NOTHING;


-- ------------------------------------------
-- 5. PURCHASE ORDERS TABLES
-- ------------------------------------------

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

-- PO Policies
DROP POLICY IF EXISTS "Allow public read on PO" ON public.purchase_orders;
CREATE POLICY "Allow public read on PO" ON public.purchase_orders FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write on PO" ON public.purchase_orders;
CREATE POLICY "Allow write on PO" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read on PO items" ON public.purchase_order_items;
CREATE POLICY "Allow public read on PO items" ON public.purchase_order_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write on PO items" ON public.purchase_order_items;
CREATE POLICY "Allow write on PO items" ON public.purchase_order_items FOR ALL USING (true) WITH CHECK (true);


-- ------------------------------------------
-- 6. DRUG RETURNS TABLE
-- ------------------------------------------

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

-- Enable RLS
ALTER TABLE public.drug_returns ENABLE ROW LEVEL SECURITY;

-- Returns Policies
DROP POLICY IF EXISTS "Allow public read access on returns" ON public.drug_returns;
CREATE POLICY "Allow public read access on returns" ON public.drug_returns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all access on returns for authenticated users" ON public.drug_returns;
CREATE POLICY "Allow all access on returns for authenticated users" ON public.drug_returns FOR ALL USING (true) WITH CHECK (true);


-- ------------------------------------------
-- 7. API PERMISSIONS GRANTS (ALL TABLES)
-- ------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_permissions TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discounts TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_settings TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drug_returns TO anon, authenticated, service_role;
