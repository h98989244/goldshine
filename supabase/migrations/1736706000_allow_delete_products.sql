-- Migration: allow_delete_products
-- Created at: 1736706000
-- 允許刪除商品 (配合前端改為 Hard Delete)

-- 建立新的刪除政策:允許 authenticated 用戶、anon 用戶和 service_role 刪除
CREATE POLICY "Allow delete products" ON products
  FOR DELETE USING (
    auth.role() = 'authenticated' OR auth.role() = 'anon' OR auth.role() = 'service_role'
  );
