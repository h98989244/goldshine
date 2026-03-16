Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { agentId, newPassword } = await req.json();

    if (!agentId || !newPassword || newPassword.length < 6) {
      return new Response(JSON.stringify({ error: '參數錯誤：需要 agentId 和至少6位的 newPassword' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // 1. 獲取代理商的資料 (從 profiles 表查詢)
    // 注意：agentId 這裡應該是 profiles.id (UUID)
    const agentRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${agentId}&select=id,email,full_name,role`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      }
    });
    const agents = await agentRes.json();

    if (!agents || agents.length === 0) {
      return new Response(JSON.stringify({ error: '找不到代理商資料' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const agent = agents[0];
    const authUserId = agent.id; // 在 profiles 表中, id 就是 auth.users 的 id

    // 2. 使用 Admin API 重設密碼
    const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${authUserId}`, {
      method: 'PUT',
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ password: newPassword })
    });

    if (!updateRes.ok) {
      const errorText = await updateRes.text();
      return new Response(JSON.stringify({ error: '密碼重設失敗：' + errorText }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: '密碼重設成功',
      agent: { name: agent.full_name, email: agent.email }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
