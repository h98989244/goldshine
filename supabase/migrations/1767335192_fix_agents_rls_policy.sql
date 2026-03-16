-- Migration: fix_agents_rls_policy
-- Created at: 1767335192

-- 修復 agents RLS 策略，允許認證用戶查詢自己的代理商資料
DROP POLICY IF EXISTS "Agents can view own data" ON agents;
DROP POLICY IF EXISTS "Authenticated users can view agents" ON agents;

-- 允許任何認證用戶查詢代理商（用於登入驗證）
DROP POLICY IF EXISTS "Allow authenticated to query agents" ON agents;
CREATE POLICY "Allow authenticated to query agents" ON agents 
FOR SELECT USING (auth.role() = 'authenticated');

-- 允許管理員和代理商本人更新
DROP POLICY IF EXISTS "Agents can update own data" ON agents;
CREATE POLICY "Agents can update own data" ON agents FOR UPDATE 
USING (auth_user_id = auth.uid());;