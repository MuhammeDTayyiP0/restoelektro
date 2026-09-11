import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true
}: ModalProps) {
  
  const modalRef = useRef<HTMLDivElement>(null)

  // Escape tuşu ile kapatma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Modal açıkken arka planın pointer event'lerini kes
  useEffect(() => {
    if (isOpen) {
      const root = document.getElementById('root')
      if (root) {
        root.style.pointerEvents = 'none'
      }
      return () => {
        if (root) {
          root.style.pointerEvents = 'auto'
        }
      }
    }
  }, [isOpen])

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'w-[98vw] max-w-[1560px] h-[92vh] max-h-[94vh]',
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-1.5 sm:p-3 md:p-5 overflow-hidden select-none isolate pointer-events-auto">
          {/* Overlay - Blur kaldırıldı, GPU dostu mat yarı saydam zemin */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed inset-0 bg-[#0B0A08]/88 z-0 pointer-events-auto"
            onClick={() => closeOnOverlayClick && onClose()}
          />
          
          {/* Modal Container - Basit opacity geçişi ve GPU layer izolasyonu */}
          <motion.div 
            ref={modalRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ transform: 'translateZ(0)', willChange: 'opacity, transform' }}
            className={clsx(
              'relative z-50 isolate w-full max-h-[94vh] sm:max-h-[90vh] bg-[#171410] rounded-2xl shadow-pos-lg flex flex-col overflow-hidden border border-[#322C26] my-auto pointer-events-auto',
              sizes[size]
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-b border-[#322C26] bg-[#12110E] flex-shrink-0 shrink-0">
              <h2 className="text-sm sm:text-base font-semibold text-surface-50 tracking-tight flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                {title}
              </h2>
              <button 
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-white hover:bg-[#241F1A] transition-colors focus:outline-none"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Body */}
            <div className={clsx(
              'text-surface-200 select-text flex-1 min-h-0',
              size === 'full' 
                ? 'overflow-hidden flex flex-col p-0' 
                : 'p-3 sm:p-5 md:p-6 overflow-y-auto pos-scrollbar'
            )}>
              {children}
            </div>
            
            {/* Footer */}
            {footer && (
              <div className="px-3.5 sm:px-6 py-2.5 sm:py-3.5 border-t border-[#322C26] bg-[#12110E] flex items-center justify-end gap-2.5 sm:gap-3 rounded-b-2xl flex-shrink-0 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}

