// 通知服務edge function
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
        const { action, user_id, type, title, title_vi, content, content_vi, notification_id, limit = 20, offset = 0 } = requestData;

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

        let result;

        switch (action) {
            case 'create':
                // 創建通知 - 嘗試使用RPC函數，如果失敗則直接插入
                try {
                    const createResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/send_notification`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            p_user_id: user_id,
                            p_type: type,
                            p_title: title,
                            p_title_vi: title_vi,
                            p_content: content,
                            p_content_vi: content_vi
                        })
                    });

                    if (createResponse.ok) {
                        result = await createResponse.json();
                        break;
                    }
                } catch (rpcError) {
                    console.log('RPC failed, trying direct insert:', rpcError.message);
                }

                // 備用方案：直接插入通知
                const directInsertResponse = await fetch(`${supabaseUrl}/rest/v1/notifications`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        user_id: user_id,
                        type: type,
                        title: title,
                        title_vi: title_vi,
                        content: content,
                        content_vi: content_vi,
                        is_read: false
                    })
                });

                if (!directInsertResponse.ok) {
                    const errorText = await directInsertResponse.text();
                    throw new Error(`Failed to create notification: ${errorText}`);
                }

                result = await directInsertResponse.json();
                break;

            case 'mark_read':
                // 標記為已讀
                const updateResponse = await fetch(`${supabaseUrl}/rest/v1/notifications?id=eq.${notification_id}`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ is_read: true })
                });

                if (!updateResponse.ok) {
                    throw new Error('Failed to mark notification as read');
                }

                result = { success: true };
                break;

            case 'mark_all_read':
                // 標記所有通知為已讀
                const markAllResponse = await fetch(`${supabaseUrl}/rest/v1/notifications?user_id=eq.${user_id}&is_read=eq.false`, {
                    method: 'PATCH',
                    headers,
                    body: JSON.stringify({ is_read: true })
                });

                if (!markAllResponse.ok) {
                    throw new Error('Failed to mark all notifications as read');
                }

                result = { success: true };
                break;

            case 'get_list':
                // 獲取通知列表
                const listResponse = await fetch(`${supabaseUrl}/rest/v1/notifications?user_id=eq.${user_id}&order=created_at.desc&limit=${limit}&offset=${offset}`, {
                    method: 'GET',
                    headers
                });

                if (!listResponse.ok) {
                    throw new Error('Failed to fetch notifications list');
                }

                result = await listResponse.json();
                break;

            case 'get_count':
                // 獲取未讀通知數量
                const countResponse = await fetch(`${supabaseUrl}/rest/v1/notifications?user_id=eq.${user_id}&is_read=eq.false&select=count`, {
                    method: 'GET',
                    headers: { ...headers, 'Prefer': 'count=exact' }
                });

                const countData = await countResponse.json();
                result = { count: countData.length || 0 };
                break;

            default:
                throw new Error('Invalid action');
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Notification service error:', error);
        
        const errorResponse = {
            error: {
                code: 'NOTIFICATION_SERVICE_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});