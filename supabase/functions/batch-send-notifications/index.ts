// 批量發送通知edge function
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
        const { type, user_ids, data, filter_type, filter_data } = requestData;

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

        let targetUserIds = [];

        if (user_ids && user_ids.length > 0) {
            // 直接使用提供的用戶ID列表
            targetUserIds = user_ids;
        } else if (filter_type && filter_data) {
            // 根據條件過濾用戶
            let filterQuery = '';
            
            switch (filter_type) {
                case 'role':
                    filterQuery = `profiles.role=eq.${filter_data.role}`;
                    break;
                case 'registration_date':
                    filterQuery = `profiles.created_at=gte.${filter_data.start_date}&profiles.created_at=lte.${filter_data.end_date}`;
                    break;
                case 'has_orders':
                    filterQuery = `profiles.id=in.(SELECT DISTINCT user_id FROM orders WHERE created_at >= '${filter_data.since_date || '1970-01-01'}')`;
                    break;
                case 'agents':
                    filterQuery = `profiles.id=in.(SELECT DISTINCT auth_user_id FROM agents WHERE auth_user_id IS NOT NULL)`;
                    break;
                default:
                    throw new Error('Invalid filter type');
            }

            // 獲取符合條件的用戶
            const usersResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id&${filterQuery}`, {
                method: 'GET',
                headers
            });

            if (!usersResponse.ok) {
                throw new Error('Failed to fetch users for filtering');
            }

            const users = await usersResponse.json();
            targetUserIds = users.map(user => user.id);
        } else {
            throw new Error('Either user_ids or filter_type must be provided');
        }

        if (targetUserIds.length === 0) {
            throw new Error('No users found to send notification to');
        }

        console.log(`Sending notification to ${targetUserIds.length} users`);

        // 批量發送通知
        const notificationPromises = targetUserIds.map(async (userId) => {
            try {
                const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        type: type,
                        user_id: userId,
                        data: data
                    })
                });

                if (!response.ok) {
                    console.error(`Failed to send notification to user ${userId}:`, await response.text());
                    return { user_id: userId, success: false, error: await response.text() };
                }

                const result = await response.json();
                return { user_id: userId, success: true, data: result };
            } catch (error) {
                console.error(`Error sending notification to user ${userId}:`, error);
                return { user_id: userId, success: false, error: error.message };
            }
        });

        const results = await Promise.allSettled(notificationPromises);
        
        const successful = results.filter(result => 
            result.status === 'fulfilled' && result.value.success
        ).length;
        
        const failed = results.length - successful;

        const summary = {
            total_users: targetUserIds.length,
            successful: successful,
            failed: failed,
            results: results.map(result => 
                result.status === 'fulfilled' ? result.value : 
                { user_id: 'unknown', success: false, error: result.reason?.message }
            )
        };

        return new Response(JSON.stringify({ 
            data: summary,
            message: `批量通知發送完成：${successful} 成功，${failed} 失敗`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Batch notification error:', error);
        
        const errorResponse = {
            error: {
                code: 'BATCH_NOTIFICATION_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});