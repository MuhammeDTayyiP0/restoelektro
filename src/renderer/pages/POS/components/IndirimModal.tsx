import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Numpad } from '../../../components/ui/Numpad'
import { formatPara } from '../../../utils/formatters'
import { usePosStore } from '../../../stores/usePosStore'
import { useAuthStore } from '../../../stores/useAuthStore'
import { ipcInvoke } from '../../../hooks/useIPC'
import { HESAP_KANALLARI } from '../../../../common/ipc-channels'
import { useToast } from '../../../components/ui/Toast'
import { Percent, Banknote, Tag } from 'lucide-react'
import { clsx } from 'clsx'

interface IndirimModalProps {
  isOpen: boolean
  onClose: () => void
  toplamTutar: number
}

export const IndirimModal = React.memo(function IndirimModal({ isOpen, onClose, toplamTutar }: IndirimModalProps) {
  const { aktifHesap, hesapAyarla } = usePosStore()
  const { personel } = useAuthStore()
  const { success, error } = useToast()

  const [indirimTipi, setIndirimTipi] = useState<'yuzde' | 'tutar'>('yuzde')
  const [girilenDeger, setGirilenDeger] = useState<string>('')
  const [islemYapiliyor, setIslemYapiliyor] = useState(false)

  // Reset value when modal opens
  useEffect(() => {
    if (isOpen) {
      setGirilenDeger('')
      setIndirimTipi('yuzde')
    }
  }, [isOpen])

  const deger = parseFloat(girilenDeger) || 0

  const handleTutarGirisi = (tus: string) => {
    if (tus === 'C' || tus === 'clear') {
      setGirilenDeger('')
    } else if (tus === '⌫' || tus === 'backspace') {
      setGirilenDeger(prev => prev.slice(0, -1))
    } else if (tus === '.') {
      if (!girilenDeger.includes('.')) setGirilenDeger(prev => (prev || '0') + '.')
    } else {
      const base = (!girilenDeger || girilenDeger === '0') ? '' : girilenDeger
      const yeniDegerStr = base + tus
      const yeniNum = parseFloat(yeniDegerStr)
      // Yüzde indirimiyse 100'ü geçemez
      if (indirimTipi === 'yuzde') {
        if (!isNaN(yeniNum) && yeniNum > 100) {
          setGirilenDeger('100')
          return
        }
      }
      // Tutar indirimiyse toplam tutarı geçemez
      if (indirimTipi === 'tutar') {
        if (!isNaN(yeniNum) && yeniNum > toplamTutar) {
          setGirilenDeger(String(toplamTutar))
          return
        }
      }
      setGirilenDeger(yeniDegerStr)
    }
  }

  const hesaplananIndirim = indirimTipi === 'yuzde' 
    ? (toplamTutar * deger) / 100 
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
        aciklama: indirimTipi === 'yuzde' ? `%${deger} İndirim` : `${formatPara(deger)} İndirim`
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
      title="Adisyon İndirimi"
      size="lg"
    >
      <div 
        className="flex flex-col gap-2.5 sm:gap-3.5 bg-[#0E121B] text-slate-100 select-none overflow-hidden"
        style={{ transform: 'translateZ(0)' }}
      >
        
        {/* İndirim Tipi Seçici (Segmented Switcher) */}
        <div className="flex bg-[#090D15] p-1 rounded-xl sm:rounded-2xl border border-[#1E2638] flex-shrink-0 shrink-0">
          <button
            type="button"
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 rounded-lg sm:rounded-xl font-mono font-bold text-xs transition-all",
              indirimTipi === 'yuzde' 
                ? "bg-amber-500 text-black border border-amber-300" 
                : "text-slate-400 hover:text-slate-200 hover:bg-[#141926]"
            )}
            onClick={() => { setIndirimTipi('yuzde'); setGirilenDeger('') }}
          >
            <Percent size={16} /> YÜZDE (%) İNDİRİMİ
          </button>
          <button
            type="button"
            className={clsx(
              "flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 sm:py-2.5 px-3 rounded-lg sm:rounded-xl font-mono font-bold text-xs transition-all",
              indirimTipi === 'tutar' 
                ? "bg-amber-500 text-black border border-amber-300" 
                : "text-slate-400 hover:text-slate-200 hover:bg-[#141926]"
            )}
            onClick={() => { setIndirimTipi('tutar'); setGirilenDeger('') }}
          >
            <Banknote size={16} /> TUTAR (₺) İNDİRİMİ
          </button>
        </div>

        {/* Hızlı Önayar Butonları */}
        <div className="grid grid-cols-6 gap-1.5 sm:gap-2 flex-shrink-0 shrink-0">
          {indirimTipi === 'yuzde' ? (
            ['5', '10', '15', '20', '25', '50'].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setGirilenDeger(val)}
                className={clsx(
                  "h-8 sm:h-9 rounded-lg sm:rounded-xl font-mono text-xs font-bold border transition-colors active:scale-95 duration-100",
                  girilenDeger === val 
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50" 
                    : "bg-[#141926] text-slate-300 border-[#222C42] hover:bg-[#1C2336]"
                )}
              >
                %{val}
              </button>
            ))
          ) : (
            ['10', '25', '50', '100', '250', '500'].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setGirilenDeger(val)}
                className={clsx(
                  "h-8 sm:h-9 rounded-lg sm:rounded-xl font-mono text-xs font-bold border transition-colors active:scale-95 duration-100",
                  girilenDeger === val 
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50" 
                    : "bg-[#141926] text-slate-300 border-[#222C42] hover:bg-[#1C2336]"
                )}
              >
                {val}₺
              </button>
            ))
          )}
        </div>

        {/* Gösterge ve Numpad Bölümü */}
        <div className="flex flex-col md:flex-row gap-2.5 sm:gap-3.5 flex-shrink-0 shrink-0">
          
          {/* Sol Kolon: Finansal Göstergeler */}
          <div className="flex-1 flex flex-col justify-between bg-[#090D15] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#1E2638] gap-2.5 flex-shrink-0 shrink-0">
            
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Mevcut Adisyon Tutarı</span>
              <span className="text-sm sm:text-base font-bold text-slate-300 line-through tabular-nums">
                {formatPara(toplamTutar)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs font-mono text-rose-400">
              <span className="flex items-center gap-1">
                <Tag size={13} /> Uygulanacak İndirim
              </span>
              <span className="text-base sm:text-lg font-black tabular-nums">
                -{formatPara(hesaplananIndirim)}
              </span>
            </div>

            {/* Yeni Ödenecek Tutar (LED style) */}
            <div className="p-3 sm:p-3.5 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex flex-col justify-center shadow-inner">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
                YENİ ÖDENECEK NET TUTAR
              </span>
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-300 tabular-nums">
                {formatPara(yeniNetTutar)}
              </span>
            </div>
            
          </div>

          {/* Sağ Kolon: Giriş Kutusu & Numpad */}
          <div className="w-full md:w-72 flex-shrink-0 bg-[#090D15] p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-[#1E2638] flex flex-col items-center">
            <div className="mb-2 text-center w-full">
               <span className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider block mb-1">
                 {indirimTipi === 'yuzde' ? 'Yüzde Oranı' : 'İndirim Tutarı'}
               </span>
               <div className="relative w-full">
                 <input
                   key={indirimTipi}
                   type="text"
                   inputMode="decimal"
                   autoComplete="off"
                   autoFocus
                   placeholder="0"
                   value={girilenDeger}
                   onChange={(e) => {
                     let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '')
                     const parts = val.split('.')
                     if (parts.length > 2) {
                       val = parts[0] + '.' + parts.slice(1).join('')
                     }
                     if (val === '') {
                       setGirilenDeger('')
                       return
                     }
                     const num = parseFloat(val)
                     if (indirimTipi === 'yuzde' && !isNaN(num) && num > 100) {
                       setGirilenDeger('100')
                       return
                     }
                     if (indirimTipi === 'tutar' && !isNaN(num) && num > toplamTutar) {
                       setGirilenDeger(String(toplamTutar))
                       return
                     }
                     setGirilenDeger(val)
                   }}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       e.preventDefault()
                       indirimUygula()
                     }
                   }}
                   className="w-full h-11 sm:h-12 bg-[#0E131E] rounded-xl border border-[#222C42] text-center font-mono font-black text-2xl sm:text-3xl text-amber-400 shadow-inner px-8 focus:outline-none focus:border-amber-500 transition-colors"
                 />
                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-400 font-mono font-bold pointer-events-none">
                   {indirimTipi === 'yuzde' ? '%' : '₺'}
                 </span>
               </div>
            </div>

            <Numpad onKeyPress={handleTutarGirisi} onClear={() => setGirilenDeger('')} />
          </div>
        </div>

        {/* Alt Aksiyon Butonları */}
        <div className="flex justify-end gap-2.5 sm:gap-3 mt-1 pt-2.5 sm:pt-3 border-t border-[#1E2436] flex-shrink-0 shrink-0">
          <Button 
            variant="ghost" 
            size="md" 
            onClick={onClose}
            className="font-mono text-xs h-10 sm:h-11"
          >
            İptal
          </Button>
          <Button 
            variant="primary" 
            size="md" 
            className="px-6 sm:px-8 font-mono font-black text-xs h-10 sm:h-11 uppercase tracking-wider"
            onClick={indirimUygula}
            disabled={islemYapiliyor || deger <= 0}
          >
            {islemYapiliyor ? 'Uygulanıyor...' : 'İndirimi Uygula'}
          </Button>
        </div>

      </div>
    </Modal>
  )
})

export default IndirimModal
