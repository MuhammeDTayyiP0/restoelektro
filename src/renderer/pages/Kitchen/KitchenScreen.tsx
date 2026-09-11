import React, { useEffect, useState, useMemo } from 'react'
import { 
  Check, 
  Clock, 
  AlertCircle, 
  ChefHat, 
  Flame, 
  RefreshCw, 
  CheckCheck, 
  Utensils, 
  Timer,
  SlidersHorizontal,
  Scale
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useIPC, useIPCListener, ipcInvoke } from '../../hooks/useIPC'
import { MUTFAK_KANALLARI } from '../../../common/ipc-channels'
import type { Siparis } from '../../../common/types/pos.types'
import { formatSaat, gecenDakikaHesapla } from '../../utils/formatters'
import { useToast } from '../../components/ui/Toast'

export default function KitchenScreen() {
  const { veri: siparisler, yukleniyor, yenile, setVeri: setSiparisler } = useIPC<Siparis[]>(MUTFAK_KANALLARI.BEKLEYEN_SIPARISLER, [])
  const { success, error } = useToast()
  
  // Canlı saat ve dakika sayacı (Bekleme sürelerini anlık güncellemek için)
  const [, setTicker] = useState(0)
  const [suankiSaat, setSuankiSaat] = useState(new Date())
  const [filtreModu, setFiltreModu] = useState<'tum' | 'acil' | 'hazirlaniyor'>('tum')

  useEffect(() => {
    const timer = setInterval(() => {
      setTicker(t => t + 1)
      setSuankiSaat(new Date())
    }, 15000) // 15 saniyede bir süreleri güncelle
    return () => clearInterval(timer)
  }, [])

  // Yeni sipariş geldiğinde listeyi otomatik yenile
  useIPCListener('mutfak:yeni-siparis', () => {
    yenile()
  })

  const durumGuncelle = async (siparisId: number, yeniDurum: string) => {
    try {
      const response = await ipcInvoke(MUTFAK_KANALLARI.DURUM_GUNCELLE, siparisId, yeniDurum)
      if (response.basarili) {
        if (yeniDurum === 'hazir') {
          setSiparisler(mevcut => mevcut.filter(s => s.id !== siparisId))
          success('Sipariş Hazır', 'Sipariş hazır olarak işaretlendi.')
        } else {
          setSiparisler(mevcut => mevcut.map(s => s.id === siparisId ? { ...s, durum: yeniDurum as any } : s))
        }
      } else {
        error('Hata', 'Sipariş durumu güncellenemedi')
      }
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  // Siparişleri masalara/hesaplara göre grupla (Fiş görünümü)
  const fisler = useMemo(() => {
    const gruplar: Record<number, Siparis[]> = {}
    siparisler.forEach(siparis => {
      if (!gruplar[siparis.hesap_id]) {
        gruplar[siparis.hesap_id] = []
      }
      gruplar[siparis.hesap_id].push(siparis)
    })

    const sirali = Object.values(gruplar).sort((a, b) => {
      const zamanA = new Date(a[0].siparis_zamani!).getTime()
      const zamanB = new Date(b[0].siparis_zamani!).getTime()
      return zamanA - zamanB
    })

    if (filtreModu === 'acil') {
      return sirali.filter(fis => gecenDakikaHesapla(fis[0].siparis_zamani) >= 15)
    }
    if (filtreModu === 'hazirlaniyor') {
      return sirali.filter(fis => fis.some(k => k.durum === 'hazirlaniyor'))
    }

    return sirali
  }, [siparisler, filtreModu])

  // İstatistikler
  const istatistik = useMemo(() => {
    const toplamFis = fisler.length
    const toplamKalem = siparisler.length
    const acilFis = siparisler.filter(s => gecenDakikaHesapla(s.siparis_zamani) >= 15).length
    return { toplamFis, toplamKalem, acilFis }
  }, [fisler, siparisler])

  if (yukleniyor && siparisler.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0B0A08] text-slate-100 min-h-screen">
        <div className="w-14 h-14 rounded-2xl bg-[#1e1a16] border border-[#3A342C] flex items-center justify-center mb-4">
          <RefreshCw className="w-7 h-7 text-amber-400 animate-spin" />
        </div>
        <p className="text-sm font-mono tracking-widest uppercase text-slate-400 animate-pulse">
          Mutfak Siparişleri Yükleniyor...
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0A08] text-slate-100 min-h-screen select-none -m-4 lg:-m-6 p-4 lg:p-6 gap-4 overflow-hidden">
      
      {/* 1. KDS ÜST KOMUTA VE DURUM ÇUBUĞU */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-[#322C26] shrink-0">
        
        {/* Sol: Başlık & Canlı İstatistik Sayaçları */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#1e1a16] border border-[#403830] flex items-center justify-center text-amber-400 shadow-sm">
              <ChefHat size={24} />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white font-mono uppercase flex items-center gap-2.5">
                MUTFAK EKRANI (KDS)
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <span>Canlı Sipariş Takip İstasyonu</span>
                <span>•</span>
                <span className="text-slate-300 font-bold">
                  {suankiSaat.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </p>
            </div>
          </div>

          {/* Hızlı KDS KPI Sayaçları */}
          <div className="hidden sm:flex items-center gap-2 bg-[#171410] p-1.5 rounded-xl border border-[#322C26]">
            {/* Toplam Fiş */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1e1a16] border border-[#3A342C] text-slate-200 text-xs font-mono font-bold">
              <Utensils size={14} className="text-sky-400" />
              <span>{siparisler.length > 0 ? fisler.length : 0} Aktif Fiş</span>
            </div>

            {/* Toplam Kalem */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#1e1a16] border border-[#3A342C] text-slate-200 text-xs font-mono font-bold">
              <span className="text-amber-400 font-black">{siparisler.length}</span>
              <span>Kalem</span>
            </div>

            {/* Acil Sipariş Uyarısı */}
            {istatistik.acilFis > 0 && (
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }} 
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-mono font-bold shadow-[0_0_12px_rgba(244,63,94,0.4)]"
              >
                <Flame size={14} className="text-rose-400 animate-pulse" />
                <span>{istatistik.acilFis} Kalem Gecikmiş (&gt;15dk)</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Sağ: Filtreleme & Hızlı Araçlar */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          
          {/* Segmented Filter */}
          <div className="flex items-center gap-1 bg-[#171410] p-1 rounded-xl border border-[#322C26]">
            <button
              onClick={() => setFiltreModu('tum')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all",
                filtreModu === 'tum' 
                  ? "bg-[#322C26] text-white shadow-sm border border-slate-600/50" 
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Tümü ({siparisler.length > 0 ? fisler.length : 0})
            </button>
            <button
              onClick={() => setFiltreModu('acil')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5",
                filtreModu === 'acil' 
                  ? "bg-rose-900/60 text-rose-200 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.3)]" 
                  : "text-rose-400/80 hover:text-rose-300"
              )}
            >
              <Flame size={13} />
              Aciller
            </button>
            <button
              onClick={() => setFiltreModu('hazirlaniyor')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all",
                filtreModu === 'hazirlaniyor' 
                  ? "bg-amber-900/50 text-amber-200 border border-amber-500/40" 
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Hazırlananlar
            </button>
          </div>

          {/* Yenile Butonu */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => yenile()}
            className="h-10 w-10 rounded-xl bg-[#1e1a16] border border-[#3A342C] hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            title="Listeyi Yenile"
          >
            <RefreshCw size={16} />
          </motion.button>
        </div>
      </div>

      {/* 2. FİŞLER YATAY AKIŞ ALANI (KDS TICKET MATRIX) */}
      <div className="flex-1 overflow-x-auto pos-scrollbar pb-3">
        <div className="flex gap-4 h-full items-start min-w-full">
          <AnimatePresence mode="popLayout">
            {fisler.map((fis) => {
              const ilkSiparis = fis[0]
              const beklemeSuresi = gecenDakikaHesapla(ilkSiparis.siparis_zamani)
              const acilMi = beklemeSuresi >= 15
              const tumKalemlerHazirlaniyor = fis.every(k => k.durum === 'hazirlaniyor')

              return (
                <motion.div
                  key={ilkSiparis.hesap_id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.25 }}
                  className={clsx(
                    'flex-shrink-0 w-84 sm:w-92 max-h-full flex flex-col rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300',
                    acilMi 
                      ? 'bg-[#171410] border-rose-500/80 shadow-[0_0_25px_rgba(244,63,94,0.25)]' 
                      : tumKalemlerHazirlaniyor
                        ? 'bg-[#171410] border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                        : 'bg-[#171410] border-[#322C26]'
                  )}
                >
                  {/* Fiş Başlığı (Header) */}
                  <div className={clsx(
                    'p-3.5 border-b flex flex-col gap-2 relative overflow-hidden transition-colors',
                    acilMi 
                      ? 'bg-gradient-to-r from-rose-950 via-rose-900/90 to-rose-950 border-rose-700/60 text-white' 
                      : tumKalemlerHazirlaniyor
                        ? 'bg-gradient-to-r from-amber-950/80 via-[#241F1A] to-[#1e1a16] border-amber-500/30 text-white'
                        : 'bg-[#1e1a16] border-[#322C26] text-white'
                  )}>
                    {/* Üst Satır: Masa Adı & Geçen Süre */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className={clsx(
                          "px-2.5 py-1 rounded-xl text-sm font-mono font-black uppercase tracking-wider border",
                          acilMi 
                            ? "bg-rose-600 text-white border-rose-400" 
                            : "bg-[#322C26] text-sky-300 border-sky-500/30"
                        )}>
                          {(ilkSiparis as any).masa_numara ? `MASA ${(ilkSiparis as any).masa_numara}` : 'PAKET SİPARİŞ'}
                        </span>
                        {(ilkSiparis as any).bolum_adi && (
                          <span className="text-[11px] font-mono text-slate-400 bg-black/30 px-2 py-0.5 rounded-lg">
                            {(ilkSiparis as any).bolum_adi}
                          </span>
                        )}
                      </div>

                      {/* Süre Rozeti */}
                      <div className={clsx(
                        'flex items-center gap-1.5 text-xs font-mono font-black px-2.5 py-1 rounded-xl border',
                        acilMi 
                          ? 'bg-rose-500/30 text-rose-200 border-rose-400/50 animate-pulse' 
                          : beklemeSuresi >= 10
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      )}>
                        <Timer size={14} className={acilMi ? "animate-spin" : ""} />
                        <span>{beklemeSuresi} dk</span>
                      </div>
                    </div>

                    {/* Alt Bilgi: Garson & Sipariş Başlangıç Saati */}
                    <div className="flex justify-between items-center text-xs font-mono text-slate-300/80 pt-1 border-t border-white/10">
                      <span className="truncate">Garson: <strong className="text-slate-200 font-semibold">{(ilkSiparis as any).garson_adi || 'Sistem'}</strong></span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} className="text-slate-400" />
                        {formatSaat(ilkSiparis.siparis_zamani)}
                      </span>
                    </div>
                  </div>

                  {/* Fiş Kalemleri Gövdesi (Sipariş Listesi) */}
                  <div className="flex-1 overflow-y-auto pos-scrollbar p-3 space-y-2.5 max-h-[calc(100vh-280px)]">
                    {fis.map(kalem => {
                      const hazirlaniyorMu = kalem.durum === 'hazirlaniyor'
                      const isKg = (
                        kalem.satis_birim?.toLowerCase() === 'kg' ||
                        kalem.satis_birim?.toLowerCase() === 'kilo' ||
                        (kalem as any).satisBirim?.toLowerCase() === 'kg' ||
                        (kalem as any).satisBirim?.toLowerCase() === 'kilo' ||
                        (kalem as any).secilenSatisTuru?.toLowerCase() === 'kg' ||
                        (kalem.urun_birim?.toLowerCase() === 'kg') ||
                        (kalem.gramaj !== undefined && Number(kalem.gramaj) > 0)
                      )
                      const gramaj = kalem.gramaj !== undefined && Number(kalem.gramaj) > 0 
                        ? Number(kalem.gramaj) 
                        : (isKg ? Number(kalem.miktar || 1) : 0)
                      const gramajRozetMetni = gramaj > 0 ? `${gramaj.toFixed(3)} KG` : 'KG'

                      return (
                        <div 
                          key={kalem.id}
                          className={clsx(
                            'p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between gap-2.5',
                            hazirlaniyorMu 
                              ? 'bg-[#241F1A] border-amber-500/50 shadow-sm' 
                              : 'bg-[#110F0C] border-[#322C26] hover:border-slate-600/40'
                          )}
                        >
                          {/* Kalem Üst Bilgi (Miktar + Ürün Adı + Gramaj Rozeti + Varyant) */}
                          <div className="flex items-start gap-3">
                            {/* Miktar Rozeti */}
                            <div className={clsx(
                              "w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 border",
                              isKg
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.25)]"
                                : hazirlaniyorMu
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                                  : "bg-sky-500/15 text-sky-400 border-sky-500/30"
                            )}>
                              {isKg ? (kalem.miktar > 1 ? `${kalem.miktar}x` : 'KG') : `${kalem.miktar}x`}
                            </div>

                            {/* Ürün & Varyant & Gramaj Rozeti */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-sm lg:text-base font-black text-white leading-tight tracking-tight">
                                  {kalem.urun_adi}
                                </h4>
                                {isKg && (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-mono font-black tracking-wider bg-emerald-950/90 text-emerald-300 border border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.35)] uppercase">
                                    <Scale size={13} className="text-emerald-400 shrink-0" />
                                    <span>{kalem.miktar > 1 && kalem.gramaj ? `${kalem.miktar}x ` : ''}{gramajRozetMetni}</span>
                                  </span>
                                )}
                                {!isKg && kalem.porsiyon && kalem.porsiyon !== 1 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    {kalem.porsiyon === 0.5 ? '0.5 Por' : kalem.porsiyon === 2 ? 'Duble Por' : `${kalem.porsiyon} Por`}
                                  </span>
                                )}
                              </div>
                              {kalem.varyant_adi && (
                                <div className="mt-1">
                                  <span className="inline-block text-[11px] font-mono font-bold text-sky-300 bg-sky-950/60 border border-sky-800/50 px-2 py-0.5 rounded-md">
                                    {kalem.varyant_adi}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Özel Mutfak Notu / Alerjen Çağrısı */}
                          {kalem.notlar && (
                            <div className="p-2.5 bg-amber-950/40 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-mono flex items-start gap-2 shadow-inner">
                              <AlertCircle size={15} className="mt-0.5 shrink-0 text-amber-400" />
                              <div className="leading-snug">
                                <span className="font-bold text-amber-300">Özel Not:</span> {kalem.notlar}
                              </div>
                            </div>
                          )}

                          {/* Kalem Bazlı Aksiyon Butonu */}
                          <div className="pt-2 border-t border-[#322C26] flex gap-2">
                            {kalem.durum === 'bekliyor' ? (
                              <motion.button 
                                whileTap={{ scale: 0.96 }}
                                onClick={() => durumGuncelle(kalem.id!, 'hazirlaniyor')}
                                className="w-full h-9 rounded-xl bg-[#1E1A16] hover:bg-[#322C26] border border-sky-500/40 text-sky-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                              >
                                <Flame size={14} className="text-sky-400" />
                                <span>Hazırlamaya Başla</span>
                              </motion.button>
                            ) : (
                              <motion.button 
                                whileTap={{ scale: 0.96 }}
                                onClick={() => durumGuncelle(kalem.id!, 'hazir')}
                                className="w-full h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-black flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all"
                              >
                                <Check size={16} />
                                <span>Hazır Olarak İşaretle</span>
                              </motion.button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Toplu Fiş Tamamlama Footer */}
                  <div className="p-3 bg-[#171410] border-t border-[#322C26]">
                    <motion.button 
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        fis.forEach(k => {
                          if (k.durum !== 'hazir') durumGuncelle(k.id!, 'hazir')
                        })
                      }}
                      className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all"
                    >
                      <CheckCheck size={18} />
                      <span>Fişin Tümünü Hazırla</span>
                    </motion.button>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
          
          {/* Sipariş Yokken Boş Durum */}
          {fisler.length === 0 && (
            <div className="flex flex-col items-center justify-center w-full h-[65vh] text-slate-500 select-none">
              <div className="w-20 h-20 rounded-3xl bg-[#171410] border border-[#322C26] flex items-center justify-center mb-4 text-emerald-400 shadow-xl">
                <ChefHat size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-300 font-mono uppercase tracking-wide">
                Mutfak Rahat
              </h3>
              <p className="text-sm font-mono text-slate-500 mt-1 max-w-sm text-center">
                Şu an bekleyen veya hazırlanan herhangi bir sipariş fişi bulunmuyor.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

