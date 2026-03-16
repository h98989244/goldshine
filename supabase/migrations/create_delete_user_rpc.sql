-- =====================================================
-- 創建 delete_user_by_id RPC 函數
-- 目的：允許 Admin 從前端直接刪除用戶 (替代 Edge Function)
-- =====================================================

-- 1. 創建函數
CREATE OR REPLACE FUNCTION delete_user_by_id(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth -- 確保可以訪問 auth schema
AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- 1. 檢查調用者是否為 admin
  SELECT role INTO current_user_role
  FROM public.profiles
  WHERE id = auth.uid();

  IF current_user_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION '權限不足: 僅管理員可以刪除用戶';
  END IF;

  -- 2. 防止刪除自己
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION '操作失敗: 無法刪除自己的帳號';
  END IF;

  -- 3. 刪除 auth.users (會自動 cascade 刪除 public.profiles)
  DELETE FROM auth.users WHERE id = target_user_id;
  
  -- 如果沒有刪除任何行 (ID 不存在)
  IF NOT FOUND THEN
    RAISE EXCEPTION '刪除失敗: 找不到該用戶 ID';
  END IF;
END;
$$;

-- 2. 授權 authenticated 角色調用此函數 (函數內部會檢查 admin 權限)
GRANT EXECUTE ON FUNCTION delete_user_by_id(UUID) TO authenticated;

-- =====================================================
-- 執行說明:
-- 1. 複製此內容到 Supabase SQL Editor
-- 2. 點擊 Run
-- =====================================================
