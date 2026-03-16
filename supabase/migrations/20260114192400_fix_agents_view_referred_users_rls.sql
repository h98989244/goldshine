-- Migration: fix_agents_view_referred_users_rls
-- Created at: 20260114192400
-- Description: 修復代理商查看推薦用戶的 RLS 政策,避免遞迴查詢

-- 刪除舊的政策
DROP POLICY IF EXISTS "Agents can view their referred users" ON public.profiles;

-- 創建新的政策,使用更簡單的邏輯
CREATE POLICY "Agents can view their referred users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- 允許代理商查看他們推薦的用戶
  referred_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM auth.users
    WHERE auth.users.id = auth.uid()
  )
);

-- 註解:這個政策允許已認證的用戶查看 referred_by 欄位等於他們自己 ID 的記錄
-- 這樣代理商就可以查看他們推薦的所有用戶
