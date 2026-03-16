-- Migration: fix_missing_agent_referral_codes
-- Created at: 20260113230000
-- Description: 為所有沒有推薦碼的代理商自動生成推薦碼

-- 為所有沒有推薦碼的代理商生成推薦碼
UPDATE profiles
SET referral_code = 'AG' || UPPER(SUBSTRING(MD5(RANDOM()::text || id::text) FROM 1 FOR 8))
WHERE role = 'agent' 
  AND (referral_code IS NULL OR referral_code = '');
