import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface NotificationBellProps {
  onClick: () => void
}

export default function NotificationBell({ onClick }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    // 即使在 Admin 頁面 user 可能為 null (由 AdminPage 自己管理 auth)，
    // 但 NotificationCenter 依賴 context。
    // 這裡我們嘗試獲取當前 session user，如果是 admin 則查詢 admin 相關通知
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        fetchUnreadCount(session.user.id)
        subscribeToNotifications(session.user.id)
      }
    }
    init()
  }, [user])

  const fetchUnreadCount = async (userId: string) => {
    try {
      // 根據 RLS，Admin 可以看到所有 recipient_role='admin' 或 'global' 的通知
      // 或者 user_id = current_user_id
      // 這裡簡化邏輯：查詢所有未讀通知，利用 RLS 自動過濾
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)

      if (error) throw error
      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const subscribeToNotifications = (userId: string) => {
    const subscription = supabase
      .channel('admin_notifications_bell')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, () => {
        // 當有任何通知變更時，重新抓取計數
        // (注意：這裡監聽所有變更，因為 RLS 讓客戶端過濾比較麻煩，
        // 簡單作法是收到訊號就重抓一次 count，反正輕量)
        fetchUnreadCount(userId)
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  return (
    <button
      onClick={onClick}
      className="relative p-2 text-gray-600 hover:text-amber-600 transition-colors"
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}