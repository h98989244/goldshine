import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        // 檢查是否有有效的重設 token
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                setError('無效的重設連結，請重新申請')
            }
        }
        checkSession()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('密碼不一致')
            return
        }

        if (password.length < 6) {
            setError('密碼至少需要 6 個字元')
            return
        }

        setLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            alert('密碼重設成功！')
            navigate('/login')
        } catch (err: any) {
            setError(err.message || '重設失敗，請稍後再試')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-amber-600" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">重設密碼</h1>
                    <p className="text-gray-600">請輸入您的新密碼</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                            新密碼
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-12"
                                placeholder="至少 6 個字元"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                            確認密碼
                        </label>
                        <input
                            id="confirmPassword"
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="再次輸入新密碼"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '重設中...' : '重設密碼'}
                    </button>
                </form>
            </div>
        </div>
    )
}
