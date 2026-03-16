-- Migration: upgrade_notification_system
-- Created by: Agent
-- Description: Adds metadata and recipient_role to notifications, and sets up trigger for new orders.

-- 1. Add new columns
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS recipient_role TEXT DEFAULT 'user';

-- 2. Update Notification RLS (Optional/Confirmation)
-- Ensure Admins can see notifications addressed to them (role='admin') or specific user_id
-- For now, we rely on inserting separate rows for admins so standard RLS (user_id = auth.uid()) works.
-- But if we want to allow admins to see "recipient_role='admin'" rows even if user_id is null:
DROP POLICY IF EXISTS "Admins can view global/admin notifications" ON notifications;
CREATE POLICY "Admins can view global/admin notifications" ON notifications
    FOR SELECT USING (
        (recipient_role = 'admin' OR recipient_role = 'global')
        AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 3. Trigger for New Orders
CREATE OR REPLACE FUNCTION handle_new_order_notification()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
BEGIN
    -- 1. Notify the Customer (User)
    IF NEW.user_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, title_vi, content, content_vi, metadata, recipient_role)
        VALUES (
            NEW.user_id,
            'order',
            '訂單建立成功',
            'Đặt hàng thành công',
            '您的訂單 #' || NEW.order_number || ' 已成功建立。',
            'Đơn hàng #' || NEW.order_number || ' của bạn đã được tạo thành công.',
            jsonb_build_object('order_id', NEW.id, 'action_url', '/orders'),
            'user'
        );
    END IF;

    -- 2. Notify Admins
    -- Broad strategy: Insert individual notifications for all admins so they track read/unread separately.
    FOR admin_record IN SELECT id FROM profiles WHERE role = 'admin' OR full_name LIKE '%admin%' LOOP
        INSERT INTO notifications (user_id, type, title, title_vi, content, content_vi, metadata, recipient_role)
        VALUES (
            admin_record.id,
            'order',
            '新訂單通知',
            'Thông báo đơn hàng mới',
            '收到新訂單 #' || NEW.order_number,
            'Đã nhận đơn hàng mới #' || NEW.order_number,
            jsonb_build_object('order_id', NEW.id, 'action_url', '/admin/orders'),
            'admin'
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_order_created_notification ON orders;
CREATE TRIGGER on_order_created_notification
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_order_notification();
