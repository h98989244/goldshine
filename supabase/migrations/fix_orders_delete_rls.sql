-- Migration: fix_orders_delete_rls
-- Purpose: 允許 Admin 刪除訂單，並確保刪除時連同 order_items 一起刪除

-- 1. 新增 RLS Policy 允許 Admin 刪除訂單
DROP POLICY IF EXISTS "Admin can delete orders" ON orders;

CREATE POLICY "Admin can delete orders"
ON orders FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 2. 修改 order_items 的外鍵約束，加入 ON DELETE CASCADE
-- 這樣刪除訂單時，會自動刪除關聯的訂單項目，避免 Foreign Key Violation
DO $$
BEGIN
  -- 嘗試找出正確的 constraint 名稱（通常是 order_items_order_id_fkey）
  IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'order_items_order_id_fkey' AND table_name = 'order_items'
  ) THEN
      ALTER TABLE order_items DROP CONSTRAINT order_items_order_id_fkey;
      
      ALTER TABLE order_items
      ADD CONSTRAINT order_items_order_id_fkey
      FOREIGN KEY (order_id)
      REFERENCES orders(id)
      ON DELETE CASCADE;
  END IF;
END $$;
