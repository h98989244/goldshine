-- Migration: add_agent_auth_support
-- Created at: 1767333670

-- 在profiles表添加角色標識
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 更新agents表，確保email用於登入
ALTER TABLE agents ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_agents_auth_user_id ON agents(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);

-- 更新RLS策略讓代理商只能看到自己的數據
DROP POLICY IF EXISTS "Agents can view own data" ON agents;
CREATE POLICY "Agents can view own data" ON agents FOR SELECT 
USING (auth_user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
));

DROP POLICY IF EXISTS "Agents can update own data" ON agents;
CREATE POLICY "Agents can update own data" ON agents FOR UPDATE 
USING (auth_user_id = auth.uid());;