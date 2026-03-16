-- Migration: add_referrer_id_and_update_trigger
-- Created at: 20260113230000
-- Description: Add referrer_id to profiles and update handle_new_user to process referral codes

-- 1. Add referrer_id column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS referrer_id UUID REFERENCES public.profiles(id);

-- 2. Create index on referral_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);

-- 3. Update handle_new_user trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_code TEXT;
BEGIN
  -- 嘗試從 metadata 獲取推薦碼
  v_referral_code := NEW.raw_user_meta_data->>'referral_code';
  
  -- 如果有推薦碼，查找對應的用戶 ID
  IF v_referral_code IS NOT NULL THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = v_referral_code
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, full_name, referral_code, role, referrer_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'FJ' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 6)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    v_referrer_id
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
