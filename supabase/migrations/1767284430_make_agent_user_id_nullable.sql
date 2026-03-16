-- Migration: make_agent_user_id_nullable
-- Created at: 1767284430

-- 允許代理商不需要關聯用戶帳號
ALTER TABLE agents ALTER COLUMN user_id DROP NOT NULL;;