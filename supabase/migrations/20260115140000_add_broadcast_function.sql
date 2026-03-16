-- Migration: add_broadcast_function
-- Created by: Agent
-- Description: Adds a function to send notifications to multiple users based on role.

CREATE OR REPLACE FUNCTION send_broadcast_notification(
    p_target_role TEXT,        -- 'agent', 'admin', 'all'
    p_title TEXT,
    p_content TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Insert for Agents
    IF p_target_role = 'agent' THEN
        INSERT INTO notifications (user_id, type, title, content, metadata, recipient_role, is_read)
        SELECT id, 'system', p_title, p_content, p_metadata, 'agent', false
        FROM profiles
        WHERE role = 'agent';
        GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Insert for Admins
    ELSIF p_target_role = 'admin' THEN
        INSERT INTO notifications (user_id, type, title, content, metadata, recipient_role, is_read)
        SELECT id, 'system', p_title, p_content, p_metadata, 'admin', false
        FROM profiles
        WHERE role = 'admin' OR full_name LIKE '%admin%';
        GET DIAGNOSTICS v_count = ROW_COUNT;
        
    -- Insert for All Users (Global)
    ELSIF p_target_role = 'all' OR p_target_role = 'global' THEN
        INSERT INTO notifications (user_id, type, title, content, metadata, recipient_role, is_read)
        SELECT id, 'system', p_title, p_content, p_metadata, 'global', false
        FROM profiles;
        GET DIAGNOSTICS v_count = ROW_COUNT;
    END IF;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
