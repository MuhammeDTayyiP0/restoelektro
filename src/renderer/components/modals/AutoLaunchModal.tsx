import React, { useState } from 'react'
import { Modal } from '../ui/Modal'
import { useToast } from '../ui/Toast'
import { ipcInvoke } from '../../hooks/useIPC'
import { UYGULAMA_KANALLARI } from '../../../common/ipc-channels'
import { Power, Zap, Wifi, ShieldCheck, Check, X } from 'lucide-react'
import { motion } from 'framer-motion'

interface AutoLaunchModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AutoLaunchModal({ isOpen, onClose }: AutoLaunchModalProps) {
  const { success, error } = useToast()
  const [yukleniyor, setYukleniyor] = useState(false)

  const handleKarar = async (etkinlestir: boolean) => {
    setYukleniyor(true)
    try {
      localStorage.setItem('etibol_auto_launch_prompted', 'true')
      
      const res = (await ipcInvoke(
        UYGULAMA_KANALLARI.OTOMATIK_BASLATMA_AYARLA,
        etkinlestir
      )) as any

      if (res && res.basarili) {
        if (etkinlestir) {
          success(
            'Otomatik Başlatma Aktif Edildi',
            'ETİBOL POS, Windows açılışında arka planda hazır başlatılacaktır.'
          )
        }
      } else {
        throw new Error(res?.hata || 'Ayar uygulanamadı')
      }
    } catch (err: any) {
      error('Hata', err.message || 'Otomatik başlatma ayarı kaydedilemedi.')
    } finally {
      setYukleniyor(false)
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => handleKarar(false)}
      title="Sistem Başlangıç Tercihi"
      size="md"
      closeOnOverlayClick={false}
      footer={
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between w-full gap-3">
          <button
            type="button"
            disabled={yukleniyor}
            onClick={() => handleKarar(false)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-surface-400 hover:text-white hover:bg-[#1e1a16] border border-transparent hover:border-[#322C26] transition-colors"
          >
            Şimdilik Hayır / Daha Sonra
          </button>
          
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            disabled={yukleniyor}
            onClick={() => handleKarar(true)}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-900/40 border border-brand-400/40 transition-colors disabled:opacity-50"
          >
            <Check size={16} />
            {yukleniyor ? 'Ayarlanıyor...' : 'Evet, Otomatik Başlat'}
          </motion.button>
        </div>
      }
    >
      <div className="space-y-4 py-1">
        {/* Üst Vurgulu İkon ve Başlık */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#1E1A16] border border-brand-500/40 flex items-center justify-center text-brand-400 shrink-0 shadow-lg shadow-brand-950/60">
            <Power size={24} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Windows Başlangıcında Otomatik Başlatılsın mı?
            </h3>
            <p className="text-xs text-surface-400 mt-1 leading-relaxed">
              ETİBOL POS'un bilgisayarınız her açıldığında otomatik olarak arka planda çalışmasını sağlayabilirsiniz.
            </p>
          </div>
        </div>

        {/* Avantajlar Kartları */}
        <div className="grid grid-cols-1 gap-2.5 pt-2">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#110F0C] border border-[#322C26]">
            <div className="w-7 h-7 rounded-lg bg-emerald-950/50 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <Zap size={15} />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Anında Satışa Hazır</div>
              <div className="text-[11px] text-surface-400 mt-0.5">
                Sistem açılışta hazır bekler, uygulamayı elle arayıp başlatmanıza gerek kalmaz.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#110F0C] border border-[#322C26]">
            <div className="w-7 h-7 rounded-lg bg-blue-950/50 border border-blue-800/40 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
              <Wifi size={15} />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Kesintisiz Garson & Mutfak Terminal Ağı</div>
              <div className="text-[11px] text-surface-400 mt-0.5">
                Port 3847 yerel sunucusu hemen aktif olur; garson telefonları ve mutfak ekranı anında bağlanır.
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-[#110F0C] border border-[#322C26]">
            <div className="w-7 h-7 rounded-lg bg-amber-950/50 border border-amber-800/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
              <ShieldCheck size={15} />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">System Tray (Bildirim Alanı) Entegrasyonu</div>
              <div className="text-[11px] text-surface-400 mt-0.5">
                Sağ üstteki [X] kapatma butonuna basıldığında kapanmaz, arka planda güvenle çalışmaya devam eder.
              </div>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-surface-500 text-center font-mono pt-1">
          * Bu tercihi dilediğiniz zaman Ayarlar &gt; İşletme &amp; Donanım panelinden değiştirebilirsiniz.
        </p>
      </div>
    </Modal>
  )
}
