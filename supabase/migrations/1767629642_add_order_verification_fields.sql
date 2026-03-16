-- Migration: add_order_verification_fields
-- Created at: 1767629642

-- 添加訂單核銷相關欄位
-- 添加訂單核銷相關欄位
ALTER TABLE orders ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10);
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_verification_code_key') THEN 
        ALTER TABLE orders ADD CONSTRAINT orders_verification_code_key UNIQUE (verification_code); 
    END IF; 
END $$;

ALTER TABLE orders ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS verification_proof_image_url TEXT;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_orders_verification_code ON orders(verification_code);
CREATE INDEX IF NOT EXISTS idx_orders_verified_by ON orders(verified_by);

-- 為現有訂單生成核銷碼
UPDATE orders 
SET verification_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))
WHERE verification_code IS NULL;;