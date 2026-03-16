import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, User, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const { signIn, signUp } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // 處理核心登入邏輯 (獲取 Profile -> Edge Function -> Action Link)
  const processLineLogin = async () => {
    try {
      setLoading(true)
      const profile = await window.liff.getProfile()
      const decodedIdToken = window.liff.getDecodedIDToken()
      console.log('LINE 用戶資料:', profile)

      // 讀取推薦碼 (如果有)
      const referralCode = sessionStorage.getItem('referralCode')
      if (referralCode) {
        console.log('檢測到推薦碼:', referralCode)
      }

      // 調用 Edge Function
      console.log('準備調用 line-auth Edge Function...')
      const { data, error: functionError } = await supabase.functions.invoke('line-auth', {
        body: {
          lineUserId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          email: decodedIdToken?.email,
          redirectTo: window.location.origin + '/line-login-callback',
          referralCode: referralCode || undefined
        }
      })

      console.log('Edge Function 原始回應:', { data, functionError })

      if (functionError) {
        console.error('Edge Function 錯誤:', functionError)
        throw new Error('無法完成登入: ' + functionError.message)
      }
      if (!data.success) {
        console.error('登入失敗:', data.error)
        throw new Error(data.error?.message || '登入失敗')
      }

      console.log('Edge Function 回應:', data)

      // 不再跳轉到 action_link,而是直接使用 token 在前端建立 session
      const actionLink = data.action_link || data.debug_properties?.action_link

      if (actionLink) {
        // 從 action_link 中提取 token
        const url = new URL(actionLink)
        const token = url.searchParams.get('token')
        const email = data.email

        if (!token || !email) {
          throw new Error('無法取得驗證 token')
        }

        console.log('使用 token 建立 session...')

        // 直接在前端使用 verifyOtp 建立 session
        const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'magiclink'
        })

        if (sessionError) {
          console.error('Session 建立失敗:', sessionError)
          throw new Error('登入驗證失敗: ' + sessionError.message)
        }

        console.log('Session 建立成功！', sessionData.session?.user?.id)

        // 標記已處理
        sessionStorage.setItem('lineLoginHandled', 'true')

        // 重置 loading 狀態
        setLoading(false)

        // 跳轉到首頁
        navigate('/')
      } else {
        throw new Error('未收到驗證連結')
      }
    } catch (err: any) {
      console.error('處理 LINE 登入失敗:', err)
      console.error('錯誤詳情:', { message: err.message, stack: err.stack })
      setError(err.message || '登入處理失敗')
      // 登入失敗時清除標記,允許重試
      sessionStorage.removeItem('lineLoginHandled')
    } finally {
      // 確保無論如何都會重置 loading
      console.log('重置 loading 狀態')
      setLoading(false)
    }
  }

  // 初始化 LIFF 並檢查登入狀態
  useEffect(() => {
    const initLiff = async () => {
      try {
        if (!window.liff) return

        // 先檢查是否已有 Supabase session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          console.log('已有 Supabase session,跳過 LINE 登入流程')
          // 清除標記並跳轉到首頁
          sessionStorage.removeItem('lineLoginHandled')
          navigate('/')
          return
        }

        // 檢查是否已處理過這次頁面載入的登入
        const handledThisSession = sessionStorage.getItem('lineLoginHandled')
        if (handledThisSession === 'processing') {
          console.log('登入處理中,跳過重複執行')
          return
        }

        const liffId = import.meta.env.VITE_LIFF_ID
        if (!liffId) {
          console.error('VITE_LIFF_ID 未設定')
          return
        }

        console.log('正在初始化 LIFF...')
        await window.liff.init({ liffId })
        console.log('LIFF 初始化成功')

        // 檢查是否已登入 LINE (這會在從 LINE 登入畫面跳轉回來後為 true)
        if (window.liff.isLoggedIn()) {
          console.log('檢測到已登入 LINE,自動開始處理...')
          // 標記為處理中
          sessionStorage.setItem('lineLoginHandled', 'processing')
          await processLineLogin()
        }
      } catch (err: any) {
        console.error('LIFF 初始化或自動登入錯誤:', err)
        sessionStorage.removeItem('lineLoginHandled')
      }
    }

    initLiff()
  }, [])

  // LINE 登入按鈕點擊處理
  const handleLineLogin = async () => {
    console.log('LINE 登入按鈕被點擊')
    setLoading(true)
    setError('')

    try {
      const liffId = import.meta.env.VITE_LIFF_ID
      if (!liffId) {
        throw new Error('VITE_LIFF_ID 未設定，無法使用 LINE 登入')
      }

      // 確保 LIFF 已初始化
      if (!window.liff) {
        throw new Error('LIFF SDK 未載入')
      }
      if (!(window.liff as any).id) {
        await window.liff.init({ liffId })
      }

      if (!window.liff.isInClient() && !window.liff.isLoggedIn()) {
        // 未登入且不在 LINE App 內，執行標準登入跳轉
        console.log('準備跳轉到 LINE 登入頁面')
        // 使用當前頁面作為回調，LIFF init 會處理回來後的狀態
        const redirectUri = window.location.href
        window.liff.login({ redirectUri })
      } else {
        // 已登入 (罕見情況，通常會被 useEffect 捕獲，但在 SPA 切換時可能發生)
        await processLineLogin()
      }
    } catch (err: any) {
      console.error('啟動 LINE 登入失敗:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  // (移除舊的 handleLineCallback 與 useEffect，因我們已改用 action_link 策略且不再依賴 query code)


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) throw error
        navigate('/')
      } else {
        // 檢查是否同意條款
        if (!agreedToTerms) {
          setError('請先同意服務條款和隱私權政策')
          setLoading(false)
          return
        }


        const referralCode = searchParams.get('ref') || sessionStorage.getItem('referralCode')

        const { error } = await signUp(email, password, fullName, agreedToTerms, referralCode || undefined)
        if (error) throw error
        setSuccess('註冊成功！請檢查您的郵箱並點擊確認連結以啟用帳號。')
        return
      }
    } catch (err: any) {
      // 改善錯誤訊息
      let errorMsg = err.message || '操作失敗，請稍後再試'
      if (errorMsg.includes('Invalid login credentials')) {
        errorMsg = '郵箱或密碼錯誤'
      } else if (errorMsg.includes('Email not confirmed')) {
        errorMsg = '請先確認您的郵箱'
      } else if (errorMsg.includes('User already registered')) {
        errorMsg = '此郵箱已註冊，請直接登入'
      }
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-amber-900 font-bold text-2xl">金</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isLogin ? t('login') : t('register')}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="姓名"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                placeholder="電子郵件"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="密碼"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* 同意條款複選框 */}
            {!isLogin && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    required
                  />
                  <div className="text-sm text-gray-700 leading-relaxed">
                    我已閱讀並同意
                    <Link to="/terms-of-service" target="_blank" className="text-amber-600 hover:text-amber-700 mx-1 underline">
                      服務條款
                    </Link>
                    和
                    <Link to="/privacy-policy" target="_blank" className="text-amber-600 hover:text-amber-700 mx-1 underline">
                      隱私權政策
                    </Link>
                    ，並了解同意時間將被記錄
                  </div>
                </label>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <CheckCircle size={20} className="shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (!isLogin && !agreedToTerms)}
              className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '處理中...' : (isLogin ? t('login') : t('register'))}
            </button>
          </form>

          {/* LINE 登入按鈕 */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或使用</span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault()
                console.log('按鈕被點擊')
                handleLineLogin()
              }}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-white transition disabled:opacity-50 hover:opacity-90"
              style={{ backgroundColor: '#06c755' }}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  處理中...
                </>
              ) : (
                <>
                  {/* <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.365 9.863c.348 0 .63.285.63.631 0 .345-.282.63-.63.63H17.61v1.125h1.755c.348 0 .63.283.63.63 0 .344-.282.629-.63.629h-2.386c-.345 0-.63-.285-.63-.629V6.835c0-.345.282-.63.63-.63h2.386c.346 0 .63.285.63.63 0 .353-.284.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.282.629-.631.629-.345 0-.63-.285-.63-.629V6.835c0-.27.18-.51.432-.595.06-.023.136-.033-.194-.033-.211 0-.39.092-.51.25l-2.462 3.33V6.835c0-.345.282-.63.63-.63.345 0 .63.285.63.63v3.016h.98zm-5.8 0c0 .344-.282.629-.631.629-.345 0-.63-.285-.63-.629V6.835c0-.345.282-.63.63-.63.345 0 .63.285.63.63v3.016h.98z" />
                  </svg> */}
                  使用 LINE 登入
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-amber-600 hover:text-amber-700"
            >
              {isLogin ? '還沒有帳號？立即註冊' : '已有帳號？立即登入'}
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-amber-200 hover:text-white">
            返回首頁
          </Link>
        </div>
      </div>
    </div>
  )
}
