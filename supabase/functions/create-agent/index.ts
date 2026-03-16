import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: corsHeaders
        });
    }

    try {
        // 使用 Service Role Key 建立管理員客戶端進行所有操作
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        console.log('[create-agent] Supabase URL:', supabaseUrl);
        console.log('[create-agent] Service role key exists:', !!serviceRoleKey);

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        // 驗證請求者身份 - 使用 Authorization header
        const authHeader = req.headers.get('Authorization');
        console.log('[create-agent] Authorization header present:', !!authHeader);

        if (!authHeader) {
            console.error('[create-agent] Missing authorization header');
            return new Response(JSON.stringify({
                error: { code: 'UNAUTHORIZED', message: '缺少授權標頭' }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        // 使用 service role 來驗證用戶的 JWT
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

        if (userError || !user) {
            console.error('[create-agent] Auth verification failed:', userError);
            return new Response(JSON.stringify({
                error: {
                    code: 'UNAUTHORIZED',
                    message: '無效的授權令牌',
                    details: userError?.message
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401,
            });
        }

        console.log('[create-agent] User authenticated:', user.email);

        // 檢查用戶是否為 admin
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        console.log('[create-agent] Profile query result:', { profile, profileError });

        // 允許 admin@thevgold.com 或 role 為 admin 的用戶
        const isAdminEmail = user.email === 'admin@thevgold.com';
        const isAdminRole = profile && profile.role === 'admin';

        console.log('[create-agent] Authorization check:', {
            userEmail: user.email,
            isAdminEmail,
            profileRole: profile?.role,
            isAdminRole
        });

        if (!isAdminEmail && !isAdminRole) {
            console.error('[create-agent] Authorization failed - not admin');
            return new Response(JSON.stringify({
                error: { code: 'FORBIDDEN', message: '權限不足:僅管理員可建立代理商' }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 403,
            });
        }

        console.log('[create-agent] Authorization successful, proceeding with agent creation');

        // 取得請求參數
        const requestBody = await req.json();
        const {
            email,
            password,
            full_name,
            phone,
            store_name,
            store_address,
            store_phone,
            commission_rate,
            referral_code,
            // 新增門市顯示欄位
            is_store_visible,
            store_name_vi,
            store_address_vi,
            store_business_hours,
            // 新增座標欄位
            latitude,
            longitude
        } = requestBody;

        if (!email || !password) {
            return new Response(JSON.stringify({
                error: { code: 'MISSING_PARAMS', message: 'Email 和密碼為必填欄位' }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }


        // 建立 Auth 用戶（使用前面已經建立的 supabaseAdmin）
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: { role: 'agent' }
        });

        if (createError) {
            console.error('建立用戶錯誤:', createError);
            return new Response(JSON.stringify({
                error: {
                    code: 'USER_CREATION_FAILED',
                    message: createError.message || '建立用戶失敗',
                    details: createError
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            });
        }

        if (!newUser.user) {
            return new Response(JSON.stringify({
                error: { code: 'USER_CREATION_FAILED', message: '建立用戶失敗:未返回用戶資料' }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            });
        }

        // 生成推薦碼:如果前端提供則使用,否則自動生成
        let finalReferralCode = referral_code;
        if (!finalReferralCode) {
            // 自動生成推薦碼: AG + 8位隨機大寫字母數字
            const randomBytes = crypto.getRandomValues(new Uint8Array(4));
            const randomHex = Array.from(randomBytes)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')
                .toUpperCase();
            finalReferralCode = 'AG' + randomHex;
        }

        // 使用 upsert 確保 profiles 記錄被正確創建或更新
        const { error: upsertError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: newUser.user.id,
                email: email,
                full_name: full_name || null,
                phone: phone || null,
                store_name: store_name || null,
                store_address: store_address || null,
                store_phone: store_phone || null,
                commission_rate: commission_rate || 0,
                referral_code: finalReferralCode,
                role: 'agent',
                // 新增門市顯示欄位
                is_store_visible: is_store_visible !== undefined ? is_store_visible : false,
                store_name_vi: store_name_vi || null,
                store_address_vi: store_address_vi || null,
                store_business_hours: store_business_hours || '10:00 - 21:00 (週一至週日)',
                // 新增座標欄位
                latitude: latitude || null,
                longitude: longitude || null
            }, {
                onConflict: 'id'
            });

        if (upsertError) {
            console.error('更新 profile 錯誤:', upsertError);
            // 如果更新失敗,刪除已建立的用戶
            await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);

            return new Response(JSON.stringify({
                error: {
                    code: 'PROFILE_UPDATE_FAILED',
                    message: '更新代理商資料失敗',
                    details: upsertError
                }
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            });
        }

        return new Response(JSON.stringify({
            success: true,
            message: '代理商建立成功',
            user: {
                id: newUser.user.id,
                email: newUser.user.email,
                created_at: newUser.user.created_at
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error('Function error:', error);
        return new Response(JSON.stringify({
            error: {
                code: 'FUNCTION_ERROR',
                message: error.message || '伺服器錯誤'
            }
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
