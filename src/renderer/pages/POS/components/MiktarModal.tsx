import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Numpad } from '../../../components/ui/Numpad'
import { clsx } from 'clsx'
import { Hash } from 'lucide-react'

interface MiktarModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (miktar: number) => void
  maxMiktar: number
  urunAdi: string
  mevcutMiktar?: number
}

export const MiktarModal = React.memo(function MiktarModal({ isOpen, onClose, onConfirm, maxMiktar, urunAdi, mevcutMiktar = 0 }: MiktarModalProps) {
  const [girilenDeger, setGirilenDeger] = useState<string>(mevcutMiktar > 0 ? mevcutMiktar.toString() : '')
  const [hataAnimasyonu, setHataAnimasyonu] = useState(false)

  // Reset value when modal opens
  useEffect(() => {
    if (isOpen) {
      setGirilenDeger(mevcutMiktar > 0 ? mevcutMiktar.toString() : '')
    }
  }, [isOpen, mevcutMiktar])

  const handleTutarGirisi = (tus: string) => {
    setHataAnimasyonu(false);
    
    if (tus === 'C' || tus === 'clear') {
      setGirilenDeger('')
    } else if (tus === '⌫' || tus === 'backspace') {
      setGirilenDeger(prev => prev.slice(0, -1))
    } else if (tus === '.') {
      // Tam sayı miktar
    } else {
      const yeniDeger = (!girilenDeger || girilenDeger === '0') ? tus : girilenDeger + tus
      if (parseInt(yeniDeger, 10) > maxMiktar) {
        setHataAnimasyonu(true);
        setTimeout(() => setHataAnimasyonu(false), 400);
        return;
      }
      setGirilenDeger(yeniDeger)
    }
  }

  const handleConfirm = () => {
    const miktar = parseInt(girilenDeger, 10) || 0
    onConfirm(Math.min(Math.max(miktar, 0), maxMiktar))
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Miktar Belirle"
      size="md"
    >
      <div 
        className="relative z-50 isolate flex flex-col gap-2.5 sm:gap-3.5 bg-[#0E121B] text-slate-100 select-none overflow-hidden"
        style={{ transform: 'translateZ(0)' }}
      >
        
        {/* Ürün & Limit Bilgisi */}
        <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#141926] border border-[#222C42] flex-shrink-0 shrink-0">
          <div className="flex items-center gap-2">
            <Hash size={16} className="text-cyan-400" />
            <span className="font-mono text-xs sm:text-sm font-bold text-white truncate max-w-[200px]">
              {urunAdi}
            </span>
          </div>
          <span className={clsx(
            "font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg uppercase border transition-all",
            hataAnimasyonu 
              ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-shake" 
              : "bg-[#090D15] text-slate-400 border-[#1E2638]"
          )}>
            Maks: {maxMiktar} Adet
          </span>
        </div>

        {/* Hızlı Miktar Önayarları */}
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2 flex-shrink-0 shrink-0">
          {['1', '2', '3', '4', '5'].map(val => (
            <button
              key={val}
              type="button"
              disabled={parseInt(val, 10) > maxMiktar}
              onClick={() => setGirilenDeger(val)}
              className={clsx(
                "h-8 sm:h-9 rounded-lg sm:rounded-xl font-mono text-xs font-bold border transition-colors active:scale-95 duration-100",
                girilenDeger === val 
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50" 
                  : "bg-[#141926] text-slate-300 border-[#222C42] hover:bg-[#1C2336] disabled:opacity-30"
              )}
            >
              {val}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setGirilenDeger(maxMiktar.toString())}
            className={clsx(
              "h-8 sm:h-9 rounded-lg sm:rounded-xl font-mono text-xs font-bold border transition-colors active:scale-95 duration-100",
              girilenDeger === maxMiktar.toString()
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                : "bg-[#141926] text-amber-400 border-[#222C42] hover:bg-[#1C2336]"
            )}
          >
            Tümü
          </button>
        </div>

        {/* Dijital Gösterge ve Numpad */}
        <div className="bg-[#090D15] p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-[#1E2436] flex flex-col items-center justify-center mx-auto w-full max-w-xs shadow-inner flex-shrink-0 shrink-0">
          <div className="mb-2 text-center w-full">
            <input
              key={urunAdi || 'miktar-input'}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              autoFocus
              placeholder="0"
              value={girilenDeger}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '')
                if (val === '') {
                  setGirilenDeger('')
                  return
                }
                const num = parseInt(val, 10)
                if (!isNaN(num) && num > maxMiktar) {
                  setHataAnimasyonu(true)
                  setTimeout(() => setHataAnimasyonu(false), 400)
                  setGirilenDeger(String(maxMiktar))
                  return
                }
                setGirilenDeger(val)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleConfirm()
                }
              }}
              className="w-full h-12 sm:h-14 text-center bg-[#0E131E] rounded-xl border border-[#222C42] font-mono font-black text-2xl sm:text-3xl text-cyan-400 shadow-inner focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <Numpad onKeyPress={handleTutarGirisi} onClear={() => setGirilenDeger('')} />
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex justify-end gap-2.5 sm:gap-3 mt-1 pt-2.5 sm:pt-3 border-t border-[#1E2436] flex-shrink-0 shrink-0">
          <Button 
            variant="ghost" 
            size="md" 
            onClick={onClose} 
            className="flex-1 font-mono text-xs h-10 sm:h-11"
          >
            İptal
          </Button>
          <Button 
            variant="primary" 
            size="md" 
            className="flex-1 font-mono font-bold text-xs h-10 sm:h-11 uppercase tracking-wider"
            onClick={handleConfirm}
          >
            Onayla
          </Button>
        </div>
      </div>
    </Modal>
  )
})

export default MiktarModal
