Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
        'Access-Control-Max-Age': '86400',
        'Access-Control-Allow-Credentials': 'false'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: corsHeaders
        });
    }

    try {
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        const supabaseUrl = Deno.env.get('SUPABASE_URL');

        if (!serviceRoleKey || !supabaseUrl) {
            return new Response(JSON.stringify({
                error: { code: 'CONFIG_ERROR', message: 'Missing Supabase configuration' }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            });
        }

        // 查詢 auth.users 表獲取 email 和基本資訊
        const authResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_auth_users_info`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
                'apikey': serviceRoleKey,
            },
            body: JSON.stringify({})
        });

        let authUsersData = [];
        if (authResponse.ok) {
            authUsersData = await authResponse.json();
        } else {
            // 如果 RPC 失敗，嘗試直接查詢 auth.users 表
            const directAuthResponse = await fetch(`${supabaseUrl}/rest/v1/auth.users?select=id,email,raw_user_meta_data`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey,
                }
            });
            
            if (directAuthResponse.ok) {
                authUsersData = await directAuthResponse.json();
            }
        }

        // 查詢 profiles 表獲取其他用戶資料
        const profilesResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*&order=created_at.desc`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${serviceRoleKey}`,
                'Content-Type': 'application/json',
                'apikey': serviceRoleKey,
            }
        });

        if (!profilesResponse.ok) {
            return new Response(JSON.stringify({
                error: { code: 'PROFILES_QUERY_FAILED', message: 'Failed to fetch profiles data' }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            });
        }

        const profilesData = await profilesResponse.json();

        // 合併資料
        const mergedUsers = profilesData.map(profile => {
            const authUser = authUsersData.find(u => u.id === profile.id);
            
            return {
                ...profile,
                email: authUser?.email || null,
                full_name: profile.full_name || authUser?.raw_user_meta_data?.full_name || '',
                auth_created_at: authUser?.created_at || null
            };
        });

        return new Response(JSON.stringify({
            success: true,
            users: mergedUsers
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        return new Response(JSON.stringify({
            error: { code: 'FUNCTION_ERROR', message: error.message }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});