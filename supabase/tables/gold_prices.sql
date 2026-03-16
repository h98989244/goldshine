CREATE TABLE gold_prices (
    id SERIAL PRIMARY KEY,
    price_twd DECIMAL(10,2) NOT NULL,
    price_vnd DECIMAL(15,2) NOT NULL,
    source VARCHAR(50) DEFAULT 'manual',
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);