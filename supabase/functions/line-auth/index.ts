import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface LineAuthRequest {
    lineUserId: string
    displayName: string
    pictureUrl?: string
    email?: string
    redirectTo?: string
    referralCode?: string
}

serve(async (req) => {
    // 處理 CORS preflight 請求
    if (req.method === 'OPTIONS') {
        return new Response('ok', {
            headers: corsHeaders,
            status: 200
        })
    }

    try {
        // 解析請求
        const { lineUserId, displayName, pictureUrl, email, redirectTo, referralCode }: LineAuthRequest = await req.json()

        console.log('收到的請求參數:', { lineUserId, displayName, email, redirectTo, referralCode })

        if (!lineUserId || !displayName) {
            throw new Error('缺少必要參數：lineUserId 和 displayName')
        }

        // 創建 Supabase Admin 客戶端
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

        console.log('處理 LINE 用戶登入:', { lineUserId, displayName, email })

        // 1. 檢查是否已有該 LINE 用戶的記錄
        const { data: existingLineUser, error: lineUserError } = await supabaseAdmin
            .from('line_users')
            .select('*')
            .eq('line_user_id', lineUserId)
            .single()

        if (lineUserError && lineUserError.code !== 'PGRST116') {
            // PGRST116 = 找不到記錄，這是正常的
            console.error('查詢 LINE 用戶錯誤:', lineUserError)
            throw lineUserError
        }

        let supabaseUserId: string
        let isNewUser = false
        // 預設 Email 邏輯 (強制小寫)
        let targetEmail = (email || `${lineUserId}@line.user`).toLowerCase()


        if (existingLineUser) {
            // 已存在的用戶
            console.log('找到現有 LINE 用戶:', existingLineUser.supabase_user_id)
            supabaseUserId = existingLineUser.supabase_user_id

            // 驗證 auth.users 中是否存在該用戶，並獲取正確的 email
            const { data: authUser, error: authUserError } = await supabaseAdmin.auth.admin.getUserById(supabaseUserId)

            if (authUserError || !authUser.user) {
                console.error('找不到對應的 Supabase Auth 用戶:', authUserError)
                throw new Error('帳號資料異常，請聯繫管理員')
            }

            // 使用 Auth 系統中實際的 Email
            if (authUser.user.email) {
                targetEmail = authUser.user.email
                console.log('使用 Auth 系統 Email:', targetEmail)
            }

            // 更新用戶資料（可能有變更）
            await supabaseAdmin
                .from('line_users')
                .update({
                    display_name: displayName,
                    picture_url: pictureUrl,
                    email: targetEmail,
                    updated_at: new Date().toISOString()
                })
                .eq('line_user_id', lineUserId)

            // 更新 profile
            await supabaseAdmin
                .from('profiles')
                .update({
                    full_name: displayName,
                    avatar_url: pictureUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', supabaseUserId)

        } else {
            // 新用戶，需要創建 Supabase 帳號
            console.log('創建新的 Supabase 用戶')
            isNewUser = true

            // 生成唯一的 email（如果 LINE 沒有提供）
            // 強制轉換為小寫，避免大小寫不匹配導致 verifyOtp 失敗
            const userEmail = (email || `${lineUserId}@line.user`).toLowerCase()
            const finalEmail = userEmail

            // 生成隨機密碼（用戶不會使用，僅用於滿足 Supabase 要求）
            const randomPassword = crypto.randomUUID()

            // 創建 Supabase 用戶
            const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
                email: finalEmail,
                password: randomPassword,
                email_confirm: true, // 自動確認 email
                user_metadata: {
                    full_name: displayName,
                    avatar_url: pictureUrl,
                    auth_provider: 'line',
                    line_user_id: lineUserId,
                    agreed_to_terms: true,
                    agreed_to_terms_at: new Date().toISOString(),
                    terms_version: '1.0',
                    privacy_policy_version: '1.0',
                    referral_code: referralCode || undefined
                }
            })

            // ... (error handling)

            if (!newUser.user) {
                throw new Error('創建用戶失敗')
            }

            supabaseUserId = newUser.user.id
            console.log('成功創建 Supabase 用戶:', supabaseUserId)
            if (referralCode) {
                console.log('設置推薦碼:', referralCode)
            }

            // 創建 line_users 記錄
            const { error: insertLineUserError } = await supabaseAdmin
                .from('line_users')
                .insert({
                    line_user_id: lineUserId,
                    supabase_user_id: supabaseUserId,
                    display_name: displayName,
                    picture_url: pictureUrl,
                    email: finalEmail
                })

            // ... (insert error handling)

            // 更新 profile
            await supabaseAdmin
                .from('profiles')
                .update({
                    full_name: displayName,
                    avatar_url: pictureUrl,
                    agreed_to_terms: true,
                    agreed_to_terms_at: new Date().toISOString(),
                    terms_version: '1.0',
                    privacy_policy_version: '1.0'
                })
                .eq('id', supabaseUserId)
        }


        // 2. 生成 session token
        // 使用前端傳來的 redirectTo，如果沒有則使用 origin
        const finalRedirectUrl = redirectTo || req.headers.get('origin') || 'http://localhost:5173'
        console.log('Redirect URL targeted:', finalRedirectUrl)

        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: targetEmail,
            options: {
                redirectTo: finalRedirectUrl
            }
        })

        if (sessionError) {
            console.error('生成 session 錯誤:', sessionError)
            throw sessionError
        }

        console.log('Session Data Properties:', JSON.stringify(sessionData.properties, null, 2))

        // 從 magic link 中提取 access_token 和 refresh_token
        // Debug: Log action link params
        const url = new URL(sessionData.properties.action_link)
        console.log('Action Link Params:', [...url.searchParams.keys()])

        // 嘗試獲取 token，如果沒有則嘗試獲取 hashed_token 或 code (PKCE)
        let token = url.searchParams.get('token')
        const code = url.searchParams.get('code') // PKCE flow
        const type = url.searchParams.get('type')

        if (!token && code) {
            console.log('檢測到 PKCE code, 將回傳 code 作為 token')
            // 注意：如果是 PKCE code，前端需要用 exchangeCodeForSession 而不是 verifyOtp magiclink ?
            // 或者仍然用 verifyOtp? 通常 verifyOtp type=magiclink 接受 token hash.
            // 但如果拿到的是 code... 
            // 暫時假設我們需要 token. 如果只有 code, 可能是 flow 配置問題.
        }

        if (!token) {
            // Log 完整 link (生產環境應隱藏敏感信息, 但這裡是 debug)
            console.log('Action Link:', sessionData.properties.action_link)
            throw new Error('無法生成 session token (找不到 token 參數)')
        }

        console.log('成功生成 session token')

        // 返回 action_link 讓前端直接跳轉驗證 (Magic Link Flow)
        return new Response(
            JSON.stringify({
                success: true,
                action_link: sessionData.properties.action_link, // 直接回傳完整連結
                email: targetEmail,
                isNewUser
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch (error: any) {
        console.error('LINE 登入錯誤:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: {
                    message: error?.message || '登入失敗',
                    details: error
                }
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
