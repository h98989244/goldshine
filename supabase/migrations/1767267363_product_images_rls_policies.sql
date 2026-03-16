-- Migration: product_images_rls_policies
-- Created at: 1767267363

-- RLS policy: 允許公開讀取 product-images bucket
DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
CREATE POLICY "Public read product-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- RLS policy: 允許通過 Edge Function 上傳
DROP POLICY IF EXISTS "Allow upload product-images" ON storage.objects;
CREATE POLICY "Allow upload product-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND (auth.role() = 'anon' OR auth.role() = 'service_role')
  );

-- RLS policy: 允許刪除
DROP POLICY IF EXISTS "Allow delete product-images" ON storage.objects;
CREATE POLICY "Allow delete product-images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND (auth.role() = 'anon' OR auth.role() = 'service_role')
  );;