import React from 'react'
import { Search, X } from 'lucide-react'
import { clsx } from 'clsx'

interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  containerClassName?: string
}

export function SearchInput({
  value,
  onChange,
  onClear,
  containerClassName,
  className,
  placeholder = 'Ara...',
  ...props
}: SearchInputProps) {
  
  return (
    <div className={clsx('relative flex items-center w-full', containerClassName)}>
      <div className="absolute left-3 text-surface-400">
        <Search size={20} />
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={clsx(
          'w-full h-12 pl-10 pr-10 rounded-pos bg-white dark:bg-surface-900 border border-surface-300 dark:border-surface-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-surface-900 dark:text-white transition-colors placeholder:text-surface-400',
          className
        )}
        {...props}
      />
      
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('')
            onClear?.()
          }}
          className="absolute right-2 p-1.5 text-surface-400 hover:text-surface-700 dark:hover:text-surface-200 rounded-full hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}
