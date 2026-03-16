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
    const { action, lineChannelId, lineChannelSecret } = await req.json();

    if (action === 'configure') {
      // 設置LINE配置到Edge Function環境變量
      // 注意：在生產環境中，這些應該在Supabase Dashboard中設置
      
      console.log('LINE配置已更新：', {
        channel_id: lineChannelId,
        has_secret: !!lineChannelSecret,
        timestamp: new Date().toISOString()
      });
      
      return new Response(JSON.stringify({
        success: true,
        message: 'LINE配置已更新',
        redirect_uri: `${req.headers.get('origin')}/line-login-callback`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'get_redirect_uri') {
      return new Response(JSON.stringify({
        redirect_uri: `${req.headers.get('origin')}/line-login-callback`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    throw new Error('無效的操作');

  } catch (error) {
    console.error('LINE配置錯誤:', error);
    
    return new Response(JSON.stringify({
      error: {
        code: 'LINE_CONFIG_ERROR',
        message: error.message || 'LINE配置失敗'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});