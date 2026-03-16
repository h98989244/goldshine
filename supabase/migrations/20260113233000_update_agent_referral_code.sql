-- Up Migration
UPDATE public.profiles
SET referral_code = '26F6A030'
FROM auth.users
WHERE profiles.id = auth.users.id
AND auth.users.email = 'wastic37@yahoo.com.tw';
