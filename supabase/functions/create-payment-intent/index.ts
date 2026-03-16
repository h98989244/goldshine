Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  }

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { amount, currency = 'twd', orderId, customerEmail } = await req.json()

    // Validate
    if (!amount || amount <= 0) {
      throw new Error('Invalid amount')
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      throw new Error('Stripe not configured. Please set STRIPE_SECRET_KEY.')
    }

    // Create Stripe payment intent
    const stripeParams = new URLSearchParams()
    stripeParams.append('amount', Math.round(amount * 100).toString())
    stripeParams.append('currency', currency.toLowerCase())
    stripeParams.append('payment_method_types[]', 'card')
    if (orderId) stripeParams.append('metadata[order_id]', orderId)
    if (customerEmail) stripeParams.append('receipt_email', customerEmail)

    const stripeResponse = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: stripeParams.toString()
    })

    if (!stripeResponse.ok) {
      const errorData = await stripeResponse.text()
      console.error('Stripe error:', errorData)
      throw new Error(`Stripe API error: ${stripeResponse.status}`)
    }

    const paymentIntent = await stripeResponse.json()

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Payment error:', error)
    return new Response(JSON.stringify({
      error: { message: error.message }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
