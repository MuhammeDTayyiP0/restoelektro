import React from 'react'
import { Maximize, Minimize, Minus, X } from 'lucide-react'
import { clsx } from 'clsx'

interface WindowControlsProps {
  className?: string
  compact?: boolean
}

export function WindowControls({ className, compact = false }: WindowControlsProps) {
  const [tamEkran, setTamEkran] = React.useState(false)
  const size = compact ? 'w-8 h-8' : 'w-9 h-9'

  const handleTamEkran = async () => {
    try {
      // @ts-ignore
      const durum = await window.api.pencere.tamEkran()
      setTamEkran(Boolean(durum))
    } catch (e) {
      console.error('Tam ekran hatası', e)
    }
  }

  const handleKucult = async () => {
    try {
      // @ts-ignore
      await window.api.pencere.kucult()
    } catch (e) {
      console.error('Küçültme hatası', e)
    }
  }

  const handleKapat = async () => {
    try {
      // @ts-ignore
      await window.api.pencere.kapat()
    } catch (e) {
      console.error('Kapatma hatası', e)
    }
  }

  return (
    <div
      className={clsx('flex items-center gap-1', className)}
      style={{ WebkitAppRegion: 'no-drag' } as any}
    >
      <button
        type="button"
        onClick={handleKucult}
        className={clsx(size, 'flex items-center justify-center text-surface-400 hover:text-white hover:bg-[#241F1A] border border-transparent hover:border-[#322C26] rounded-lg touch-feedback')}
        title="Küçült"
        aria-label="Küçült"
      >
        <Minus size={16} />
      </button>
      <button
        type="button"
        onClick={handleTamEkran}
        className={clsx(size, 'flex items-center justify-center text-surface-400 hover:text-white hover:bg-[#241F1A] border border-transparent hover:border-[#322C26] rounded-lg touch-feedback')}
        title="Tam Ekran"
        aria-label="Tam Ekran"
      >
        {tamEkran ? <Minimize size={16} /> : <Maximize size={16} />}
      </button>
      <button
        type="button"
        onClick={handleKapat}
        className={clsx(size, 'flex items-center justify-center text-surface-400 hover:text-white hover:bg-rose-600 border border-transparent hover:border-rose-500 rounded-lg touch-feedback transition-colors')}
        title="Arka Plana Gizle (Tepsiye Küçült)"
        aria-label="Kapat"
      >
        <X size={17} />
      </button>
    </div>
  )
}
