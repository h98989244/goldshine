CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    type VARCHAR(30) NOT NULL,
    title VARCHAR(200) NOT NULL,
    title_vi VARCHAR(200),
    content TEXT,
    content_vi TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);