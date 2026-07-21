import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { clsx } from 'clsx'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  title: string
  message?: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(7)
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((title: string, message?: string) => {
    addToast({ title, message, type: 'success' })
  }, [addToast])

  const error = useCallback((title: string, message?: string) => {
    addToast({ title, message, type: 'error', duration: 5000 })
  }, [addToast])

  const warning = useCallback((title: string, message?: string) => {
    addToast({ title, message, type: 'warning' })
  }, [addToast])

  const info = useCallback((title: string, message?: string) => {
    addToast({ title, message, type: 'info' })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration || 3000)

    return () => clearTimeout(timer)
  }, [toast, onRemove])

  const icons = {
    success: <CheckCircle className="text-green-500" size={24} />,
    error: <XCircle className="text-red-500" size={24} />,
    warning: <AlertTriangle className="text-amber-500" size={24} />,
    info: <Info className="text-blue-500" size={24} />,
  }

  const bgColors = {
    success: 'border-l-green-500',
    error: 'border-l-red-500',
    warning: 'border-l-amber-500',
    info: 'border-l-blue-500',
  }

  return (
    <div
      className={clsx(
        'bg-white dark:bg-surface-800 shadow-pos-lg rounded-pos border border-surface-200 dark:border-surface-700 border-l-4 p-4 flex gap-3 animate-slide-down',
        bgColors[toast.type]
      )}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-pos-base font-semibold text-surface-900 dark:text-surface-100">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 transition-colors"
      >
        <X size={20} />
      </button>
    </div>
  )
}
