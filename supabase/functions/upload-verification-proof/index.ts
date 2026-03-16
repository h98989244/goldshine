import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        console.log('Received request with Authorization header length:', authHeader?.length)

        // 1. 建立 Supabase Client
        // process.env.SUPABASE_URL 等在 Deno 中是 Deno.env.get
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader! } } }
        )

        // 2. 獲取當前用戶
        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            throw new Error('Unauthorized')
        }

        // 3. 檢查是否為代理商
        // 這裡我們需要用 Service Role Key 才能確保能讀取 profiles (雖然 RLS 可能允許讀取自己的，但 Service Role 更保險)
        // 不過既然我們已經有 user id，我們試著用剛才建立的 client 讀取（如果 RLS 正確的話）
        // 為求保險，我們這裡再建立一個 admin client 專門用來查權限和上傳（上傳需要繞過 RLS 的話）
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || profile.role !== 'agent') {
            throw new Error('Forbidden: Only agents can upload verification proofs')
        }

        // 4. 解析請求
        const { imageData, fileName } = await req.json()
        if (!imageData || !fileName) {
            throw new Error('Missing imageData or fileName')
        }

        // Extract base64
        const base64Match = imageData.match(/^data:([^;]+);base64,(.+)$/)
        if (!base64Match) {
            throw new Error('Invalid image data format')
        }
        const contentType = base64Match[1]
        const base64Data = base64Match[2]

        // Convert to Uint8Array
        const binaryStr = atob(base64Data)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i)
        }

        // 5. 上傳文件
        const timestamp = Date.now()
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
        const path = `${user.id}/${timestamp}-${sanitizedName}` // 使用 user.id 分資料夾

        const { error: uploadError } = await supabaseAdmin.storage
            .from('verification-proofs')
            .upload(path, bytes, {
                contentType,
                upsert: true
            })

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`)
        }

        // 6. 獲取 URL
        const { data: urlData } = supabaseAdmin.storage
            .from('verification-proofs')
            .getPublicUrl(path)

        return new Response(
            JSON.stringify({
                data: { publicUrl: urlData.publicUrl },
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
