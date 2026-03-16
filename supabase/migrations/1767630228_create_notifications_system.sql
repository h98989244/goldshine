-- Migration: create_notifications_system
-- Created at: 1767630228

-- 創建通知表
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    title_vi VARCHAR(200),
    content TEXT,
    content_vi TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加索引
-- 添加索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);

-- 添加RLS策略
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 允許用戶查看自己的通知
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- 允許管理員查看所有通知
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
CREATE POLICY "Admins can view all notifications" ON notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (full_name LIKE '%admin%' OR full_name LIKE '%管理員%')
        )
    );

-- 允許用戶更新自己的通知狀態
DROP POLICY IF EXISTS "Users can update their own notification status" ON notifications;
CREATE POLICY "Users can update their own notification status" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 允許管理員插入通知
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
CREATE POLICY "Admins can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (full_name LIKE '%admin%' OR full_name LIKE '%管理員%')
        )
    );

-- 創建觸發器自動更新updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 創建函數用於發送通知
CREATE OR REPLACE FUNCTION send_notification(
    p_user_id UUID,
    p_type VARCHAR(30),
    p_title VARCHAR(200),
    p_title_vi VARCHAR(200) DEFAULT NULL,
    p_content TEXT DEFAULT NULL,
    p_content_vi TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    notification_id INTEGER;
BEGIN
    INSERT INTO notifications (user_id, type, title, title_vi, content, content_vi)
    VALUES (p_user_id, p_type, p_title, p_title_vi, p_content, p_content_vi)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;