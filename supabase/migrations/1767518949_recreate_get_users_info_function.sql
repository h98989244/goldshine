-- Migration: recreate_get_users_info_function
-- Created at: 1767518949

DROP FUNCTION IF EXISTS get_auth_users_info();

CREATE OR REPLACE FUNCTION get_auth_users_info()
RETURNS TABLE(
    id uuid,
    email varchar(255),
    created_at timestamptz,
    raw_user_meta_data jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.created_at,
        u.raw_user_meta_data
    FROM auth.users u
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;