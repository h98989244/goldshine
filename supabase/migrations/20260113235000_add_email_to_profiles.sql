-- Migration: add_email_to_profiles
-- Created at: 20260113235000
-- Description: Add email column to profiles table and sync from auth.users

-- 1. Add email column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 2. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 3. Sync existing emails from auth.users to profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 4. Add comment
COMMENT ON COLUMN public.profiles.email IS '用戶 Email (從 auth.users 同步)';
