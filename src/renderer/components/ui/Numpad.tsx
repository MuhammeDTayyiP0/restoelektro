import React from 'react'
import { NUMPAD_TUSLARI } from '../../utils/constants'
import { Button } from './Button'
import { clsx } from 'clsx'
import { Delete } from 'lucide-react'

interface NumpadProps {
  onKeyPress: (key: string) => void
  onClear?: () => void
  value?: string
  layout?: string[][] // Custom layout if needed
  className?: string
  showDisplay?: boolean // Eğer Numpad kendi ekranını göstersin istenirse
  actionButton?: React.ReactNode // 'Tamam' veya 'Ekle' gibi ekstra bir buton
}

export function Numpad({
  onKeyPress,
  onClear,
  value = '',
  layout = NUMPAD_TUSLARI,
  className,
  showDisplay = false,
  actionButton
}: NumpadProps) {
  
  return (
    <div className={clsx('w-full max-w-sm flex flex-col gap-3', className)}>
      {showDisplay && (
        <div className="bg-surface-100 dark:bg-surface-900 h-16 rounded-pos flex items-center justify-end px-4 border border-surface-200 dark:border-surface-800 mb-2">
          <span className="text-pos-2xl font-bold font-mono tracking-wider truncate">
            {value || '0'}
          </span>
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-2">
        {layout.map((row, rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            {row.map((key) => {
              const isClear = key === 'C'
              const isBackspace = key === '⌫'
              
              return (
                <Button
                  key={key}
                  variant={isClear ? 'danger' : isBackspace ? 'secondary' : 'outline'}
                  size="xl"
                  onClick={() => {
                    if (isClear) {
                      if (onClear) onClear()
                      else onKeyPress('C')
                    }
                    else onKeyPress(key)
                  }}
                  className={clsx(
                    'text-pos-xl font-medium',
                    !isClear && !isBackspace && 'bg-white dark:bg-surface-800'
                  )}
                >
                  {isBackspace ? <Delete size={24} className="mx-auto" /> : key}
                </Button>
              )
            })}
          </React.Fragment>
        ))}
      </div>
      
      {actionButton && (
        <div className="mt-2">
          {actionButton}
        </div>
      )}
    </div>
  )
}
