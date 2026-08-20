import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Numpad } from '../../../components/ui/Numpad'

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

  // Reset value when modal opens
  useEffect(() => {
    if (isOpen) {
      setGirilenDeger(mevcutMiktar > 0 ? mevcutMiktar.toString() : '')
    }
  }, [isOpen, mevcutMiktar])

  const handleTutarGirisi = (tus: string) => {
    if (tus === 'C' || tus === 'clear') {
      setGirilenDeger('')
    } else if (tus === '⌫' || tus === 'backspace') {
      setGirilenDeger(prev => prev.slice(0, -1))
    } else if (tus === '.') {
      // Miktar için ondalık girmeye gerek yok ama porsiyon vs desteklenecekse eklenebilir. 
      // Şimdilik sadece tam sayı
    } else {
      const yeniDeger = girilenDeger + tus
      if (parseInt(yeniDeger) > maxMiktar) return // Maksimum sınırı geçmesini engelle
      setGirilenDeger(yeniDeger)
    }
  }

  const handleConfirm = () => {
    const miktar = parseInt(girilenDeger) || 0
    onConfirm(Math.min(Math.max(miktar, 0), maxMiktar))
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Miktar Girin"
      size="md"
    >
      <div className="flex flex-col gap-6 p-2">
        <div className="text-center mb-2">
          <p className="text-surface-500 font-medium mb-1">Ürün</p>
          <h4 className="text-xl font-bold text-surface-900 dark:text-white">{urunAdi}</h4>
          <p className="text-sm text-surface-400 mt-1">Maksimum seçilebilir: {maxMiktar}</p>
        </div>

        <div className="bg-surface-50 dark:bg-surface-900 p-4 rounded-3xl border border-surface-200 dark:border-surface-800 flex flex-col items-center justify-center mx-auto w-72">
          <div className="mb-4 text-center w-full">
             <div className="text-5xl font-black text-brand-600 dark:text-brand-400 h-16 flex items-center justify-center bg-white dark:bg-surface-950 rounded-2xl border border-surface-200 dark:border-surface-700 shadow-inner">
               {girilenDeger || '0'}
             </div>
          </div>
          <Numpad onKeyPress={handleTutarGirisi} />
        </div>

        <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-surface-200 dark:border-surface-800">
          <Button variant="ghost" size="lg" onClick={onClose} className="flex-1">İptal</Button>
          <Button 
            variant="primary" 
            size="lg" 
            className="flex-1 font-bold text-lg"
            onClick={handleConfirm}
          >
            Onayla
          </Button>
        </div>
      </div>
    </Modal>
  )
}
