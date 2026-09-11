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
    <div className={clsx('w-full max-w-sm flex flex-col gap-1.5 sm:gap-2.5 select-none flex-shrink-0 shrink-0', className)}>
      {showDisplay && (
        <div className="bg-[#0B0A08] h-12 sm:h-14 2xl:h-16 rounded-xl flex items-center justify-end px-4 sm:px-5 border border-[#322C26] shadow-inner mb-1 flex-shrink-0">
          <span className="text-xl sm:text-2xl font-bold font-mono text-white tracking-widest truncate">
            {value || '0'}
          </span>
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 2xl:gap-2.5">
        {layout.map((row, rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            {row.map((key) => {
              const isClear = key === 'C'
              const isBackspace = key === '⌫'
              
              return (
                <motion.button
                  key={key}
                  type="button"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.94, y: 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                  onClick={() => {
                    if (isClear) {
                      if (onClear) onClear()
                      else onKeyPress('C')
                    } else {
                      onKeyPress(key)
                    }
                  }}
                  className={clsx(
                    'pos-numpad-btn h-11 sm:h-12 md:h-14 xl:h-14 2xl:h-16 rounded-xl flex items-center justify-center font-mono text-lg sm:text-xl xl:text-2xl font-bold border transition-colors shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-500/50 touch-feedback relative overflow-hidden',
                    row.length === 1 && 'col-span-3',
                    isClear
                      ? 'bg-rose-950/30 hover:bg-rose-900/40 text-rose-400 border-rose-900/50 active:bg-rose-900/60 shadow-inner'
                      : isBackspace
                      ? 'bg-[#1e1a16] hover:bg-[#322C26] text-surface-200 border-[#403830] active:bg-[#403830]'
                      : 'bg-[#1e1a16] hover:bg-[#241F1A] text-white border-[#3A342C] active:bg-[#3A342C] hover:border-brand-500/40'
                  )}
                  aria-label={isBackspace ? 'Sil' : isClear ? 'Temizle' : `Tuş ${key}`}
                >
                  {/* Üst kenar hafif ışık yansıması (mekanik tuş hissi) */}
                  <span className="absolute inset-x-0 top-0 h-[1px] bg-white/[0.08]" />
                  {isBackspace ? <Delete size={20} className="mx-auto text-surface-300" /> : key}
                </motion.button>
              )
            })}
          </React.Fragment>
        ))}
      </div>
      
      {actionButton && (
        <div className="mt-1 flex-shrink-0 shrink-0">
          {actionButton}
        </div>
      )}
    </div>
  )
})


