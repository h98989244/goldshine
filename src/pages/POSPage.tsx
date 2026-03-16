import { useState, useEffect } from 'react'
import { Search, QrCode, CreditCard, Banknote, CheckCircle, XCircle, Printer, Package, Calendar, Clock, User, Receipt } from 'lucide-react'
import { supabase, Order } from '../lib/supabase'

type OrderWithDetails = Order & {
  store?: { name: string }
  profiles?: { full_name: string; phone: string }
}

export default function POSPage() {
  const [verifyCode, setVerifyCode] = useState('')
  const [currentOrder, setCurrentOrder] = useState<OrderWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [todayOrders, setTodayOrders] = useState<OrderWithDetails[]>([])
  const [dailyStats, setDailyStats] = useState({ total: 0, cash: 0, card: 0, count: 0 })

  useEffect(() => {
    fetchTodayOrders()
  }, [])

  async function fetchTodayOrders() {
    const today = new Date().toISOString().split('T')[0]
    const { data } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', today)
      .order('created_at', { ascending: false })

    if (data) {
      setTodayOrders(data)
      const completed = data.filter(o => o.status === 'completed')
      setDailyStats({
        count: completed.length,
        total: completed.reduce((sum, o) => sum + (o.total || 0), 0),
        cash: completed.filter(o => o.payment_method === 'cash').reduce((sum, o) => sum + (o.total || 0), 0),
        card: completed.filter(o => o.payment_method === 'card').reduce((sum, o) => sum + (o.total || 0), 0),
      })
    }
  }

  async function searchOrder() {
    if (!verifyCode.trim()) return
    setLoading(true)
    setMessage(null)

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`order_number.eq.${verifyCode},verification_code.eq.${verifyCode}`)
      .single()

    if (error || !data) {
      setMessage({ type: 'error', text: '找不到此訂單' })
      setCurrentOrder(null)
    } else {
      setCurrentOrder(data)
    }
    setLoading(false)
  }

  async function processPayment(method: 'cash' | 'card') {
    if (!currentOrder) return
    setLoading(true)

    const receiptNumber = `R${Date.now().toString().slice(-8)}`
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'completed',
        payment_method: method,
        receipt_number: receiptNumber,
        verified_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      })
      .eq('id', currentOrder.id)

    if (error) {
      setMessage({ type: 'error', text: '處理失敗，請重試' })
    } else {
      setMessage({ type: 'success', text: `付款成功！收據編號: ${receiptNumber}` })
      setCurrentOrder({ ...currentOrder, status: 'completed', payment_method: method, receipt_number: receiptNumber })
      fetchTodayOrders()
    }
    setLoading(false)
  }

  async function cancelOrder() {
    if (!currentOrder) return
    if (!confirm('確定要取消此訂單嗎？')) return

    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', currentOrder.id)

    if (!error) {
      setMessage({ type: 'success', text: '訂單已取消' })
      setCurrentOrder(null)
      fetchTodayOrders()
    }
  }

  const formatPrice = (price: number, currency: string = 'TWD') => {
    return currency === 'TWD' ? `NT$ ${price.toLocaleString()}` : `${price.toLocaleString()} VND`
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; text: string }> = {
      pending: { color: 'bg-yellow-100 text-yellow-700', text: '待付款' },
      reserved: { color: 'bg-blue-100 text-blue-700', text: '已預約' },
      completed: { color: 'bg-green-100 text-green-700', text: '已完成' },
      cancelled: { color: 'bg-red-100 text-red-700', text: '已取消' },
    }
    const c = config[status] || config.pending
    return <span className={`px-2 py-1 rounded text-xs ${c.color}`}>{c.text}</span>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 頂部欄 */}
      <header className="bg-amber-700 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-amber-900 font-bold">金</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">金銀山有限公司 POS 系統</h1>
              <p className="text-amber-200 text-sm">門市收銀台</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-amber-200">{new Date().toLocaleDateString('zh-TW')}</p>
            <p className="font-mono">{new Date().toLocaleTimeString('zh-TW')}</p>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* 左側：訂單查詢 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 搜尋區 */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <QrCode className="text-amber-600" />
                訂單核銷
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && searchOrder()}
                  placeholder="輸入訂單編號或核銷碼"
                  className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-amber-500 font-mono text-lg"
                />
                <button
                  onClick={searchOrder}
                  disabled={loading}
                  className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
                >
                  <Search size={20} />
                  查詢
                </button>
              </div>

              {message && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                  message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  {message.text}
                </div>
              )}
            </div>

            {/* 訂單詳情 */}
            {currentOrder && (
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-800">訂單詳情</h2>
                  {getStatusBadge(currentOrder.status)}
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Package className="text-amber-600" size={18} />
                      <span>訂單編號: <span className="font-mono font-semibold text-gray-800">{currentOrder.order_number}</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Calendar className="text-amber-600" size={18} />
                      <span>預約日期: {currentOrder.pickup_date || '-'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Clock className="text-amber-600" size={18} />
                      <span>預約時段: {currentOrder.pickup_time_slot || '-'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <User className="text-amber-600" size={18} />
                      <span>客戶ID: {currentOrder.user_id?.slice(0, 8) || '訪客'}...</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Receipt className="text-amber-600" size={18} />
                      <span>幣別: {currentOrder.currency}</span>
                    </div>
                  </div>
                </div>

                {/* 金額 */}
                <div className="bg-amber-50 rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">應收金額</span>
                    <span className="text-3xl font-bold text-amber-600">
                      {formatPrice(currentOrder.total, currentOrder.currency)}
                    </span>
                  </div>
                </div>

                {/* 操作按鈕 */}
                {currentOrder.status === 'reserved' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500 text-center mb-4">選擇付款方式完成交易</p>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => processPayment('cash')}
                        disabled={loading}
                        className="py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-3 text-lg font-semibold"
                      >
                        <Banknote size={24} />
                        現金付款
                      </button>
                      <button
                        onClick={() => processPayment('card')}
                        disabled={loading}
                        className="py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-3 text-lg font-semibold"
                      >
                        <CreditCard size={24} />
                        信用卡
                      </button>
                    </div>
                    <button
                      onClick={cancelOrder}
                      className="w-full py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      取消訂單
                    </button>
                  </div>
                )}

                {currentOrder.status === 'completed' && (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 text-green-600 mb-4">
                      <CheckCircle size={24} />
                      <span className="text-lg font-semibold">交易完成</span>
                    </div>
                    <p className="text-gray-500 mb-4">
                      收據編號: {currentOrder.receipt_number} | 付款方式: {currentOrder.payment_method === 'cash' ? '現金' : '信用卡'}
                    </p>
                    <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 mx-auto">
                      <Printer size={18} />
                      列印收據
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 右側：日結統計 */}
          <div className="space-y-6">
            {/* 今日統計 */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">今日統計</h2>
              <div className="space-y-4">
                <div className="bg-amber-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">總營業額</p>
                  <p className="text-2xl font-bold text-amber-600">NT$ {dailyStats.total.toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">現金</p>
                    <p className="font-bold text-green-600">NT$ {dailyStats.cash.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">刷卡</p>
                    <p className="font-bold text-blue-600">NT$ {dailyStats.card.toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-center text-gray-500">
                  已完成 <span className="font-bold text-gray-800">{dailyStats.count}</span> 筆交易
                </div>
              </div>
            </div>

            {/* 今日訂單列表 */}
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">今日訂單</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {todayOrders.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">今日尚無訂單</p>
                ) : (
                  todayOrders.map(order => (
                    <div
                      key={order.id}
                      onClick={() => { setCurrentOrder(order); setVerifyCode(order.order_number) }}
                      className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-sm">{order.order_number}</p>
                          <p className="text-xs text-gray-500">{order.pickup_time_slot}</p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(order.status)}
                          <p className="text-sm font-semibold mt-1">NT$ {order.total?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
