-- Migration: fix_stores_and_products_rls
-- Created at: 1767269399

-- 添加 stores 表的 INSERT/UPDATE/DELETE 權限
DROP POLICY IF EXISTS "Allow insert stores" ON stores;
CREATE POLICY "Allow insert stores" ON stores
  FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));

DROP POLICY IF EXISTS "Allow update stores" ON stores;
CREATE POLICY "Allow update stores" ON stores
  FOR UPDATE USING (auth.role() IN ('anon', 'authenticated', 'service_role'));

DROP POLICY IF EXISTS "Allow delete stores" ON stores;
CREATE POLICY "Allow delete stores" ON stores
  FOR DELETE USING (auth.role() IN ('anon', 'authenticated', 'service_role'));

-- 確保 products 表有完整權限
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow insert products') THEN
    CREATE POLICY "Allow insert products" ON products
      FOR INSERT WITH CHECK (auth.role() IN ('anon', 'authenticated', 'service_role'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Allow update products') THEN
    CREATE POLICY "Allow update products" ON products
      FOR UPDATE USING (auth.role() IN ('anon', 'authenticated', 'service_role'));
  END IF;
END $$;;