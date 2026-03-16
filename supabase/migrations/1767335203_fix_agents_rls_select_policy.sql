-- Migration: fix_agents_rls_select_policy
-- Created at: 1767335203

-- 修復 agents RLS 策略
DROP POLICY IF EXISTS "Agents can view own data" ON agents;
DROP POLICY IF EXISTS "Allow authenticated to query agents" ON agents;

-- 允許任何認證用戶查詢代理商
CREATE POLICY "Allow authenticated to query agents" ON agents 
FOR SELECT USING (auth.role() = 'authenticated');;