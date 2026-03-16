import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, User, LogIn, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

// Admin 帳號對照表（username -> { password, supabaseEmail, supabasePassword, displayName }）
const ADMIN_ACCOUNTS: Record<string, { password: string; supabaseEmail: string; supabasePassword: string; displayName: string }> = {
  admin: {
    password: 'Aa13145311',
    supabaseEmail: 'admin@thevgold.com',
    supabasePassword: 'Admin@TheVGold2026!',
    displayName: '系統管理員'
  },
  neo0519: {
    password: '12345678',
    supabaseEmail: 'admin@admin.log.tw',
    supabasePassword: '12345678',
    displayName: '系統管理員'
  }
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 驗證帳密
      const account = ADMIN_ACCOUNTS[username]
      if (account && password === account.password) {
        // 同時登入 Supabase（用於 RLS 政策驗證和數據訪問）
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: account.supabaseEmail,
          password: account.supabasePassword
        })

        if (authError) {
          console.error('Supabase 登入失敗:', authError)
          setError('系統登入失敗，請聯繫管理員')
          setLoading(false)
          return
        }

        // 驗證 session 已建立
        if (!authData.session) {
          console.error('Session 未建立')
          setError('登入失敗：無法建立會話，請重試')
          setLoading(false)
          return
        }

        console.log('Admin login successful, session established:', authData.session.user.id)

        // 設定登入狀態和帳戶資訊
        const adminInfo = {
          username: username,
          email: account.supabaseEmail,
          role: 'admin',
          displayName: account.displayName,
          loginTime: new Date().toISOString()
        }

        localStorage.setItem('adminAuthenticated', 'true')
        localStorage.setItem('adminInfo', JSON.stringify(adminInfo))
        localStorage.setItem('adminLoginTime', adminInfo.loginTime)

        // 等待一小段時間確保 session 完全建立
        await new Promise(resolve => setTimeout(resolve, 100))

        navigate('/admin')
      } else {
        setError('帳號或密碼錯誤')
      }
    } catch (err: any) {
      console.error('登入錯誤:', err)
      setError('登入失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full mb-4">
              <span className="text-white font-bold text-2xl">金</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">管理後台登入</h1>
            <p className="text-gray-500 mt-2">請輸入管理員帳號密碼</p>
          </div>

          {/* 錯誤提示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* 登入表單 */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                帳號
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="請輸入帳號"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密碼
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2 font-semibold transition"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} />
                  登入
                </>
              )}
            </button>
          </form>

          {/* 底部連結 */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <Link to="/" className="text-amber-600 hover:text-amber-700">
              返回首頁
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
