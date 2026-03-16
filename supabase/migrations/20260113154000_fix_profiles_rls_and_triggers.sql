-- Migration: fix_profiles_rls_and_triggers
-- Created at: 20260113154000
-- Description: Fix profiles table RLS policies and triggers causing 500 errors

-- 1. 暫時禁用可能有問題的觸發器(使用 DO 塊來處理不存在的情況)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'user_registration_notification_trigger') THEN
    ALTER TABLE profiles DISABLE TRIGGER user_registration_notification_trigger;
  END IF;
END $$;

-- 2. 確保 profiles 表的 RLS 政策正確
-- 刪除可能衝突的舊政策
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;

-- 3. 重新創建簡單且正確的 RLS 政策
-- 用戶可以查看自己的 profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 用戶可以更新自己的 profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admin 可以查看所有 profiles
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Admin 可以更新所有 profiles
CREATE POLICY "Admin can update all profiles" ON profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- 4. 重新啟用觸發器(如果存在)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'user_registration_notification_trigger') THEN
    ALTER TABLE profiles ENABLE TRIGGER user_registration_notification_trigger;
  END IF;
END $$;
