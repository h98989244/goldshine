CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- 檢查是否為 admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  SELECT json_build_object(
    'total_orders', (SELECT COUNT(*) FROM orders),
    'total_revenue', (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'canceled'),
    'total_products', (SELECT COUNT(*) FROM products WHERE is_active = true),
    'total_users', (SELECT COUNT(*) FROM profiles),
    -- Count both 'pending' and 'reserved' as pending orders
    'pending_orders', (SELECT COUNT(*) FROM orders WHERE status IN ('pending', 'reserved')),
    'today_orders', (
      SELECT COUNT(*) FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
    ),
    'today_revenue', (
      SELECT COALESCE(SUM(total), 0) FROM orders
      WHERE DATE(created_at) = CURRENT_DATE AND status != 'canceled'
    ),
    'month_revenue', (
      SELECT COALESCE(SUM(total), 0) FROM orders
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
      AND status != 'canceled'
    ),
    'shipped_orders', (SELECT COUNT(*) FROM orders WHERE status = 'shipped'),
    'completed_orders', (SELECT COUNT(*) FROM orders WHERE status = 'completed')
  ) INTO result;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_dashboard_stats() IS 'Admin only: 取得後台 Dashboard 統計數據 (含 reserved 狀態)';
