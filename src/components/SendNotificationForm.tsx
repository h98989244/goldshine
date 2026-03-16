import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Users, Send, AlertCircle, Info } from 'lucide-react'

export default function SendNotificationForm() {
    const [targetType, setTargetType] = useState<'specific' | 'agent' | 'admin' | 'global'>('specific')
    const [userId, setUserId] = useState('')
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [actionUrl, setActionUrl] = useState('')
    const [sending, setSending] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSending(true)
        setMessage(null)

        try {
            if (targetType === 'specific') {
                if (!userId.trim()) throw new Error('User ID is required for specific target')

                const { error } = await supabase.from('notifications').insert({
                    user_id: userId.trim(),
                    type: 'system',
                    title,
                    content,
                    metadata: actionUrl ? { action_url: actionUrl } : {},
                    recipient_role: 'user'
                })

                if (error) throw error
            } else {
                const { error } = await supabase.rpc('send_broadcast_notification', {
                    p_target_role: targetType,
                    p_title: title,
                    p_content: content,
                    p_metadata: actionUrl ? { action_url: actionUrl } : {}
                })

                if (error) throw error
            }

            setMessage({ type: 'success', text: '發送成功！' })
            // Reset form
            setTitle('')
            setContent('')
            setActionUrl('')
        } catch (err: any) {
            console.error('Error sending notification:', err)
            setMessage({ type: 'error', text: err.message || '發送失敗，請稍後再試' })
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow border border-gray-100">
            <div className="flex items-center gap-2 mb-6 text-gray-800">
                <Send className="w-6 h-6 text-amber-600" />
                <h2 className="text-xl font-bold">發送系統通知</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Target Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">接收對象</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                            { id: 'specific', label: '特定用戶' },
                            { id: 'agent', label: '所有代理' },
                            { id: 'admin', label: '所有管理員' },
                            { id: 'global', label: '全體廣播' }
                        ].map((type) => (
                            <button
                                type="button"
                                key={type.id}
                                onClick={() => setTargetType(type.id as any)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${targetType === type.id
                                        ? 'bg-amber-50 border-amber-500 text-amber-700'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* User ID Input (Specific only) */}
                {targetType === 'specific' && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">用戶 ID (UUID)</label>
                        <input
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                            required
                        />
                    </div>
                )}

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">通知標題</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="請輸入標題"
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                        required
                    />
                </div>

                {/* Content */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">通知內容</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="請輸入內容"
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                        required
                    />
                </div>

                {/* Action URL (Metadata) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        跳轉連結 (選填)
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={actionUrl}
                            onChange={(e) => setActionUrl(e.target.value)}
                            placeholder="e.g. /products/gold-ring"
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                        />
                        <Info className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                        用戶點擊通知後將導向此連結
                    </p>
                </div>

                {/* Message Alert */}
                {message && (
                    <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        <AlertCircle className="w-5 h-5" />
                        <p>{message.text}</p>
                    </div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-lg transition disabled:opacity-50 flex justify-center items-center gap-2"
                >
                    {sending ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            發送中...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            發送通知
                        </>
                    )}
                </button>
            </form>
        </div>
    )
}
