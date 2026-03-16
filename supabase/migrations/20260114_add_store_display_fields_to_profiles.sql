-- Migration: add_store_display_fields_to_profiles
-- Created at: 20260114
-- Description: Add store display control and multilingual fields to profiles table for dynamic store page

-- 1. Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_store_visible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS store_name_vi VARCHAR(100),
ADD COLUMN IF NOT EXISTS store_address_vi TEXT,
ADD COLUMN IF NOT EXISTS store_business_hours VARCHAR(100) DEFAULT '10:00 - 21:00 (週一至週日)';

-- 2. Create index for faster store queries
CREATE INDEX IF NOT EXISTS idx_profiles_store_visible 
ON public.profiles(role, is_store_visible) 
WHERE role = 'agent' AND is_store_visible = true;

-- 3. Set default values for existing agents with store information
-- Automatically make agents with store_name visible on the store page
UPDATE public.profiles 
SET is_store_visible = TRUE 
WHERE role = 'agent' 
  AND store_name IS NOT NULL 
  AND store_name != ''
  AND is_store_visible IS NULL;

-- 4. Add comments for documentation
COMMENT ON COLUMN public.profiles.is_store_visible IS '是否在門市頁面顯示此代理商門市';
COMMENT ON COLUMN public.profiles.store_name_vi IS '門市名稱(越南文)';
COMMENT ON COLUMN public.profiles.store_address_vi IS '門市地址(越南文)';
COMMENT ON COLUMN public.profiles.store_business_hours IS '營業時間';
