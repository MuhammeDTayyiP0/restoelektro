import React, { useState } from 'react'
import { clsx } from 'clsx'

export interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  content?: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTabId?: string
  activeTabId?: string
  onChange?: (tabId: string) => void
  variant?: 'line' | 'pills'
  fullWidth?: boolean
  className?: string
  contentClassName?: string
}

export function Tabs({
  tabs,
  defaultTabId,
  activeTabId: externalActiveTabId,
  onChange,
  variant = 'line',
  fullWidth = false,
  className,
  contentClassName
}: TabsProps) {
  
  const [internalActiveTabId, setInternalActiveTabId] = useState<string>(
    defaultTabId || (tabs.length > 0 ? tabs[0].id : '')
  )

  const activeTabId = externalActiveTabId !== undefined ? externalActiveTabId : internalActiveTabId

  const handleTabChange = (id: string) => {
    if (externalActiveTabId === undefined) {
      setInternalActiveTabId(id)
    }
    onChange?.(id)
  }

  const activeTabContent = tabs.find(t => t.id === activeTabId)?.content

  return (
    <div className={clsx('flex flex-col', className)}>
      <div 
        className={clsx(
          'flex overflow-x-auto pos-scrollbar no-select',
          variant === 'line' ? 'border-b border-surface-200 dark:border-surface-700' : 'gap-2 p-1 bg-surface-100 dark:bg-surface-800 rounded-pos-lg'
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          
          let tabClass = ''
          if (variant === 'line') {
            tabClass = clsx(
              'flex items-center justify-center gap-2 h-14 px-6 text-pos-base font-medium border-b-2 transition-colors min-w-[120px] touch-feedback',
              fullWidth && 'flex-1',
              isActive 
                ? 'border-brand-500 text-brand-600 dark:text-brand-400' 
                : 'border-transparent text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-200 hover:border-surface-300'
            )
          } else {
            tabClass = clsx(
              'flex items-center justify-center gap-2 h-12 px-5 text-pos-base font-medium rounded-pos transition-colors touch-feedback',
              fullWidth && 'flex-1',
              isActive
                ? 'bg-white dark:bg-surface-600 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700'
            )
          }

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={tabClass}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
      
      {activeTabContent && (
        <div className={clsx('flex-1 pt-4', contentClassName)}>
          {activeTabContent}
        </div>
      )}
    </div>
  )
}
