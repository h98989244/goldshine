-- Migration: fix_agents_view_referred_users_rls_v2
-- Created at: 20260114194500
-- Description: 修復代理商查看推薦用戶的 RLS 政策,移除不必要的 EXISTS 檢查

-- 刪除舊的政策
DROP POLICY IF EXISTS "Agents can view their referred users" ON public.profiles;

-- 創建新的政策,使用最簡單的邏輯
CREATE POLICY "Agents can view their referred users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- 允許代理商查看他們推薦的用戶
  -- 只需要檢查 referred_by 欄位是否等於當前用戶 ID
  referred_by = auth.uid()
);

-- 註解:這個政策允許已認證的用戶查看 referred_by 欄位等於他們自己 ID 的記錄
-- 配合其他政策(Users can select own profile, Admin can view all profiles)一起使用
