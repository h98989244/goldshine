-- Migration: fix_trigger_search_path
-- Created at: 20260113223000
-- Description: 修復觸發器函數的 search_path,確保可以訪問 profiles 表和 net schema

-- 1. 修復 handle_new_user_terms_agreement 函數
CREATE OR REPLACE FUNCTION handle_new_user_terms_agreement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  -- Update profile with terms agreement information
  UPDATE profiles 
  SET 
    agreed_to_terms = COALESCE(NEW.raw_user_meta_data->>'agreed_to_terms', 'false')::boolean,
    agreed_to_terms_at = CASE 
      WHEN NEW.raw_user_meta_data->>'agreed_to_terms' = 'true' 
      THEN COALESCE((NEW.raw_user_meta_data->>'agreed_to_terms_at')::timestamptz, NOW()) 
      ELSE NULL 
    END,
    terms_version = COALESCE(NEW.raw_user_meta_data->>'terms_version', '1.0'),
    privacy_policy_version = COALESCE(NEW.raw_user_meta_data->>'privacy_policy_version', '1.0'),
    role = 'user',
    is_active = true,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- 2. 修復 notify_user_registration 函數
CREATE OR REPLACE FUNCTION notify_user_registration()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
DECLARE
  service_key text;
BEGIN
  -- 只有在新建用戶時才發送通知
  IF TG_OP = 'INSERT' THEN
    -- 嘗試獲取 service key
    BEGIN
      service_key := current_setting('app.service_role_key', true);
    EXCEPTION WHEN OTHERS THEN
      service_key := NULL;
    END;

    -- 如果沒有 service key (例如在某些內部調用中)，則跳過通知，避免阻擋用戶建立
    IF service_key IS NULL OR service_key = '' THEN
      -- 可以選擇記錄日誌
      -- RAISE WARNING 'notify_user_registration: Missing app.service_role_key, skipping notification via net.http_post';
      RETURN NEW;
    END IF;

    -- 使用異常處理區塊包裹 HTTP 請求
    BEGIN
      PERFORM net.http_post(
        url := 'https://kbywkigkmoojppeyljmd.supabase.co/functions/v1/send-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || service_key || '"}',
        body := json_build_object(
          'type', 'registration',
          'user_id', NEW.id
        )::text
      );
    EXCEPTION WHEN OTHERS THEN
      -- 捕獲所有錯誤，確保用戶建立不被中斷
      -- RAISE WARNING 'notify_user_registration: Failed to send notification: %', SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. 修復 notify_order_events 函數 (同樣加入 search_path)
CREATE OR REPLACE FUNCTION notify_order_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, extensions
AS $$
DECLARE
  service_key text;
BEGIN
  -- 獲取 key
  service_key := current_setting('app.service_role_key', true);
  IF service_key IS NULL OR service_key = '' THEN
     RETURN NEW;
  END IF;

  BEGIN
    -- 訂單建立時發送通知
    IF TG_OP = 'INSERT' THEN
      PERFORM net.http_post(
        url := 'https://kbywkigkmoojppeyljmd.supabase.co/functions/v1/send-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || service_key || '"}',
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
    IF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
      PERFORM net.http_post(
        url := 'https://kbywkigkmoojppeyljmd.supabase.co/functions/v1/send-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || service_key || '"}',
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
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
      PERFORM net.http_post(
        url := 'https://kbywkigkmoojppeyljmd.supabase.co/functions/v1/send-notification',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || service_key || '"}',
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
  EXCEPTION WHEN OTHERS THEN
    -- RAISE WARNING 'notify_order_events: Failed to send notification: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;
