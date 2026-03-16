import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders })
    }

    try {
        console.log('=== Delete User Request ===')

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.error('No auth header')
            return new Response(JSON.stringify({ error: { message: '未授權' } }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        // 使用 service role 直接驗證和操作
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        // 從 auth header 提取 token
        const token = authHeader.replace('Bearer ', '')

        // 驗證 token 並獲取用戶
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

        if (userError || !user) {
            console.error('User verification failed:', userError?.message)
            return new Response(JSON.stringify({ error: { message: '無效的授權' } }), {
                status: 401,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        console.log('User verified:', user.id)

        // 檢查用戶是否為 admin
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'admin') {
            console.error('Not admin:', profile?.role)
            return new Response(JSON.stringify({ error: { message: '權限不足' } }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        console.log('Admin verified')

        // 獲取要刪除的用戶 ID
        const { userId } = await req.json()

        if (!userId) {
            return new Response(JSON.stringify({ error: { message: '缺少 userId' } }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        if (userId === user.id) {
            return new Response(JSON.stringify({ error: { message: '無法刪除自己' } }), {
                status: 403,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        console.log('Deleting user:', userId)

        // 刪除用戶
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (deleteError) {
            console.error('Delete failed:', deleteError.message)
            return new Response(JSON.stringify({ error: { message: deleteError.message } }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        console.log('User deleted successfully')

        return new Response(JSON.stringify({ success: true, message: '用戶已刪除' }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error('Function error:', error.message)
        return new Response(JSON.stringify({ error: { message: error.message } }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})
