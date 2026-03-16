-- Migration: update_handle_new_user_with_email
-- Created at: 20260113235500
-- Description: Update handle_new_user trigger to sync email

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_code TEXT;
BEGIN
  -- 嘗試從 metadata 獲取推薦碼
  v_referral_code := NEW.raw_user_meta_data->>'referral_code';
  
  -- 如果有推薦碼,查找對應的用戶 ID
  IF v_referral_code IS NOT NULL THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = v_referral_code
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, referral_code, role, referrer_id)
  VALUES (
    NEW.id,
    NEW.email,  -- 同步 email
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'FJ' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 6)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    v_referrer_id
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,  -- 更新時也同步 email
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    referrer_id = EXCLUDED.referrer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
