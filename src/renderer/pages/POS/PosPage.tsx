import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useMenuStore } from '../../stores/useMenuStore'
import { usePosStore } from '../../stores/usePosStore'
import { ipcInvoke, useIPCListener } from '../../hooks/useIPC'
import { HESAP_KANALLARI, MASA_KANALLARI } from '../../../common/ipc-channels'
import type { Hesap } from '../../../common/types/pos.types'
import { useToast } from '../../components/ui/Toast'
import { motion } from 'framer-motion'
import { Activity, Server } from 'lucide-react'
import { APP_VERSION_TAG } from '../../utils/version'
import { useAuthStore } from '../../stores/useAuthStore'

// Alt Bileşenler
import PosMenu from './components/PosMenu'
import PosCart from './components/PosCart'

export default function PosPage() {
  const { hesapId } = useParams<{ hesapId?: string }>()
  const [searchParams] = useSearchParams()
  const masaIdParam = searchParams.get('masa')
  const masaId = masaIdParam ? parseInt(masaIdParam, 10) : null

  const navigate = useNavigate()
  const { error, info } = useToast()
  
  const { menuyuGetir, yukleniyor: menuYukleniyor } = useMenuStore()
  const { hesapAyarla, hesapGuncelle, aktifHesap } = usePosStore()
  const { personel } = useAuthStore()
  const [hesapYukleniyor, setHesapYukleniyor] = useState(true)

  // Sayfa yüklendiğinde menüyü getir
  useEffect(() => {
    menuyuGetir()
  }, [menuyuGetir])

  const hesabiYukle = useCallback(async () => {
    setHesapYukleniyor(true)
    try {
      if (hesapId) {
        const hesap = await ipcInvoke<Hesap>(HESAP_KANALLARI.DETAY, parseInt(hesapId, 10))
        if (hesap) {
          hesapAyarla(hesap, hesap.masa_id)
        } else {
          error('Hesap Bulunamadı', 'İstenen hesap veritabanında bulunamadı.')
          navigate('/tables')
        }
      } else if (masaId) {
        // Yeni veya varolan açık hesap için
        hesapAyarla(null, masaId)
      } else {
        hesapAyarla(null, null)
      }
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setHesapYukleniyor(false)
    }
  }, [hesapId, masaId, hesapAyarla, navigate, error])

  // URL'deki parametrelere göre hesap verilerini çek
  useEffect(() => {
    hesabiYukle()
  }, [hesabiYukle])

  useEffect(() => {
    if (!masaId) return
    const adi = personel ? `${personel.ad} ${personel.soyad}` : ''
    ipcInvoke(MASA_KANALLARI.KILIT, masaId, personel?.id, adi).then((res: any) => {
      if (res && res.kilitli) {
        error('Masa kilitli', res.hata || 'Başka terminalde açık')
        navigate('/tables')
      }
    }).catch(() => {})
    return () => {
      ipcInvoke(MASA_KANALLARI.KILIT_AC, masaId).catch(() => {})
    }
  }, [masaId])

  // Anlık güncellemeleri dinle (Garson El Terminali vb.)
  useIPCListener('siparis:guncellendi', async (guncellenenHesapId: number, guncellenenMasaId?: number) => {
    try {
      if (aktifHesap && aktifHesap.id === guncellenenHesapId) {
        // Kasa görevlisinin o an açık tuttuğu masaya yeni ürün eklendi veya güncellendi
        // Ekranı yenilemeden (unmount/re-render blink olmadan) arka planda güncelle
        const guncelHesap = await ipcInvoke<Hesap>(HESAP_KANALLARI.DETAY, guncellenenHesapId)
        if (guncelHesap) {
          const eskiSiparisSayisi = aktifHesap.siparisler?.length || 0
          const yeniSiparisSayisi = guncelHesap.siparisler?.length || 0
          hesapGuncelle(guncelHesap)

          if (yeniSiparisSayisi > eskiSiparisSayisi) {
            info('Yeni Ürün Eklendi', 'Garson terminalinden bu masaya yeni sipariş(ler) eklendi.')
          }
        }
      } else if (!aktifHesap && masaId && masaId === guncellenenMasaId) {
        // Kasa görevlisi boş bir masaya bakıyorken garson sipariş gönderip hesap açtıysa
        // Kullanıcının taslak sepetini ve odağını bozmadan arka planda hesabı bağla
        const guncelHesap = await ipcInvoke<Hesap>(HESAP_KANALLARI.DETAY, guncellenenHesapId)
        if (guncelHesap) {
          hesapGuncelle(guncelHesap)
          window.history.replaceState(null, '', `#/pos/${guncellenenHesapId}`)
          info('Yeni Sipariş Eklendi', 'Garson terminalinden bu masaya sipariş girildi.')
        }
      }
      // Farklı bir masaya ait siparişlerde hiçbir odak değişikliği veya yönlendirme yapılmaz
    } catch (err: any) {
      console.error('Anlık sipariş senkronizasyon hatası:', err)
    }
  })

  if (menuYukleniyor || hesapYukleniyor) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#0B0A08] text-slate-100 select-none p-6 relative overflow-hidden">
        {/* Subtle background tech grid */}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative flex flex-col items-center w-full max-w-sm p-8 rounded-2xl bg-[#171410] border border-[#322C26] shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-center z-10"
        >
          {/* Hardware Diagnostic Icon */}
          <div className="relative flex items-center justify-center w-16 h-16 mb-5 rounded-xl bg-[#1e1a16] border border-[#403830]">
            <Server className="w-8 h-8 text-emerald-400" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          {/* Monospace Hardware Title */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 className="text-sm font-black tracking-widest text-slate-100 uppercase font-mono">
              ETİBOL POS TERMİNALİ
            </h3>
          </div>

          <p className="text-xs text-slate-400 font-mono tracking-tight mb-6">
            {menuYukleniyor ? 'SİSTEM // Menü veritabanı eşitleniyor...' : 'SİSTEM // Masa adisyonu yükleniyor...'}
          </p>

          {/* Industrial Segmented Bar */}
          <div className="w-full bg-[#0B0A08] rounded-md h-2 p-0.5 border border-[#322C26] flex items-center">
            <motion.div 
              className="bg-emerald-500 h-full rounded-sm"
              initial={{ width: '15%' }}
              animate={{ width: ['20%', '85%', '60%', '95%'] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            />
          </div>

          <div className="flex items-center justify-between w-full mt-3 px-0.5 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Activity size={10} className="text-emerald-400" /> CANLI BAĞLANTI
            </span>
            <span className="text-slate-400">{APP_VERSION_TAG}</span>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-full overflow-hidden bg-[#0B0A08] select-none">
      {/* Sol Taraf: Sepet ve Hesap Özeti (Industrial Split Layout) */}
      <motion.aside 
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-[320px] sm:w-[340px] md:w-[360px] lg:w-[380px] xl:w-[410px] 2xl:w-[440px] flex-shrink-0 shrink-0 bg-[#171410] border-r border-[#322C26] flex flex-col h-full z-10 shadow-[6px_0_30px_rgba(0,0,0,0.6)] overflow-hidden"
      >
        <PosCart />
      </motion.aside>

      {/* Sağ Taraf: Menü ve Kategoriler */}
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-[#0B0A08]">
        <PosMenu />
      </main>
    </div>
  )
}
