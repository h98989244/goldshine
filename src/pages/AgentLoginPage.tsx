import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, LogIn, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AgentLoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 使用 Supabase Auth 登入
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('登入失敗:未返回用戶資料')
      }

      // 驗證是否為代理商 - 查詢 profiles 表
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single()

      if (profileError || !profile) {
        await supabase.auth.signOut()
        throw new Error('無法取得用戶資料')
      }

      if (profile.role !== 'agent') {
        await supabase.auth.signOut()
        throw new Error('此帳號不是代理商帳號')
      }

      // 登入成功,導向代理商後台
      navigate('/agent')
    } catch (err: any) {
      setError(err.message || '登入失敗')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-4">
              <span className="text-3xl">💎</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">代理商登入</h1>
            <p className="text-gray-500 mt-2">登入您的代理商帳號</p>
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
                電子郵件
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="your@email.com"
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
            <span className="mx-2">|</span>
            <Link to="/login" className="text-amber-600 hover:text-amber-700">
              一般會員登入
            </Link>
          </div>
        </div>

        {/* 提示 */}
        <p className="text-center text-gray-500 text-sm mt-6">
          代理商帳號由管理員創建，請聯繫管理員獲取帳號
        </p>
      </div>
    </div>
  )
}
