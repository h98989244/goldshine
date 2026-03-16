-- Migration: force_schema_reload_and_verify_fk
-- Created at: 20260113155500
-- Description: Verify foreign keys exist and force schema cache reload

-- 1. 檢查並確保 orders.user_id 外鍵存在
DO $$
BEGIN
  -- 如果外鍵約束不存在,則創建它
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'orders_user_id_fkey' 
    AND table_name = 'orders'
  ) THEN
    -- 先確保欄位存在
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'user_id'
    ) THEN
      ALTER TABLE orders ADD COLUMN user_id UUID;
    END IF;
    
    -- 添加外鍵約束
    ALTER TABLE orders 
    ADD CONSTRAINT orders_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES profiles(id) 
    ON DELETE SET NULL;
  END IF;
END $$;

-- 2. 創建索引(如果不存在)
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- 3. 強制 PostgREST 重新載入 schema cache
-- 這個通知會觸發 Supabase 重新載入 schema
NOTIFY pgrst, 'reload schema';

-- 4. 添加註解
COMMENT ON COLUMN orders.user_id IS '下單用戶 ID,關聯到 profiles 表';
