import { useState, useEffect } from 'react'
import { Bell, X, Check, CheckCheck, Clock } from 'lucide-react'
import { supabase, Notification, NotificationType } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { user } = useAuth()

  useEffect(() => {
    if (user && isOpen) {
      fetchNotifications()
      fetchUnreadCount()
    }
  }, [user, isOpen])

  // 實時監聽通知
  useEffect(() => {
    if (!user) return

    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        console.log('Real-time notification update:', payload)
        fetchNotifications()
        fetchUnreadCount()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user])

  const fetchNotifications = async () => {
    if (!user) return

    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching notifications:', error)
    } else {
      setNotifications(data || [])
    }
    setLoading(false)
  }

  const fetchUnreadCount = async () => {
    if (!user) return

    try {
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

  const markAsRead = async (notificationId: number) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)

      if (error) throw error

      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'registration':
        return '🎉'
      case 'order':
        return '🛒'
      case 'completion':
        return '✅'
      case 'settlement':
        return '💰'
      default:
        return '📢'
    }
  }

  const getNotificationTypeText = (type: NotificationType) => {
    switch (type) {
      case 'registration':
        return '註冊通知'
      case 'order':
        return '訂單通知'
      case 'completion':
        return '完成通知'
      case 'settlement':
        return '結算通知'
      default:
        return '系統通知'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={20} className="text-amber-600" />
            <h2 className="text-lg font-semibold">通知中心</h2>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Actions */}
        {unreadCount > 0 && (
          <div className="p-4 border-b">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700"
            >
              <CheckCheck size={16} />
              標記全部為已讀
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full mx-auto mb-2"></div>
              載入中...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell size={48} className="mx-auto mb-4 text-gray-300" />
              <p>暫無通知</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer ${!notification.is_read ? 'bg-amber-50 border-l-4 border-amber-400' : ''
                    }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {getNotificationTypeText(notification.type)}
                      </p>
                      {notification.content && (
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.content}
                        </p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock size={12} />
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <Check size={16} className="text-amber-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}