-- Migration: fix_handle_new_user_role
-- Created at: 20260113205000
-- Description: Fix handle_new_user trigger to support role field from user_metadata

-- 修改觸發器函數：從 user_metadata 讀取 role 並插入到 profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, referral_code, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'FJ' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 6)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
