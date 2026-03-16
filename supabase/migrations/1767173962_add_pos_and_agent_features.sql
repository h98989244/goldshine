-- Migration: add_pos_and_agent_features
-- Created at: 1767173962


-- 添加訂單核銷碼
ALTER TABLE orders ADD COLUMN IF NOT EXISTS verification_code VARCHAR(10);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS verified_by UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(30);

-- 代理商推薦追蹤表
CREATE TABLE IF NOT EXISTS agent_referrals (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  referral_code VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入示範商品數據
INSERT INTO products (sku, name, name_vi, description, category_id, weight, purity, labor_cost_twd, labor_cost_vnd, size_options, stock_quantity, is_active) VALUES
('GN001', '經典黃金項鍊', 'Day chuyen vang co dien', '經典設計，適合日常佩戴，純金打造，工藝精湛。', 1, 3.75, '999', 800, 200000, '["45cm","50cm","55cm"]', 10, true),
('GR001', '時尚黃金戒指', 'Nhan vang thoi trang', '簡約時尚，百搭款式，適合各種場合。', 2, 2.5, '999', 600, 150000, '["6號","7號","8號","9號","10號"]', 15, true),
('GB001', '優雅黃金手鐲', 'Vong tay vang thanh lich', '優雅大方，適合婚嫁送禮，展現高貴氣質。', 3, 15.0, '999', 2000, 500000, '["16cm","17cm","18cm"]', 8, true),
('GE001', '精緻黃金耳環', 'Hoa tai vang tinh te', '精緻小巧，閃耀動人，點亮您的每一天。', 4, 1.2, '999', 400, 100000, '[]', 20, true),
('GN002', '福字黃金吊墜', 'Mat day chuyen vang chu Phuc', '寓意吉祥，送禮首選，象徵福氣滿滿。', 1, 5.0, '999', 1000, 250000, '[]', 12, true),
('GR002', '龍鳳黃金對戒', 'Nhan doi vang long phuong', '龍鳳呈祥，婚嫁必備，見證永恆愛情。', 2, 6.0, '999', 1500, 375000, '["6號","7號","8號","9號","10號"]', 6, true)
ON CONFLICT (sku) DO NOTHING;

-- 啟用 RLS
ALTER TABLE agent_referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all agent_referrals" ON agent_referrals;
CREATE POLICY "Enable all agent_referrals" ON agent_referrals FOR ALL USING (true);

-- agents 表 RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all agents" ON agents;
CREATE POLICY "Enable all agents" ON agents FOR ALL USING (true);

-- coupons 表 RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all coupons" ON coupons;
CREATE POLICY "Enable all coupons" ON coupons FOR ALL USING (true);
;