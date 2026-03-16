-- Migration: add_user_registration_notification_trigger
-- Created at: 1767630588

-- 創建用戶註冊通知觸發器函數
CREATE OR REPLACE FUNCTION notify_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- 只有在新建用戶時才發送通知
  IF TG_OP = 'INSERT' THEN
    -- 調用edge function發送註冊通知
    PERFORM net.http_post(
      url := 'https://kbywkigkmoojppeyljmd.supabase.co/functions/v1/user-registration-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}',
      body := json_build_object('user_id', NEW.id)::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 在profiles表上創建觸發器
DROP TRIGGER IF EXISTS user_registration_notification_trigger ON profiles;
CREATE TRIGGER user_registration_notification_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_registration();

-- 創建訂單狀態變更通知觸發器函數
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 訂單完成時發送通知
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    PERFORM net.http_post(
      url := 'https://kbywkigkmoojppeyljmd.supabase.co/functions/v1/order-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}',
      body := json_build_object(
        'action', 'order_completed',
        'order_id', NEW.id,
        'user_id', NEW.user_id,
        'order_number', NEW.order_number,
        'verification_code', NEW.verification_code
      )::text
    );
  END IF;
  
  -- 訂單建立時發送通知
  IF TG_OP = 'INSERT' THEN
    PERFORM net.http_post(
      url := 'https://kbywkigkmoojppeyljmd.supabase.co/functions/v1/order-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}',
      body := json_build_object(
        'action', 'order_created',
        'order_id', NEW.id,
        'user_id', NEW.user_id,
        'order_number', NEW.order_number,
        'total', NEW.total
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 在orders表上創建觸發器
DROP TRIGGER IF EXISTS order_status_notification_trigger ON orders;
CREATE TRIGGER order_status_notification_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_status_change();;