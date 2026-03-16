CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(15,2) NOT NULL,
    gold_weight DECIMAL(10,3) NOT NULL,
    labor_cost DECIMAL(10,2) DEFAULT 0,
    selected_size VARCHAR(50)
);