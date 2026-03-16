import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { imageData, fileName } = await req.json()

    if (!imageData || !fileName) {
      throw new Error('Missing imageData or fileName')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract base64 data
    const base64Match = imageData.match(/^data:([^;]+);base64,(.+)$/)
    if (!base64Match) {
      throw new Error('Invalid image data format')
    }
    const contentType = base64Match[1]
    const base64Data = base64Match[2]
    
    // Convert base64 to Uint8Array
    const binaryStr = atob(base64Data)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }

    // Generate unique filename
    const timestamp = Date.now()
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `products/${timestamp}-${sanitizedName}`

    // Upload using Supabase client
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(storagePath, bytes, {
        contentType,
        upsert: true
      })

    if (error) {
      throw new Error(`Storage error: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(storagePath)

    return new Response(JSON.stringify({
      data: { publicUrl: urlData.publicUrl }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(JSON.stringify({
      error: { code: 'UPLOAD_FAILED', message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
