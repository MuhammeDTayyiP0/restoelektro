import React, { useState } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Numpad } from '../../../components/ui/Numpad'
import { formatPara } from '../../../utils/formatters'
import { usePosStore } from '../../../stores/usePosStore'
import { useAuthStore } from '../../../stores/useAuthStore'
import { ipcInvoke } from '../../../hooks/useIPC'
import { HESAP_KANALLARI } from '../../../../common/ipc-channels'
import { useToast } from '../../../components/ui/Toast'
import { Percent, Banknote, Tag, Check, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

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
      setGirilenDeger(prev => prev === '0' ? tus : prev + tus)
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
      <div className="flex flex-col gap-4 p-2 bg-[#0E121B] text-slate-100 -m-6 p-6 select-none">
        
        {/* İndirim Tipi Seçici (Segmented Switcher) */}
        <div className="flex bg-[#090D15] p-1 rounded-2xl border border-[#1E2638]">
          <button
            type="button"
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-mono font-bold text-xs transition-all",
              indirimTipi === 'yuzde' 
                ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] border border-amber-300" 
                : "text-slate-400 hover:text-slate-200 hover:bg-[#141926]"
            )}
            onClick={() => { setIndirimTipi('yuzde'); setGirilenDeger('') }}
          >
            <Percent size={18} /> YÜZDE (%) İNDİRİMİ
          </button>
          <button
            type="button"
            className={clsx(
              "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-mono font-bold text-xs transition-all",
              indirimTipi === 'tutar' 
                ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)] border border-amber-300" 
                : "text-slate-400 hover:text-slate-200 hover:bg-[#141926]"
            )}
            onClick={() => { setIndirimTipi('tutar'); setGirilenDeger('') }}
          >
            <Banknote size={18} /> TUTAR (₺) İNDİRİMİ
          </button>
        </div>

        {/* Hızlı Önayar Butonları */}
        <div className="grid grid-cols-6 gap-2">
          {indirimTipi === 'yuzde' ? (
            ['5', '10', '15', '20', '25', '50'].map(val => (
              <motion.button
                key={val}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setGirilenDeger(val)}
                className={clsx(
                  "h-10 rounded-xl font-mono text-xs font-bold border transition-colors",
                  girilenDeger === val 
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50" 
                    : "bg-[#141926] text-slate-300 border-[#222C42] hover:bg-[#1C2336]"
                )}
              >
                %{val}
              </motion.button>
            ))
          ) : (
            ['10', '25', '50', '100', '250', '500'].map(val => (
              <motion.button
                key={val}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setGirilenDeger(val)}
                className={clsx(
                  "h-10 rounded-xl font-mono text-xs font-bold border transition-colors",
                  girilenDeger === val 
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50" 
                    : "bg-[#141926] text-slate-300 border-[#222C42] hover:bg-[#1C2336]"
                )}
              >
                {val}₺
              </motion.button>
            ))
          )}
        </div>

        {/* Gösterge ve Numpad Bölümü */}
        <div className="flex flex-col md:flex-row gap-4">
          
          {/* Sol Kolon: Finansal Göstergeler */}
          <div className="flex-1 flex flex-col justify-between bg-[#090D15] p-4 rounded-2xl border border-[#1E2638] gap-3">
            
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Mevcut Adisyon Tutarı</span>
              <span className="text-base font-bold text-slate-300 line-through tabular-nums">
                {formatPara(toplamTutar)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs font-mono text-rose-400">
              <span className="flex items-center gap-1">
                <Tag size={14} /> Uygulanacak İndirim
              </span>
              <span className="text-xl font-black tabular-nums">
                -{formatPara(hesaplananIndirim)}
              </span>
            </div>

            {/* Yeni Ödenecek Tutar (LED style) */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl flex flex-col justify-center shadow-inner">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-0.5">
                YENİ ÖDENECEK NET TUTAR
              </span>
              <span className="text-3xl font-black font-mono text-emerald-300 tabular-nums">
                {formatPara(yeniNetTutar)}
              </span>
            </div>
            
          </div>

          {/* Sağ Kolon: Giriş Kutusu & Numpad */}
          <div className="w-full md:w-72 flex-shrink-0 bg-[#090D15] p-4 rounded-2xl border border-[#1E2638] flex flex-col items-center">
            <div className="mb-3 text-center w-full">
               <span className="text-slate-400 text-[10px] font-mono font-bold uppercase tracking-wider block mb-1">
                 {indirimTipi === 'yuzde' ? 'Yüzde Oranı' : 'İndirim Tutarı'}
               </span>
               <div className="h-14 bg-[#0E131E] rounded-xl border border-[#222C42] flex items-center justify-center font-mono font-black text-3xl text-amber-400 shadow-inner px-3">
                 {girilenDeger || '0'}
                 <span className="text-xl text-slate-400 ml-1">
                   {indirimTipi === 'yuzde' ? '%' : '₺'}
                 </span>
               </div>
            </div>

            <Numpad onKeyPress={handleTutarGirisi} onClear={() => setGirilenDeger('')} />
          </div>
        </div>

        {/* Alt Aksiyon Butonları */}
        <div className="flex justify-end gap-3 mt-2 pt-3 border-t border-[#1E2436]">
          <Button 
            variant="ghost" 
            size="lg" 
            onClick={onClose}
            className="font-mono text-xs"
          >
            İptal
          </Button>
          <Button 
            variant="primary" 
            size="lg" 
            className="px-8 font-mono font-black text-xs h-12 uppercase tracking-wider"
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
