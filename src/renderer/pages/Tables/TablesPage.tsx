import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Users, 
  Clock, 
  Search, 
  RefreshCw, 
  Layers, 
  TrendingUp, 
  CircleDot, 
  Link2, 
  UtensilsCrossed, 
  ShoppingBag,
  Sparkles
} from 'lucide-react'
import { useIPC, useIPCListener, ipcInvoke } from '../../hooks/useIPC'
import { MASA_KANALLARI } from '../../../common/ipc-channels'
import type { Masa, Bolum } from '../../../common/types/table.types'
import { formatPara, gecenDakikaHesapla } from '../../utils/formatters'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../stores/useAuthStore'
import { useToast } from '../../components/ui/Toast'

export default function TablesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [seciliBolum, setSeciliBolum] = useState<string>(() => sessionStorage.getItem('seciliBolum') || 'tum')
  const [durumFiltresi, setDurumFiltresi] = useState<string>('tum')
  const [aramaMetni, setAramaMetni] = useState<string>('')

  useEffect(() => {
    sessionStorage.setItem('seciliBolum', seciliBolum)
  }, [seciliBolum])

  const { veri: bolumler, yukleniyor: bolumlerYukleniyor, yenile: bolumleriYenile } = useIPC<Bolum[]>(MASA_KANALLARI.BOLUMLER, [])
  const { veri: masalar, yukleniyor: masalarYukleniyor, yenile: masalariYenile } = useIPC<Masa[]>(MASA_KANALLARI.MASALAR, [])

  const personel = useAuthStore(s => s.personel)
  const isAdmin = personel?.rol === 'admin'

  const [topluModalAcik, setTopluModalAcik] = useState(false)
  const [seciliHedefBolumId, setSeciliHedefBolumId] = useState<number | null>(null)
  const [onek, setOnek] = useState('S')
  const [masaSayisi, setMasaSayisi] = useState(15)
  const [olusturuluyor, setOlusturuluyor] = useState(false)

  // İlk açılışta hedef bölümü varsayılan ilk bölüme ayarla
  useEffect(() => {
    if (bolumler.length > 0 && !seciliHedefBolumId) {
      setSeciliHedefBolumId(bolumler[0].id)
    }
  }, [bolumler, seciliHedefBolumId])

  const hedefBolumId = seciliBolum !== 'tum' 
    ? parseInt(seciliBolum, 10) 
    : (seciliHedefBolumId || (bolumler.length > 0 ? bolumler[0].id : null))

  const handleTopluMasaOlustur = async () => {
    if (!hedefBolumId || isNaN(hedefBolumId)) {
      toast.error('Hata', 'Lütfen geçerli bir bölüm seçin.')
      return
    }

    if (!onek.trim()) {
      toast.warning('Eksik Bilgi', 'Lütfen bir masa öneki girin (örn: S).')
      return
    }

    if (masaSayisi < 1 || masaSayisi > 200) {
      toast.warning('Geçersiz Sayı', 'Masa sayısı 1 ile 200 arasında olmalıdır.')
      return
    }

    setOlusturuluyor(true)
    try {
      const sonuc: any = await ipcInvoke(MASA_KANALLARI.MASA_TOPLU_EKLE, hedefBolumId, onek.trim().toUpperCase(), masaSayisi)
      if (sonuc && sonuc.basarili) {
        toast.success('Masalar Oluşturuldu', `${masaSayisi} adet masa başarıyla eklendi.`)
        setTopluModalAcik(false)
        await masalariYenile()
        await bolumleriYenile()
      } else {
        toast.error('Hata', (sonuc && sonuc.hata) || 'Masa oluşturulamadı.')
      }
    } catch (err: any) {
      console.error('IPC Hatası:', err)
      toast.error('İşlem Hatası', err.message || 'Masa oluşturulurken bir hata meydana geldi.')
    } finally {
      setOlusturuluyor(false)
    }
  }

  // Anlık güncellemeleri dinle (Garson vs)
  useIPCListener('masalar:guncellendi', () => {
    masalariYenile()
  })

  // 60 saniyede bir masaları yenile (süreyi güncellemek için)
  useEffect(() => {
    const timer = setInterval(() => {
      masalariYenile()
    }, 60000)
    return () => clearInterval(timer)
  }, [masalariYenile])

  // İstatistikler (KPI)
  const istatistikler = useMemo(() => {
    const toplam = masalar.length
    const doluSayisi = masalar.filter(m => m.durum === 'dolu' || !!m.aktif_hesap_id).length
    const bosSayisi = masalar.filter(m => m.durum === 'bos' && !m.aktif_hesap_id).length
    const rezerveSayisi = masalar.filter(m => m.durum === 'rezerve').length
    const toplamAdisyon = masalar.reduce((toplam, m) => toplam + (m.aktif_hesap_tutari || 0), 0)
    const dolulukOrani = toplam > 0 ? Math.round((doluSayisi / toplam) * 100) : 0

    return { toplam, doluSayisi, bosSayisi, rezerveSayisi, toplamAdisyon, dolulukOrani }
  }, [masalar])

  // Bölüm bazlı masa sayıları haritası
  const bolumMasaSayilari = useMemo(() => {
    const map: Record<string, { toplam: number; dolu: number }> = {}
    masalar.forEach(m => {
      const bId = m.bolum_id.toString()
      if (!map[bId]) map[bId] = { toplam: 0, dolu: 0 }
      map[bId].toplam += 1
      if (m.durum === 'dolu' || !!m.aktif_hesap_id) {
        map[bId].dolu += 1
      }
    })
    return map
  }, [masalar])

  const seciliBolumdekiMasaSayisi = useMemo(() => {
    if (seciliBolum === 'tum') return masalar.length
    return masalar.filter(m => m.bolum_id.toString() === seciliBolum).length
  }, [masalar, seciliBolum])

  const bolumdeHicMasaYok = seciliBolumdekiMasaSayisi === 0 && !aramaMetni.trim() && durumFiltresi === 'tum'

  // Filtreleme mantığı
  const filtrelenmisMasalar = useMemo(() => {
    return masalar.filter(masa => {
      // 1. Bölüm filtresi
      if (seciliBolum !== 'tum' && masa.bolum_id.toString() !== seciliBolum) {
        return false
      }

      // 2. Durum filtresi
      const doluMu = masa.durum === 'dolu' || !!masa.aktif_hesap_id
      const bosMu = masa.durum === 'bos' && !masa.aktif_hesap_id
      const rezerveMi = masa.durum === 'rezerve'
      const birlestiMi = masa.durum === 'birlesti'

      if (durumFiltresi === 'dolu' && !doluMu) return false
      if (durumFiltresi === 'bos' && !bosMu) return false
      if (durumFiltresi === 'rezerve' && !rezerveMi) return false
      if (durumFiltresi === 'birlesti' && !birlestiMi) return false

      // 3. Arama filtresi
      if (aramaMetni.trim()) {
        const query = aramaMetni.toLowerCase().trim()
        const masaNoStr = masa.numara.toString().toLowerCase()
        const garsonStr = (masa.garson_adi || '').toLowerCase()
        if (!masaNoStr.includes(query) && !garsonStr.includes(query)) {
          return false
        }
      }

      return true
    })
  }, [masalar, seciliBolum, durumFiltresi, aramaMetni])

  const masaTikla = (masa: Masa) => {
    if (masa.aktif_hesap_id) {
      navigate(`/pos/${masa.aktif_hesap_id}`)
    } else {
      navigate(`/pos?masa=${masa.id}`)
    }
  }

  // Süre formatlama (örn: 75 dk -> 1s 15dk)
  const formatGecenSure = (dakika: number) => {
    if (dakika < 60) return `${dakika} dk`
    const saat = Math.floor(dakika / 60)
    const kalanDk = dakika % 60
    return `${saat}s ${kalanDk}d`
  }

  if (bolumlerYukleniyor && masalarYukleniyor) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#090A0F] text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-[#141926] border border-[#222C42] flex items-center justify-center mb-4">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
        <p className="text-sm font-mono tracking-widest uppercase text-slate-400 animate-pulse">
          Masa düzeni yükleniyor...
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#090A0F] text-slate-100 overflow-hidden select-none -m-4 lg:-m-6 p-4 lg:p-6 gap-4">
      
      {/* 1. ÜST BAŞLIK & KOMUTA ÇUBUĞU */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 pb-3 border-b border-[#1A2234] shrink-0">
        
        {/* Sol Taraf: Başlık & KPI Badge'leri */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#121724] border border-[#232F47] flex items-center justify-center text-emerald-400 shadow-sm">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-white font-mono uppercase flex items-center gap-2">
                MASA YÖNETİMİ
                <span className="text-[10px] font-mono font-bold bg-[#141926] text-emerald-400 border border-[#222C42] px-2 py-0.5 rounded-full">
                  CANLI
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {istatistikler.toplam} Masa • {istatistikler.doluSayisi} Dolu (%{istatistikler.dolulukOrani})
              </p>
            </div>
          </div>

          {/* Hızlı KPI Mini Sayaçlar */}
          <div className="hidden sm:flex items-center gap-2 bg-[#0C1017] p-1.5 rounded-xl border border-[#1A2234]">
            {/* Boş */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs font-mono font-bold">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              <span>{istatistikler.bosSayisi} Boş</span>
            </div>

            {/* Dolu */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/30 border border-amber-500/20 text-amber-300 text-xs font-mono font-bold">
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
              <span>{istatistikler.doluSayisi} Dolu</span>
            </div>

            {/* Toplam Adisyon */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#141926] border border-[#222C42] text-slate-200 text-xs font-mono font-bold">
              <TrendingUp size={13} className="text-emerald-400" />
              <span className="text-emerald-400 font-black tabular-nums">{formatPara(istatistikler.toplamAdisyon)}</span>
            </div>
          </div>
        </div>

        {/* Sağ Taraf: Hızlı İşlem Araçları */}
        <div className="flex items-center gap-2.5 w-full xl:w-auto justify-between xl:justify-end">
          {/* Arama Inputu */}
          <div className="relative flex-1 sm:w-64 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={aramaMetni}
              onChange={e => setAramaMetni(e.target.value)}
              placeholder="Masa no veya garson ara..."
              className="w-full h-11 pl-9 pr-8 bg-[#0C1017] border border-[#1E2638] focus:border-emerald-500/60 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
            {aramaMetni && (
              <button
                onClick={() => setAramaMetni('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Toplu Masa Ekle Butonu (Admin) */}
          {isAdmin && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setTopluModalAcik(true)}
              className="h-11 px-3.5 rounded-xl bg-[#121724] border border-[#222C42] hover:border-emerald-500/50 text-emerald-400 hover:text-emerald-300 font-mono text-xs font-bold flex items-center gap-2 transition-colors"
              title="Toplu Masa Oluştur"
            >
              <Plus size={16} />
              <span className="hidden lg:inline">Toplu Masa</span>
            </motion.button>
          )}

          {/* Müşteriler Butonu */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/customers')}
            className="h-11 px-3.5 rounded-xl bg-[#121724] border border-[#222C42] hover:border-slate-500 text-slate-300 hover:text-white font-mono text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Users size={16} />
            <span className="hidden md:inline">Müşteriler</span>
          </motion.button>

          {/* Hızlı Paket Sipariş Butonu */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/pos')}
            className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
          >
            <Plus size={18} />
            <span>Hızlı Satış</span>
          </motion.button>

          {/* Yenile Butonu */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => masalariYenile()}
            className="h-11 w-11 rounded-xl bg-[#121724] border border-[#222C42] hover:border-slate-500 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="Masaları Yenile"
          >
            <RefreshCw size={16} />
          </motion.button>
        </div>
      </div>

      {/* 2. BÖLÜMLER & DURUM FİLTRELEME ÇUBUĞU (INDUSTRIAL SEGMENTED BAR) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shrink-0 bg-[#0C1017] p-2 rounded-2xl border border-[#1A2234]">
        
        {/* Kat / Bölge Sekmeleri */}
        <div className="flex items-center gap-1.5 overflow-x-auto pos-scrollbar pb-1 md:pb-0">
          <button
            onClick={() => setSeciliBolum('tum')}
            className={clsx(
              "h-10 px-4 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all shrink-0",
              seciliBolum === 'tum'
                ? "bg-[#1E293B] text-white shadow-sm border border-slate-600/50"
                : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-[#141926]"
            )}
          >
            <Layers size={14} />
            <span>Tüm Bölümler</span>
            <span className="bg-[#090A0F] text-slate-400 px-1.5 py-0.5 rounded text-[10px]">
              {masalar.length}
            </span>
          </button>

          {bolumler.map(bolum => {
            const bStats = bolumMasaSayilari[bolum.id.toString()] || { toplam: 0, dolu: 0 }
            const isActive = seciliBolum === bolum.id.toString()

            return (
              <button
                key={bolum.id}
                onClick={() => setSeciliBolum(bolum.id.toString())}
                className={clsx(
                  "h-10 px-4 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all shrink-0",
                  isActive
                    ? "bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] border border-emerald-400/40"
                    : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-[#141926]"
                )}
              >
                <span>{bolum.ad}</span>
                <span className={clsx(
                  "px-1.5 py-0.5 rounded text-[10px]",
                  isActive ? "bg-emerald-950/70 text-emerald-200" : "bg-[#090A0F] text-slate-400"
                )}>
                  {bStats.dolu}/{bStats.toplam}
                </span>
              </button>
            )
          })}
        </div>

        {/* Durum Filtre Çipleri */}
        <div className="flex items-center gap-1 bg-[#090D15] p-1 rounded-xl border border-[#161D2B] self-start md:self-auto overflow-x-auto">
          {[
            { id: 'tum', label: 'Tümü' },
            { id: 'bos', label: 'Boş', color: 'text-emerald-400' },
            { id: 'dolu', label: 'Dolu', color: 'text-amber-400' },
            { id: 'rezerve', label: 'Rezerve', color: 'text-purple-400' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setDurumFiltresi(f.id)}
              className={clsx(
                "h-8 px-3 rounded-lg font-mono text-xs font-bold transition-all shrink-0",
                durumFiltresi === f.id
                  ? "bg-[#1A2234] text-white shadow-sm border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MASA KARTLARI GRİDİ (HIGH-CONTRAST INDUSTRIAL CARDS) */}
      <div className="flex-1 overflow-y-auto pos-scrollbar pr-1 pb-4">
        {filtrelenmisMasalar.length === 0 ? (
          (bolumdeHicMasaYok && isAdmin) ? (
            <div className="flex flex-col items-center justify-center min-h-[380px] text-slate-400 text-center p-6 my-auto">
              <div className="w-20 h-20 mb-5 rounded-3xl bg-[#0E121B] border border-[#1E2436] flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <Sparkles size={36} />
              </div>
              <h3 className="text-2xl font-black font-mono text-white uppercase tracking-tight mb-2">
                Bu Bölümde Masa Yok
              </h3>
              <p className="text-sm text-slate-400 font-mono max-w-md mb-6">
                Bu bölüme hızlıca toplu masa ekleyebilirsiniz. Önek ve masa sayısını belirleyip oluştur butonuna tıklayın.
              </p>

              <div className="flex flex-col gap-4 bg-[#0C1017] border border-[#1E2436] p-6 rounded-2xl w-full max-w-sm text-left shadow-2xl">
                {seciliBolum === 'tum' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Hedef Bölüm</label>
                    <select
                      value={hedefBolumId || ''}
                      onChange={e => setSeciliHedefBolumId(parseInt(e.target.value, 10))}
                      className="w-full h-12 px-4 bg-[#141926] border border-[#222C42] focus:border-emerald-500/60 rounded-xl text-sm font-mono font-bold text-white focus:outline-none transition-colors"
                    >
                      {bolumler.map(b => (
                        <option key={b.id} value={b.id} className="bg-[#0C1017] text-white">
                          {b.ad}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Masa Öneki (Örn: S)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={onek}
                      onChange={e => setOnek(e.target.value)}
                      placeholder="Örn: S veya M"
                      className="w-full h-12 px-4 bg-[#141926] border border-[#222C42] focus:border-emerald-500/60 rounded-xl text-sm font-mono font-bold text-white uppercase focus:outline-none transition-colors"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">Önizleme:</span>
                      <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/20">
                        {onek.trim() || 'M'} 1
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Masa Sayısı</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={masaSayisi}
                    onChange={e => setMasaSayisi(parseInt(e.target.value) || 1)}
                    className="w-full h-12 px-4 bg-[#141926] border border-[#222C42] focus:border-emerald-500/60 rounded-xl text-sm font-mono font-bold text-white focus:outline-none transition-colors"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleTopluMasaOlustur}
                  disabled={olusturuluyor || !onek.trim() || masaSayisi < 1}
                  className="w-full h-12 mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#1A2234] disabled:text-slate-500 disabled:border disabled:border-[#222C42] text-white font-mono text-sm font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {olusturuluyor ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Oluşturuluyor...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>Toplu Masa Oluştur</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 text-slate-400 text-center">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-[#0E121B] border border-[#1E2436] flex items-center justify-center text-slate-400">
                <UtensilsCrossed size={32} />
              </div>
              <p className="text-base font-mono font-bold text-slate-300 uppercase tracking-wider">
                Kriterlere Uygun Masa Bulunamadı
              </p>
              <p className="text-xs text-slate-400 font-mono mt-1 max-w-sm">
                Seçili filtreleri temizleyerek veya arama kutusunu sıfırlayarak tekrar deneyin.
              </p>
              <button
                onClick={() => { setSeciliBolum('tum'); setDurumFiltresi('tum'); setAramaMetni('') }}
                className="mt-4 px-4 py-2 bg-[#141926] hover:bg-[#1C2336] border border-[#222C42] text-xs font-mono font-bold text-slate-200 rounded-xl transition-colors"
              >
                Filtreleri Sıfırla
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3.5">
            <AnimatePresence>
              {filtrelenmisMasalar.map(masa => {
                const doluMu = masa.durum === 'dolu' || !!masa.aktif_hesap_id
                const rezerveMi = masa.durum === 'rezerve'
                const birlestiMi = masa.durum === 'birlesti'

                // Geçen süre hesabı
                const gecenSure = doluMu && masa.acik_sure
                  ? parseInt(masa.acik_sure, 10) || 0
                  : 0

                return (
                  <motion.button
                    key={masa.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => masaTikla(masa)}
                    className={clsx(
                      "relative flex flex-col justify-between h-40 rounded-2xl p-3.5 text-left border transition-all touch-feedback group overflow-hidden shadow-lg",
                      doluMu
                        ? "bg-gradient-to-b from-[#18130B] to-[#0E1017] border-amber-500/50 hover:border-amber-400 shadow-[0_4px_24px_rgba(245,158,11,0.12)] ring-1 ring-amber-500/20"
                        : rezerveMi
                          ? "bg-gradient-to-b from-[#160F24] to-[#0E1017] border-purple-500/40 hover:border-purple-400 shadow-[0_4px_20px_rgba(139,92,246,0.1)] ring-1 ring-purple-500/20"
                          : "bg-gradient-to-b from-[#0B1516] to-[#0C1017] border-emerald-500/25 hover:border-emerald-400/70 shadow-[0_4px_16px_rgba(16,185,129,0.06)]"
                    )}
                  >
                    {/* Kart Üst Durum Çizgisi */}
                    <div className={clsx(
                      "absolute top-0 left-0 right-0 h-1.5",
                      doluMu ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" : rezerveMi ? "bg-purple-400 shadow-[0_0_8px_rgba(139,92,246,0.8)]" : "bg-emerald-500/60"
                    )} />

                    {/* Üst Kısım: Masa No & Durum Rozeti */}
                    <div className="flex items-start justify-between w-full pt-1">
                      <div className="flex flex-col">
                        <span className="text-2xl 2xl:text-3xl font-black font-mono tracking-tight text-white group-hover:text-amber-300 transition-colors">
                          {masa.numara}
                        </span>
                        {masa.bolum_adi && seciliBolum === 'tum' && (
                          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[80px]">
                            {masa.bolum_adi}
                          </span>
                        )}
                      </div>

                      {/* Durum Rozeti */}
                      {doluMu ? (
                        <div className="flex flex-col items-end gap-1">
                          <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full uppercase">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Dolu
                          </span>
                          {gecenSure > 0 && (
                            <span className="flex items-center gap-1 text-[10px] font-mono text-amber-400/90 font-semibold">
                              <Clock size={10} />
                              {formatGecenSure(gecenSure)}
                            </span>
                          )}
                        </div>
                      ) : rezerveMi ? (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                          Rezerve
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Boş
                        </span>
                      )}
                    </div>

                    {/* Alt Kısım: Fiyat veya Kapasite Bilgisi */}
                    <div className="flex items-end justify-between w-full mt-auto pt-2 border-t border-[#1E2638]">
                      {doluMu ? (
                        <div className="flex flex-col w-full">
                          <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase">
                            ADİSYON TUTARI
                          </span>
                          <div className="flex items-baseline justify-between w-full">
                            <span className="text-base 2xl:text-lg font-black font-mono text-emerald-400 tabular-nums tracking-tight">
                              {formatPara(masa.aktif_hesap_tutari || 0)}
                            </span>
                            {masa.garson_adi && (
                              <span className="text-[10px] font-mono text-slate-400 truncate max-w-[70px]">
                                👤 {masa.garson_adi}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full text-slate-400 text-xs font-mono">
                          <span className="flex items-center gap-1">
                            <Users size={13} className="text-slate-400" />
                            <span>{masa.kapasite || 4} Kişilik</span>
                          </span>
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            AÇIK
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Masa Birleşti İkonu */}
                    {birlestiMi && (
                      <div 
                        className="absolute bottom-2 right-2 p-1 bg-amber-500/20 border border-amber-500/50 rounded-md text-amber-300 shadow-md"
                        title="Bu masa başka bir masa ile birleşmiştir"
                      >
                        <Link2 size={12} />
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Toplu Masa Oluşturma Modalı (Admin için her an erişilebilir) */}
      <AnimatePresence>
        {topluModalAcik && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#0C1017] border border-[#1E2436] rounded-2xl w-full max-w-md p-6 shadow-2xl relative"
            >
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1A2234]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="text-base font-black font-mono text-white uppercase">Toplu Masa Oluştur</h3>
                </div>
                <button
                  onClick={() => setTopluModalAcik(false)}
                  className="w-8 h-8 rounded-lg bg-[#141926] hover:bg-[#1E2436] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Hedef Bölüm</label>
                  <select
                    value={(seciliBolum !== 'tum' ? parseInt(seciliBolum, 10) : (seciliHedefBolumId || bolumler[0]?.id)) || ''}
                    onChange={e => setSeciliHedefBolumId(parseInt(e.target.value, 10))}
                    className="w-full h-12 px-4 bg-[#141926] border border-[#222C42] focus:border-emerald-500/60 rounded-xl text-sm font-mono font-bold text-white focus:outline-none transition-colors"
                  >
                    {bolumler.map(b => (
                      <option key={b.id} value={b.id} className="bg-[#0C1017] text-white">
                        {b.ad}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Masa Öneki (Örn: S)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={onek}
                      onChange={e => setOnek(e.target.value)}
                      placeholder="Örn: S veya M"
                      className="w-full h-12 px-4 bg-[#141926] border border-[#222C42] focus:border-emerald-500/60 rounded-xl text-sm font-mono font-bold text-white uppercase focus:outline-none transition-colors"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">Önizleme:</span>
                      <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/20">
                        {onek.trim() || 'M'} 1
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Masa Sayısı</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={masaSayisi}
                    onChange={e => setMasaSayisi(parseInt(e.target.value) || 1)}
                    className="w-full h-12 px-4 bg-[#141926] border border-[#222C42] focus:border-emerald-500/60 rounded-xl text-sm font-mono font-bold text-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-[#1A2234]">
                  <button
                    onClick={() => setTopluModalAcik(false)}
                    className="h-11 px-4 rounded-xl bg-[#141926] hover:bg-[#1E2436] text-slate-400 hover:text-white font-mono text-xs font-bold transition-colors"
                  >
                    İptal
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleTopluMasaOlustur}
                    disabled={olusturuluyor || !onek.trim() || masaSayisi < 1}
                    className="h-11 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#1A2234] disabled:text-slate-500 text-white font-mono text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {olusturuluyor ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Oluşturuluyor...</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>Oluştur</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
