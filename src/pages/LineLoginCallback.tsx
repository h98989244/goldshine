import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LineLoginCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // 監聽 Supabase Auth 狀態變化
    // Magic Link 跳轉回來時，Supabase JS Client 會自動解析 URL hash 並建立 session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change in callback:', event, session?.user?.id)

      if (event === 'SIGNED_IN' && session) {
        setStatus('success')
        setMessage('登入成功！正在跳轉...')

        // 標記已處理，避免 LoginPage 重複觸發
        sessionStorage.setItem('lineLoginHandled', 'true')

        // 延遲跳轉以展示成功狀態
        setTimeout(() => {
          navigate('/')
        }, 1000)
      } else if (event === 'SIGNED_OUT') {
        // 可能是剛跳轉回來還未處理完 hash，暫不處理
        // 或者處理失敗
      }
    })

    // 處理 URL Hash (如果是 Magic Link 回來，Supabase 會自動處理，但我們可以手動檢查錯誤)
    const handleHash = async () => {
      // 如果網址包含 error_description，表示 Supabase 回傳錯誤
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const errorDescription = hashParams.get('error_description')
      const error = hashParams.get('error')

      if (error || errorDescription) {
        setStatus('error')
        setMessage(errorDescription || error || '登入發生錯誤')
        return
      }

      // 檢查是否長時間沒有反應 (例如 hash 不正確導致無法 sign in)
      setTimeout(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (!session) {
            // 如果過了幾秒還沒登入，可能是無效的連結
            // 這裡不強制報錯，因為有可能是已經登入過了，交給 onAuthStateChange 處理
            console.log('Checking session fallback: No session found yet.')
          }
        })
      }, 3000)
    }

    handleHash()

    return () => {
      subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-amber-900 font-bold text-2xl">金</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-6">LINE 登入處理中</h1>

        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
            <p className="text-gray-600">正在驗證您的身分...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium mb-2">{message}</p>
            <p className="text-gray-500 text-sm">即將跳轉至首頁...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 font-medium mb-4">{message}</p>
            <button
              onClick={() => navigate('/login')}
              className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition"
            >
              返回登入頁面
            </button>
          </div>
        )}
      </div>
    </div>
  )
}