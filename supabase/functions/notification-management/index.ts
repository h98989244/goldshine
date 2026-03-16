// 通知管理edge function (管理員用)
Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders });
    }

    try {
        const requestData = await req.json();
        const { action, notification_ids, days_old, user_id, admin_user_id } = requestData;

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing Supabase configuration');
        }

        const headers = {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey
        };

        // 驗證管理員權限
        const adminCheckResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${admin_user_id}&select=role`, {
            method: 'GET',
            headers
        });

        if (!adminCheckResponse.ok) {
            throw new Error('Failed to verify admin permissions');
        }

        const adminData = await adminCheckResponse.json();
        if (!adminData.length || adminData[0].role !== 'admin') {
            throw new Error('Insufficient permissions: admin role required');
        }

        let result;

        switch (action) {
            case 'delete_notifications':
                // 刪除指定的通知
                if (!notification_ids || !Array.isArray(notification_ids)) {
                    throw new Error('notification_ids array is required');
                }

                const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/notifications?id=in.(${notification_ids.join(',')})`, {
                    method: 'DELETE',
                    headers
                });

                if (!deleteResponse.ok) {
                    throw new Error('Failed to delete notifications');
                }

                result = { 
                    success: true, 
                    deleted_count: notification_ids.length,
                    message: `已成功刪除 ${notification_ids.length} 條通知`
                };
                break;

            case 'cleanup_old_notifications':
                // 清理舊通知
                if (!days_old || days_old < 1) {
                    throw new Error('days_old must be greater than 0');
                }

                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days_old);

                const cleanupResponse = await fetch(`${supabaseUrl}/rest/v1/notifications?created_at=lt.${cutoffDate.toISOString()}`, {
                    method: 'DELETE',
                    headers
                });

                if (!cleanupResponse.ok) {
                    throw new Error('Failed to cleanup old notifications');
                }

                result = { 
                    success: true, 
                    message: `已清理 ${days_old} 天前的舊通知`,
                    cutoff_date: cutoffDate.toISOString()
                };
                break;

            case 'get_statistics':
                // 獲取通知統計
                const statsQueries = await Promise.all([
                    // 總通知數
                    fetch(`${supabaseUrl}/rest/v1/notifications?select=count`, {
                        method: 'GET',
                        headers: { ...headers, 'Prefer': 'count=exact' }
                    }),
                    // 未讀通知數
                    fetch(`${supabaseUrl}/rest/v1/notifications?is_read=eq.false&select=count`, {
                        method: 'GET',
                        headers: { ...headers, 'Prefer': 'count=exact' }
                    }),
                    // 按類型統計
                    fetch(`${supabaseUrl}/rest/v1/notifications?select=type`, {
                        method: 'GET',
                        headers
                    }),
                    // 最近7天的通知數
                    fetch(`${supabaseUrl}/rest/v1/notifications?created_at=gte.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}&select=count`, {
                        method: 'GET',
                        headers: { ...headers, 'Prefer': 'count=exact' }
                    })
                ]);

                const [totalRes, unreadRes, typeRes, weekRes] = statsQueries;
                
                const totalData = await totalRes.json();
                const unreadData = await unreadRes.json();
                const typeData = await typeRes.json();
                const weekData = await weekRes.json();

                // 統計各類型通知數量
                const typeStats = {};
                typeData.forEach(notification => {
                    typeStats[notification.type] = (typeStats[notification.type] || 0) + 1;
                });

                result = {
                    total_notifications: totalData.length || 0,
                    unread_notifications: unreadData.length || 0,
                    notifications_last_7_days: weekData.length || 0,
                    notifications_by_type: typeStats,
                    timestamp: new Date().toISOString()
                };
                break;

            case 'mark_user_notifications_read':
                // 標記特定用戶的所有通知為已讀
                if (!user_id) {
                    throw new Error('user_id is required');
                }

                const markReadResponse = await fetch(`${supabaseUrl}/rest/v1/notifications?user_id=eq.${user_id}&is_read=eq.false`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ is_read: true })
                });

                if (!markReadResponse.ok) {
                    throw new Error('Failed to mark user notifications as read');
                }

                result = { 
                    success: true, 
                    message: `已標記用戶 ${user_id} 的所有通知為已讀`,
                    user_id: user_id
                };
                break;

            case 'export_notifications':
                // 導出通知數據 (管理員功能)
                const exportResponse = await fetch(`${supabaseUrl}/rest/v1/notifications?select=*&order=created_at.desc&limit=1000`, {
                    method: 'GET',
                    headers
                });

                if (!exportResponse.ok) {
                    throw new Error('Failed to export notifications');
                }

                const exportData = await exportResponse.json();
                
                result = {
                    success: true,
                    total_exported: exportData.length,
                    export_data: exportData,
                    export_timestamp: new Date().toISOString()
                };
                break;

            default:
                throw new Error('Invalid action');
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Notification management error:', error);
        
        const errorResponse = {
            error: {
                code: 'NOTIFICATION_MANAGEMENT_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});