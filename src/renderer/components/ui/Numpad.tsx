import React from 'react'
import { NUMPAD_TUSLARI } from '../../utils/constants'
import { clsx } from 'clsx'
import { Delete } from 'lucide-react'
import { motion } from 'framer-motion'

interface NumpadProps {
  onKeyPress: (key: string) => void
  onClear?: () => void
  value?: string
  layout?: string[][] // Custom layout if needed
  className?: string
  showDisplay?: boolean // Eğer Numpad kendi ekranını göstersin istenirse
  actionButton?: React.ReactNode // 'Tamam' veya 'Ekle' gibi ekstra bir buton
}

export const Numpad = React.memo(function Numpad({
  onKeyPress,
  onClear,
  value = '',
  layout = NUMPAD_TUSLARI,
  className,
  showDisplay = false,
  actionButton
}: NumpadProps) {
  
  return (
    <div className={clsx('w-full max-w-sm flex flex-col gap-2.5 select-none', className)}>
      {showDisplay && (
        <div className="bg-[#090B11] h-16 rounded-xl flex items-center justify-end px-5 border border-[#1E2333] shadow-inner mb-1">
          <span className="text-2xl font-bold font-mono text-white tracking-widest truncate">
            {value || '0'}
          </span>
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-2.5">
        {layout.map((row, rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            {row.map((key) => {
              const isClear = key === 'C'
              const isBackspace = key === '⌫'
              
              return (
                <motion.button
                  key={key}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.93, y: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  onClick={() => {
                    if (isClear) {
                      if (onClear) onClear()
                      else onKeyPress('C')
                    } else {
                      onKeyPress(key)
                    }
                  }}
                  className={clsx(
                    'h-14 sm:h-16 rounded-xl flex items-center justify-center font-mono text-xl sm:text-2xl font-semibold border transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-500/50',
                    row.length === 1 && 'col-span-3',
                    isClear
                      ? 'bg-red-950/30 hover:bg-red-900/40 text-red-400 border-red-900/50 active:bg-red-900/60'
                      : isBackspace
                      ? 'bg-[#141824] hover:bg-[#1D2233] text-surface-300 border-[#222738] active:bg-[#252C42]'
                      : 'bg-[#121520] hover:bg-[#1A1F30] text-white border-[#1E2334] active:bg-[#242A42] hover:border-brand-500/30'
                  )}
                  aria-label={isBackspace ? 'Sil' : isClear ? 'Temizle' : `Tuş ${key}`}
                >
                  {isBackspace ? <Delete size={22} className="mx-auto" /> : key}
                </motion.button>
              )
            })}
          </React.Fragment>
        ))}
      </div>
      
      {actionButton && (
        <div className="mt-1">
          {actionButton}
        </div>
      )}
    </div>
  )
})

