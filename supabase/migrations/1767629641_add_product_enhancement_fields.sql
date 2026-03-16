-- Migration: add_product_enhancement_fields
-- Created at: 1767629641

-- 添加商品管理增強功能所需的新欄位
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_certificate BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS markup_amount DECIMAL(10,2) DEFAULT 0;;