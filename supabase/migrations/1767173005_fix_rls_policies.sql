-- Migration: fix_rls_policies
-- Created at: 1767173005


-- 修復 profiles 表的 RLS 政策，允許新用戶插入
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service role full access profiles" ON profiles;

CREATE POLICY "Enable read for users" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for users" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Enable update for users" ON profiles FOR UPDATE USING (auth.uid() = id);

-- 修復 orders 表政策
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Service role full access orders" ON orders;

DROP POLICY IF EXISTS "Enable read orders" ON orders;
CREATE POLICY "Enable read orders" ON orders FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable insert orders" ON orders;
CREATE POLICY "Enable insert orders" ON orders FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Enable update orders" ON orders;
CREATE POLICY "Enable update orders" ON orders FOR UPDATE USING (true);

-- order_items 政策
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all order_items" ON order_items FOR ALL USING (true);

-- commissions 政策修復
DROP POLICY IF EXISTS "Enable all commissions" ON commissions;
CREATE POLICY "Enable all commissions" ON commissions FOR ALL USING (true);

-- notifications 政策
DROP POLICY IF EXISTS "Enable all notifications" ON notifications;
CREATE POLICY "Enable all notifications" ON notifications FOR ALL USING (true);
;