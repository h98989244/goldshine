import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

/**
 * Hook 用於管理 Supabase session 狀態
 * 監聽 auth 狀態變化並提供當前 session 資訊
 */
export function useSupabaseSession() {
    const [session, setSession] = useState<Session | null>(null)
    const [status, setStatus] = useState<SessionStatus>('loading')
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        // 獲取初始 session
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('Auth state changed: INITIAL_SESSION', session?.user?.id)
            setSession(session)
            setUserId(session?.user?.id || null)
            setStatus(session ? 'authenticated' : 'unauthenticated')
        })

        // 監聽 auth 狀態變化
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('Auth state changed:', _event, session?.user?.id)
            setSession(session)
            setUserId(session?.user?.id || null)
            setStatus(session ? 'authenticated' : 'unauthenticated')
        })

        return () => subscription.unsubscribe()
    }, [])

    return {
        session,
        status,
        userId,
        isLoading: status === 'loading',
        isAuthenticated: status === 'authenticated',
        isUnauthenticated: status === 'unauthenticated',
    }
}
