-- Migration: fix_orders_profiles_relationship
-- Created at: 20260113150000
-- Description: Fix the foreign key relationship between orders and profiles tables

-- 確保 orders 表有正確的 user_id 欄位並指向 profiles
-- 如果 user_id 欄位不存在,則添加它
ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 如果有舊的 store_id 關聯到 profiles 的情況,我們需要確保使用 user_id
-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- 添加註解
COMMENT ON COLUMN orders.user_id IS '下單用戶 ID,關聯到 profiles 表';
