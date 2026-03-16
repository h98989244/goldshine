import { useState, useEffect } from 'react'
import { Users, Plus, Edit, Trash2, Search, X, Save, Shield, User as UserIcon, Key } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { updateUserProfile, updateUserPassword, logOperation } from '../services/adminApi'

interface User {
    id: string
    email: string
    full_name: string
    phone: string
    role: string
    commission_rate: number
    store_name: string
    store_address: string
    store_phone: string
    created_at: string
}

export default function UsersAdmin() {
    const [users, setUsers] = useState<User[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [passwordFormData, setPasswordFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    })
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone: '',
        role: 'user',
        commission_rate: 0,
        store_name: '',
        store_address: '',
        store_phone: ''
    })

    useEffect(() => {
        loadUsers()
    }, [])

    useEffect(() => {
        let filtered = users

        // 角色篩選
        if (roleFilter !== 'all') {
            filtered = filtered.filter(user => user.role === roleFilter)
        }

        // 搜尋
        if (searchTerm) {
            filtered = filtered.filter(user =>
                user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setFilteredUsers(filtered)
    }, [searchTerm, roleFilter, users])

    const loadUsers = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setUsers(data || [])
            setFilteredUsers(data || [])
        } catch (error) {
            console.error('Error loading users:', error)
            alert('載入用戶失敗')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (user: User) => {
        setSelectedUser(user)
        setFormData({
            full_name: user.full_name || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || 'user',
            // Handle commission rate conversion (Decimal to Percentage)
            commission_rate: (user.commission_rate && user.commission_rate > 1)
                ? user.commission_rate
                : (user.commission_rate || 0) * 100,
            store_name: user.store_name || '',
            store_address: user.store_address || '',
            store_phone: user.store_phone || ''
        })
        setShowEditModal(true)
    }

    const handleDelete = (user: User) => {
        setSelectedUser(user)
        setShowDeleteModal(true)
    }

    const handlePasswordReset = (user: User) => {
        setSelectedUser(user)
        setPasswordFormData({
            newPassword: '',
            confirmPassword: ''
        })
        setShowPasswordModal(true)
    }

    const submitPasswordReset = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUser) return

        // 驗證密碼
        if (passwordFormData.newPassword.length < 6) {
            alert('密碼長度至少需要 6 個字元')
            return
        }

        if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
            alert('兩次輸入的密碼不一致')
            return
        }

        try {
            await updateUserPassword(selectedUser.id, passwordFormData.newPassword)
            alert('密碼已成功重設！')
            setShowPasswordModal(false)
            setPasswordFormData({ newPassword: '', confirmPassword: '' })
        } catch (error: any) {
            console.error('Error updating password:', error)
            alert('密碼重設失敗：' + error.message)
        }
    }

    const submitEdit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUser) return

        try {
            await updateUserProfile(selectedUser.id, {
                ...formData,
                commission_rate: formData.commission_rate / 100 // Convert percentage to decimal
            })

            alert('用戶資料更新成功！')
            setShowEditModal(false)
            loadUsers()
        } catch (error: any) {
            console.error('Error updating user:', error)
            alert('更新失敗：' + error.message)
        }
    }

    const confirmDelete = async () => {
        if (!selectedUser) return

        try {
            // 檢查 session 是否有效
            const { data: { session }, error: sessionError } = await supabase.auth.getSession()

            if (sessionError || !session) {
                alert('登入狀態已過期,請重新登入')
                window.location.href = '/admin/login'
                return
            }

            console.log('Deleting user via RPC with valid session:', session.user.id)

            // 呼叫 RPC 函數刪除用戶
            const { error } = await supabase.rpc('delete_user_by_id', {
                target_user_id: selectedUser.id
            })

            if (error) {
                console.error('RPC Delete error:', error)

                // 檢查是否為權限錯誤
                if (error.message?.includes('權限不足') || error.code === '42501') {
                    alert('權限不足：僅管理員可刪除用戶')
                    return
                }

                throw error
            }

            // Log operation
            logOperation({
                operationType: 'delete',
                tableName: 'profiles',
                operationDescription: `刪除用戶 ID: ${selectedUser.id}`,
                beforeValues: selectedUser,
                afterValues: null
            })

            alert('用戶已完全刪除')
            setShowDeleteModal(false)
            loadUsers()
        } catch (error: any) {
            console.error('Error deleting user:', error)
            alert('刪除失敗：' + error.message)
        }
    }

    const getRoleBadge = (role: string) => {
        const styles = {
            admin: 'bg-purple-100 text-purple-700',
            agent: 'bg-amber-100 text-amber-700',
            user: 'bg-blue-100 text-blue-700'
        }
        const labels = {
            admin: '管理員',
            agent: '代理商',
            user: '用戶'
        }
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[role as keyof typeof styles] || styles.user}`}>
                {labels[role as keyof typeof labels] || role}
            </span>
        )
    }

    return (
        <div>
            {/* 標題 */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">用戶管理</h1>
                    <p className="text-gray-600 mt-1">
                        管理系統用戶、編輯資料和權限
                        <span className="ml-2 text-sm">
                            (共 {users.length} 位用戶)
                        </span>
                    </p>
                </div>
                <button
                    onClick={loadUsers}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                >
                    <Search size={18} />
                    重新載入
                </button>
            </div>

            {/* 搜尋和篩選 */}
            <div className="bg-white rounded-xl shadow p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="搜尋姓名、Email 或電話..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    >
                        <option value="all">所有角色</option>
                        <option value="admin">管理員</option>
                        <option value="agent">代理商</option>
                        <option value="user">用戶</option>
                    </select>
                </div>
            </div>

            {/* 用戶列表 */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">載入中...</p>
                </div>
            ) : filteredUsers.length === 0 ? (
                <div className="bg-white rounded-xl shadow p-12 text-center">
                    <Users size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">
                        {searchTerm || roleFilter !== 'all' ? '找不到符合的用戶' : '暫無用戶'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用戶</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">聯絡方式</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">註冊時間</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                                                    <UserIcon size={20} className="text-amber-600" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.full_name || '未設定'}</div>
                                                    <div className="text-sm text-gray-500">{user.email || <span className="text-amber-600">LINE 登入</span>}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{user.phone || '-'}</div>
                                            {user.role === 'agent' && user.store_name && (
                                                <div className="text-xs text-gray-500">門市：{user.store_name}</div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getRoleBadge(user.role)}
                                            {user.role === 'agent' && (
                                                <div className="text-xs text-green-600 mt-1">
                                                    佣金：{(user.commission_rate && user.commission_rate > 1
                                                        ? user.commission_rate
                                                        : (user.commission_rate || 0) * 100).toFixed(1)
                                                    }%
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="text-blue-600 hover:text-blue-900 mr-3"
                                                title="編輯用戶"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handlePasswordReset(user)}
                                                className="text-amber-600 hover:text-amber-900 mr-3"
                                                title="重設密碼"
                                            >
                                                <Key size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user)}
                                                className="text-red-600 hover:text-red-900"
                                                title="刪除用戶"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 編輯用戶彈窗 */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <form onSubmit={submitEdit} className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">編輯用戶資料</h3>
                                <button type="button" onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* 基本資訊 */}
                                <div>
                                    <h4 className="font-semibold text-gray-800 mb-3">基本資訊</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                                            <input
                                                type="text"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                disabled
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Email 無法修改</p>
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
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            >
                                                <option value="user">用戶</option>
                                                <option value="agent">代理商</option>
                                                <option value="admin">管理員</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* 代理商資訊（僅當角色為 agent 時顯示）*/}
                                {formData.role === 'agent' && (
                                    <>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 mb-3">門市資訊</h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">門市名稱</label>
                                                    <input
                                                        type="text"
                                                        value={formData.store_name}
                                                        onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">門市地址</label>
                                                    <textarea
                                                        value={formData.store_address}
                                                        onChange={(e) => setFormData({ ...formData, store_address: e.target.value })}
                                                        rows={2}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">門市電話</label>
                                                    <input
                                                        type="tel"
                                                        value={formData.store_phone}
                                                        onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>

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
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

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
            {showDeleteModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">確認刪除</h3>
                        <p className="text-gray-600 mb-6">
                            確定要刪除用戶「{selectedUser.full_name || selectedUser.email}」嗎？
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

            {/* 密碼重設彈窗 */}
            {showPasswordModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <form onSubmit={submitPasswordReset}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">重設用戶密碼</h3>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="mb-6">
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">用戶：</span>
                                        {selectedUser.full_name || '未設定'}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">Email：</span>
                                        {selectedUser.email || <span className="text-amber-600">LINE 登入</span>}
                                    </p>
                                    <p className="text-sm text-gray-700">
                                        <span className="font-semibold">角色：</span>
                                        {selectedUser.role === 'admin' ? '管理員' : selectedUser.role === 'agent' ? '代理商' : '用戶'}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            新密碼
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordFormData.newPassword}
                                            onChange={(e) => setPasswordFormData({
                                                ...passwordFormData,
                                                newPassword: e.target.value
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder="至少 6 個字元"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            確認新密碼
                                        </label>
                                        <input
                                            type="password"
                                            value={passwordFormData.confirmPassword}
                                            onChange={(e) => setPasswordFormData({
                                                ...passwordFormData,
                                                confirmPassword: e.target.value
                                            })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                                            placeholder="再次輸入新密碼"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        💡 密碼長度至少需要 6 個字元
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center justify-center gap-2"
                                >
                                    <Key size={18} />
                                    重設密碼
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
