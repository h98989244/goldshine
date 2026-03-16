import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (error) throw error

            setSent(true)
        } catch (err: any) {
            setError(err.message || '發送失敗，請稍後再試')
        } finally {
            setLoading(false)
        }
    }

    if (sent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="text-green-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">郵件已發送</h2>
                    <p className="text-gray-600 mb-6">
                        我們已經發送密碼重設連結到 <strong>{email}</strong>
                    </p>
                    <p className="text-sm text-gray-500 mb-6">
                        請檢查您的郵箱並點擊連結來重設密碼。如果沒有收到郵件，請檢查垃圾郵件資料夾。
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium"
                    >
                        <ArrowLeft size={20} />
                        返回登入頁面
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">忘記密碼</h1>
                    <p className="text-gray-600">輸入您的 Email，我們將發送重設密碼的連結</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="your@email.com"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '發送中...' : '發送重設連結'}
                    </button>

                    <div className="text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
                        >
                            <ArrowLeft size={18} />
                            返回登入
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
