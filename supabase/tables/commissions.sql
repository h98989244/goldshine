CREATE TABLE commissions (
    id SERIAL PRIMARY KEY,
    agent_id INTEGER NOT NULL REFERENCES agents(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    amount DECIMAL(15,2) NOT NULL,
    rate DECIMAL(5,4) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    settlement_month VARCHAR(7),
    settled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);