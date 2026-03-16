-- Migration: allow_guest_orders
-- Created at: 1767273654

-- 允許訪客下單（user_id 可為 NULL）
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;;