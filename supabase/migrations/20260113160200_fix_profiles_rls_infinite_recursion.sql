-- Migration: fix_profiles_rls_infinite_recursion
-- Created at: 20260113160200
-- Description: Fix infinite recursion in profiles RLS policies by using auth.jwt() instead of querying profiles table

-- 刪除導致無限遞迴的政策
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 重新創建不會造成遞迴的 RLS 政策
-- 使用 auth.jwt() 來檢查角色,而不是查詢 profiles 表

-- 用戶可以查看自己的 profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 用戶可以更新自己的 profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Admin 可以查看所有 profiles (使用 JWT claims 而非查詢 profiles)
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT
  USING (
    auth.uid() = id 
    OR 
    (auth.jwt() ->> 'role')::text = 'admin'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

-- Admin 可以更新所有 profiles (使用 JWT claims 而非查詢 profiles)
CREATE POLICY "Admin can update all profiles" ON profiles
  FOR UPDATE
  USING (
    auth.uid() = id 
    OR 
    (auth.jwt() ->> 'role')::text = 'admin'
    OR
    (auth.jwt() -> 'user_metadata' ->> 'role')::text = 'admin'
  );

-- Service role 完全訪問
CREATE POLICY "Service role full access" ON profiles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
