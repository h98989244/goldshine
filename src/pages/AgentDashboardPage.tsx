import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Share2, QrCode, DollarSign, Users, TrendingUp, Copy, Check, Download, Calendar, ChevronRight, CheckCircle, Package, Search, BarChart3, LogOut, Upload, Key, Bell } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, Order } from '../lib/supabase'
import NotificationBell from '../components/NotificationBell'
import NotificationCenter from '../components/NotificationCenter'

type Commission = {
  id: number
  order_id: string
  verification_code?: string  // 核銷碼
  customer_name?: string      // 客戶名稱
  amount: number
  rate: number
  status: string
  settlement_month: string
  created_at: string
}

type Referral = {
  id: number
  user_id: string
  created_at: string
  profiles?: { full_name: string }
}

type Agent = {
  id: string
  agent_code: string
  full_name: string
  email: string
  commission_rate: number
  total_sales: number
  total_commission: number
  store_name: string
  role: string
}

export default function AgentDashboardPage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [authChecking, setAuthChecking] = useState(true)
  const [agentInfo, setAgentInfo] = useState<Agent | null>(null)
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'commissions' | 'referrals' | 'verification' | 'performance'>('overview')
  const [todayOrders, setTodayOrders] = useState<Order[]>([])
  const [verifyCode, setVerifyCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string; order?: Order } | null>(null)
  const [lowStockItems, setLowStockItems] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [showCommissionEdit, setShowCommissionEdit] = useState(false)
  const [newCommissionRate, setNewCommissionRate] = useState(5)
  // 核銷彈窗相關狀態
  const [showVerificationModal, setShowVerificationModal] = useState(false)
  const [pendingVerificationOrder, setPendingVerificationOrder] = useState<Order | null>(null)
  const [verificationImage, setVerificationImage] = useState<string | null>(null)
  const [uploadingProof, setUploadingProof] = useState(false)
  const [skipUpload, setSkipUpload] = useState(false)
  // 業績查詢相關
  const [perfPeriod, setPerfPeriod] = useState<'today' | 'week' | 'month' | 'custom'>('month')
  const [perfDateRange, setPerfDateRange] = useState({ start: '', end: '' })
  const [perfData, setPerfData] = useState<{
    registrations: number
    orderCount: number
    completedCount: number
    reservedCount: number
    cancelledCount: number
    totalAmount: number
    totalCommission: number
    orders: Order[]
  }>({ registrations: 0, orderCount: 0, completedCount: 0, reservedCount: 0, cancelledCount: 0, totalAmount: 0, totalCommission: 0, orders: [] })
  const [perfLoading, setPerfLoading] = useState(false)
  // 本月業績統計
  const [monthlyStats, setMonthlyStats] = useState<{
    monthlySales: number
    monthlyCommission: number
    newCustomers: number
  }>({ monthlySales: 0, monthlyCommission: 0, newCustomers: 0 })
  const [monthlyLoading, setMonthlyLoading] = useState(false)
  // 修改密碼相關狀態
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  // 通知系統狀態
  const [showNotifications, setShowNotifications] = useState(false)

  const agentCode = agentInfo?.agent_code || 'AGENT001'
  const referralLink = `${window.location.origin}?ref=${agentCode}`

  // 驗證代理商身份
  useEffect(() => {
    async function checkAgentAuth() {
      if (!user) {
        navigate('/agent/login')
        return
      }

      // 檢查是否為代理商 - 查詢 profiles 表
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error || !profile || profile.role !== 'agent') {
        // 不是代理商,跳轉到登入頁
        navigate('/agent/login')
        return
      }

      // 設定代理商資訊
      const agentData: Agent = {
        id: profile.id,
        agent_code: profile.referral_code || profile.id.substring(0, 8).toUpperCase(),
        full_name: profile.full_name || '代理商',
        email: profile.email || '',
        commission_rate: profile.commission_rate || 0.05,
        total_sales: 0,
        total_commission: 0,
        store_name: profile.store_name || '',
        role: profile.role
      }

      setAgentInfo(agentData)
      setAuthChecking(false)

      // 檢查庫存狀況
      checkInventoryStatus(profile.id)
    }

    checkAgentAuth()
  }, [user, navigate])

  // 檢查庫存狀況
  async function checkInventoryStatus(agentId: string) {
    try {
      // 獲取商品資料
      const { data: productsData } = await supabase.from('products').select('*')
      setProducts(productsData || [])

      // 從localStorage獲取庫存數據
      const savedInventory = localStorage.getItem(`inventory_${agentId}`)
      if (!savedInventory) return

      const agentInventory = JSON.parse(savedInventory)
      const lowStockItems = (productsData || [])
        .filter(product => {
          const stock = agentInventory[product.id]
          return stock && stock.quantity <= stock.min_stock
        })
        .map(product => {
          const stock = agentInventory[product.id]
          return {
            ...product,
            current_stock: stock.quantity,
            min_stock: stock.min_stock
          }
        })

      setLowStockItems(lowStockItems)
    } catch (error) {
      console.error('檢查庫存狀況失敗:', error)
    }
  }

  // 載入代理商數據
  useEffect(() => {
    if (agentInfo) {
      fetchAgentData()
      fetchTodayOrders()
    }
  }, [agentInfo?.id]) // Correct dependency to prevent infinite loops if agentInfo object identity changes but id doesn't

  // Refs for functions to avoid stale closures in listeners
  const activeTabRef = useRef(activeTab)
  const fetchPerformanceRef = useRef(fetchPerformance)
  const fetchMonthlyStatsRef = useRef(fetchMonthlyStats)
  const fetchTodayOrdersRef = useRef(fetchTodayOrders)
  const fetchAgentDataRef = useRef(fetchAgentData)

  useEffect(() => {
    activeTabRef.current = activeTab
    fetchPerformanceRef.current = fetchPerformance
    fetchMonthlyStatsRef.current = fetchMonthlyStats
    fetchTodayOrdersRef.current = fetchTodayOrders
    fetchAgentDataRef.current = fetchAgentData
  }) // Verify: Removed dependency array to update refs on every render

  // 實時監聽
  useEffect(() => {
    if (!agentInfo?.id) return

    const changes = supabase
      .channel('agent-dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'commissions',
          filter: `agent_id=eq.${agentInfo.id}`
        },
        () => {
          fetchAgentDataRef.current()
          if (activeTabRef.current === 'overview') {
            fetchMonthlyStatsRef.current()
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          // 當有任何訂單變更時，刷新數據
          fetchTodayOrdersRef.current()
          // 訂單變更可能影響銷售總額，所以也刷新代理商數據
          fetchAgentDataRef.current()

          if (activeTabRef.current === 'overview') {
            fetchMonthlyStatsRef.current()
          } else if (activeTabRef.current === 'performance') {
            fetchPerformanceRef.current()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(changes)
    }
  }, [agentInfo?.id])

  // 獲取代理商推薦的用戶 ID 列表
  async function getReferredUserIds(): Promise<string[]> {
    if (!agentInfo?.id) return []
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('referred_by', agentInfo.id)
    return (data || []).map(u => u.id)
  }

  // 取得本地日期字串 YYYY-MM-DD
  function getLocalDateString(date = new Date()) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  async function fetchTodayOrders() {
    if (!agentInfo) return

    const today = getLocalDateString()

    // 獲取該代理商推薦用戶的訂單
    const referredUserIds = await getReferredUserIds()

    // 查詢條件:
    // 1. 推薦客戶的訂單 (user_id in referredUserIds)
    // 2. 門市領取訂單 (store_id = agentInfo.id)
    // 並且符合今日預約或待核銷狀態
    let query = supabase
      .from('orders')
      .select('*')
      .or(`pickup_date.eq.${today},status.eq.reserved`)
      .order('created_at', { ascending: false })

    // 構建查詢條件
    if (referredUserIds.length > 0) {
      // 有推薦客戶,查詢推薦客戶訂單或門市領取訂單
      query = query.or(`user_id.in.(${referredUserIds.join(',')}),store_id.eq.${agentInfo.id}`)
    } else {
      // 沒有推薦客戶,只查詢門市領取訂單
      query = query.eq('store_id', agentInfo.id)
    }

    const { data } = await query
    setTodayOrders(data || [])
  }

  async function handleLogout() {
    try {
      // 清除本地狀態
      setAgentInfo(null)
      setCommissions([])
      setReferrals([])
      setTodayOrders([])
      setPerfData({ registrations: 0, orderCount: 0, completedCount: 0, reservedCount: 0, cancelledCount: 0, totalAmount: 0, totalCommission: 0, orders: [] })
      setMonthlyStats({ monthlySales: 0, monthlyCommission: 0, newCustomers: 0 })

      // 執行登出
      await signOut()

      // 導向登入頁面
      navigate('/agent/login', { replace: true })
    } catch (error) {
      console.error('登出失敗:', error)
      alert('登出失敗,請重試')
    }
  }

  // 修改密碼
  async function handleChangePassword() {
    setPasswordError('')
    setPasswordSuccess('')

    // 驗證表單
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('請填寫所有欄位')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('新密碼至少需要 6 個字元')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('新密碼與確認密碼不一致')
      return
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError('新密碼不能與舊密碼相同')
      return
    }

    setChangingPassword(true)

    try {
      // 先驗證舊密碼
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: passwordForm.currentPassword
      })

      if (signInError) {
        setPasswordError('舊密碼錯誤')
        setChangingPassword(false)
        return
      }

      // 更新密碼
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      })

      if (updateError) {
        setPasswordError('密碼修改失敗: ' + updateError.message)
        setChangingPassword(false)
        return
      }

      // 成功
      setPasswordSuccess('密碼修改成功!')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })

      // 3秒後關閉對話框
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordSuccess('')
      }, 3000)
    } catch (error: any) {
      setPasswordError('發生錯誤: ' + error.message)
    } finally {
      setChangingPassword(false)
    }
  }

  // 扣減庫存
  const deductInventory = async (agentId: string, orderId: string) => {
    try {
      // 獲取訂單商品明細
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId)

      if (!orderItems || orderItems.length === 0) return

      // 獲取代理商庫存
      const savedInventory = localStorage.getItem(`inventory_${agentId}`)
      if (!savedInventory) return

      const agentInventory = JSON.parse(savedInventory)

      // 扣減庫存
      orderItems.forEach(item => {
        if (agentInventory[item.product_id]) {
          agentInventory[item.product_id].quantity = Math.max(0, agentInventory[item.product_id].quantity - item.quantity)
        }
      })

      // 保存更新後的庫存
      localStorage.setItem(`inventory_${agentId}`, JSON.stringify(agentInventory))
    } catch (error) {
      console.error('扣減庫存失敗:', error)
    }
  }

  // 圖片上傳函數
  const uploadVerificationImage = async (file: File): Promise<string | null> => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('僅支援 JPG、PNG、WebP 格式')
      return null
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不能超過 5MB')
      return null
    }

    setUploadingProof(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string
          const { data, error } = await supabase.functions.invoke('upload-verification-proof', {
            body: { imageData: base64Data, fileName: `verification_${Date.now()}_${file.name}` }
          })
          if (error) throw error
          const url = data?.data?.publicUrl || data?.url
          if (url) {
            setVerificationImage(url)
          } else if (data?.error) {
            throw new Error(data.error.message || '上傳失敗')
          }
        } catch (err: any) {
          alert('上傳失敗：' + err.message)
        } finally {
          setUploadingProof(false)
        }
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      alert('上傳失敗：' + err.message)
      setUploadingProof(false)
    }
    return null
  }

  // 開始核銷流程（顯示彈窗）
  const startVerification = async () => {
    if (!verifyCode.trim() || !agentInfo) return
    setVerifying(true)
    setVerifyResult(null)

    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('verification_code', verifyCode.toUpperCase())
      .single()

    if (error || !order) {
      setVerifyResult({ success: false, message: '找不到此核銷碼對應的訂單' })
      setVerifying(false)
      return
    }

    // 驗證訂單是否屬於該代理商
    // 1. 檢查是否為推薦客戶的訂單
    const referredUserIds = await getReferredUserIds()
    const isReferredOrder = order.user_id && referredUserIds.includes(order.user_id)

    // 2. 檢查是否為門市領取訂單
    const isStorePickup = order.store_id === agentInfo.id

    if (!isReferredOrder && !isStorePickup) {
      setVerifyResult({
        success: false,
        message: '此訂單不屬於您的推薦客戶,也不是在您的門市領取,無權核銷'
      })
      setVerifying(false)
      return
    }

    if (order.status === 'completed') {
      setVerifyResult({ success: false, message: '此訂單已完成核銷', order })
      setVerifying(false)
      return
    } else if (order.status === 'cancelled') {
      setVerifyResult({ success: false, message: '此訂單已取消', order })
      setVerifying(false)
      return
    }

    // 設置待核銷訂單並顯示彈窗
    setPendingVerificationOrder(order)
    setShowVerificationModal(true)
    setVerificationImage(null)
    setSkipUpload(false)
    setVerifying(false)
  }

  // 確認核銷（執行實際核銷操作）
  const confirmVerification = async () => {
    if (!pendingVerificationOrder || !agentInfo || !user) return

    setVerifying(true)
    try {
      // 執行核銷
      const updateData: any = {
        status: 'completed',
        verified_at: new Date().toISOString(),
        verified_by: user.id
      }

      // 如果有上傳憑證圖片，添加到更新資料中
      if (verificationImage) {
        updateData.verification_proof_image_url = verificationImage
      }

      await supabase.from('orders').update(updateData).eq('id', pendingVerificationOrder.id)

      // 扣減庫存
      await deductInventory(agentInfo.id, pendingVerificationOrder.id)

      // 重新檢查庫存狀況
      checkInventoryStatus(agentInfo.id)

      // 檢查是否為推薦客戶的訂單
      const referredUserIds = await getReferredUserIds()
      const isReferredOrder = pendingVerificationOrder.user_id && referredUserIds.includes(pendingVerificationOrder.user_id)

      // 只有推薦客戶的訂單才計算佣金
      let successMsg = '核銷成功!'
      if (isReferredOrder) {
        // 推薦客戶訂單,計算佣金
        const rawRate = agentInfo.commission_rate || 0.05
        const effectiveRate = rawRate > 1 ? rawRate / 100 : rawRate
        const estimatedCommission = Math.round(pendingVerificationOrder.total * effectiveRate)
        successMsg = verificationImage
          ? `核銷成功!憑證圖片已上傳。獲得佣金 NT$ ${estimatedCommission.toLocaleString()}`
          : `核銷成功!獲得佣金 NT$ ${estimatedCommission.toLocaleString()}`
      } else {
        // 門市領取訂單,無佣金
        successMsg = verificationImage
          ? '核銷成功!憑證圖片已上傳。(門市領取訂單,無佣金)'
          : '核銷成功!(門市領取訂單,無佣金)'
      }

      // 發送核銷通知
      try {
        await supabase.functions.invoke('send-verification-notification', {
          body: {
            orderId: pendingVerificationOrder.id,
            verifiedBy: user.id,
            isReferredOrder
          }
        })
      } catch (error) {
        console.error('發送通知失敗:', error)
        // 不影響核銷流程,只記錄錯誤
      }

      setVerifyResult({
        success: true,
        message: successMsg,
        order: { ...pendingVerificationOrder, status: 'completed' }
      })
      fetchTodayOrders()

      // 清理狀態並關閉彈窗
      setShowVerificationModal(false)
      setPendingVerificationOrder(null)
      setVerificationImage(null)
      setSkipUpload(false)
      setVerifyCode('')

    } catch (error: any) {
      setVerifyResult({ success: false, message: '核銷失敗：' + error.message })
    }
    setVerifying(false)
  }

  async function updateCommissionRate() {
    if (!agentInfo?.id) return
    const { error } = await supabase
      .from('profiles')
      .update({ commission_rate: newCommissionRate / 100 })
      .eq('id', agentInfo.id)
    if (error) {
      alert('更新失敗:' + error.message)
    } else {
      setAgentInfo({ ...agentInfo, commission_rate: newCommissionRate / 100 })
      setShowCommissionEdit(false)
    }
  }

  // 計算時間範圍
  function getDateRange(period: 'today' | 'week' | 'month' | 'custom') {
    const today = getLocalDateString()
    if (period === 'today') return { start: today, end: today }

    const now = new Date()
    if (period === 'week') {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - now.getDay())
      return { start: getLocalDateString(weekStart), end: today }
    }
    if (period === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      return { start: getLocalDateString(monthStart), end: today }
    }
    return perfDateRange
  }

  // 查詢業績（根據代理商的 id 查詢推薦用戶）
  async function fetchPerformance() {
    if (!agentInfo?.id) {
      setPerfData({ registrations: 0, orderCount: 0, completedCount: 0, reservedCount: 0, cancelledCount: 0, totalAmount: 0, totalCommission: 0, orders: [] })
      return
    }
    setPerfLoading(true)
    const range = getDateRange(perfPeriod)
    if (!range.start || !range.end) {
      setPerfLoading(false)
      return
    }

    // 步驟1:查詢該代理商推薦的所有用戶（透過 id）
    const { data: referredUsers } = await supabase
      .from('profiles')
      .select('id, created_at')
      .eq('referred_by', agentInfo.id)

    const referredUserIds = (referredUsers || []).map(u => u.id)

    // 步驟2：統計時間範圍內的新增推薦用戶數
    const registrations = (referredUsers || []).filter(u => {
      const createdAt = u.created_at.split('T')[0]
      return createdAt >= range.start && createdAt <= range.end
    }).length

    // 步驟3：查詢訂單
    // 3.1 查詢推薦用戶的訂單
    let referredOrders: Order[] = []
    if (referredUserIds.length > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .in('user_id', referredUserIds)
        .gte('created_at', range.start + 'T00:00:00')
        .lte('created_at', range.end + 'T23:59:59')
        .order('created_at', { ascending: false })
      referredOrders = orders || []
    }

    // 3.2 查詢門市領取訂單
    const { data: storeOrders } = await supabase
      .from('orders')
      .select('*')
      .eq('store_id', agentInfo.id)
      .gte('created_at', range.start + 'T00:00:00')
      .lte('created_at', range.end + 'T23:59:59')
      .order('created_at', { ascending: false })

    // 合併訂單列表(去重)
    const storeOrderIds = new Set((storeOrders || []).map(o => o.id))
    const allOrders = [
      ...referredOrders,
      ...(storeOrders || []).filter(o => !referredUserIds.includes(o.user_id || ''))
    ]
    const orderList = allOrders.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )

    const completed = orderList.filter(o => o.status === 'completed')
    const reserved = orderList.filter(o => o.status === 'reserved')
    const cancelled = orderList.filter(o => o.status === 'cancelled')

    // 只計算推薦客戶訂單的總額和佣金
    const referredCompleted = referredOrders.filter(o => o.status === 'completed')
    const totalAmount = referredCompleted.reduce((sum, o) => sum + (o.total || 0), 0)

    // Calculate effective commission rate (handle legacy percentage values > 1)
    const rawRate = agentInfo?.commission_rate || 0.05
    const commissionRate = rawRate > 1 ? rawRate / 100 : rawRate
    const totalCommission = totalAmount * commissionRate

    setPerfData({
      registrations,
      orderCount: orderList.length,
      completedCount: completed.length,
      reservedCount: reserved.length,
      cancelledCount: cancelled.length,
      totalAmount,
      totalCommission,
      orders: orderList
    })
    setPerfLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'performance' && agentInfo) fetchPerformance()
  }, [activeTab, perfPeriod, perfDateRange, agentInfo])

  // 查詢本月業績統計
  async function fetchMonthlyStats() {
    if (!agentInfo?.id) {
      setMonthlyStats({ monthlySales: 0, monthlyCommission: 0, newCustomers: 0 })
      return
    }
    setMonthlyLoading(true)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    const startDate = getLocalDateString(monthStart)
    const endDate = getLocalDateString(monthEnd)

    // 查詢該代理商推薦的所有用戶
    const { data: referredUsers } = await supabase
      .from('profiles')
      .select('id, created_at')
      .eq('referred_by', agentInfo.id)

    const referredUserIds = (referredUsers || []).map(u => u.id)

    // 統計本月新增推薦用戶數
    const newCustomers = (referredUsers || []).filter(u => {
      const createdAt = u.created_at.split('T')[0]
      return createdAt >= startDate && createdAt <= endDate
    }).length

    // 查詢這些推薦用戶在本月的已完成訂單
    let monthlySales = 0
    if (referredUserIds.length > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .in('user_id', referredUserIds)
        .eq('status', 'completed')
        .gte('created_at', startDate + 'T00:00:00')
        .lte('created_at', endDate + 'T23:59:59')

      monthlySales = (orders || []).reduce((sum, o) => sum + (o.total || 0), 0)
    }

    const rawRate = agentInfo?.commission_rate || 0.05
    const commissionRate = rawRate > 1 ? rawRate / 100 : rawRate
    const monthlyCommission = monthlySales * commissionRate

    setMonthlyStats({ monthlySales, monthlyCommission, newCustomers })
    setMonthlyLoading(false)
  }

  // 當切換到概覽頁面時載入本月業績
  useEffect(() => {
    if (activeTab === 'overview' && agentInfo) fetchMonthlyStats()
  }, [activeTab, agentInfo])

  // 載入代理商數據
  async function fetchAgentData() {
    if (!agentInfo?.id) return

    // 1. 獲取佣金記錄(包含訂單和客戶資訊)
    const { data: comms, error: commsError } = await supabase
      .from('commissions')
      .select(`
        *,
        orders(
          verification_code,
          user_id,
          profiles!orders_user_id_fkey(full_name)
        )
      `)
      .eq('agent_id', agentInfo.id)
      .order('created_at', { ascending: false })

    if (commsError) {
      console.error('獲取佣金記錄失敗:', commsError)
    }

    // 轉換資料格式,提取核銷碼和客戶名稱
    if (comms) {
      const formattedComms = comms.map((c: any) => ({
        ...c,
        verification_code: c.orders?.verification_code || null,
        customer_name: c.orders?.profiles?.full_name || '未知客戶'
      }))
      console.log('佣金記錄數量:', formattedComms.length)
      setCommissions(formattedComms)
    } else {
      setCommissions([])
    }

    // 2. 獲取推薦用戶
    let referredUserIds: string[] = []
    const { data: refs } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .eq('referred_by', agentInfo.id)
      .order('created_at', { ascending: false })

    if (refs) {
      setReferrals(refs.map(r => ({
        id: parseInt(r.id.slice(0, 8), 16),
        user_id: r.id,
        created_at: r.created_at,
        profiles: { full_name: r.full_name || r.email || '未命名用戶' }
      })))
      referredUserIds = refs.map(r => r.id)
    }

    // 3. 計算總銷售額 (Total Sales)
    // 查詢所有推薦用戶的已完成訂單
    let totalSales = 0
    if (referredUserIds.length > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('total')
        .in('user_id', referredUserIds)
        .eq('status', 'completed')

      if (orders) {
        totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0)
      }
    }

    // 4. 計算總佣金 (Total Commission)
    const totalCommission = (comms || []).reduce((sum, c) => sum + c.amount, 0)

    // 5. 更新 AgentInfo 狀態
    setAgentInfo(prev => prev ? ({
      ...prev,
      total_sales: totalSales,
      total_commission: totalCommission
    }) : null)
  }

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const generateQRCode = () => {
    // 使用 QR Code API
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(referralLink)}`
  }

  const exportCommissionStatement = () => {
    if (commissions.length === 0) {
      alert('目前沒有佣金記錄可匯出')
      return
    }

    // 建立 CSV 內容
    const headers = ['核銷碼', '客戶名稱', '佣金金額', '佣金比例', '結算月份', '狀態', '建立日期']
    const rows = commissions.map(c => [
      c.verification_code || '-',
      c.customer_name || '未知客戶',
      c.amount.toFixed(0),
      `${(c.rate * 100).toFixed(1)}%`,
      c.settlement_month,
      c.status === 'settled' ? '已結算' : '待結算',
      new Date(c.created_at).toLocaleDateString('zh-TW')
    ])

    // 組合 CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // 加入 BOM 以支援中文
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

    // 建立下載連結
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `佣金對帳單_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const pendingCommission = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0)
  const settledCommission = commissions.filter(c => c.status === 'settled').reduce((sum, c) => sum + c.amount, 0)

  // 載入中
  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">驗證身份中...</p>
        </div>
      </div>
    )
  }

  if (!agentInfo) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部 */}
      <header className="bg-gradient-to-r from-amber-700 to-amber-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">代理商後台</h1>
              <p className="text-amber-200">歡迎回來,{agentInfo.full_name || '代理商'}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-amber-200 hover:text-white">返回前台</Link>
              <NotificationBell onClick={() => setShowNotifications(true)} />
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600/50 hover:bg-amber-600 rounded-lg transition"
              >
                <Key size={18} />
                修改密碼
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600/50 hover:bg-amber-600 rounded-lg transition"
              >
                <LogOut size={18} />
                登出
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 統計卡片 */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-amber-600" size={20} />
              </div>
              <span className="text-gray-500 text-sm">總銷售額</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">NT$ {(agentInfo?.total_sales || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600" size={20} />
              </div>
              <span className="text-gray-500 text-sm">已結算佣金</span>
            </div>
            <p className="text-2xl font-bold text-green-600">NT$ {settledCommission.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-blue-600" size={20} />
              </div>
              <span className="text-gray-500 text-sm">待結算佣金</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">NT$ {pendingCommission.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="text-purple-600" size={20} />
              </div>
              <span className="text-gray-500 text-sm">推薦客戶</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">{referrals.length} 人</p>
          </div>
        </div>

        {/* 推廣連結 */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Share2 className="text-amber-600" />
            我的推廣連結
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="bg-amber-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-500 mb-1">推廣碼</p>
                <p className="text-2xl font-bold text-amber-600 font-mono">{agentCode}</p>
              </div>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm font-mono"
                />
                <button
                  onClick={copyLink}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
                >
                  {copied ? <Check size={18} /> : <Copy size={18} />}
                  {copied ? '已複製' : '複製'}
                </button>
              </div>
              <div className="text-sm text-gray-500">
                <div className="flex items-center gap-2 mb-1">
                  佣金比例: <span className="font-semibold text-amber-600 text-lg">{
                    // Display percentage: if rate > 1 (legacy), use as is. If rate <= 1 (decimal), multiply by 100.
                    ((agentInfo?.commission_rate || 0.05) > 1
                      ? (agentInfo?.commission_rate || 0.05)
                      : (agentInfo?.commission_rate || 0.05) * 100).toFixed(1)
                  }%</span>
                </div>
                客戶透過此連結註冊後，其所有訂單您都能獲得佣金
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">推廣 QR Code</p>
              <img
                src={generateQRCode()}
                alt="QR Code"
                className="w-40 h-40 mx-auto border rounded-lg"
              />
              <a
                href={generateQRCode()}
                download="referral-qrcode.png"
                className="inline-flex items-center gap-2 mt-3 text-amber-600 hover:text-amber-700 text-sm"
              >
                <Download size={16} />
                下載 QR Code
              </a>
            </div>
          </div>
        </div>

        {/* 標籤頁 */}
        <div className="bg-white rounded-xl shadow">
          <div className="border-b flex overflow-x-auto">
            {[
              { key: 'overview', label: '概覽' },
              { key: 'performance', label: '業績查詢' },
              { key: 'verification', label: '訂單核銷' },
              { key: 'commissions', label: '佣金記錄' },
              { key: 'referrals', label: '推薦客戶' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-6 py-4 font-medium transition ${activeTab === tab.key
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">本月業績</h3>
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid md:grid-cols-3 gap-6 text-center">
                    <div>
                      <p className="text-sm text-gray-500">本月銷售</p>
                      <p className="text-xl font-bold text-gray-800">
                        {monthlyLoading ? '載入中...' : `NT$ ${monthlyStats.monthlySales.toLocaleString()}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">本月佣金</p>
                      <p className="text-xl font-bold text-amber-600">
                        {monthlyLoading ? '載入中...' : `NT$ ${monthlyStats.monthlyCommission.toLocaleString()}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">新增客戶</p>
                      <p className="text-xl font-bold text-gray-800">
                        {monthlyLoading ? '載入中...' : `${monthlyStats.newCustomers} 人`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 今日訂單統計 */}
                <h3 className="font-semibold text-gray-800 mt-6 mb-4">今日預約取貨</h3>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">今日預約</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {todayOrders.filter(o => o.pickup_date === getLocalDateString()).length}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">已完成</p>
                    <p className="text-2xl font-bold text-green-600">{todayOrders.filter(o => o.status === 'completed').length}</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">待核銷</p>
                    <p className="text-2xl font-bold text-amber-600">{todayOrders.filter(o => o.status === 'reserved').length}</p>
                  </div>
                </div>

                {/* 庫存提醒 */}
                {lowStockItems.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-red-800 mb-4 flex items-center gap-2">
                      <Package size={20} />
                      庫存不足提醒
                    </h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700 mb-3">以下商品庫存不足，建議盡快補充：</p>
                      <div className="space-y-2">
                        {lowStockItems.map(item => (
                          <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded border">
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-sm text-gray-500 ml-2">({item.sku})</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm">
                                <span className="text-red-600">庫存：{item.current_stock}</span>
                                <span className="text-gray-400 mx-2">/</span>
                                <span className="text-gray-600">最低：{item.min_stock}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-red-600 mt-3">
                        ⚠️ 庫存不足可能影響客戶取貨體驗，建議聯繫管理員補充庫存
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'performance' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="text-amber-600" />
                    業績查詢
                  </h3>
                </div>

                {/* 時間篩選 */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex gap-2">
                      {[
                        { key: 'today', label: '今日' },
                        { key: 'week', label: '本週' },
                        { key: 'month', label: '本月' },
                        { key: 'custom', label: '自訂' },
                      ].map(p => (
                        <button
                          key={p.key}
                          onClick={() => setPerfPeriod(p.key as any)}
                          className={`px-4 py-2 rounded-lg font-medium transition ${perfPeriod === p.key
                            ? 'bg-amber-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                    {perfPeriod === 'custom' && (
                      <div className="flex gap-2 items-center">
                        <input
                          type="date"
                          value={perfDateRange.start}
                          onChange={e => setPerfDateRange({ ...perfDateRange, start: e.target.value })}
                          className="px-3 py-2 border rounded-lg"
                        />
                        <span className="text-gray-500">~</span>
                        <input
                          type="date"
                          value={perfDateRange.end}
                          onChange={e => setPerfDateRange({ ...perfDateRange, end: e.target.value })}
                          className="px-3 py-2 border rounded-lg"
                        />
                        <button
                          onClick={fetchPerformance}
                          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                        >
                          查詢
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {perfLoading ? (
                  <div className="text-center py-8 text-gray-500">載入中...</div>
                ) : (
                  <>
                    {/* 統計卡片 */}
                    <div className="grid md:grid-cols-4 gap-4 mb-6">
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">推廣註冊</p>
                        <p className="text-2xl font-bold text-purple-600">{perfData.registrations} 人</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">訂單總數</p>
                        <p className="text-2xl font-bold text-blue-600">{perfData.orderCount} 筆</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">成交金額</p>
                        <p className="text-2xl font-bold text-green-600">NT$ {perfData.totalAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-4">
                        <p className="text-sm text-gray-500">預估佣金</p>
                        <p className="text-2xl font-bold text-amber-600">NT$ {Math.round(perfData.totalCommission).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* 訂單狀態分布 */}
                    <div className="bg-white border rounded-lg p-4 mb-6">
                      <h4 className="font-medium text-gray-700 mb-3">訂單狀態分布</h4>
                      <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">已完成: {perfData.completedCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">待取貨: {perfData.reservedCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">已取消: {perfData.cancelledCount}</span>
                        </div>
                      </div>
                      {/* 進度條 */}
                      {perfData.orderCount > 0 && (
                        <div className="flex h-4 rounded-full overflow-hidden mt-3 bg-gray-200">
                          <div className="bg-green-500" style={{ width: `${(perfData.completedCount / perfData.orderCount) * 100}%` }}></div>
                          <div className="bg-blue-500" style={{ width: `${(perfData.reservedCount / perfData.orderCount) * 100}%` }}></div>
                          <div className="bg-red-500" style={{ width: `${(perfData.cancelledCount / perfData.orderCount) * 100}%` }}></div>
                        </div>
                      )}
                    </div>

                    {/* 訂單列表 */}
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <div className="p-4 border-b">
                        <h4 className="font-medium text-gray-700">訂單明細</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left py-3 px-4">訂單編號</th>
                              <th className="text-left py-3 px-4">金額</th>
                              <th className="text-left py-3 px-4">狀態</th>
                              <th className="text-left py-3 px-4">日期</th>
                            </tr>
                          </thead>
                          <tbody>
                            {perfData.orders.length === 0 ? (
                              <tr><td colSpan={4} className="text-center py-8 text-gray-500">此期間暫無訂單</td></tr>
                            ) : perfData.orders.map(o => (
                              <tr key={o.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4 font-mono">{o.order_number}</td>
                                <td className="py-3 px-4">NT$ {Number(o.total || 0).toLocaleString()}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-1 rounded text-xs ${o.status === 'completed' ? 'bg-green-100 text-green-700' :
                                    o.status === 'reserved' ? 'bg-blue-100 text-blue-700' :
                                      o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                        o.status === 'returned' ? 'bg-purple-100 text-purple-700' :
                                          'bg-gray-100 text-gray-600'
                                    }`}>
                                    {o.status === 'completed' ? '已完成' : o.status === 'reserved' ? '待取貨' : o.status === 'returned' ? '已退貨' : o.status === 'cancelled' ? '已取消' : o.status}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'verification' && (
              <div>
                {/* 核銷輸入區 */}
                <div className="bg-amber-50 rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="text-amber-600" />
                    訂單核銷
                  </h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={verifyCode}
                      onChange={e => setVerifyCode(e.target.value.toUpperCase())}
                      placeholder="輸入6位核銷碼"
                      className="flex-1 p-4 text-2xl font-mono text-center border-2 border-amber-300 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-200 uppercase tracking-widest"
                      maxLength={6}
                    />
                    <button
                      onClick={startVerification}
                      disabled={verifying || verifyCode.length !== 6}
                      className="px-8 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 font-semibold"
                    >
                      {verifying ? '驗證中...' : '確認核銷'}
                    </button>
                  </div>

                  {verifyResult && (
                    <div className={`mt-4 p-4 rounded-lg ${verifyResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      <p className="font-semibold">{verifyResult.message}</p>
                      {verifyResult.order && (
                        <div className="mt-2 text-sm">
                          <p>訂單編號：{verifyResult.order.order_number}</p>
                          <p>金額：NT$ {Number(verifyResult.order.total).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 今日訂單列表 */}
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Package className="text-amber-600" />
                  今日訂單 ({todayOrders.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4">訂單編號</th>
                        <th className="text-left py-3 px-4">核銷碼</th>
                        <th className="text-left py-3 px-4">金額</th>
                        <th className="text-left py-3 px-4">時段</th>
                        <th className="text-left py-3 px-4">狀態</th>
                        <th className="text-left py-3 px-4">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayOrders.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-500">今日暫無預約訂單</td></tr>
                      ) : todayOrders.map(order => (
                        <tr key={order.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-mono">{order.order_number}</td>
                          <td className="py-3 px-4 font-mono text-amber-600 font-bold">{order.verification_code}</td>
                          <td className="py-3 px-4">NT$ {Number(order.total).toLocaleString()}</td>
                          <td className="py-3 px-4">{order.pickup_time_slot}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${order.status === 'completed' ? 'bg-green-100 text-green-700' :
                              order.status === 'reserved' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                              {order.status === 'completed' ? '已完成' : order.status === 'reserved' ? '待核銷' : order.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {order.status === 'reserved' && (
                              <button
                                onClick={() => { setVerifyCode(order.verification_code || ''); }}
                                className="text-amber-600 hover:underline text-xs"
                              >
                                快速核銷
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'commissions' && (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-800">佣金記錄</h3>
                  <button
                    onClick={exportCommissionStatement}
                    className="text-amber-600 hover:text-amber-700 text-sm flex items-center gap-1"
                  >
                    <Calendar size={16} />
                    匯出對帳單
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-4">核銷碼</th>
                        <th className="text-left py-3 px-4">客戶名稱</th>
                        <th className="text-left py-3 px-4">佣金金額</th>
                        <th className="text-left py-3 px-4">比例</th>
                        <th className="text-left py-3 px-4">結算月份</th>
                        <th className="text-left py-3 px-4">狀態</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">
                            目前沒有佣金記錄
                          </td>
                        </tr>
                      ) : (
                        commissions.map(c => (
                          <tr key={c.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-mono text-amber-600">
                              {c.verification_code || '-'}
                            </td>
                            <td className="py-3 px-4">
                              {c.customer_name || '未知客戶'}
                            </td>
                            <td className="py-3 px-4 font-semibold text-amber-600">
                              NT$ {c.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 font-semibold text-amber-600 text-lg">
                              {(c.rate * 100).toFixed(1)}%
                            </td>
                            <td className="py-3 px-4">{c.settlement_month}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded text-xs ${c.status === 'settled'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                                }`}>
                                {c.status === 'settled' ? '已結算' : '待結算'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'referrals' && (
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">推薦客戶列表</h3>
                <div className="space-y-3">
                  {referrals.map(r => (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <Users size={18} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{r.profiles?.full_name}</p>
                          <p className="text-sm text-gray-500">註冊於 {new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 修改密碼彈窗 */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Key className="text-amber-600" />
                修改密碼
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">舊密碼</label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="請輸入舊密碼"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">新密碼</label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="至少 6 個字元"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">確認新密碼</label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    placeholder="再次輸入新密碼"
                  />
                </div>
              </div>

              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {passwordSuccess}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPasswordModal(false)
                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setPasswordError('')
                    setPasswordSuccess('')
                  }}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                  disabled={changingPassword}
                >
                  取消
                </button>
                <button
                  onClick={handleChangePassword}
                  className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={changingPassword}
                >
                  {changingPassword ? '修改中...' : '確認修改'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 佣金比例編輯彈窗 */}
        {showCommissionEdit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-sm w-full p-6">
              <h3 className="text-lg font-bold mb-4">修改佣金比例</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">佣金比例 (%)</label>
                <input
                  type="number"
                  value={newCommissionRate}
                  onChange={e => setNewCommissionRate(Number(e.target.value))}
                  className="w-full p-3 border rounded-lg text-center text-2xl font-bold"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-2">每筆訂單將按此比例計算佣金</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowCommissionEdit(false)} className="flex-1 py-2 border rounded-lg hover:bg-gray-50">取消</button>
                <button onClick={updateCommissionRate} className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">確認修改</button>
              </div>
            </div>
          </div>
        )}

        {/* 核銷憑證上傳彈窗 */}
        {showVerificationModal && pendingVerificationOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold mb-4">上傳核銷憑證</h3>

              {/* 訂單資訊 */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="text-sm space-y-1">
                  <div><span className="text-gray-500">訂單編號：</span><span className="font-mono font-semibold">{pendingVerificationOrder.order_number}</span></div>
                  <div><span className="text-gray-500">核銷碼：</span><span className="font-mono text-amber-600 font-bold">{pendingVerificationOrder.verification_code}</span></div>
                  <div><span className="text-gray-500">金額：</span><span className="font-semibold">NT$ {Number(pendingVerificationOrder.total).toLocaleString()}</span></div>
                </div>
              </div>

              {/* 圖片上傳區域 */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">上傳憑證圖片</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {verificationImage ? (
                    <div className="space-y-3">
                      <img src={verificationImage} alt="憑證圖片" className="max-w-full h-32 mx-auto rounded-lg object-cover" />
                      <button
                        onClick={() => setVerificationImage(null)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        重新上傳
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload size={32} className="mx-auto text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600">點擊上傳或拖拽圖片到此處</p>
                        <p className="text-xs text-gray-400">支援 JPG、PNG、WebP，最大 5MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) uploadVerificationImage(file)
                        }}
                        className="hidden"
                        id="verification-upload"
                      />
                      <label
                        htmlFor="verification-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer"
                      >
                        <Upload size={16} />
                        {uploadingProof ? '上傳中...' : '選擇圖片'}
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* 跳過選項 */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={skipUpload}
                    onChange={(e) => setSkipUpload(e.target.checked)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-sm text-gray-700">跳過上傳，直接核銷</span>
                </label>
              </div>

              {/* 按鈕 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowVerificationModal(false)
                    setPendingVerificationOrder(null)
                    setVerificationImage(null)
                    setSkipUpload(false)
                  }}
                  className="flex-1 py-2 border rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={confirmVerification}
                  disabled={verifying || (!verificationImage && !skipUpload)}
                  className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? '核銷中...' : '確認核銷'}
                </button>
              </div>

              {/* 提示 */}
              <p className="text-xs text-gray-500 mt-3 text-center">
                建議上傳憑證圖片以便後續查詢，但您也可以選擇跳過
              </p>
            </div>
          </div>
        )}

        {/* 通知中心 */}
        <NotificationCenter
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      </div>
    </div>
  )
}
