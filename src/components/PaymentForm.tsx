import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { supabase } from '../lib/supabase'
import { CreditCard, Lock, AlertCircle } from 'lucide-react'

// Stripe publishable key - should be set in environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

interface PaymentFormProps {
  amount: number
  currency: 'TWD' | 'VND'
  orderId: string
  customerEmail?: string
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
}

export default function PaymentForm({ amount, currency, orderId, customerEmail, onSuccess, onError }: PaymentFormProps) {
  const [loading, setLoading] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [error, setError] = useState('')

  // Check if Stripe is configured
  const isStripeConfigured = !!STRIPE_PUBLISHABLE_KEY

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!isStripeConfigured) {
        throw new Error('Stripe 支付尚未設定。請聯繫管理員。')
      }

      // Call Edge Function to create payment intent
      const { data, error: fnError } = await supabase.functions.invoke('create-payment-intent', {
        body: { amount, currency: currency.toLowerCase(), orderId, customerEmail }
      })

      if (fnError) throw new Error(fnError.message)
      if (data.error) throw new Error(data.error.message)

      // Load Stripe
      const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY)
      if (!stripe) throw new Error('Failed to load Stripe')

      // Confirm payment (in production, use Stripe Elements)
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: {
            // In production, use Stripe Elements CardElement
            // This is a placeholder for demo
          } as any,
          billing_details: {
            email: customerEmail
          }
        }
      })

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess(paymentIntent.id)
      }

    } catch (err: any) {
      const errorMsg = err.message || '支付失敗，請稍後重試'
      setError(errorMsg)
      onError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (p: number) => currency === 'TWD' ? `NT$ ${p.toLocaleString()}` : `${p.toLocaleString()} VND`

  if (!isStripeConfigured) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-yellow-800 mb-1">線上支付暫未開放</h3>
            <p className="text-sm text-yellow-700">
              目前僅支援 O2O 預約取貨模式。請選擇門市預約，到店後再行付款。
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="text-amber-600" size={24} />
        <h3 className="font-semibold text-gray-800">信用卡付款</h3>
        <Lock size={16} className="text-green-600 ml-auto" />
        <span className="text-xs text-green-600">安全加密</span>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex justify-between">
          <span className="text-gray-600">應付金額</span>
          <span className="text-xl font-bold text-amber-600">{formatPrice(amount)}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">卡號</label>
          <input
            type="text"
            value={cardNumber}
            onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
            placeholder="4242 4242 4242 4242"
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">有效期限</label>
            <input
              type="text"
              value={expiry}
              onChange={e => setExpiry(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="MM/YY"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">安全碼</label>
            <input
              type="text"
              value={cvc}
              onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="CVC"
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              處理中...
            </>
          ) : (
            <>
              <Lock size={18} />
              確認付款 {formatPrice(amount)}
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          付款由 Stripe 安全處理，我們不會儲存您的卡片資訊。
        </p>
      </form>
    </div>
  )
}
