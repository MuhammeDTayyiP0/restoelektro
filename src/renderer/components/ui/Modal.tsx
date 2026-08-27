import React, { useEffect, useRef } from 'react'
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

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'w-[98vw] max-w-[1560px] h-[95vh] max-h-[95vh]',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden select-none">
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => closeOnOverlayClick && onClose()}
          />
          
          {/* Modal Container */}
          <motion.div 
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={clsx(
              'relative w-full bg-[#0D101A] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-[#1E2436] my-auto z-10',
              sizes[size]
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-[#1A1F30] bg-[#090B12] flex-shrink-0 shrink-0">
              <h2 className="text-sm sm:text-base font-semibold text-white tracking-tight flex items-center gap-2.5">
                <span className="w-2 h-2 rounded-full bg-brand-500" />
                {title}
              </h2>
              <button 
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-white hover:bg-[#1A1F30] transition-colors focus:outline-none"
                aria-label="Kapat"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Body */}
            <div className={clsx(
              'text-surface-200 select-text',
              size === 'full' 
                ? 'flex-1 min-h-0 overflow-hidden flex flex-col p-0' 
                : 'p-4 sm:p-6 overflow-y-auto pos-scrollbar max-h-[75vh]'
            )}>
              {children}
            </div>
            
            {/* Footer */}
            {footer && (
              <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-[#1A1F30] bg-[#090B12] flex items-center justify-end gap-3 rounded-b-2xl flex-shrink-0 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

