-- Migration: add_agent_notification_rls
-- Description: Adds RLS policy to allow agents to view notifications addressed to them

-- Allow agents to view notifications with recipient_role='agent' or 'global'
DROP POLICY IF EXISTS "Agents can view agent/global notifications" ON notifications;
CREATE POLICY "Agents can view agent/global notifications" ON notifications
    FOR SELECT USING (
        (recipient_role = 'agent' OR recipient_role = 'global')
        AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'agent'
        )
    );

-- Allow agents to update their own notifications (mark as read)
DROP POLICY IF EXISTS "Agents can update their notifications" ON notifications;
CREATE POLICY "Agents can update their notifications" ON notifications
    FOR UPDATE USING (
        user_id = auth.uid()
        AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'agent'
        )
    );
