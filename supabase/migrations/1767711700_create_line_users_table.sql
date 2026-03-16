-- Migration: create_line_users_table
-- Created at: 1767711700
-- Purpose: 儲存 LINE 用戶與 Supabase 用戶的對應關係

-- 創建 line_users 表
-- 創建 line_users 表
CREATE TABLE IF NOT EXISTS line_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  line_user_id TEXT UNIQUE NOT NULL,
  supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  picture_url TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_line_users_line_user_id ON line_users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_line_users_supabase_user_id ON line_users(supabase_user_id);

-- 啟用 RLS
ALTER TABLE line_users ENABLE ROW LEVEL SECURITY;

-- RLS 政策：用戶可以查看自己的 LINE 資料
DROP POLICY IF EXISTS "Users can view own LINE data" ON line_users;
CREATE POLICY "Users can view own LINE data" ON line_users 
  FOR SELECT USING (auth.uid() = supabase_user_id);

-- RLS 政策：Service role 完全訪問（用於 Edge Function）
DROP POLICY IF EXISTS "Service role full access line_users" ON line_users;
CREATE POLICY "Service role full access line_users" ON line_users 
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 創建更新時間的觸發器
CREATE OR REPLACE FUNCTION update_line_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS line_users_updated_at ON line_users;
CREATE TRIGGER line_users_updated_at
  BEFORE UPDATE ON line_users
  FOR EACH ROW
  EXECUTE FUNCTION update_line_users_updated_at();
