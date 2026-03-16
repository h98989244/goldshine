import { useState, useEffect } from 'react'
import { Package, Clock, CheckCircle, XCircle, Search } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useToast } from '../contexts/ToastContext'
import { supabase, Order } from '../lib/supabase'

const statusConfig: Record<string, { icon: any; color: string; label: string; labelVi: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', label: '待付款', labelVi: 'Cho thanh toan' },
  reserved: { icon: Package, color: 'text-blue-500', label: '已預約', labelVi: 'Da dat truoc' },
  completed: { icon: CheckCircle, color: 'text-green-500', label: '已完成', labelVi: 'Hoan thanh' },
  cancelled: { icon: XCircle, color: 'text-red-500', label: '已取消', labelVi: 'Da huy' },
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [guestSearchQuery, setGuestSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'order_number' | 'verification_code'>('order_number')
  const { user } = useAuth()
  const { t, language } = useI18n()
  const { showToast } = useToast()

  useEffect(() => {
    if (user) {
      fetchUserOrders()
    } else {
      setLoading(false)
    }
  }, [user])

  async function fetchUserOrders() {
    if (!user) return
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setOrders(data)
    setLoading(false)
  }

  async function handleGuestSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!guestSearchQuery.trim()) {
      showToast('請輸入訂單編號或核銷碼', 'warning')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq(searchType, guestSearchQuery.trim())
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        setOrders(data)
        showToast(`找到 ${data.length} 筆訂單`, 'success')
      } else {
        setOrders([])
        showToast('查無訂單，請確認訂單編號或核銷碼是否正確', 'info')
      }
    } catch (err: any) {
      console.error('Guest order search error:', err)
      showToast('查詢失敗，請稍後再試', 'error')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (order: Order) => {
    return order.currency === 'TWD'
      ? `NT$ ${order.total.toLocaleString()}`
      : `${order.total.toLocaleString()} VND`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('myOrders')}</h1>

        {/* 訪客訂單查詢 */}
        {!user && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Search size={20} className="text-amber-600" />
              訪客訂單查詢
            </h2>
            <form onSubmit={handleGuestSearch} className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={searchType === 'order_number'}
                    onChange={() => setSearchType('order_number')}
                    className="text-amber-600"
                  />
                  <span className="text-sm">訂單編號</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={searchType === 'verification_code'}
                    onChange={() => setSearchType('verification_code')}
                    className="text-amber-600"
                  />
                  <span className="text-sm">核銷碼</span>
                </label>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={guestSearchQuery}
                  onChange={(e) => setGuestSearchQuery(e.target.value)}
                  placeholder={searchType === 'order_number' ? '請輸入訂單編號 (例: FJ1234567890)' : '請輸入核銷碼'}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-amber-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-amber-700 transition"
                >
                  查詢
                </button>
              </div>
              <p className="text-xs text-gray-500">
                提示：訂單編號和核銷碼可在預約成功頁面或確認郵件中找到
              </p>
            </form>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Package size={60} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {user ? '尚無訂單記錄' : '請使用上方查詢功能查詢訂單'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => {
              const status = statusConfig[order.status] || statusConfig.pending
              const StatusIcon = status.icon
              return (
                <div key={order.id} className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">訂單編號</p>
                      <p className="font-mono font-semibold text-gray-800">{order.order_number}</p>
                    </div>
                    <div className={`flex items-center gap-2 ${status.color}`}>
                      <StatusIcon size={20} />
                      <span className="font-medium">
                        {language === 'zh-TW' ? status.label : status.labelVi}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">下單時間</p>
                      <p className="font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">取貨日期</p>
                      <p className="font-medium">{order.pickup_date || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">取貨時段</p>
                      <p className="font-medium">{order.pickup_time_slot || '-'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t('total')}</p>
                      <p className="font-bold text-amber-600">{formatPrice(order)}</p>
                    </div>
                  </div>

                  {order.status === 'reserved' && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-blue-600 mb-2">請於預約時間至門市取貨付款</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">核銷碼</p>
                          <p className="font-mono text-lg font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg inline-block">
                            {order.verification_code || '-'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">請向門市人員出示此核銷碼</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
