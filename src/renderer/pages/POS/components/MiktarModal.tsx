import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Numpad } from '../../../components/ui/Numpad'
import { clsx } from 'clsx'
import { Hash, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

interface MiktarModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (miktar: number) => void
  maxMiktar: number
  urunAdi: string
  mevcutMiktar?: number
}

export default function MiktarModal({ isOpen, onClose, onConfirm, maxMiktar, urunAdi, mevcutMiktar = 0 }: MiktarModalProps) {
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
      const yeniDeger = girilenDeger === '0' ? tus : girilenDeger + tus
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
      <div className="flex flex-col gap-4 p-2 bg-[#0E121B] text-slate-100 -m-6 p-6 select-none">
        
        {/* Ürün & Limit Bilgisi */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#141926] border border-[#222C42]">
          <div className="flex items-center gap-2.5">
            <Hash size={18} className="text-cyan-400" />
            <span className="font-mono text-sm font-bold text-white truncate max-w-[200px]">
              {urunAdi}
            </span>
          </div>
          <span className={clsx(
            "font-mono text-xs font-bold px-2.5 py-1 rounded-lg uppercase border transition-all",
            hataAnimasyonu 
              ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-shake" 
              : "bg-[#090D15] text-slate-400 border-[#1E2638]"
          )}>
            Maks: {maxMiktar} Adet
          </span>
        </div>

        {/* Hızlı Miktar Önayarları */}
        <div className="grid grid-cols-6 gap-2">
          {['1', '2', '3', '4', '5'].map(val => (
            <motion.button
              key={val}
              whileTap={{ scale: 0.95 }}
              type="button"
              disabled={parseInt(val, 10) > maxMiktar}
              onClick={() => setGirilenDeger(val)}
              className={clsx(
                "h-10 rounded-xl font-mono text-xs font-bold border transition-colors",
                girilenDeger === val 
                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50" 
                  : "bg-[#141926] text-slate-300 border-[#222C42] hover:bg-[#1C2336] disabled:opacity-30"
              )}
            >
              {val}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setGirilenDeger(maxMiktar.toString())}
            className={clsx(
              "h-10 rounded-xl font-mono text-xs font-bold border transition-colors",
              girilenDeger === maxMiktar.toString()
                ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                : "bg-[#141926] text-amber-400 border-[#222C42] hover:bg-[#1C2336]"
            )}
          >
            Tümü
          </motion.button>
        </div>

        {/* Dijital Gösterge ve Numpad */}
        <div className="bg-[#090D15] p-4 rounded-2xl border border-[#1E2436] flex flex-col items-center justify-center mx-auto w-full max-w-xs shadow-inner">
          <div className="mb-3 text-center w-full">
             <div className="h-16 flex items-center justify-center bg-[#0E131E] rounded-xl border border-[#222C42] font-mono font-black text-4xl text-cyan-400 shadow-inner">
               {girilenDeger || '0'}
             </div>
          </div>
          <Numpad onKeyPress={handleTutarGirisi} onClear={() => setGirilenDeger('0')} />
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex justify-end gap-3 mt-1 pt-3 border-t border-[#1E2436]">
          <Button 
            variant="ghost" 
            size="lg" 
            onClick={onClose} 
            className="flex-1 font-mono text-xs"
          >
            İptal
          </Button>
          <Button 
            variant="primary" 
            size="lg" 
            className="flex-1 font-mono font-bold text-xs h-12 uppercase tracking-wider"
            onClick={handleConfirm}
          >
            Onayla
          </Button>
        </div>
      </div>
    </Modal>
  )
}
