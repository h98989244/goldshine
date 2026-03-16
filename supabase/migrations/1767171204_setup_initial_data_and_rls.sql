-- Migration: setup_initial_data_and_rls
-- Created at: 1767171204


-- 插入初始角色
-- 插入初始角色
INSERT INTO roles (name, display_name_zh, display_name_vi, permissions) VALUES
('super_admin', '超級管理員', 'Quan tri vien cap cao', '["all"]'),
('product_editor', '商品小編', 'Bien tap vien san pham', '["products.read","products.write"]'),
('finance', '財務/結算', 'Tai chinh', '["orders.read","commissions.read","commissions.write","reports.read"]'),
('customer_service', '客服', 'Cham soc khach hang', '["orders.read","users.read","notifications.write"]'),
('agent', '代理商', 'Dai ly', '["agent.dashboard","referrals.read","commissions.read"]'),
('pos_staff', '門市店員', 'Nhan vien POS', '["pos.access","orders.update"]')
ON CONFLICT (name) DO NOTHING;

-- 插入初始金價
INSERT INTO gold_prices (price_twd, price_vnd) VALUES (2150, 1850000);

-- 插入示範商品分類
INSERT INTO product_categories (name, name_vi, sort_order) VALUES
('黃金項鍊', 'Day chuyen vang', 1),
('黃金戒指', 'Nhan vang', 2),
('黃金手鐲', 'Vong tay vang', 3),
('黃金耳環', 'Hoa tai vang', 4);

-- 插入示範門市
INSERT INTO stores (name, name_vi, address, phone) VALUES
('台北旗艦店', 'Cua hang chinh Taipei', '台北市中山區南京東路一段', '02-1234-5678'),
('台中門市', 'Cua hang Taichung', '台中市西屯區台灣大道', '04-1234-5678');

-- 啟用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_logs ENABLE ROW LEVEL SECURITY;

-- RLS 政策：profiles
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access profiles" ON profiles FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS 政策：orders
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access orders" ON orders FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 公開讀取的表（商品、分類、門市、金價）
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE gold_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read products" ON products FOR SELECT USING (true);
CREATE POLICY "Public read categories" ON product_categories FOR SELECT USING (true);
CREATE POLICY "Public read stores" ON stores FOR SELECT USING (true);
CREATE POLICY "Public read gold_prices" ON gold_prices FOR SELECT USING (true);
;