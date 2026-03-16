import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

type AuthContextType = {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, fullName: string, agreedToTerms?: boolean, referralCode?: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 檢查 Supabase session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      }
      setLoading(false)
    })

    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)

      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)

        // 如果 URL 中有 auth hash（來自 magic link），清除它
        if (window.location.hash && window.location.hash.includes('access_token')) {
          console.log('清除 URL hash')
          // 使用 replaceState 清除 hash，不觸發頁面重載
          window.history.replaceState(null, '', window.location.pathname + window.location.search)
        }
      } else {
        setProfile(null)
      }
    })

    // 檢查 URL 中的 referral code
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref) {
      console.log('Capturing referral code:', ref)
      sessionStorage.setItem('referralCode', ref)
    }

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error }
  }

  async function signUp(email: string, password: string, fullName: string, agreedToTerms: boolean = false, referralCode?: string) {
    // 檢查是否已同意條款
    if (!agreedToTerms) {
      return { error: new Error('請先同意服務條款和隱私權政策') }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          referral_code: referralCode,
          agreed_to_terms: agreedToTerms,
          agreed_to_terms_at: new Date().toISOString(),
          terms_version: '1.0',
          privacy_policy_version: '1.0'
        }
      }
    })
    // Profile 會由數據庫 trigger 自動創建
    if (!error && data.user && !data.user.identities?.length) {
      // 用戶已存在但未確認
      return { error: new Error('此郵箱已註冊，請檢查您的郵箱確認信') }
    }
    return { error }
  }

  async function signOut() {
    // 清除 LINE 相關的 sessionStorage
    sessionStorage.removeItem('lineLoginHandled')

    // 如果有 LIFF，嘗試執行 LIFF 登出
    if (window.liff) {
      try {
        // 先檢查 liff 是否已初始化，避免直接調用 isLoggedIn 報錯
        // 注意：liff.id 是初始化後才有的屬性，或者我們可以嘗試 catch 錯誤
        if (window.liff.isLoggedIn()) {
          window.liff.logout()
          console.log('LIFF logged out')
        }
      } catch (error) {
        // 忽略 LIFF 相關錯誤 (例如 liffId is necessary for liff.init())
        // 這樣不會影響後續的 Supabase 登出
        console.warn('LIFF logout check failed (non-fatal):', error)
      }
    }

    // Supabase 登出
    await supabase.auth.signOut()
  }

  function generateReferralCode() {
    return 'FJ' + Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
