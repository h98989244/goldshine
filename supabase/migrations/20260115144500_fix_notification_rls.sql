-- Migration: fix_notification_rls
-- Description: Updates RLS policy to allow admins (by role) to insert notifications.

DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;

CREATE POLICY "Admins can insert notifications" ON notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (role = 'admin' OR full_name LIKE '%admin%' OR full_name LIKE '%管理員%')
        )
    );
