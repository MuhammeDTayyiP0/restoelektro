import React, { useState } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Numpad } from '../../../components/ui/Numpad'
import { formatPara } from '../../../utils/formatters'
import { usePosStore } from '../../../stores/usePosStore'
import { useAuthStore } from '../../../stores/useAuthStore'
import { useIPC, ipcInvoke } from '../../../hooks/useIPC'
import { HESAP_KANALLARI } from '../../../../common/ipc-channels'
import { useToast } from '../../../components/ui/Toast'
import { Percent, Banknote } from 'lucide-react'
import { clsx } from 'clsx'

interface IndirimModalProps {
  isOpen: boolean
  onClose: () => void
  toplamTutar: number
}

export default function IndirimModal({ isOpen, onClose, toplamTutar }: IndirimModalProps) {
  const { aktifHesap, hesapAyarla } = usePosStore()
  const { personel } = useAuthStore()
  const { success, error } = useToast()

  const [indirimTipi, setIndirimTipi] = useState<'yuzde' | 'tutar'>('yuzde')
  const [girilenDeger, setGirilenDeger] = useState<string>('')
  const [islemYapiliyor, setIslemYapiliyor] = useState(false)

  const deger = parseFloat(girilenDeger) || 0

  const handleTutarGirisi = (tus: string) => {
    if (tus === 'C' || tus === 'clear') {
      setGirilenDeger('')
    } else if (tus === '⌫' || tus === 'backspace') {
      setGirilenDeger(prev => prev.slice(0, -1))
    } else if (tus === '.') {
      if (!girilenDeger.includes('.')) setGirilenDeger(prev => prev + '.')
    } else {
      // Yüzde indirimiyse 100'ü geçemez
      if (indirimTipi === 'yuzde') {
        const yeniDeger = parseFloat(girilenDeger + tus)
        if (yeniDeger > 100) return
      }
      // Tutar indirimiyse toplam tutarı geçemez
      if (indirimTipi === 'tutar') {
        const yeniDeger = parseFloat(girilenDeger + tus)
        if (yeniDeger > toplamTutar) return
      }
      setGirilenDeger(prev => prev + tus)
    }
  }

  const hesaplananIndirim = indirimTipi === 'yuzde' 
    ? toplamTutar * (deger / 100) 
    : deger
  
  const yeniNetTutar = Math.max(0, toplamTutar - hesaplananIndirim)

  const indirimUygula = async () => {
    if (!aktifHesap) return
    if (deger <= 0) {
      error('Uyarı', 'Geçerli bir indirim değeri girin.')
      return
    }

    setIslemYapiliyor(true)
    try {
      const response = await ipcInvoke<any>(HESAP_KANALLARI.INDIRIM_UYGULA, {
        hesap_id: aktifHesap.id,
        indirim_tipi: indirimTipi,
        deger: deger,
        aciklama: indirimTipi === 'yuzde' ? `%${deger} İndirim` : `${deger} TL İndirim`
      })

      if (response && response.basarili) {
        success('İndirim Uygulandı', `Yeni toplam: ${formatPara(response.net_tutar)}`)
        
        // Hesabı güncelle
        const guncelHesap = await ipcInvoke<any>(HESAP_KANALLARI.DETAY, aktifHesap.id)
        hesapAyarla(guncelHesap, guncelHesap.masa_id)
        
        onClose()
      } else {
        error('Hata', response.hata || 'İndirim uygulanamadı')
      }
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setIslemYapiliyor(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="İndirim Uygula"
      size="lg"
    >
      <div className="flex flex-col gap-6 p-2">
        
        {/* İndirim Tipi Seçimi */}
        <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-2xl">
          <button
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all",
              indirimTipi === 'yuzde' 
                ? "bg-white dark:bg-surface-900 shadow-sm text-brand-600 dark:text-brand-400" 
                : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
            )}
            onClick={() => { setIndirimTipi('yuzde'); setGirilenDeger('') }}
          >
            <Percent size={20} /> Yüzde İndirimi
          </button>
          <button
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold transition-all",
              indirimTipi === 'tutar' 
                ? "bg-white dark:bg-surface-900 shadow-sm text-brand-600 dark:text-brand-400" 
                : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
            )}
            onClick={() => { setIndirimTipi('tutar'); setGirilenDeger('') }}
          >
            <Banknote size={20} /> Tutar İndirimi
          </button>
        </div>

        {/* Gösterge ve Numpad */}
        <div className="flex gap-6">
          <div className="flex-1 flex flex-col justify-center">
            
            <div className="mb-6">
              <span className="text-surface-500 font-medium block mb-2">Genel Toplam</span>
              <span className="text-2xl font-bold line-through text-surface-400">{formatPara(toplamTutar)}</span>
            </div>

            <div className="mb-6">
              <span className="text-surface-500 font-medium block mb-2">İndirim Tutarı</span>
              <span className="text-3xl font-bold text-red-500">
                -{formatPara(hesaplananIndirim)}
              </span>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
              <span className="text-green-700 dark:text-green-400 font-medium block mb-1">Yeni Ödenecek Tutar</span>
              <span className="text-4xl font-black text-green-700 dark:text-green-400">
                {formatPara(yeniNetTutar)}
              </span>
            </div>
            
          </div>

          <div className="w-72 flex-shrink-0 bg-surface-50 dark:bg-surface-900 p-4 rounded-3xl border border-surface-200 dark:border-surface-800">
            <div className="mb-4 text-center">
               <span className="text-surface-500 text-sm font-bold uppercase tracking-wider block mb-1">
                 {indirimTipi === 'yuzde' ? 'Yüzde Girin' : 'Tutar Girin'}
               </span>
               <div className="text-4xl font-black text-surface-900 dark:text-white h-12 flex items-center justify-center">
                 {girilenDeger || '0'}
                 <span className="text-2xl text-surface-400 ml-1">
                   {indirimTipi === 'yuzde' ? '%' : '₺'}
                 </span>
               </div>
            </div>
            <Numpad onKeyPress={handleTutarGirisi} />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-surface-200 dark:border-surface-800">
          <Button variant="ghost" size="lg" onClick={onClose}>İptal</Button>
          <Button 
            variant="primary" 
            size="lg" 
            className="px-8 font-bold text-lg"
            onClick={indirimUygula}
            disabled={islemYapiliyor || deger <= 0}
          >
            {islemYapiliyor ? 'Uygulanıyor...' : 'İndirimi Uygula'}
          </Button>
        </div>

      </div>
    </Modal>
  )
}
