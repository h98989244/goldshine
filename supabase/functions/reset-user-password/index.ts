import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 驗證請求方法
        if (req.method !== 'POST') {
            throw new Error('Method not allowed')
        }

        // 獲取請求資料
        const { userId, newPassword } = await req.json()

        if (!userId || !newPassword) {
            throw new Error('Missing required fields: userId and newPassword')
        }

        // 驗證密碼長度
        if (newPassword.length < 6) {
            throw new Error('Password must be at least 6 characters long')
        }

        // 獲取當前用戶的 session
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            throw new Error('Missing authorization header')
        }

        // 創建 Supabase 客戶端(使用 anon key 驗證請求者)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: authHeader },
                },
            }
        )

        // 驗證請求者是否為管理員
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            throw new Error('Unauthorized: Invalid token')
        }

        // 檢查用戶角色
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            throw new Error('Failed to fetch user profile')
        }

        if (profile.role !== 'admin') {
            throw new Error('Forbidden: Only admins can reset passwords')
        }

        // 使用 service role key 創建管理員客戶端
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 更新用戶密碼
        const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            { password: newPassword }
        )

        if (error) {
            console.error('Error updating password:', error)
            throw new Error(`Failed to update password: ${error.message}`)
        }

        // 記錄操作日誌
        await supabaseAdmin
            .from('operation_logs')
            .insert({
                user_id: user.id,
                user_email: user.email,
                operation_type: 'update',
                table_name: 'auth.users',
                operation_description: `重設用戶密碼 ID: ${userId}`,
                after_values: { password_updated: true },
                user_agent: req.headers.get('user-agent')
            })

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Password updated successfully',
                data
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error in reset-user-password function:', error)

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Internal server error'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: error.message.includes('Unauthorized') ? 401 :
                    error.message.includes('Forbidden') ? 403 :
                        error.message.includes('Method not allowed') ? 405 : 400,
            }
        )
    }
})
