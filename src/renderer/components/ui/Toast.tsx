import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { clsx } from 'clsx'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

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
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((title: string, message?: string) => {
    addToast({ title, message, type: 'success' })
  }, [addToast])

  const error = useCallback((title: string, message?: string) => {
    addToast({ title, message, type: 'error', duration: 4500 })
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
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration || 3200)

    return () => clearTimeout(timer)
  }, [toast, onRemove])

  const typeConfig = {
    success: {
      icon: <CheckCircle2 className="text-emerald-400" size={18} />,
      border: 'border-l-emerald-500 border-[#322C26]',
      accentBg: 'bg-emerald-500/10 text-emerald-400',
    },
    error: {
      icon: <AlertCircle className="text-red-400" size={18} />,
      border: 'border-l-red-500 border-[#322C26]',
      accentBg: 'bg-red-500/10 text-red-400',
    },
    warning: {
      icon: <AlertTriangle className="text-amber-400" size={18} />,
      border: 'border-l-amber-500 border-[#322C26]',
      accentBg: 'bg-amber-500/10 text-amber-400',
    },
    info: {
      icon: <Info className="text-brand-300" size={18} />,
      border: 'border-l-brand-500 border-[#322C26]',
      accentBg: 'bg-brand-500/10 text-brand-300',
    },
  }

  const config = typeConfig[toast.type]

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={clsx(
        'pointer-events-auto bg-[#171410] shadow-pos-lg rounded-xl border border-l-4 p-3.5 flex items-start gap-3 select-none',
        config.border
      )}
      role="alert"
    >
      <div className={clsx('p-1 rounded-lg shrink-0 mt-0.5', config.accentBg)}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-sm font-medium text-surface-100 tracking-tight leading-snug">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="text-xs text-surface-400 mt-0.5 leading-relaxed break-words">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 text-surface-400 hover:text-white rounded-lg hover:bg-surface-800 transition-colors"
        aria-label="Kapat"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}

