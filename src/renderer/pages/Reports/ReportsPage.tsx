import React, { useState, useEffect, useMemo } from 'react'
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  Users, 
  Receipt, 
  Calendar, 
  Download, 
  RefreshCw, 
  Search, 
  AlertTriangle, 
  Layers, 
  PieChart as PieIcon, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  FileSpreadsheet, 
  CreditCard, 
  Banknote, 
  BookOpen, 
  ShieldAlert,
  ChevronRight,
  ArrowRight,
  Filter,
  Activity,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useIPC, ipcInvoke } from '../../hooks/useIPC'
import { RAPOR_KANALLARI } from '../../../common/ipc-channels'
import { formatPara, formatMiktar } from '../../utils/formatters'
import { useToast } from '../../components/ui/Toast'
import { useNavigate } from 'react-router-dom'
import type { 
  GunlukSatisOzeti, 
  UrunSatisRaporu, 
  SaatlikSatisDagilimi, 
  OdemeTipiDagilimi, 
  KritikStokRaporu 
} from '../../../common/types/report.types'

// Endüstriyel Renk Paleti (GEMINI.md uyumlu: Koyu charcoal, Fonksiyonel Yeşil, Sarı, Kırmızı, Mavi)
const DONUT_RENKLERI = ['#10B981', '#9A5F48', '#F59E0B', '#8A8178', '#EC4899', '#06B6D4']

