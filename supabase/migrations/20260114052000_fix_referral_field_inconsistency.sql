-- Migration: fix_referral_field_inconsistency
-- Created at: 20260114052000
-- Description: 統一使用 referred_by 欄位,修復推薦關係無法建立的問題

-- 1. 將 referrer_id 的資料複製到 referred_by (如果 referred_by 為空)
UPDATE public.profiles
SET referred_by = referrer_id
WHERE referrer_id IS NOT NULL 
  AND (referred_by IS NULL OR referred_by != referrer_id);

-- 2. 刪除 referrer_id 欄位
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS referrer_id;

-- 3. 更新 handle_new_user trigger 使用 referred_by
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referred_by UUID;
  v_referral_code TEXT;
BEGIN
  -- 嘗試從 metadata 獲取推薦碼
  v_referral_code := NEW.raw_user_meta_data->>'referral_code';
  
  -- 如果有推薦碼,查找對應的用戶 ID
  IF v_referral_code IS NOT NULL THEN
    SELECT id INTO v_referred_by
    FROM public.profiles
    WHERE referral_code = v_referral_code
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, referral_code, role, referred_by)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'FJ' || UPPER(SUBSTRING(MD5(NEW.id::text) FROM 1 FOR 6)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    v_referred_by
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    referred_by = EXCLUDED.referred_by;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 建立索引以加速查詢
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by);

-- 5. 驗證資料遷移
-- 執行後可以用以下查詢確認:
-- SELECT COUNT(*) as total_referrals FROM profiles WHERE referred_by IS NOT NULL;
