-- SQL Script to setup alert settings table
-- Run this in your Supabase SQL Editor

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

-- Policies
DROP POLICY IF EXISTS "Allow public read on alert settings" ON public.alert_settings;
CREATE POLICY "Allow public read on alert settings" ON public.alert_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow write on alert settings" ON public.alert_settings;
CREATE POLICY "Allow write on alert settings" ON public.alert_settings FOR ALL USING (true) WITH CHECK (true);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_settings TO anon, authenticated, service_role;

-- Seed default settings row if not present
INSERT INTO public.alert_settings (email_enabled, email_recipient, whatsapp_enabled, whatsapp_recipient, low_stock_threshold, expiry_months_threshold)
VALUES (false, 'apoteker@example.com', false, '081234567890', 10, 3);
