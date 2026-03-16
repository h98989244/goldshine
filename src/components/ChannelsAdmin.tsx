import { useState, useEffect } from 'react'
import { Store, Plus, Edit, Trash2, Search, DollarSign, Phone, Mail, MapPin, Package, X, Save, Tag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import MapPreview from './MapPreview'

interface Agent {
    id: string
    full_name: string
    email: string
    phone: string
    store_name: string
    store_address: string
    store_phone: string
    commission_rate: number
    referral_code: string
    created_at: string
    // 新增門市顯示欄位
    is_store_visible?: boolean
    store_name_vi?: string
    store_address_vi?: string
    store_business_hours?: string
    // 新增座標欄位
    latitude?: number | null
    longitude?: number | null
}

export default function ChannelsAdmin() {
    const [agents, setAgents] = useState<Agent[]>([])
    const [filteredAgents, setFilteredAgents] = useState<Agent[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddModal, setShowAddModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        phone: '',
        store_name: '',
        store_address: '',
        store_phone: '',
        commission_rate: 0,
        referral_code: '',
        // 新增門市顯示欄位
        is_store_visible: false,
        store_name_vi: '',
        store_address_vi: '',
        store_business_hours: '10:00 - 21:00 (週一至週日)',
        // 新增座標欄位
        latitude: null as number | null,
        longitude: null as number | null
    })

    useEffect(() => {
        loadAgents()
    }, [])

    useEffect(() => {
        if (searchTerm) {
            const filtered = agents.filter(agent =>
                agent.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                agent.store_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                agent.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                agent.referral_code?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            setFilteredAgents(filtered)
        } else {
            setFilteredAgents(agents)
        }
    }, [searchTerm, agents])

    const loadAgents = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'agent')
                .order('created_at', { ascending: false })

            if (error) throw error
            setAgents(data || [])
            setFilteredAgents(data || [])
        } catch (error) {
            console.error('Error loading agents:', error)
            alert('載入代理商失敗')
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = () => {
        setFormData({
            full_name: '',
            email: '',
            password: '',
            phone: '',
            store_name: '',
            store_address: '',
            store_phone: '',
            commission_rate: 0,
            referral_code: '',
            is_store_visible: false,
            store_name_vi: '',
            store_address_vi: '',
            store_business_hours: '10:00 - 21:00 (週一至週日)',
            latitude: null,
            longitude: null
        })
        setShowAddModal(true)
    }

    const handleEdit = (agent: Agent) => {
        setSelectedAgent(agent)
        setFormData({
            full_name: agent.full_name || '',
            email: agent.email || '',
            password: '',
            phone: agent.phone || '',
            store_name: agent.store_name || '',
            store_address: agent.store_address || '',
            store_phone: agent.store_phone || '',
            commission_rate: agent.commission_rate || 0,
            referral_code: agent.referral_code || '',
            is_store_visible: agent.is_store_visible || false,
            store_name_vi: agent.store_name_vi || '',
            store_address_vi: agent.store_address_vi || '',
            store_business_hours: agent.store_business_hours || '10:00 - 21:00 (週一至週日)',
            latitude: agent.latitude || null,
            longitude: agent.longitude || null
        })

        // Handle commission rate conversion (Decimal to Percentage)
        // If rate > 1, assume it's already percentage (legacy data). Otherwise multiply by 100.
        const rate = agent.commission_rate || 0
        setFormData(prev => ({
            ...prev,
            commission_rate: rate > 1 ? rate : rate * 100
        }))
        setShowEditModal(true)
    }

    const handleDelete = (agent: Agent) => {
        setSelectedAgent(agent)
        setShowDeleteModal(true)
    }

    const submitAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            // 使用表單中的密碼
            if (!formData.password) {
                throw new Error('請輸入密碼')
            }

            // 先刷新 session 以確保 token 有效
            console.log('正在刷新 session...')
            const { data: { session }, error: sessionError } = await supabase.auth.refreshSession()

            if (sessionError) {
                console.error('Session refresh error:', sessionError)
                throw new Error('Session 刷新失敗，請重新登入')
            }

            if (!session) {
                console.error('No session after refresh')
                throw new Error('未登入或 session 已過期，請重新登入')
            }

            console.log('Session refreshed successfully')
            console.log('User email:', session.user?.email)
            console.log('Access token exists:', !!session.access_token)
            console.log('Token expires at:', new Date(session.expires_at! * 1000).toLocaleString())

            // 使用 supabase.functions.invoke 呼叫 Edge Function，它會自動處理 Authorization header
            console.log('Invoking create-agent function...')
            const { data: responseData, error: invokeError } = await supabase.functions.invoke('create-agent', {
                body: {
                    email: formData.email,
                    password: formData.password,
                    full_name: formData.full_name,
                    phone: formData.phone,
                    store_name: formData.store_name,
                    store_address: formData.store_address,
                    store_phone: formData.store_phone,
                    commission_rate: formData.commission_rate / 100, // Convert percentage to decimal
                    referral_code: formData.referral_code,
                    // 新增門市顯示欄位
                    is_store_visible: formData.is_store_visible,
                    store_name_vi: formData.store_name_vi,
                    store_address_vi: formData.store_address_vi,
                    store_business_hours: formData.store_business_hours,
                    // 新增座標欄位
                    latitude: formData.latitude,
                    longitude: formData.longitude
                }
            })

            if (invokeError) {
                console.error('Invoke error:', invokeError)
                // 嘗試解析 invokeError body 獲取更詳細訊息
                let errorMessage = '呼叫 Edge Function 失敗'
                try {
                    if (invokeError instanceof Error) {
                        errorMessage = invokeError.message
                    } else {
                        const errorBody = typeof invokeError === 'string' ? JSON.parse(invokeError) : invokeError
                        errorMessage = errorBody.message || errorBody.error?.message || JSON.stringify(invokeError)
                    }
                } catch (e) {
                    errorMessage = String(invokeError)
                }

                // 特別處理 401
                if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
                    throw new Error('認證失敗，請重新登入管理員帳號')
                }

                throw new Error(errorMessage)
            }

            console.log('Response data:', responseData)

            if (!responseData.success) {
                throw new Error(responseData.error?.message || responseData.message || '建立代理商失敗')
            }

            alert(`代理商新增成功!\n\nEmail: ${formData.email}\n密碼: ${formData.password}\n推薦碼: ${formData.referral_code || '系統自動生成'}\n\n請將登入資訊提供給代理商。`)
            setShowAddModal(false)
            loadAgents()
        } catch (error: any) {
            console.error('Error adding agent:', error)

            // 提供更詳細的錯誤訊息
            let errorMessage = '新增失敗:'

            if (error.message) {
                errorMessage += ` ${error.message}`
            } else if (error.code === '23502') {
                errorMessage += ' 缺少必要欄位'
            } else if (error.code === '23505') {
                errorMessage += ' 此 Email 或推薦碼已被使用'
            } else {
                errorMessage += ' 未知錯誤'
            }

            if (error.details) {
                errorMessage += `\n詳細資訊: ${JSON.stringify(error.details)}`
            }

            alert(errorMessage)
        }
    }

    const submitEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAgent) return

        try {
            // 準備更新資料,排除空密碼
            const updateData: any = {
                full_name: formData.full_name,
                phone: formData.phone,
                store_name: formData.store_name,
                store_address: formData.store_address,
                store_phone: formData.store_phone,
                commission_rate: formData.commission_rate / 100, // Convert percentage to decimal
                referral_code: formData.referral_code,
                // 新增門市顯示欄位
                is_store_visible: formData.is_store_visible,
                store_name_vi: formData.store_name_vi,
                store_address_vi: formData.store_address_vi,
                store_business_hours: formData.store_business_hours,
                // 新增座標欄位
                latitude: formData.latitude,
                longitude: formData.longitude
            }

            // 如果有填寫密碼,則透過 Edge Function 更新密碼
            if (formData.password && formData.password.trim() !== '') {
                // 取得 session
                const { data: { session } } = await supabase.auth.getSession()
                const accessToken = session?.access_token

                if (!accessToken) {
                    throw new Error('未授權:請先登入')
                }

                // 呼叫 reset-agent-password Edge Function
                const resetPasswordResponse = await fetch(
                    'https://kbywkigkmoojppeyljmd.supabase.co/functions/v1/reset-agent-password',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`
                        },
                        body: JSON.stringify({
                            agentId: selectedAgent.id,
                            newPassword: formData.password
                        })
                    }
                )

                if (!resetPasswordResponse.ok) {
                    const errorData = await resetPasswordResponse.json()
                    throw new Error(errorData.error || '密碼更新失敗')
                }

                // alert('密碼已更新') // 可以選擇是否要個別提示,或最後統一提示
            }

            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', selectedAgent.id)

            if (error) throw error

            let successMessage = '代理商資料更新成功!'
            if (formData.password && formData.password.trim() !== '') {
                successMessage += '\n密碼也已成功更新。'
            }
            alert(successMessage)
            setShowEditModal(false)
            loadAgents()
        } catch (error: any) {
            console.error('Error updating agent:', error)
            alert('更新失敗:' + error.message)
        }
    }

    const confirmDelete = async () => {
        if (!selectedAgent) return

        try {
            // 1. 先刪除 profiles 資料 (維持原本邏輯)
            const { error: profileError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', selectedAgent.id)

            if (profileError) throw profileError

            // 2. 呼叫 Edge Function 刪除 auth 帳號
            console.log('Invoking delete-user function for:', selectedAgent.id)
            const { error: deleteAuthError } = await supabase.functions.invoke('delete-user', {
                body: { userId: selectedAgent.id }
            })

            if (deleteAuthError) {
                console.error('Failed to delete auth user:', deleteAuthError)
                // 不拋出錯誤，因為 profile 已經刪除，主要目的已達成
            } else {
                console.log('Auth user deleted successfully')
            }

            alert('代理商已刪除')
            setShowDeleteModal(false)
            loadAgents()
        } catch (error: any) {
            console.error('Error deleting agent:', error)
            alert('刪除失敗：' + error.message)
        }
    }

    return (
        <div>
            {/* 標題 */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">通路管理（代理商管理）</h1>
                    <p className="text-gray-600 mt-1">管理代理商資訊、門市資料和佣金設定</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                >
                    <Plus size={20} />
                    新增代理商
                </button>
            </div>

            {/* 搜尋欄 */}
            <div className="bg-white rounded-xl shadow p-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="搜尋代理商名稱、門市名稱、Email 或推薦碼..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* 代理商列表 */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">載入中...</p>
                </div>
            ) : filteredAgents.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-12 text-center">
                    <Store size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">
                        {searchTerm ? '找不到符合的代理商' : '暫無代理商'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAgents.map(agent => (
                        <div key={agent.id} className="bg-white rounded-xl shadow hover:shadow-lg transition p-6">
                            {/* 門市名稱 */}
                            <div className="flex items-center gap-2 mb-4">
                                <Store className="text-amber-600" size={24} />
                                <h3 className="text-lg font-bold text-gray-800">
                                    {agent.store_name || '未設定門市名稱'}
                                </h3>
                            </div>

                            {/* 資訊列表 */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-start gap-2 text-sm">
                                    <span className="text-gray-500">👤 負責人：</span>
                                    <span className="text-gray-800">{agent.full_name || '未設定'}</span>
                                </div>
                                <div className="flex items-start gap-2 text-sm">
                                    <Mail size={14} className="text-gray-400 mt-0.5" />
                                    <span className="text-gray-600">{agent.email}</span>
                                </div>
                                {agent.phone && (
                                    <div className="flex items-start gap-2 text-sm">
                                        <Phone size={14} className="text-gray-400 mt-0.5" />
                                        <span className="text-gray-600">{agent.phone}</span>
                                    </div>
                                )}
                                {agent.store_address && (
                                    <div className="flex items-start gap-2 text-sm">
                                        <MapPin size={14} className="text-gray-400 mt-0.5" />
                                        <span className="text-gray-600">{agent.store_address}</span>
                                    </div>
                                )}
                                <div className="flex items-start gap-2 text-sm">
                                    <Tag size={14} className="text-blue-500 mt-0.5" />
                                    <span className="text-blue-600">
                                        推薦碼：{agent.referral_code || '未設定'}
                                    </span>
                                </div>
                                <div className="flex items-start gap-2 text-sm">
                                    <DollarSign size={14} className="text-green-600 mt-0.5" />
                                    <span className="text-green-700 font-semibold">
                                        佣金比例：{(agent.commission_rate && agent.commission_rate > 1 ? agent.commission_rate : (agent.commission_rate || 0) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {/* 操作按鈕 */}
                            <div className="flex gap-2 pt-4 border-t">
                                <button
                                    onClick={() => handleEdit(agent)}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm"
                                >
                                    <Edit size={14} />
                                    編輯
                                </button>
                                <Link
                                    to="/admin/inventory"
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition text-sm"
                                >
                                    <Package size={14} />
                                    庫存
                                </Link>
                                <button
                                    onClick={() => handleDelete(agent)}
                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm"
                                >
                                    <Trash2 size={14} />
                                    刪除
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 新增代理商彈窗 */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <form onSubmit={submitAdd} className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">新增代理商</h3>
                                <button type="button" onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <AgentForm formData={formData} setFormData={setFormData} isEditMode={false} />

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    保存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 編輯代理商彈窗 */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <form onSubmit={submitEdit} className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">編輯代理商資訊</h3>
                                <button type="button" onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <AgentForm formData={formData} setFormData={setFormData} isEditMode={true} />

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    保存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 刪除確認彈窗 */}
            {showDeleteModal && selectedAgent && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">確認刪除</h3>
                        <p className="text-gray-600 mb-6">
                            確定要刪除代理商「{selectedAgent.store_name || selectedAgent.full_name}」嗎？
                            此操作無法復原。
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                取消
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                確認刪除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// 代理商表單組件
function AgentForm({ formData, setFormData, isEditMode = false }: {
    formData: any
    setFormData: (data: any) => void
    isEditMode?: boolean
}) {
    return (
        <div className="space-y-6">
            {/* 基本資訊 */}
            <div>
                <h4 className="font-semibold text-gray-800 mb-3">基本資訊</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">負責人姓名 *</label>
                        <input
                            type="text"
                            required
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            readOnly={isEditMode}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent ${isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                        />
                        {isEditMode && <p className="text-xs text-gray-500 mt-1">Email 無法修改</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">推薦碼</label>
                        <input
                            type="text"
                            value={formData.referral_code}
                            onChange={(e) => setFormData({ ...formData, referral_code: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder="請自訂推薦碼 (選填)"
                        />
                        <p className="text-xs text-gray-500 mt-1">用於代理商推廣的唯一代碼</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">電話</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            密碼 {!isEditMode && '*'}
                        </label>
                        <input
                            type="password"
                            required={!isEditMode}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            placeholder={isEditMode ? '留空則不修改密碼' : '請輸入代理商的登入密碼'}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            {isEditMode ? '僅在需要重設密碼時填寫' : '此密碼將用於代理商登入後台'}
                        </p>
                    </div>
                </div>
            </div>

            {/* 門市資訊 */}
            <div>
                <h4 className="font-semibold text-gray-800 mb-3">門市資訊</h4>
                <div className="space-y-4">
                    {/* 門市顯示開關 */}
                    <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg">
                        <input
                            type="checkbox"
                            id="is_store_visible"
                            checked={formData.is_store_visible}
                            onChange={(e) => setFormData({ ...formData, is_store_visible: e.target.checked })}
                            className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="is_store_visible" className="text-sm font-medium text-gray-700 cursor-pointer">
                            在門市頁面顯示此代理商門市
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">門市名稱(繁中)</label>
                            <input
                                type="text"
                                value={formData.store_name}
                                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">門市名稱(越南文)</label>
                            <input
                                type="text"
                                value={formData.store_name_vi}
                                onChange={(e) => setFormData({ ...formData, store_name_vi: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="選填"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">門市地址(繁中)</label>
                            <textarea
                                value={formData.store_address}
                                onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">門市地址(越南文)</label>
                            <textarea
                                value={formData.store_address_vi}
                                onChange={(e) => setFormData({ ...formData, store_address_vi: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="選填"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">門市電話</label>
                            <input
                                type="tel"
                                value={formData.store_phone}
                                onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">營業時間</label>
                            <input
                                type="text"
                                value={formData.store_business_hours}
                                onChange={(e) => setFormData({ ...formData, store_business_hours: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="例如: 10:00 - 21:00 (週一至週日)"
                            />
                        </div>
                    </div>

                    {/* 地圖預覽與座標 */}
                    <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">門市位置與座標</h5>
                        <MapPreview
                            latitude={formData.latitude}
                            longitude={formData.longitude}
                            address={formData.store_address}
                            onCoordinatesChange={(lat, lng) => {
                                setFormData({ ...formData, latitude: lat, longitude: lng })
                            }}
                        />
                    </div>

                    {/* 手動輸入座標 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">緯度 (Latitude)</label>
                            <input
                                type="number"
                                step="0.000001"
                                value={formData.latitude || ''}
                                onChange={(e) => setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="例如: 25.033000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">經度 (Longitude)</label>
                            <input
                                type="number"
                                step="0.000001"
                                value={formData.longitude || ''}
                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                placeholder="例如: 121.565400"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* 佣金設定 */}
            <div>
                <h4 className="font-semibold text-gray-800 mb-3">佣金設定</h4>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">佣金比例（%）</label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={formData.commission_rate}
                        onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">此代理商的訂單佣金比例（例如：15 表示 15%）</p>
                </div>
            </div>
        </div >
    )
}
