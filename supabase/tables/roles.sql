CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name_zh VARCHAR(100),
    display_name_vi VARCHAR(100),
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);