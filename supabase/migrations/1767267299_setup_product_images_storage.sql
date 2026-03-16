-- Migration: setup_product_images_storage
-- Created at: 1767267299

-- Enable RLS on storage.objects
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access for product-images bucket
DROP POLICY IF EXISTS "Public read access for product-images" ON storage.objects;
CREATE POLICY "Public read access for product-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

-- Allow upload via Edge Function (CRITICAL!)
DROP POLICY IF EXISTS "Allow upload via edge function" ON storage.objects;
CREATE POLICY "Allow upload via edge function" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND (auth.role() = 'anon' OR auth.role() = 'service_role')
  );

-- Allow service_role to delete (optional)
DROP POLICY IF EXISTS "Service role delete only" ON storage.objects;
CREATE POLICY "Service role delete only" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND auth.role() = 'service_role');;