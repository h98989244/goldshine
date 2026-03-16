-- Migration: Fix missing profiles and create admin account
-- Created at: 2026-01-09

-- 暫時停用通知觸發器以避免大量通知和 net schema 錯誤
ALTER TABLE public.profiles DISABLE TRIGGER user_registration_notification_trigger;

-- 步驟 1: 為所有沒有 profile 的 users 建立 profile
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', '未設定') as full_name,
    'user' as role,
    u.created_at,
    NOW() as updated_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 步驟 2: 建立 admin 使用者 (如果不存在)
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- 檢查 admin 是否已存在
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@thevgold.com';
    
    IF admin_user_id IS NULL THEN
        -- 建立新的 admin 使用者
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'admin@thevgold.com',
            crypt('Admin@TheVGold2026!', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"系統管理員"}',
            '',
            '',
            '',
            ''
        ) RETURNING id INTO admin_user_id;
        
        RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Admin user already exists with ID: %', admin_user_id;
    END IF;
    
    -- 建立或更新 admin profile
    INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
    VALUES (
        admin_user_id,
        'admin@thevgold.com',
        '系統管理員',
        'admin',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        full_name = '系統管理員',
        updated_at = NOW();
    
    RAISE NOTICE 'Admin profile created/updated';
END $$;

-- 重新啟用通知觸發器
ALTER TABLE public.profiles ENABLE TRIGGER user_registration_notification_trigger;
