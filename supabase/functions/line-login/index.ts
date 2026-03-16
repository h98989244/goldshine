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
    const { code } = await req.json();

    // LINE Login 設定 - 使用用戶提供的配置
    const LINE_CHANNEL_ID = '2008825136';
    const LINE_CHANNEL_SECRET = 'c33d2f1340b54de156a758d4225591fb';
    const REDIRECT_URI = `${req.headers.get('origin')}/line-login-callback`;

    if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET) {
      throw new Error('LINE Login 配置缺失');
    }

    // 1. 交換授權碼獲取 access token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenResponse.ok) {
      throw new Error(`LINE Token 錯誤: ${tokenData.error_description || tokenData.error}`);
    }

    // 2. 獲取用戶資料
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const profileData = await profileResponse.json();
    
    if (!profileResponse.ok) {
      throw new Error(`LINE Profile 錯誤: ${profileData.message || '無法獲取用戶資料'}`);
    }

    // 3. 生成臨時用戶資料 (使用LINE用戶ID作為email)
    const lineUserEmail = `line_${profileData.userId}@line-login.fanjin`;
    const displayName = profileData.displayName || 'LINE用戶';

    // 4. 檢查用戶是否已存在
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // 檢查profiles表中的用戶
    const checkUserResponse = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${profileData.userId}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    });

    const existingUsers = await checkUserResponse.json();

    let userId = profileData.userId;
    let isNewUser = false;

    if (existingUsers.length === 0) {
      isNewUser = true;
      
      // 創建新用戶
      const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: profileData.userId,
          email: lineUserEmail,
          email_confirm: true, // LINE用戶自動確認
          user_metadata: {
            line_user_id: profileData.userId,
            display_name: displayName,
            picture_url: profileData.pictureUrl,
            provider: 'line'
          }
        }),
      });

      if (!createUserResponse.ok) {
        const errorData = await createUserResponse.json();
        throw new Error(`創建用戶失敗: ${errorData.message || '未知錯誤'}`);
      }

      const newUser = await createUserResponse.json();
      
      // 創建用戶資料
      const profileResponse = await fetch(`${supabaseUrl}/rest/v1/profiles`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          id: profileData.userId,
          full_name: displayName,
          avatar_url: profileData.pictureUrl,
          preferred_language: 'zh-TW',
          preferred_currency: 'TWD',
          role: 'user',
          is_active: true,
        }),
      });

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(`創建用戶資料失敗: ${errorData.message || '未知錯誤'}`);
      }
    }

    // 5. 生成JWT token
    const jwtResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: lineUserEmail,
        password: profileData.userId, // 使用LINE userId作為密碼
      }),
    });

    const jwtData = await jwtResponse.json();
    
    if (!jwtResponse.ok) {
      throw new Error(`JWT Token 錯誤: ${jwtData.error_description || jwtData.error}`);
    }

    // 返回成功響應
    return new Response(JSON.stringify({ 
      success: true,
      user: {
        id: userId,
        email: lineUserEmail,
        display_name: displayName,
        picture_url: profileData.pictureUrl,
        is_new_user: isNewUser
      },
      session: {
        access_token: jwtData.access_token,
        refresh_token: jwtData.refresh_token,
        expires_in: jwtData.expires_in,
        token_type: jwtData.token_type,
        user: jwtData.user
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('LINE Login 錯誤:', error);
    
    return new Response(JSON.stringify({
      error: {
        code: 'LINE_LOGIN_ERROR',
        message: error.message || 'LINE登入失敗'
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});