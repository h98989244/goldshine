import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
    id: string
    type: ToastType
    message: string
    duration?: number
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
        const id = Math.random().toString(36).substring(7)
        const newToast: Toast = { id, type, message, duration }

        setToasts(prev => [...prev, newToast])

        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, duration)
        }
    }, [])

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5" />
            case 'error': return <XCircle className="w-5 h-5" />
            case 'warning': return <AlertCircle className="w-5 h-5" />
            case 'info': return <Info className="w-5 h-5" />
        }
    }

    const getStyles = (type: ToastType) => {
        switch (type) {
            case 'success': return 'bg-green-50 text-green-800 border-green-200'
            case 'error': return 'bg-red-50 text-red-800 border-red-200'
            case 'warning': return 'bg-yellow-50 text-yellow-800 border-yellow-200'
            case 'info': return 'bg-blue-50 text-blue-800 border-blue-200'
        }
    }

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-md">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 shadow-lg animate-slide-in ${getStyles(toast.type)}`}
                    >
                        <div className="flex-shrink-0 mt-0.5">
                            {getIcon(toast.type)}
                        </div>
                        <p className="flex-1 text-sm font-medium leading-relaxed">
                            {toast.message}
                        </p>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="flex-shrink-0 hover:opacity-70 transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) throw new Error('useToast must be used within ToastProvider')
    return context
}
