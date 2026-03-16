-- Migration: fix_profile_creation_trigger
-- Created at: 1767272442

-- 創建觸發器函數：自動為新用戶創建 profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'FJ' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 6))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 刪除舊觸發器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 創建觸發器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();;