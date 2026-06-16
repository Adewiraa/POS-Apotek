-- SQL Script to update profiles table and add user management fields
-- Run this in your Supabase SQL Editor

-- 1. Add email column to profiles table if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2. Update existing demo profiles with their respective emails
UPDATE public.profiles SET email = 'admin@demo.com' WHERE role = 'admin';
UPDATE public.profiles SET email = 'apoteker@demo.com' WHERE role = 'pharmacist';
UPDATE public.profiles SET email = 'kasir@demo.com' WHERE role = 'cashier';

-- 3. Ensure proper permissions are granted to profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on profiles" ON public.profiles;
CREATE POLICY "Allow public read access on profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all access on profiles for authenticated users" ON public.profiles;
CREATE POLICY "Allow all access on profiles for authenticated users" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated, service_role;
