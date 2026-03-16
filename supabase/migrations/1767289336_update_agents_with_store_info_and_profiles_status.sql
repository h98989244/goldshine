-- Migration: update_agents_with_store_info_and_profiles_status
-- Created at: 1767289336

-- 1. 擴展 agents 表，加入門市資訊（一對一關係）
ALTER TABLE agents 
ADD COLUMN IF NOT EXISTS name VARCHAR(100),
ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(30),
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS store_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS store_phone VARCHAR(30),
ADD COLUMN IF NOT EXISTS store_address TEXT,
ADD COLUMN IF NOT EXISTS store_hours VARCHAR(100);

-- 2. 擴展 profiles 表，加入狀態和更多資料欄位
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS birthday DATE,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 更新現有用戶為啟用狀態
UPDATE profiles SET is_active = TRUE WHERE is_active IS NULL;

-- 讓 agents.user_id 可為空（允許不綁定用戶的代理商）
ALTER TABLE agents ALTER COLUMN user_id DROP NOT NULL;;