import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Phone, Globe, DollarSign, Share2, Copy, Check, Key } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useCart } from '../contexts/CartContext'
import { supabase } from '../lib/supabase'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const { t, language, setLanguage } = useI18n()
  const { currency, setCurrency } = useCart()
  const [copied, setCopied] = useState(false)
  // 修改密碼相關狀態
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const referralLink = profile?.referral_code
    ? `${window.location.origin}?ref=${profile.referral_code}`
    : ''

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 修改密碼
  const handleChangePassword = async () => {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('profile')}</h1>

        {/* 基本資料 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
              <User size={40} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {profile?.full_name || user?.email?.split('@')[0]}
              </h2>
              <p className="text-gray-500">{user?.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-600">
              <Mail className="text-amber-600" size={20} />
              <span>{user?.email}</span>
            </div>
            {profile?.phone && (
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="text-amber-600" size={20} />
                <span>{profile.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* 偏好設定 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">偏好設定</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="text-amber-600" size={20} />
                <span className="text-gray-600">{t('language')}</span>
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'zh-TW' | 'vi')}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-amber-500"
              >
                <option value="zh-TW">繁體中文</option>
                <option value="vi">Tieng Viet</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DollarSign className="text-amber-600" size={20} />
                <span className="text-gray-600">{t('currency')}</span>
              </div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'TWD' | 'VND')}
                className="px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-amber-500"
              >
                <option value="TWD">TWD (新台幣)</option>
                <option value="VND">VND (越南盾)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 推薦碼 */}
        {/* {profile?.referral_code && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 mb-4">
              <Share2 className="text-amber-600" size={20} />
              {t('referralCode')}
            </h3>

            <div className="bg-amber-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-500 mb-1">您的推薦碼</p>
              <p className="text-2xl font-bold text-amber-600">{profile.referral_code}</p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm"
              />
              <button
                onClick={copyReferralLink}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition flex items-center gap-2"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? '已複製' : '複製'}
              </button>
            </div>
          </div>
        )} */}

        {/* 修改密碼 */}
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full bg-amber-600 text-white py-3 rounded-lg font-semibold hover:bg-amber-700 transition flex items-center justify-center gap-2 mb-4"
        >
          <Key size={20} />
          修改密碼
        </button>

        {/* 修改密碼彈窗 */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">修改密碼</h2>

              <div className="space-y-4">
                {/* 舊密碼 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    舊密碼
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="請輸入舊密碼"
                  />
                </div>

                {/* 新密碼 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新密碼
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="請輸入新密碼(至少 6 個字元)"
                  />
                </div>

                {/* 確認密碼 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    確認新密碼
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    placeholder="請再次輸入新密碼"
                  />
                </div>

                {/* 錯誤訊息 */}
                {passwordError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                    {passwordError}
                  </div>
                )}

                {/* 成功訊息 */}
                {passwordSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                    {passwordSuccess}
                  </div>
                )}

                {/* 按鈕 */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowPasswordModal(false)
                      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                      setPasswordError('')
                      setPasswordSuccess('')
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                    disabled={changingPassword}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleChangePassword}
                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={changingPassword}
                  >
                    {changingPassword ? '處理中...' : '確認修改'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 登出 */}
        <button
          onClick={handleSignOut}
          className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition"
        >
          {t('logout')}
        </button>
      </div>
    </div>
  )
}
