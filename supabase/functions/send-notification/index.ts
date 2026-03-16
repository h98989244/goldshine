// 統一發送通知edge function
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
        const { type, user_id, data } = requestData;

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

        let notificationData;

        switch (type) {
            case 'registration':
                // 註冊成功通知
                notificationData = {
                    action: 'create',
                    user_id: user_id,
                    type: 'registration',
                    title: '歡迎加入汎金珠寶！',
                    title_vi: 'Chào mừng đến với Fanjin Jewelry!',
                    content: '您的帳戶已成功建立，感謝您的註冊。我們將為您提供最優質的珠寶服務。',
                    content_vi: 'Tài khoản của bạn đã được tạo thành công. Cảm ơn bạn đã đăng ký. Chúng tôi sẽ cung cấp dịch vụ trang sức tốt nhất cho bạn.'
                };
                break;

            case 'order_created':
                // 訂單建立通知
                const { order_number, total, items_count } = data;
                notificationData = {
                    action: 'create',
                    user_id: user_id,
                    type: 'order',
                    title: '訂單已建立',
                    title_vi: 'Đơn hàng đã được tạo',
                    content: `您的訂單 ${order_number} 已成功建立，總金額 NT$ ${total?.toLocaleString() || '0'}。我們將盡快為您處理。`,
                    content_vi: `Đơn hàng ${order_number} của bạn đã được tạo thành công với tổng số tiền NT$ ${total?.toLocaleString() || '0'}. Chúng tôi sẽ xử lý sớm nhất có thể.`
                };
                break;

            case 'order_completed':
                // 訂單完成通知
                const { order_number: completion_order, verification_code, delivery_info } = data;
                let completionContent = `您的訂單 ${completion_order} 已完成。感謝您的購買！`;
                let completionContentVi = `Đơn hàng ${completion_order} của bạn đã hoàn thành. Cảm ơn bạn đã mua hàng!`;

                if (verification_code) {
                    completionContent += `\n核銷碼：${verification_code}`;
                    completionContentVi += `\nMã xác nhận: ${verification_code}`;
                }

                if (delivery_info) {
                    completionContent += `\n${delivery_info}`;
                    completionContentVi += `\n${delivery_info}`;
                }

                notificationData = {
                    action: 'create',
                    user_id: user_id,
                    type: 'completion',
                    title: '訂單已完成',
                    title_vi: 'Đơn hàng đã hoàn thành',
                    content: completionContent,
                    content_vi: completionContentVi
                };
                break;

            case 'agent_settlement':
                // 代理商結算通知
                const { settlement_order, commission_amount, settlement_period } = data;
                notificationData = {
                    action: 'create',
                    user_id: user_id,
                    type: 'settlement',
                    title: '佣金結算通知',
                    title_vi: 'Thông báo thanh toán hoa hồng',
                    content: `您有一筆佣金 NT$ ${commission_amount?.toLocaleString() || '0'} 已結算，訂單編號：${settlement_order}。${settlement_period ? `結算期間：${settlement_period}` : ''}`,
                    content_vi: `Bạn có một khoản hoa hồng NT$ ${commission_amount?.toLocaleString() || '0'} đã được thanh toán, mã đơn hàng: ${settlement_order}.${settlement_period ? `Thời kỳ thanh toán: ${settlement_period}` : ''}`
                };
                break;

            case 'order_status_update':
                // 訂單狀態更新通知
                const { status_order, new_status, status_message } = data;
                const statusTitleMap = {
                    'processing': '訂單處理中',
                    'shipped': '訂單已出貨',
                    'cancelled': '訂單已取消',
                    'refunded': '訂單已退款'
                };

                const statusTitleViMap = {
                    'processing': 'Đơn hàng đang được xử lý',
                    'shipped': 'Đơn hàng đã được giao',
                    'cancelled': 'Đơn hàng đã bị hủy',
                    'refunded': 'Đơn hàng đã được hoàn tiền'
                };

                notificationData = {
                    action: 'create',
                    user_id: user_id,
                    type: 'order_status',
                    title: statusTitleMap[new_status] || '訂單狀態更新',
                    title_vi: statusTitleViMap[new_status] || 'Cập nhật trạng thái đơn hàng',
                    content: `您的訂單 ${status_order} 狀態已更新為：${new_status}。${status_message || ''}`,
                    content_vi: `Trạng thái đơn hàng ${status_order} của bạn đã được cập nhật thành: ${new_status}. ${status_message || ''}`
                };
                break;

            case 'promotion':
                // 促銷活動通知
                const { promotion_title, promotion_content, promotion_url } = data;
                notificationData = {
                    action: 'create',
                    user_id: user_id,
                    type: 'promotion',
                    title: promotion_title,
                    title_vi: promotion_title,
                    content: `${promotion_content}${promotion_url ? `\n查看詳情：${promotion_url}` : ''}`,
                    content_vi: `${promotion_content}${promotion_url ? `\nXem chi tiết: ${promotion_url}` : ''}`
                };
                break;

            case 'system_announcement':
                // 系統公告通知
                const { announcement_title, announcement_content } = data;
                notificationData = {
                    action: 'create',
                    user_id: user_id,
                    type: 'system',
                    title: announcement_title,
                    title_vi: announcement_title,
                    content: announcement_content,
                    content_vi: announcement_content
                };
                break;

            default:
                throw new Error('Invalid notification type');
        }

        // 發送通知
        const notificationResponse = await fetch(`${supabaseUrl}/functions/v1/notification-service`, {
            method: 'POST',
            headers,
            body: JSON.stringify(notificationData)
        });

        if (!notificationResponse.ok) {
            throw new Error('Failed to create notification');
        }

        const result = await notificationResponse.json();

        return new Response(JSON.stringify({ data: result }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Send notification error:', error);
        
        const errorResponse = {
            error: {
                code: 'SEND_NOTIFICATION_ERROR',
                message: error.message
            }
        };

        return new Response(JSON.stringify(errorResponse), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});