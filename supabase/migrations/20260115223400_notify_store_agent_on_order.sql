-- Migration: notify_store_agent_on_order
-- Created at: 2026-01-15
-- Description: Updates order notification trigger to notify store agents when orders are placed for pickup at their store

CREATE OR REPLACE FUNCTION handle_new_order_notification()
RETURNS TRIGGER AS $$
DECLARE
    admin_record RECORD;
BEGIN
    -- 1. 通知客戶
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

    -- 2. 通知管理員
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

    -- 3. 通知門市代理商 (新增)
    IF NEW.store_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, title_vi, content, content_vi, metadata, recipient_role)
        VALUES (
            NEW.store_id,
            'order',
            '新門市訂單',
            'Đơn hàng mới tại cửa hàng',
            '收到新的門市領取訂單 #' || NEW.order_number || 
            CASE 
                WHEN NEW.pickup_date IS NOT NULL 
                THEN '，預約取貨日期：' || NEW.pickup_date 
                ELSE '' 
            END,
            'Đã nhận đơn hàng lấy tại cửa hàng #' || NEW.order_number ||
            CASE 
                WHEN NEW.pickup_date IS NOT NULL 
                THEN ', Ngày hẹn lấy hàng: ' || NEW.pickup_date 
                ELSE '' 
            END,
            jsonb_build_object(
                'order_id', NEW.id, 
                'action_url', '/agent',
                'pickup_date', NEW.pickup_date,
                'pickup_time_slot', NEW.pickup_time_slot
            ),
            'agent'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_order_created_notification ON orders;
CREATE TRIGGER on_order_created_notification
    AFTER INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_order_notification();
