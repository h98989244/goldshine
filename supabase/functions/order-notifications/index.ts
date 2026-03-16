// 訂單通知edge function
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
        const { action, order_id, user_id, order_number, total, status, verification_code } = requestData;

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
            case 'order_created':
                // 訂單建立通知
                const createNotificationResponse = await fetch(`${supabaseUrl}/functions/v1/notification-service`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        action: 'create',
                        user_id: user_id,
                        type: 'order',
                        title: '訂單已建立',
                        content: `您的訂單 ${order_number} 已成功建立，總金額 NT$ ${total?.toLocaleString() || '0'}。我們將盡快為您處理。`
                    })
                });

                if (!createNotificationResponse.ok) {
                    throw new Error('Failed to create order notification');
                }

                result = await createNotificationResponse.json();
                break;

            case 'order_completed':
                // 訂單完成通知
                const completionContent = verification_code 
                    ? `您的訂單 ${order_number} 已完成，核銷碼：${verification_code}。感謝您的購買！`
                    : `您的訂單 ${order_number} 已完成。感謝您的購買！`;

                const completeNotificationResponse = await fetch(`${supabaseUrl}/functions/v1/notification-service`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        action: 'create',
                        user_id: user_id,
                        type: 'completion',
                        title: '訂單已完成',
                        content: completionContent
                    })
                });

                if (!completeNotificationResponse.ok) {
                    throw new Error('Failed to create completion notification');
                }

                result = await completeNotificationResponse.json();
                break;

            case 'agent_settlement':
                // 代理商結算通知
                const settlementResponse = await fetch(`${supabaseUrl}/functions/v1/notification-service`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        action: 'create',
                        user_id: user_id,
                        type: 'settlement',
                        title: '佣金結算通知',
                        content: `您有一筆佣金 NT$ ${total?.toLocaleString() || '0'} 已結算，訂單編號：${order_number}。`
                    })
                });

                if (!settlementResponse.ok) {
                    throw new Error('Failed to create settlement notification');
                }

                result = await settlementResponse.json();
                break;

            default:
                throw new Error('Invalid action');
        }

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Order notification service error:', error);
        
        const errorResponse = {
            error: {
                code: 'ORDER_NOTIFICATION_SERVICE_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});