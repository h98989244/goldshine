CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone VARCHAR(20),
    full_name VARCHAR(100),
    avatar_url TEXT,
    preferred_language VARCHAR(10) DEFAULT 'zh-TW',
    preferred_currency VARCHAR(10) DEFAULT 'TWD',
    referral_code VARCHAR(20) UNIQUE,
    referred_by UUID,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);