export default function ReportsPage() {
  const navigate = useNavigate()
  const { success, error, info } = useToast()

  // Tarih Filtresi Durumu
  const [zamanFiltresi, setZamanFiltresi] = useState<'bugun' | 'buhafta' | 'buay' | 'ozel'>('bugun')
  const [ozelBaslangic, setOzelBaslangic] = useState<string>(() => {
    const d = new Date()
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  })
  const [ozelBitis, setOzelBitis] = useState<string>(() => {
    const d = new Date()
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  })

  const [yukleniyor, setYukleniyor] = useState(false)
  const [aktifSekme, setAktifSekme] = useState<'genel' | 'urunler' | 'odemeler' | 'stok'>('genel')
  const [urunArama, setUrunArama] = useState('')
  const [urunSiralama, setUrunSiralama] = useState<'ciro' | 'adet' | 'kar' | 'maliyet'>('ciro')

  // Rapor State'leri
  const [ozet, setOzet] = useState<GunlukSatisOzeti>({
    tarih: '',
    toplam_ciro: 0,
    toplam_maliyet: 0,
    net_kar: 0,
    kar_marji: 0,
    toplam_hesap: 0,
    ortalama_hesap: 0,
    nakit_toplam: 0,
    kart_toplam: 0,
    acik_hesap_toplam: 0,
    diger_toplam: 0,
    iptal_tutar: 0,
    ikram_tutar: 0,
    indirim_tutar: 0,
  })

  const [zamanSerisi, setZamanSerisi] = useState<SaatlikSatisDagilimi[]>([])
  const [urunRaporu, setUrunRaporu] = useState<UrunSatisRaporu[]>([])
  const [odemeDagilimi, setOdemeDagilimi] = useState<OdemeTipiDagilimi[]>([])
  const [kritikStoklar, setKritikStoklar] = useState<KritikStokRaporu[]>([])

  // Tarih aralığını hesapla
  const getAktifTarihAraligi = () => {
    const bugun = new Date()
    const bitis = new Date(bugun.getTime() - bugun.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
    let baslangic = bitis

    if (zamanFiltresi === 'buhafta') {
      const haftaninBaslangici = new Date(bugun)
      const day = haftaninBaslangici.getDay() || 7
      haftaninBaslangici.setDate(bugun.getDate() - day + 1)
      baslangic = new Date(haftaninBaslangici.getTime() - haftaninBaslangici.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
    } else if (zamanFiltresi === 'buay') {
      const ayinBaslangici = new Date(bugun.getFullYear(), bugun.getMonth(), 1)
      baslangic = new Date(ayinBaslangici.getTime() - ayinBaslangici.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
    } else if (zamanFiltresi === 'ozel') {
      baslangic = ozelBaslangic
      return { baslangic: ozelBaslangic, bitis: ozelBitis }
    }

    return { baslangic, bitis }
  }

  // Tüm Rapor Verilerini Çek
  const raporVerileriniYukle = async () => {
    setYukleniyor(true)
    const { baslangic, bitis } = getAktifTarihAraligi()

    try {
      // 1. Finansal Genel Özet
      const ozetRes = await ipcInvoke<GunlukSatisOzeti>(RAPOR_KANALLARI.GUNLUK_OZET, baslangic, bitis)
      if (ozetRes) setOzet(ozetRes)

      // 2. Zaman Serisi Grafiği (Ciro, Maliyet, Kâr)
      const zamanRes = await ipcInvoke<SaatlikSatisDagilimi[]>(RAPOR_KANALLARI.SAATLIK_DAGILIM, baslangic, bitis)
      if (zamanRes && Array.isArray(zamanRes)) setZamanSerisi(zamanRes)

      // 3. Ürün & Reçete Performansı
      const urunRes = await ipcInvoke<UrunSatisRaporu[]>(RAPOR_KANALLARI.URUN_RAPORU, baslangic, bitis)
      if (urunRes && Array.isArray(urunRes)) setUrunRaporu(urunRes)

      // 4. Kasa & Ödeme Tipi Dağılımı
      const odemeRes = await ipcInvoke<OdemeTipiDagilimi[]>(RAPOR_KANALLARI.KASA_RAPORU, baslangic, bitis)
      if (odemeRes && Array.isArray(odemeRes)) setOdemeDagilimi(odemeRes)

      // 5. Kritik Stok & Hammadde Raporu
      const stokRes = await ipcInvoke<KritikStokRaporu[]>(RAPOR_KANALLARI.STOK_RAPORU)
      if (stokRes && Array.isArray(stokRes)) {
        setKritikStoklar(stokRes.filter(s => s.stok_durumu !== 'normal'))
      }
    } catch (err: any) {
      console.error('Rapor verisi yükleme hatası:', err)
      error('Hata', 'Rapor verileri alınırken sorun oluştu.')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    raporVerileriniYukle()
  }, [zamanFiltresi, ozelBaslangic, ozelBitis])

  // Dışa Aktar (Excel XLSX / CSV)
  const handleExport = async (tip: 'satis' | 'urun' | 'stok', format: 'xlsx' | 'csv') => {
    try {
      const { baslangic, bitis } = getAktifTarihAraligi()
      const res = await ipcInvoke<any>(RAPOR_KANALLARI.DISA_AKTAR, tip, format, baslangic, bitis)
      if (res && res.basarili) {
        success('Dışa Aktarım Başarılı', `Rapor dosyası kaydedildi:\n${res.dosya_yolu}`)
      } else if (res && res.hata !== 'İptal edildi') {
        error('Hata', res.hata || 'Dışa aktarım yapılamadı.')
      }
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  // Filtrelenmiş ve Sıralanmış Ürün Raporu
  const filtrelenmisUrunler = useMemo(() => {
    return urunRaporu
      .filter(u => {
        if (!urunArama.trim()) return true
        const q = urunArama.toLowerCase().trim()
        return (u.urun_adi || '').toLowerCase().includes(q) || (u.kategori_adi || '').toLowerCase().includes(q)
      })
      .sort((a, b) => {
        if (urunSiralama === 'ciro') return b.toplam_ciro - a.toplam_ciro
        if (urunSiralama === 'adet') return b.satis_adedi - a.satis_adedi
        if (urunSiralama === 'kar') return b.net_kar - a.net_kar
        if (urunSiralama === 'maliyet') return b.toplam_maliyet - a.toplam_maliyet
        return 0
      })
  }, [urunRaporu, urunArama, urunSiralama])

  // Özel Tooltip Formatlayıcı (Recharts)
  const CustomGraphTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#171410] border border-[#322C26] rounded-xl p-3.5 shadow-xl font-mono text-xs z-50">
          <p className="text-slate-400 font-bold mb-2 pb-1 border-b border-[#322C26]">
            {label} Akışı
          </p>
          <div className="flex flex-col gap-1.5">
            {payload.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
                  <span className="text-slate-300 font-medium">{p.name}:</span>
                </div>
                <span className="text-white font-black tabular-nums">{formatPara(p.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0A08] text-slate-100 min-h-screen select-none -m-4 lg:-m-6 p-4 lg:p-6 gap-4 overflow-hidden">
      
      {/* 1. ÜST BAŞLIK & FİLTRELEME & DIŞA AKTARIM ARAÇ ÇUBUĞU */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 pb-3 border-b border-[#322C26] shrink-0">
        
        {/* Başlık ve Durum Rozeti */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#1e1a16] border border-[#322C26] flex items-center justify-center text-cyan-400 shadow-md">
            <Activity size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg lg:text-xl font-black tracking-tight text-white font-mono uppercase">
                İŞLETME FİNANS & STOK PANELİ
              </h1>
              <span className="text-[10px] font-mono font-bold bg-[#1E1A16] text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded uppercase">
                DENETİM & ANALİTİK
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Net ciro, reçete maliyetleri, kâr marjı analizi ve kritik hammadde durumu
            </p>
          </div>
        </div>

        {/* Tarih Filtreleri & Dışa Aktarma Butonları */}
        <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto justify-between xl:justify-end">
          
          {/* Segmented Time Control */}
          <div className="flex items-center gap-1 bg-[#171410] p-1 rounded-xl border border-[#322C26]">
            <button
              onClick={() => setZamanFiltresi('bugun')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all",
                zamanFiltresi === 'bugun'
                  ? "bg-[#322C26] text-white border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Bugün
            </button>
            <button
              onClick={() => setZamanFiltresi('buhafta')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all",
                zamanFiltresi === 'buhafta'
                  ? "bg-[#322C26] text-white border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Bu Hafta
            </button>
            <button
              onClick={() => setZamanFiltresi('buay')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all",
                zamanFiltresi === 'buay'
                  ? "bg-[#322C26] text-white border border-cyan-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Bu Ay
            </button>
            <button
              onClick={() => setZamanFiltresi('ozel')}
              className={clsx(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all",
                zamanFiltresi === 'ozel'
                  ? "bg-[#322C26] text-cyan-300 border border-cyan-500/50 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Özel Tarih
            </button>
          </div>

          {/* Özel Tarih Seçici Inputs (Seçildiğinde görünür) */}
          {zamanFiltresi === 'ozel' && (
            <div className="flex items-center gap-1.5 bg-[#171410] px-2 py-1 rounded-xl border border-[#322C26]">
              <input
                type="date"
                value={ozelBaslangic}
                onChange={e => setOzelBaslangic(e.target.value)}
                className="bg-[#110F0C] text-xs font-mono text-slate-200 border border-[#3A342C] rounded-lg px-2 py-1 focus:border-cyan-400 focus:outline-none"
              />
              <span className="text-slate-500 text-xs font-mono">-</span>
              <input
                type="date"
                value={ozelBitis}
                onChange={e => setOzelBitis(e.target.value)}
                className="bg-[#110F0C] text-xs font-mono text-slate-200 border border-[#3A342C] rounded-lg px-2 py-1 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          )}

          {/* Dışa Aktarma Butonları */}
          <div className="flex items-center gap-1.5">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport(aktifSekme === 'urunler' ? 'urun' : aktifSekme === 'stok' ? 'stok' : 'satis', 'xlsx')}
              className="h-9 px-3 rounded-xl bg-[#1e1a16] border border-[#3A342C] hover:border-emerald-500/60 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Excel (.xlsx) İndir"
            >
              <FileSpreadsheet size={15} className="text-emerald-400" />
              <span>Excel</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport(aktifSekme === 'urunler' ? 'urun' : aktifSekme === 'stok' ? 'stok' : 'satis', 'csv')}
              className="h-9 px-3 rounded-xl bg-[#1e1a16] border border-[#3A342C] hover:border-slate-500 text-slate-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="CSV İndir"
            >
              <Download size={15} className="text-slate-400" />
              <span>CSV</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={raporVerileriniYukle}
              disabled={yukleniyor}
              className="h-9 w-9 rounded-xl bg-[#1e1a16] border border-[#3A342C] hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 flex items-center justify-center transition-colors"
              title="Yenile"
            >
              <RefreshCw size={15} className={clsx(yukleniyor && "animate-spin text-cyan-400")} />
            </motion.button>
          </div>

        </div>
      </div>

      {/* 2. RAPOR İÇERİK BÖLÜMÜ (SCROLLABLE) */}
      <div className="flex-1 overflow-y-auto pos-scrollbar space-y-4 pr-1 pb-8">
        
        {/* ========================================================================= */}
        {/* 5 GENEL BAKIŞ (KPI) KARTI (TOPLAM CİRO, MALİYET, NET KÂR, ADİSYON, ORTALAMA) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* 1. TOPLAM CİRO */}
          <div className="bg-[#171410] p-3.5 rounded-2xl border border-[#322C26] flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <DollarSign size={18} />
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded uppercase">
                Brüt Gelir
              </span>
            </div>
            <div>
              <p className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Toplam Ciro</p>
              <h3 className="text-xl lg:text-2xl font-mono font-black text-white mt-0.5 tracking-tight tabular-nums">
                {formatPara(ozet.toplam_ciro)}
              </h3>
            </div>
          </div>

          {/* 2. TOPLAM MALİYET */}
          <div className="bg-[#171410] p-3.5 rounded-2xl border border-[#322C26] flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-rose-500/40 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <TrendingDown size={18} />
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded uppercase">
                Reçete Gideri
              </span>
            </div>
            <div>
              <p className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Toplam Maliyet</p>
              <h3 className="text-xl lg:text-2xl font-mono font-black text-rose-400 mt-0.5 tracking-tight tabular-nums">
                {formatPara(ozet.toplam_maliyet)}
              </h3>
            </div>
          </div>

          {/* 3. NET KÂR (CİRO - MALİYET) */}
          <div className="bg-[#171410] p-3.5 rounded-2xl border border-[#322C26] flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <TrendingUp size={18} />
              </div>
              <div className="flex items-center gap-1 text-[10px] font-mono font-black text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded">
                <span>%{ozet.kar_marji} MARJ</span>
              </div>
            </div>
            <div>
              <p className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Net Kâr</p>
              <h3 className="text-xl lg:text-2xl font-mono font-black text-emerald-400 mt-0.5 tracking-tight tabular-nums">
                {formatPara(ozet.net_kar)}
              </h3>
            </div>
          </div>

          {/* 4. TOPLAM SATILAN ADİSYON */}
          <div className="bg-[#171410] p-3.5 rounded-2xl border border-[#322C26] flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Receipt size={18} />
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded uppercase">
                Kapanan
              </span>
            </div>
            <div>
              <p className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Adisyon Sayısı</p>
              <h3 className="text-xl lg:text-2xl font-mono font-black text-white mt-0.5 tracking-tight tabular-nums">
                {ozet.toplam_hesap} <span className="text-xs font-normal text-slate-400">Fiş</span>
              </h3>
            </div>
          </div>

          {/* 5. ORTALAMA MASA / ADİSYON TUTARI */}
          <div className="bg-[#171410] p-3.5 rounded-2xl border border-[#322C26] flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Users size={18} />
              </div>
              <span className="text-[10px] font-mono font-bold text-indigo-300 bg-indigo-950/40 border border-indigo-500/30 px-2 py-0.5 rounded uppercase">
                Masa Başı
              </span>
            </div>
            <div>
              <p className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider">Ortalama Adisyon</p>
              <h3 className="text-xl lg:text-2xl font-mono font-black text-white mt-0.5 tracking-tight tabular-nums">
                {formatPara(ozet.ortalama_hesap)}
              </h3>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* GRAFİK VE ÖDEME DAĞILIMI BÖLÜMÜ (CİRO / MALİYET / KÂR AKIŞI + KASA ÖZETİ) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Sol Panel: Zaman Akışı Recharts Grafiği (Ciro vs Maliyet vs Net Kâr) */}
          <div className="lg:col-span-2 bg-[#171410] p-4 rounded-2xl border border-[#322C26] shadow-xl flex flex-col">
            <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-[#1E1A16]">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-cyan-400" />
                <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
                  Finansal Akış (Ciro, Maliyet & Net Kâr)
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#9A5F48]" /> Ciro
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" /> Maliyet
                </span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Net Kâr
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              {zamanSerisi.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
                  Seçili tarih aralığında satış verisi bulunamadı.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={zamanSerisi} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ciroGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9A5F48" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#9A5F48" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="karGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="maliyetGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E1A16" vertical={false} />
                    <XAxis 
                      dataKey="zaman_etiketi" 
                      stroke="#7A7166" 
                      fontSize={11} 
                      fontFamily="monospace"
                      tickLine={false}
                      axisLine={{ stroke: '#322C26' }}
                    />
                    <YAxis 
                      stroke="#7A7166" 
                      fontSize={11} 
                      fontFamily="monospace"
                      tickLine={false}
                      axisLine={{ stroke: '#322C26' }}
                      tickFormatter={(val) => `₺${val}`} 
                    />
                    <Tooltip content={<CustomGraphTooltip />} />
                    <Area 
                      name="Ciro" 
                      type="monotone" 
                      dataKey="toplam_tutar" 
                      stroke="#9A5F48" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#ciroGrad)" 
                    />
                    <Area 
                      name="Maliyet" 
                      type="monotone" 
                      dataKey="toplam_maliyet" 
                      stroke="#EF4444" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#maliyetGrad)" 
                    />
                    <Area 
                      name="Net Kâr" 
                      type="monotone" 
                      dataKey="net_kar" 
                      stroke="#10B981" 
                      strokeWidth={2.5} 
                      fillOpacity={1} 
                      fill="url(#karGrad)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Sağ Panel: Kasa & Ödeme Tipi Dağılımı (Nakit, Kredi Kartı, Açık Hesap) */}
          <div className="bg-[#171410] p-4 rounded-2xl border border-[#322C26] shadow-xl flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-[#1E1A16]">
              <div className="flex items-center gap-2">
                <Banknote size={18} className="text-amber-400" />
                <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
                  Kasa & Ödeme Dağılımı
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-[#1E1A16] text-slate-300 px-2 py-0.5 rounded">
                Tahsilat Dökümü
              </span>
            </div>

            {/* Ödeme Yöntemleri Kartları & İlerleme Çubukları */}
            <div className="space-y-2.5 flex-1 flex flex-col justify-center">
              
              {/* Nakit */}
              <div className="bg-[#171410] p-3 rounded-xl border border-[#241f1a]">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <Banknote size={16} className="text-emerald-400" />
                    <span className="font-mono text-xs font-bold text-slate-200">Nakit Ödeme</span>
                  </div>
                  <span className="font-mono text-xs font-black text-emerald-400 tabular-nums">
                    {formatPara(ozet.nakit_toplam)}
                  </span>
                </div>
                <div className="w-full bg-[#1E1A16] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${ozet.toplam_ciro > 0 ? Math.min(100, (ozet.nakit_toplam / ozet.toplam_ciro) * 100) : 0}%` }}
                  />
                </div>
              </div>

              {/* Kredi Kartı */}
              <div className="bg-[#171410] p-3 rounded-xl border border-[#241f1a]">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <CreditCard size={16} className="text-cyan-400" />
                    <span className="font-mono text-xs font-bold text-slate-200">Kredi Kartı / POS</span>
                  </div>
                  <span className="font-mono text-xs font-black text-cyan-400 tabular-nums">
                    {formatPara(ozet.kart_toplam)}
                  </span>
                </div>
                <div className="w-full bg-[#1E1A16] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-cyan-400 h-full rounded-full transition-all"
                    style={{ width: `${ozet.toplam_ciro > 0 ? Math.min(100, (ozet.kart_toplam / ozet.toplam_ciro) * 100) : 0}%` }}
                  />
                </div>
              </div>

              {/* Açık Hesap (Veresiye / Cari) */}
              <div className="bg-[#171410] p-3 rounded-xl border border-[#241f1a]">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-amber-400" />
                    <span className="font-mono text-xs font-bold text-slate-200">Açık Hesap (Veresiye)</span>
                  </div>
                  <span className="font-mono text-xs font-black text-amber-400 tabular-nums">
                    {formatPara(ozet.acik_hesap_toplam)}
                  </span>
                </div>
                <div className="w-full bg-[#1E1A16] h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-400 h-full rounded-full transition-all"
                    style={{ width: `${ozet.toplam_ciro > 0 ? Math.min(100, (ozet.acik_hesap_toplam / ozet.toplam_ciro) * 100) : 0}%` }}
                  />
                </div>
              </div>

            </div>

            {/* İndirim & İkram & İptal Dipnotu */}
            <div className="mt-3 pt-2.5 border-t border-[#1E1A16] grid grid-cols-3 gap-1 text-center font-mono text-[11px]">
              <div>
                <span className="text-slate-500 block text-[10px]">İndirim</span>
                <span className="text-rose-400 font-bold tabular-nums">-{formatPara(ozet.indirim_tutar)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">İkram</span>
                <span className="text-purple-400 font-bold tabular-nums">{formatPara(ozet.ikram_tutar)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">İptal</span>
                <span className="text-slate-400 font-bold tabular-nums">{formatPara(ozet.iptal_tutar)}</span>
              </div>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* ALT BÖLÜM: ÜRÜN & REÇETE PERFORMANSI TABLOSU + KRİTİK STOK UYARILARI */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Sol Panel (2 Kolon): ÜRÜN & REÇETE PERFORMANS TABLOSU */}
          <div className="lg:col-span-2 bg-[#171410] p-4 rounded-2xl border border-[#322C26] shadow-xl flex flex-col">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 pb-3 border-b border-[#1E1A16]">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-emerald-400" />
                <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
                  Ürün & Reçete Performans Analizi
                </h3>
              </div>

              {/* Arama ve Sıralama */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={urunArama}
                    onChange={e => setUrunArama(e.target.value)}
                    placeholder="Ürün veya kategori ara..."
                    className="w-full bg-[#110F0C] border border-[#3A342C] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-400 focus:outline-none placeholder:text-slate-600"
                  />
                </div>

                <select
                  value={urunSiralama}
                  onChange={e => setUrunSiralama(e.target.value as any)}
                  className="bg-[#110F0C] border border-[#3A342C] rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-cyan-400 focus:outline-none"
                >
                  <option value="ciro">Ciroya Göre</option>
                  <option value="adet">Satış Adedine Göre</option>
                  <option value="kar">Net Kâra Göre</option>
                  <option value="maliyet">Maliyete Göre</option>
                </select>
              </div>
            </div>

            {/* Performans Tablosu */}
            <div className="overflow-x-auto pos-scrollbar max-h-96 min-h-[220px]">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-[#1E1A16] text-[11px] text-slate-400 uppercase bg-[#171410]">
                    <th className="py-2.5 px-3">Ürün</th>
                    <th className="py-2.5 px-2 text-center">Adet</th>
                    <th className="py-2.5 px-3 text-right">Ciro</th>
                    <th className="py-2.5 px-3 text-right">Reçete Maliyeti</th>
                    <th className="py-2.5 px-3 text-right">Net Kâr</th>
                    <th className="py-2.5 px-2 text-center">Marj</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e1a16]">
                  {filtrelenmisUrunler.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-mono">
                        Satış kaydı bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filtrelenmisUrunler.map((u) => (
                      <tr key={u.urun_id} className="hover:bg-[#1e1a16] transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-100">{u.urun_adi}</span>
                            <span className="text-[10px] text-slate-500">{u.kategori_adi}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-200 tabular-nums">
                          {u.satis_adedi}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-cyan-300 tabular-nums">
                          {formatPara(u.toplam_ciro)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-400 tabular-nums">
                          {formatPara(u.toplam_maliyet)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-emerald-400 tabular-nums">
                          {formatPara(u.net_kar)}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span className={clsx(
                            "px-2 py-0.5 rounded text-[10px] font-bold tabular-nums",
                            u.kar_marji >= 60 ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40" :
                            u.kar_marji >= 30 ? "bg-amber-950/60 text-amber-300 border border-amber-500/40" :
                            "bg-rose-950/60 text-rose-300 border border-rose-500/40"
                          )}>
                            %{u.kar_marji}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Sağ Panel (1 Kolon): KRİTİK STOK VE HAMMADDE UYARI PANELİ */}
          <div className="bg-[#171410] p-4 rounded-2xl border border-[#322C26] shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-[#1E1A16]">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-rose-400" />
                  <h3 className="font-mono font-bold text-sm text-slate-100 uppercase tracking-wider">
                    Kritik Stok Uyarısı
                  </h3>
                </div>
                <button
                  onClick={() => navigate('/inventory')}
                  className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5"
                >
                  Stok & Menü <ChevronRight size={12} />
                </button>
              </div>

              {/* Kritik Stok Listesi */}
              <div className="space-y-2 max-h-96 overflow-y-auto pos-scrollbar pr-0.5">
                {kritikStoklar.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center text-slate-500">
                    <CheckCircle2 size={32} className="text-emerald-400 mb-2 opacity-80" />
                    <p className="text-xs font-mono font-bold text-slate-300">Tüm Stoklar Yeterli</p>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                      Minimum seviyenin altına inen hammadde bulunmuyor.
                    </p>
                  </div>
                ) : (
                  kritikStoklar.map((ham) => (
                    <div 
                      key={ham.hammadde_id}
                      className="bg-[#171410] p-2.5 rounded-xl border border-[#322C26] flex items-center justify-between gap-2"
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-white truncate">{ham.hammadde_adi}</span>
                          {ham.stok_durumu === 'tukendi' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-950 text-rose-300 border border-rose-600">
                              TÜKENDİ
                            </span>
                          )}
                          {ham.stok_durumu === 'kritik' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-950 text-red-300 border border-red-500">
                              KRİTİK
                            </span>
                          )}
                          {ham.stok_durumu === 'dusuk' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-500">
                              DÜŞÜK
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 mt-0.5">
                          Min Eşik: {formatMiktar(ham.min_stok)} {ham.birim} {ham.tedarikci ? `• ${ham.tedarikci}` : ''}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-black text-rose-400 block tabular-nums">
                          {formatMiktar(ham.mevcut_stok)} {ham.birim}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          Eksik: {formatMiktar(ham.eksik_miktar)} {ham.birim}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Alt Kısayol */}
            <div className="mt-3 pt-2.5 border-t border-[#1E1A16]">
              <button
                onClick={() => navigate('/inventory')}
                className="w-full h-9 rounded-xl bg-[#1E1A16] border border-cyan-500/30 hover:border-cyan-500/60 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Hammadde Stok Girişi Yap</span>
                <ArrowRight size={14} />
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
