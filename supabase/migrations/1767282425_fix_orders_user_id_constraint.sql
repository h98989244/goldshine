-- Migration: fix_orders_user_id_constraint
-- Created at: 1767282425

-- 移除orders.user_id的外鍵約束，改為允許null並指向auth.users
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;

-- 確保user_id可以為null
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

-- 添加新的外鍵約束指向auth.users（如果需要），或保持無約束允許訪客訂單
-- 不添加新約束，允許訪客預約;