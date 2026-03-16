-- Migration: add_verification_proof_image
-- Created at: 1767629673

-- 添加憑證圖片欄位
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS verification_proof_image_url TEXT;

-- 為現有訂單生成核銷碼（如果沒有的話）
UPDATE orders 
SET verification_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6))
WHERE verification_code IS NULL OR verification_code = '';;