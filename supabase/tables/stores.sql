CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_vi VARCHAR(100),
    address TEXT,
    address_vi TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);