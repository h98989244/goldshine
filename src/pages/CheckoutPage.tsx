import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Calendar, Clock, MapPin, CreditCard, Store as StoreIcon, Wallet } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useToast } from '../contexts/ToastContext'
import { supabase, Store } from '../lib/supabase'
import PaymentForm from '../components/PaymentForm'

const timeSlots = ['10:00-12:00', '12:00-14:00', '14:00-16:00', '16:00-18:00', '18:00-20:00']

export default function CheckoutPage() {
  const [searchParams] = useSearchParams()
  const [stores, setStores] = useState<Store[]>([])
  const [selectedStore, setSelectedStore] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'o2o' | 'online'>('o2o')
  const [loading, setLoading] = useState(false)
  const { items, getTotal, currency, goldPrice, clearCart, calculatePrice } = useCart()
  const { user } = useAuth()
  const { t, language } = useI18n()
  const { showToast } = useToast()
  const navigate = useNavigate()

  // 從URL參數讀取預約資訊（避免重複填寫）
  useEffect(() => {
    const storeParam = searchParams.get('store')
    const dateParam = searchParams.get('date')
    const timeParam = searchParams.get('time')
    if (storeParam) setSelectedStore(storeParam)
    if (dateParam) setSelectedDate(dateParam)
    if (timeParam) setSelectedTime(decodeURIComponent(timeParam))
  }, [searchParams])

  useEffect(() => {
    async function fetchStores() {
      const { data } = await supabase
        .from('profiles')
        .select('id, store_name, store_name_vi, store_address, store_address_vi, store_phone, store_business_hours, latitude, longitude, full_name, phone')
        .eq('role', 'agent')
        .eq('is_store_visible', true)
        .order('created_at', { ascending: false })
      if (data && data.length > 0) setStores(data)
    }
    fetchStores()
  }, [])

  const formatPrice = (price: number) => {
    return currency === 'TWD' ? `NT$ ${price.toLocaleString()}` : `${price.toLocaleString()} VND`
  }

  const getMinDate = () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedStore || !selectedDate || !selectedTime) {
      showToast('請填寫完整資訊', 'warning')
      return
    }

    setLoading(true)
    try {
      const orderNumber = `FJ${Date.now().toString().slice(-10)}`
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
      const { data, error } = await supabase.from('orders').insert({
        user_id: user?.id || null,
        order_number: orderNumber,
        verification_code: verificationCode,
        status: 'reserved',
        currency,
        subtotal: getTotal(),
        discount: 0,
        total: getTotal(),
        gold_price_at_order: currency === 'TWD' ? goldPrice?.price_twd : goldPrice?.price_vnd,
        store_id: selectedStore,
        pickup_date: selectedDate,
        pickup_time_slot: selectedTime,
      }).select().single()

      if (error) throw error

      // 插入訂單明細
      for (const item of items) {
        await supabase.from('order_items').insert({
          order_id: data.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: calculatePrice(item.product),
          gold_weight: item.product.weight,
          labor_cost: currency === 'TWD' ? item.product.labor_cost_twd : item.product.labor_cost_vnd,
          selected_size: item.selectedSize,
        })
      }

      clearCart()
      navigate(`/order-success?id=${data.id}`)
    } catch (err: any) {
      console.error('Order creation error:', err)
      console.error('Error details:', JSON.stringify(err, null, 2))
      let errorMsg = '訂單建立失敗，請稍後再試'
      if (err.code === '23503') {
        errorMsg = '商品或門市資料異常，請重新整理頁面後再試'
      } else if (err.code === '42501') {
        errorMsg = '權限不足，請先登入後再預約'
      } else if (err.message) {
        errorMsg = err.message
      }
      showToast(`${errorMsg}${err.code ? ` (錯誤代碼: ${err.code})` : ''}`, 'error', 5000)
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('reservePickup')}</h1>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
          {/* 左側：預約資訊 */}
          <div className="space-y-6">
            {/* 選擇門市 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
                <MapPin className="text-amber-600" size={20} />
                {t('selectStore')}
              </h2>
              <div className="space-y-3">
                {stores.map(store => (
                  <label
                    key={store.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition ${selectedStore === store.id
                      ? 'border-amber-600 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="store"
                      value={store.id}
                      checked={selectedStore === store.id}
                      onChange={() => setSelectedStore(store.id)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">
                        {language === 'zh-TW' ? store.store_name : (store.store_name_vi || store.store_name)}
                      </p>
                      <p className="text-sm text-gray-500">{store.store_address}</p>
                      <p className="text-sm text-amber-600">{store.store_phone}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 選擇日期 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
                <Calendar className="text-amber-600" size={20} />
                {t('selectDate')}
              </h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={getMinDate()}
                className="w-full p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
            </div>

            {/* 選擇時段 */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
                <Clock className="text-amber-600" size={20} />
                {t('selectTime')}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {timeSlots.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedTime(slot)}
                    className={`p-3 rounded-lg border-2 transition ${selectedTime === slot
                      ? 'border-amber-600 bg-amber-50 text-amber-700'
                      : 'border-gray-200 hover:border-amber-300'
                      }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 右側：訂單摘要 */}
          <div>
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
                <CreditCard className="text-amber-600" size={20} />
                訂單摘要
              </h2>

              <div className="space-y-3 mb-6">
                {items.map(item => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {language === 'zh-TW' ? item.product.name : (item.product.name_vi || item.product.name)}
                      {item.quantity > 1 && ` x${item.quantity}`}
                    </span>
                    <span className="font-medium">{formatPrice(calculatePrice(item.product) * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">{t('total')}</span>
                  <span className="text-2xl font-bold text-amber-600">{formatPrice(getTotal())}</span>
                </div>
              </div>

              {/* 付款方式選擇 */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">付款方式</h3>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${paymentMethod === 'o2o' ? 'border-amber-600 bg-amber-50' : 'border-gray-200'}`}>
                    <input type="radio" checked={paymentMethod === 'o2o'} onChange={() => setPaymentMethod('o2o')} className="text-amber-600" />
                    <StoreIcon size={20} className="text-amber-600" />
                    <div>
                      <p className="font-medium">門市取貨付款 (O2O)</p>
                      <p className="text-xs text-gray-500">預約後到門市付款取貨</p>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${paymentMethod === 'online' ? 'border-amber-600 bg-amber-50' : 'border-gray-200'}`}>
                    <input type="radio" checked={paymentMethod === 'online'} onChange={() => setPaymentMethod('online')} className="text-amber-600" />
                    <Wallet size={20} className="text-amber-600" />
                    <div>
                      <p className="font-medium">線上支付</p>
                      <p className="text-xs text-gray-500">使用信用卡立即付款</p>
                    </div>
                  </label>
                </div>
              </div>

              {paymentMethod === 'online' ? (
                <PaymentForm
                  amount={getTotal()}
                  currency={currency}
                  orderId=""
                  customerEmail={user?.email}
                  onSuccess={(paymentIntentId) => {
                    // 處理線上支付成功
                    showToast('付款成功！訂單將盡快處理', 'success')
                    clearCart()
                    navigate('/orders')
                  }}
                  onError={(error) => {
                    console.error('Payment error:', error)
                  }}
                />
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={loading || !selectedStore || !selectedDate || !selectedTime}
                    className="w-full bg-amber-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-amber-700 transition disabled:opacity-50"
                  >
                    {loading ? '處理中...' : t('confirm')}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-4">
                    確認預約後，請於指定時間至門市取貨付款
                  </p>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
