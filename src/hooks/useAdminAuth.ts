import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/**
 * Admin 帳戶資訊介面
 */
export interface AdminInfo {
    username: string
    email: string
    role: string
    displayName: string
    loginTime: string
}

/**
 * Admin 權限檢查 Hook
 * 使用 localStorage 確保只有通過 /admin/login 登入的管理員可以訪問後台
 */
export function useAdminAuth() {
    const navigate = useNavigate()
    const [isAdmin, setIsAdmin] = useState(false)
    const [checking, setChecking] = useState(true)
    const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null)

    useEffect(() => {
        const adminAuthenticated = localStorage.getItem('adminAuthenticated') === 'true'
        const savedAdminInfo = localStorage.getItem('adminInfo')

        if (!adminAuthenticated) {
            // 未驗證,導向 Admin 登入頁
            navigate('/admin/login')
            setChecking(false)
        } else {
            // 已驗證,允許訪問
            setIsAdmin(true)

            // 讀取 admin 資訊
            if (savedAdminInfo) {
                try {
                    setAdminInfo(JSON.parse(savedAdminInfo))
                } catch (error) {
                    console.error('Error parsing admin info:', error)
                }
            }

            setChecking(false)
        }
    }, [navigate])

    return { isAdmin, checking, adminInfo }
}

/**
 * Admin 登出函數
 */
export async function adminLogout() {
    // 清除所有 admin 相關的 localStorage
    localStorage.removeItem('adminAuthenticated')
    localStorage.removeItem('adminInfo')
    localStorage.removeItem('adminLoginTime')

    // 登出 Supabase session
    await supabase.auth.signOut()
}
