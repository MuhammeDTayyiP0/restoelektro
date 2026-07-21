import React from 'react'
import { clsx, type ClassValue } from 'clsx'

// Dokunmatik ekran için optimize edilmiş ortak Button bileşeni
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'pos'
  fullWidth?: boolean
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  className?: ClassValue
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: ButtonProps) {
  
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-pos touch-feedback'
  
  const variants = {
    primary: 'bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500 border border-transparent shadow-pos',
    secondary: 'bg-surface-200 text-surface-900 hover:bg-surface-300 dark:bg-surface-800 dark:text-surface-100 dark:hover:bg-surface-700 focus:ring-surface-500 border border-transparent',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 border border-transparent shadow-pos',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-500 border border-transparent shadow-pos',
    outline: 'bg-transparent text-brand-500 border-2 border-brand-500 hover:bg-brand-50 focus:ring-brand-500 dark:text-brand-400 dark:border-brand-400 dark:hover:bg-brand-950',
    ghost: 'bg-transparent text-surface-700 hover:bg-surface-100 dark:text-surface-300 dark:hover:bg-surface-800 focus:ring-surface-500',
  }
  
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-4 text-base min-h-touch', // Min touch target
    lg: 'h-14 px-6 text-pos-lg min-h-touch-lg rounded-pos-lg',
    xl: 'h-16 px-8 text-pos-xl min-h-touch-xl rounded-pos-xl',
    pos: 'h-20 px-8 text-pos-2xl rounded-pos-xl font-bold shadow-pos-lg', // Büyük POS butonu (Örn: Ödeme Al)
  }

  const classes = clsx(
    baseStyles,
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className
  )

  return (
    <button className={classes} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : leftIcon ? (
        <span className="mr-2">{leftIcon}</span>
      ) : null}
      
      {children}
      
      {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
    </button>
  )
}
