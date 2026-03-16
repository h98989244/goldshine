-- =====================================================
-- 後台管理系統 RLS Policies 和 RPC 函數
-- 目的：建立完整的權限控制和統計函數
-- =====================================================

-- 1. 確保 profiles.role 欄位存在
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

COMMENT ON COLUMN profiles.role IS '用戶角色: admin, user, agent';

-- 2. ==================== PRODUCTS RLS ====================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 刪除舊 policies
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Admin can manage products" ON products;

-- 所有人可查看啟用的商品
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
USING (is_active = true OR auth.uid() IS NOT NULL);

-- Admin 可以 CRUD 所有商品
CREATE POLICY "Admin can manage products"
ON products FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 3. ==================== ORDERS RLS ====================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 刪除舊 policies
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON orders;
DROP POLICY IF EXISTS "Admin can update orders" ON orders;
DROP POLICY IF EXISTS "Admin can insert orders" ON orders;

-- 用戶可查看自己的訂單
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admin 可查看所有訂單
CREATE POLICY "Admin can view all orders"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin 可更新訂單
CREATE POLICY "Admin can update orders"
ON orders FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin 可建立訂單
CREATE POLICY "Admin can insert orders"
ON orders FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 4. ==================== PROFILES RLS ====================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 刪除舊 policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin can update profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 用戶可查看自己的 profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Admin 可查看所有 profiles
CREATE POLICY "Admin can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- Admin 可更新所有 profiles
CREATE POLICY "Admin can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- 用戶可更新自己的 profile（但不能改 role）
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid() 
  AND role = (SELECT role FROM profiles WHERE id = auth.uid())
);

-- 5. ==================== ORDER_ITEMS RLS ====================
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- 刪除舊 policies
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Admin can view all order items" ON order_items;

-- 用戶可查看自己訂單的項目
CREATE POLICY "Users can view own order items"
ON order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Admin 可查看所有訂單項目
CREATE POLICY "Admin can view all order items"
ON order_items FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 6. ==================== RPC 函數 ====================

-- 取得 Dashboard 統計數據
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
    'pending_orders', (SELECT COUNT(*) FROM orders WHERE status = 'pending'),
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

-- 取得訂單統計（按日期）
CREATE OR REPLACE FUNCTION get_orders_by_date(days_count INT DEFAULT 7)
RETURNS TABLE(date DATE, count BIGINT, revenue NUMERIC)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 檢查是否為 admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  RETURN QUERY
  SELECT
    DATE(o.created_at) as date,
    COUNT(*) as count,
    COALESCE(SUM(o.total), 0) as revenue
  FROM orders o
  WHERE o.created_at >= CURRENT_DATE - days_count
  AND o.status != 'canceled'
  GROUP BY DATE(o.created_at)
  ORDER BY date DESC;
END;
$$;

-- 7. 註解說明
COMMENT ON FUNCTION get_dashboard_stats() IS 'Admin only: 取得後台 Dashboard 統計數據';
COMMENT ON FUNCTION get_orders_by_date(INT) IS 'Admin only: 取得指定天數內的訂單統計';
