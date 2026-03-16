CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    name_vi VARCHAR(200),
    description TEXT,
    description_vi TEXT,
    category_id INTEGER REFERENCES product_categories(id),
    weight DECIMAL(10,3) NOT NULL,
    purity VARCHAR(20) DEFAULT '999',
    labor_cost_twd DECIMAL(10,2) DEFAULT 0,
    labor_cost_vnd DECIMAL(15,2) DEFAULT 0,
    size_options JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);