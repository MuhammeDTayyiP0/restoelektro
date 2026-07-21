import React from 'react'
import { clsx } from 'clsx'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  glass?: boolean
}

export function Card({ 
  children, 
  className, 
  padding = 'md',
  glass = false,
  ...props 
}: CardProps) {
  
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8',
  }
  
  const classes = clsx(
    'rounded-pos-lg overflow-hidden shadow-pos',
    glass 
      ? 'glass-panel' 
      : 'bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800',
    paddings[padding],
    className
  )
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  )
}
