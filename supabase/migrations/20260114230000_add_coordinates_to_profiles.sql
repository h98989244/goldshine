-- Migration: add_coordinates_to_profiles
-- Created at: 20260114230000
-- Description: Add latitude and longitude coordinates to profiles table for Google Maps integration

-- 1. Add coordinate columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- 2. Add check constraints to ensure valid coordinate ranges
ALTER TABLE public.profiles
ADD CONSTRAINT check_latitude_range CHECK (latitude >= -90 AND latitude <= 90),
ADD CONSTRAINT check_longitude_range CHECK (longitude >= -180 AND longitude <= 180);

-- 3. Create index for geospatial queries (useful for future location-based features)
CREATE INDEX IF NOT EXISTS idx_profiles_coordinates 
ON public.profiles(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 4. Add comments for documentation
COMMENT ON COLUMN public.profiles.latitude IS '門市緯度座標 (範圍: -90 到 90)';
COMMENT ON COLUMN public.profiles.longitude IS '門市經度座標 (範圍: -180 到 180)';
