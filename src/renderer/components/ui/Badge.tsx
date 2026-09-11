import React from 'react'
import { clsx } from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md',
  className 
}: BadgeProps) {
  
  const variants = {
    default: 'bg-surface-200 text-surface-800 dark:bg-surface-800 dark:text-surface-200',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50',
    danger: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-800/50',
    info: 'bg-brand-100 text-brand-800 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800/50',
    outline: 'bg-transparent text-surface-600 dark:text-surface-400 border border-surface-300 dark:border-surface-600',
  }
  
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  }
  
  return (
    <span className={clsx(
      'inline-flex items-center justify-center font-medium rounded-full',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  )
}
