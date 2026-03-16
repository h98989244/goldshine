import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 200, headers: corsHeaders })
    }

    try {
        const { orderId, verifiedBy, isReferredOrder } = await req.json()

        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error('Missing Supabase configuration')
        }

        const supabase = createClient(supabaseUrl, serviceRoleKey)

        // 獲取訂單資訊
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(`
        *,
        user:profiles!user_id(full_name, email),
        agent:profiles!agent_id(full_name, store_name)
      `)
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            throw new Error('Order not found: ' + orderError?.message)
        }

        // 獲取核銷者資訊
        const { data: verifier, error: verifierError } = await supabase
            .from('profiles')
            .select('full_name, store_name')
            .eq('id', verifiedBy)
            .single()

        if (verifierError) {
            console.error('Failed to get verifier info:', verifierError)
        }

        const verifierName = verifier?.store_name || verifier?.full_name || '門市'
        const orderType = isReferredOrder ? '推薦客戶訂單' : '門市領取訂單'

        // 發送通知給推薦代理商(如果有)
        if (order.agent_id) {
            await supabase.from('notifications').insert({
                user_id: order.agent_id,
                type: 'completion',
                title: '訂單已核銷',
                title_vi: 'Đơn hàng đã được xác nhận',
                content: `訂單 ${order.order_number} (${orderType}) 已由 ${verifierName} 核銷完成`,
                content_vi: `Đơn hàng ${order.order_number} (${orderType}) đã được ${verifierName} xác nhận hoàn thành`,
                is_read: false
            })
        }

        // 如果核銷者不是推薦代理商,也發送通知給核銷者
        if (verifiedBy !== order.agent_id) {
            await supabase.from('notifications').insert({
                user_id: verifiedBy,
                type: 'completion',
                title: '核銷成功',
                title_vi: 'Xác nhận thành công',
                content: `您已成功核銷訂單 ${order.order_number} (${orderType})`,
                content_vi: `Bạn đã xác nhận thành công đơn hàng ${order.order_number} (${orderType})`,
                is_read: false
            })
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Notification sent successfully'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )
    } catch (error) {
        console.error('Send verification notification error:', error)
        return new Response(
            JSON.stringify({
                error: error.message || 'Internal server error'
            }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
        )
    }
})
