CREATE TABLE operation_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);