-- Migration: fix_product_images_upload_policy
-- Created at: 1736703458
-- 修復商品圖片上傳權限問題

-- 刪除舊的上傳政策
DROP POLICY IF EXISTS "Allow upload product-images" ON storage.objects;

-- 刪除舊的刪除政策
DROP POLICY IF EXISTS "Allow delete product-images" ON storage.objects;

-- 建立新的上傳政策:允許 authenticated 用戶、anon 用戶和 service_role 上傳
CREATE POLICY "Allow authenticated upload product-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon' OR auth.role() = 'service_role')
  );

-- 建立新的更新政策:允許 authenticated 用戶、anon 用戶和 service_role 更新
CREATE POLICY "Allow authenticated update product-images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images'
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon' OR auth.role() = 'service_role')
  );

-- 建立新的刪除政策:允許 authenticated 用戶、anon 用戶和 service_role 刪除
CREATE POLICY "Allow authenticated delete product-images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND (auth.role() = 'authenticated' OR auth.role() = 'anon' OR auth.role() = 'service_role')
  );
