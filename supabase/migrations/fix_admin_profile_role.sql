-- =====================================================
-- 檢查並修復 Admin Profile Role
-- 目的：確保當前登入的 admin 用戶有正確的 role 設置
-- =====================================================

-- 步驟 1: 檢查當前用戶的 profile
-- 替換 USER_ID 為實際的用戶 ID (從 console log 獲取)
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles 
WHERE id = '9c16b646-949a-4dbd-b653-0d14cae013af';

-- 步驟 2: 如果 role 不是 'admin',更新它
UPDATE profiles 
SET 
    role = 'admin',
    updated_at = NOW()
WHERE id = '9c16b646-949a-4dbd-b653-0d14cae013af';

-- 步驟 3: 驗證更新
SELECT 
    id,
    email,
    full_name,
    role,
    updated_at
FROM profiles 
WHERE id = '9c16b646-949a-4dbd-b653-0d14cae013af';

-- 步驟 4: 檢查所有 admin 用戶
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- 步驟 5: 如果需要,也可以檢查 auth.users 表
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    last_sign_in_at
FROM auth.users 
WHERE id = '9c16b646-949a-4dbd-b653-0d14cae013af';

-- 注意事項:
-- 1. 執行前請確認 USER_ID 正確
-- 2. 執行後請重新測試刪除用戶功能
-- 3. 如果問題仍然存在,請檢查 Edge Function 日誌
