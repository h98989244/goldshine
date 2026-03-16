CREATE TABLE agents (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    agent_code VARCHAR(20) UNIQUE NOT NULL,
    commission_rate DECIMAL(5,4) DEFAULT 0.05,
    total_sales DECIMAL(15,2) DEFAULT 0,
    total_commission DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);