-- =====================================================
-- 通知系統資料庫更新 Migration
-- 目的：新增缺少的欄位、建立 RLS policies、啟用 Realtime
-- =====================================================

-- 1. 新增缺少的欄位
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

-- 2. 建立索引提升查詢效能
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 3. 啟用 RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. 刪除舊的 policies（如果存在）
DROP POLICY IF EXISTS "Admin can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can update notifications" ON notifications;
DROP POLICY IF EXISTS "Users can mark their notifications as read" ON notifications;
DROP POLICY IF EXISTS "Admin can delete notifications" ON notifications;

-- 5. 建立新的 RLS Policies

-- Admin 可以看到所有通知
CREATE POLICY "Admin can view all notifications"
ON notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 用戶只能看到自己的通知或 target_role='all' 的通知
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR target_role = 'all'
  OR (target_role = 'user' AND user_id IS NULL)
);

-- Admin 可以插入通知
CREATE POLICY "Admin can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin 可以更新所有通知
CREATE POLICY "Admin can update notifications"
ON notifications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 用戶可以更新自己的通知（僅 is_read 欄位）
CREATE POLICY "Users can mark their notifications as read"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admin 可以刪除通知
CREATE POLICY "Admin can delete notifications"
ON notifications FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 6. 啟用 Realtime（需要在 Supabase Dashboard 執行或使用 SQL）
-- 注意：此指令可能需要 superuser 權限，如果失敗請在 Dashboard 手動啟用
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- 7. 新增註解說明
COMMENT ON COLUMN notifications.target_role IS '目標角色：admin, user, all';
COMMENT ON COLUMN notifications.order_id IS '關聯的訂單 ID（可選）';
COMMENT ON TABLE notifications IS '系統通知表，支援即時更新和權限控制';
