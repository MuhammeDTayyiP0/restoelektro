import React, { useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { X } from 'lucide-react'
import { Button } from './Button'

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

  if (!isOpen) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-[95vw] h-[95vh]',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => closeOnOverlayClick && onClose()}
      />
      
      {/* Modal Content */}
      <div 
        ref={modalRef}
        className={clsx(
          'relative w-full bg-white dark:bg-surface-900 rounded-pos-lg shadow-pos-lg flex flex-col overflow-hidden animate-scale-in border border-surface-200 dark:border-surface-800 m-4',
          sizes[size],
          size === 'full' && 'max-h-[95vh]'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-950">
          <h2 className="text-pos-lg font-semibold text-surface-900 dark:text-surface-100">
            {title}
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="rounded-full w-10 h-10 p-0"
            aria-label="Kapat"
          >
            <X size={24} />
          </Button>
        </div>
        
        {/* Body */}
        <div className={clsx(
          'p-6 overflow-y-auto pos-scrollbar',
          size === 'full' ? 'flex-1' : 'max-h-[70vh]'
        )}>
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-surface-100 dark:border-surface-800 bg-surface-50 dark:bg-surface-950 flex justify-end gap-3 rounded-b-pos-lg">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
