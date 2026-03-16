// 用戶註冊通知edge function
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
        const { user_id } = requestData;

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

        // 發送註冊成功通知
        const notificationResponse = await fetch(`${supabaseUrl}/functions/v1/notification-service`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                action: 'create',
                user_id: user_id,
                type: 'registration',
                title: '歡迎加入汎金珠寶！',
                content: '您的帳戶已成功建立，感謝您的註冊。我們將為您提供最優質的珠寶服務。'
            })
        });

        if (!notificationResponse.ok) {
            throw new Error('Failed to create registration notification');
        }

        const result = await notificationResponse.json();

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('User registration notification error:', error);
        
        const errorResponse = {
            error: {
                code: 'USER_REGISTRATION_NOTIFICATION_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});