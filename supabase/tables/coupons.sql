CREATE TABLE coupons (
    id SERIAL PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    type VARCHAR(20) DEFAULT 'fixed',
    value DECIMAL(10,2) NOT NULL,
    min_purchase DECIMAL(15,2) DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);