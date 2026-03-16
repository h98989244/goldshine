import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle, Calendar, Clock, MapPin, QrCode, Copy, Check } from 'lucide-react'
import { supabase, Order, Store } from '../lib/supabase'

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('id')
  const [order, setOrder] = useState<Order | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId) return
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()
      if (data) {
        setOrder(data)
        // 獲取門市資訊(從 profiles 表)
        if (data.store_id) {
          const { data: storeData } = await supabase
            .from('profiles')
            .select('id, store_name, store_address, store_phone, full_name, phone')
            .eq('id', data.store_id)
            .eq('role', 'agent')
            .single()
          if (storeData) setStore(storeData)
        }
      }
    }
    fetchOrder()
  }, [orderId])

  const copyCode = () => {
    if (order?.verification_code) {
      navigator.clipboard.writeText(order.verification_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatPrice = (price: number, currency: string = 'TWD') => {
    return currency === 'TWD' ? `NT$ ${price.toLocaleString()}` : `${price.toLocaleString()} VND`
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        {/* 成功圖標 */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">預約成功！</h1>
          <p className="text-gray-500">請於預約時間前往門市取貨付款</p>
        </div>

        {/* 核銷碼 */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6 text-center">
          <p className="text-sm text-amber-700 mb-2">取貨核銷碼</p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-bold text-amber-600 font-mono tracking-widest">
              {order.verification_code || order.order_number.slice(-6)}
            </span>
            <button
              onClick={copyCode}
              className="p-2 bg-amber-200 rounded-lg hover:bg-amber-300 transition"
            >
              {copied ? <Check size={20} className="text-green-600" /> : <Copy size={20} className="text-amber-700" />}
            </button>
          </div>
          <p className="text-xs text-amber-600 mt-2">請向門市人員出示此核銷碼</p>
        </div>

        {/* 訂單資訊 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">預約詳情</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <QrCode className="text-amber-600 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-500">訂單編號</p>
                <p className="font-mono font-semibold">{order.order_number}</p>
              </div>
            </div>

            {store && (
              <div className="flex items-start gap-3">
                <MapPin className="text-amber-600 mt-1" size={20} />
                <div>
                  <p className="text-sm text-gray-500">取貨門市</p>
                  <p className="font-semibold">{store.store_name}</p>
                  <p className="text-sm text-gray-500">{store.store_address}</p>
                  <p className="text-sm text-amber-600">{store.store_phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <Calendar className="text-amber-600 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-500">預約日期</p>
                <p className="font-semibold">{order.pickup_date}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="text-amber-600 mt-1" size={20} />
              <div>
                <p className="text-sm text-gray-500">預約時段</p>
                <p className="font-semibold">{order.pickup_time_slot}</p>
              </div>
            </div>
          </div>

          <div className="border-t mt-4 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">預估金額</span>
              <span className="text-xl font-bold text-amber-600">
                {formatPrice(order.total, order.currency)}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">*實際金額以門市結帳時金價計算</p>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">取貨須知</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. 請於預約時間內前往門市</li>
            <li>2. 出示核銷碼或訂單編號</li>
            <li>3. 現場驗貨確認後付款</li>
            <li>4. 支援現金或信用卡支付</li>
          </ul>
        </div>

        {/* 操作按鈕 */}
        <div className="space-y-3">
          <Link
            to="/orders"
            className="block w-full bg-amber-600 text-white text-center py-4 rounded-lg font-semibold hover:bg-amber-700 transition"
          >
            查看我的訂單
          </Link>
          <Link
            to="/"
            className="block w-full bg-gray-100 text-gray-700 text-center py-4 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            返回首頁
          </Link>
        </div>
      </div>
    </div>
  )
}
