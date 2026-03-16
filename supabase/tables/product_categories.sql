CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_vi VARCHAR(100),
    parent_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);