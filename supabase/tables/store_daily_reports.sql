CREATE TABLE store_daily_reports (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    date DATE NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_sales DECIMAL(15,2) DEFAULT 0,
    cash_amount DECIMAL(15,2) DEFAULT 0,
    card_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);