-- Migration: update_notification_triggers_unified
-- Created at: 1767688427

-- 更新通知觸發器使用統一通知函數

-- 更新用戶註冊通知觸發器函數
CREATE OR REPLACE FUNCTION notify_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  -- 只有在新建用戶時才發送通知
  IF TG_OP = 'INSERT' THEN
    -- 調用統一edge function發送註冊通知
    PERFORM net.http_post(
      url := 'https://kbywkigkmoojppeyljmd.supabase.co/functions/v1/send-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}',
      body := json_build_object(
        'type', 'registration',
        'user_id', NEW.id
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建訂單通知觸發器函數
CREATE OR REPLACE FUNCTION notify_order_events()
RETURNS TRIGGER AS $$
BEGIN
  -- 訂單建立時發送通知
  IF TG_OP = 'INSERT' THEN
    PERFORM net.http_post(
      url := 'https://kbywkigkmoojppeyljmd.supabase.co/functions/v1/send-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}',
      body := json_build_object(
        'type', 'order_created',
        'user_id', NEW.user_id,
        'data', json_build_object(
          'order_number', NEW.order_number,
          'total', NEW.total,
          'items_count', COALESCE(NEW.items_count, 1)
        )
      )::text
    );
  END IF;

  -- 訂單完成時發送通知
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    PERFORM net.http_post(
      url := 'https://kbywkigkmoojppeyljmd.supabase.co/functions/v1/send-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}',
      body := json_build_object(
        'type', 'order_completed',
        'user_id', NEW.user_id,
        'data', json_build_object(
          'order_number', NEW.order_number,
          'verification_code', NEW.verification_code,
          'delivery_info', CASE 
            WHEN NEW.delivery_info IS NOT NULL THEN '商品已送達：' || NEW.delivery_info
            ELSE NULL
          END
        )
      )::text
    );
  END IF;

  -- 訂單狀態變更通知
  IF OLD.status != NEW.status AND TG_OP = 'UPDATE' THEN
    PERFORM net.http_post(
      url := 'https://kbywkigkmoojppeyljmd.supabase.co/functions/v1/send-notification',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}',
      body := json_build_object(
        'type', 'order_status_update',
        'user_id', NEW.user_id,
        'data', json_build_object(
          'status_order', NEW.order_number,
          'new_status', NEW.status,
          'status_message', CASE 
            WHEN NEW.status = 'shipped' THEN '您的訂單已出貨，預計2-3個工作天送達'
            WHEN NEW.status = 'cancelled' THEN '訂單已取消，如有任何問題請聯繫客服'
            WHEN NEW.status = 'refunded' THEN '退款已處理，款項將於3-5個工作天內退回您的帳戶'
            ELSE NULL
          END
        )
      )::text
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 刪除舊觸發器
DROP TRIGGER IF EXISTS user_registration_notification_trigger ON profiles;
DROP TRIGGER IF EXISTS order_status_notification_trigger ON orders;
DROP TRIGGER IF EXISTS order_events_notification_trigger ON orders;

-- 重新創建觸發器
CREATE TRIGGER user_registration_notification_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION notify_user_registration();

CREATE TRIGGER order_events_notification_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION notify_order_events();

-- 創建代理商佣金結算通知觸發器
CREATE OR REPLACE FUNCTION notify_agent_settlement()
RETURNS TRIGGER AS $$
BEGIN
  -- 當佣金記錄狀態變更為已結算時發送通知
  IF OLD.status != 'settled' AND NEW.status = 'settled' THEN
    -- 獲取代理商的用戶ID
    DECLARE
      agent_user_id UUID;
    BEGIN
      SELECT a.auth_user_id INTO agent_user_id 
      FROM agents a 
      WHERE a.id = NEW.agent_id;
      
      IF agent_user_id IS NOT NULL THEN
        PERFORM net.http_post(
          url := 'https://kbywkigkmoojppeyljmd.supabase.co/functions/v1/send-notification',
          headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.service_role_key', true) || '"}',
          body := json_build_object(
            'type', 'agent_settlement',
            'user_id', agent_user_id,
            'data', json_build_object(
              'settlement_order', COALESCE(NEW.order_reference, 'N/A'),
              'commission_amount', NEW.amount,
              'settlement_period', CASE 
                WHEN NEW.settlement_date IS NOT NULL THEN 
                  to_char(NEW.settlement_date, 'YYYY年MM月') || '月份佣金'
                ELSE NULL
              END
            )
          )::text
        );
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 在commissions表上創建觸發器
DROP TRIGGER IF EXISTS agent_settlement_notification_trigger ON commissions;
CREATE TRIGGER agent_settlement_notification_trigger
  AFTER UPDATE ON commissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_agent_settlement();;