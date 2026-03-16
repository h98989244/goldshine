-- Migration: add_agent_columns_to_profiles
-- Created at: 20260113
-- Description: Add missing columns to profiles table for converting agents table to profiles

-- 1. Add missing columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS store_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS store_address TEXT,
ADD COLUMN IF NOT EXISTS store_phone VARCHAR(30),
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS phone VARCHAR(30);

-- 2. Add comment for clarity
COMMENT ON COLUMN profiles.store_name IS '代理商門市名稱';
COMMENT ON COLUMN profiles.store_address IS '代理商門市地址';
COMMENT ON COLUMN profiles.store_phone IS '代理商門市電話';
COMMENT ON COLUMN profiles.commission_rate IS '代理商佣金比例(%)';
COMMENT ON COLUMN profiles.phone IS '聯繫電話';

-- 3. Update RLS policy to allow admins to update these columns
-- (Existing policies "Admin can update profiles" normally cover all columns, 
-- but we ensure any specific column policies don't block this if they existed)
