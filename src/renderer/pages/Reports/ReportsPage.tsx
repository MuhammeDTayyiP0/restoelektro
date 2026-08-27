import React, { useState, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts'
import { 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  FileSpreadsheet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  BarChart2,
  PieChart as PieIcon,
  Activity,
  Layers
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import { useIPC, ipcInvoke } from '../../hooks/useIPC'
import { RAPOR_KANALLARI, MASA_KANALLARI } from '../../../common/ipc-channels'
import { formatPara } from '../../utils/formatters'
import { useToast } from '../../components/ui/Toast'

// Endüstriyel POS Grafik Renk Paleti (AI Mor/Gökkuşağı yerine profesyonel POS renkleri)
const GRAFIK_RENKLERI = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#06B6D4', '#EC4899', '#8B5CF6']

export default function ReportsPage() {
  const [zamanAraligi, setZamanAraligi] = useState<'bugun' | 'buhafta' | 'buay'>('bugun')
  const [yukleniyor, setYukleniyor] = useState(false)
  const { success, error } = useToast()

  const [istatistikler, setIstatistikler] = useState({
    toplamSatis: 0,
    toplamSiparis: 0,
    ortalamaSepet: 0,
    aktifMasalar: 0
  })

  const [satisGrafigi, setSatisGrafigi] = useState<{saat: string, satis: number}[]>([])
  const [kategoriDagilimi, setKategoriDagilimi] = useState<{name: string, value: number}[]>([])
  const [personelSatis, setPersonelSatis] = useState<{ad: string, satis: number}[]>([])

  // Tarih aralığını hesapla
  const getTarihAraligi = (aralik: string) => {
    const bugun = new Date()
    const bitis = new Date(bugun.getTime() - (bugun.getTimezoneOffset() * 60000)).toISOString().slice(0, 10)
    let baslangic = bitis

    if (aralik === 'buhafta') {
      const haftaninBaslangici = new Date(bugun)
      const day = haftaninBaslangici.getDay() || 7 // Pazartesi 1, Pazar 7
      haftaninBaslangici.setDate(bugun.getDate() - day + 1)
      baslangic = new Date(haftaninBaslangici.getTime() - (haftaninBaslangici.getTimezoneOffset() * 60000)).toISOString().slice(0, 10)
    } else if (aralik === 'buay') {
      const ayinBaslangici = new Date(bugun.getFullYear(), bugun.getMonth(), 1)
      baslangic = new Date(ayinBaslangici.getTime() - (ayinBaslangici.getTimezoneOffset() * 60000)).toISOString().slice(0, 10)
    }

    return { baslangic, bitis }
  }

  // Verileri veritabanından çek
  const verileriGetir = async () => {
    setYukleniyor(true)
    const { baslangic, bitis } = getTarihAraligi(zamanAraligi)

    try {
      // 1. Günlük/Genel Özet
      const ozet = await ipcInvoke(RAPOR_KANALLARI.GUNLUK_OZET, baslangic, bitis)
      
      // 2. Aktif Masalar (Mevcut anlık durum)
      const masalar = await ipcInvoke(MASA_KANALLARI.MASALAR)
      const aktifMasaSayisi = masalar ? masalar.filter((m: any) => m.durum === 'dolu' || !!m.aktif_hesap_id).length : 0

      if (ozet) {
        setIstatistikler({
          toplamSatis: ozet.toplam_ciro || 0,
          toplamSiparis: ozet.toplam_hesap || 0,
          ortalamaSepet: ozet.ortalama_hesap || 0,
          aktifMasalar: aktifMasaSayisi
        })
      }

      // 3. Saatlik/Günlük Satış Dağılımı
      const dagilim = await ipcInvoke(RAPOR_KANALLARI.SAATLIK_DAGILIM, baslangic, bitis)
      if (dagilim && Array.isArray(dagilim)) {
        setSatisGrafigi(dagilim.map(d => ({
          saat: d.zaman_etiketi,
          satis: d.toplam_tutar
        })))
      }

      // 4. Kategori Satış Dağılımı
      const kategoriler = await ipcInvoke(RAPOR_KANALLARI.KATEGORI_RAPORU, baslangic, bitis)
      if (kategoriler && Array.isArray(kategoriler)) {
        setKategoriDagilimi(kategoriler.map(k => ({
          name: k.kategori_adi,
          value: k.toplam_tutar
        })))
      }

      // 5. Personel Performansı
      const personel = await ipcInvoke(RAPOR_KANALLARI.PERSONEL_RAPORU, baslangic, bitis)
      if (personel && Array.isArray(personel)) {
        setPersonelSatis(personel.map(p => ({
          ad: p.personel_adi,
          satis: p.toplam_satis
        })))
      }

    } catch (err) {
      console.error("Rapor verileri çekilemedi:", err)
      error("Hata", "Rapor verileri yüklenirken bir sorun oluştu.")
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    verileriGetir()
  }, [zamanAraligi])

  // Gerçek Dışa Aktarım (Excel/CSV Export)
  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      const { baslangic, bitis } = getTarihAraligi(zamanAraligi)
      const response = await ipcInvoke(RAPOR_KANALLARI.DISA_AKTAR, 'satis', format, baslangic, bitis)
      
      if (response && response.basarili) {
        success('Dışa Aktarım Başarılı', `Rapor ${format.toUpperCase()} formatında kaydedildi:\n${response.dosya_yolu}`)
      } else {
        error('Dışa Aktarım Hatası', response?.hata || 'Bilinmeyen bir hata oluştu.')
      }
    } catch (err) {
      error('Hata', 'Dışa aktarma işlemi sırasında bir hata oluştu.')
    }
  }

  // Özel Recharts Tooltip Formatlayıcı
  const CustomTooltip = ({ active, payload, label, prefix = '₺', suffix = '' }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0E121E]/95 border border-[#222C42] rounded-xl p-3 shadow-2xl backdrop-blur-md font-mono text-xs">
          <p className="text-slate-400 font-bold mb-1">{label}</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].color || payload[0].fill || '#3B82F6' }} />
            <span className="text-white font-black text-sm">
              {prefix}{Number(payload[0].value).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}{suffix}
            </span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#090A0F] text-slate-100 min-h-screen select-none -m-4 lg:-m-6 p-4 lg:p-6 gap-5 overflow-hidden">
      
      {/* 1. ÜST BAŞLIK & FİLTRE / EXPORT ARAÇ ÇUBUĞU */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-[#1A2234] shrink-0">
        
        {/* Sol Taraf: Başlık & Açıklama */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#121724] border border-[#232F47] flex items-center justify-center text-sky-400 shadow-sm">
            <Activity size={24} />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-black tracking-tight text-white font-mono uppercase flex items-center gap-2">
              İŞLETME RAPORLARI
              <span className="text-[10px] font-mono font-bold bg-[#141926] text-sky-400 border border-[#222C42] px-2 py-0.5 rounded-full">
                ANALİTİK
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono">
              Finansal ciro, saatlik satış akışı ve personel performansı
            </p>
          </div>
        </div>

        {/* Sağ Taraf: Zaman Filtresi & Dışa Aktar */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end flex-wrap">
          
          {/* Segmented Time Control */}
          <div className="flex items-center gap-1 bg-[#0C1017] p-1 rounded-xl border border-[#1A2234]">
            <button
              onClick={() => setZamanAraligi('bugun')}
              className={clsx(
                "px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all",
                zamanAraligi === 'bugun'
                  ? "bg-[#1E293B] text-white shadow-sm border border-slate-600/50"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Bugün
            </button>
            <button
              onClick={() => setZamanAraligi('buhafta')}
              className={clsx(
                "px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all",
                zamanAraligi === 'buhafta'
                  ? "bg-[#1E293B] text-white shadow-sm border border-slate-600/50"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Bu Hafta
            </button>
            <button
              onClick={() => setZamanAraligi('buay')}
              className={clsx(
                "px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all",
                zamanAraligi === 'buay'
                  ? "bg-[#1E293B] text-white shadow-sm border border-slate-600/50"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              Bu Ay
            </button>
          </div>

          {/* Dışa Aktarma Butonları */}
          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport('excel')}
              className="h-9 px-3 rounded-xl bg-[#121724] border border-[#222C42] hover:border-emerald-500/50 text-emerald-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Excel Olarak İndir"
            >
              <FileSpreadsheet size={15} className="text-emerald-400" />
              <span>Excel</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => handleExport('csv')}
              className="h-9 px-3 rounded-xl bg-[#121724] border border-[#222C42] hover:border-slate-500 text-slate-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="CSV Olarak İndir"
            >
              <Download size={15} className="text-slate-400" />
              <span>CSV</span>
            </motion.button>

            {/* Yenile */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={verileriGetir}
              disabled={yukleniyor}
              className="h-9 w-9 rounded-xl bg-[#121724] border border-[#222C42] hover:border-slate-500 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              title="Verileri Yenile"
            >
              <RefreshCw size={15} className={clsx(yukleniyor && "animate-spin text-sky-400")} />
            </motion.button>
          </div>

        </div>
      </div>

      {/* 2. RAPOR İÇERİĞİ (KAYDIRILABİLİR ALAN) */}
      <div className="flex-1 overflow-y-auto pos-scrollbar space-y-5 pb-8 pr-1">
        
        {/* KPI (ÖZET) KARTLARI (INDUSTRIAL METRIC GRID) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Toplam Ciro */}
          <div className="bg-[#0E121E] p-4 rounded-2xl border border-[#1E2538] flex flex-col justify-between relative overflow-hidden shadow-lg group hover:border-sky-500/40 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <DollarSign size={20} />
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                <ArrowUpRight size={13} />
                <span>+12.5%</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">Toplam Ciro</p>
              <h3 className="text-2xl lg:text-3xl font-mono font-black text-white mt-1 tracking-tight">
                {formatPara(istatistikler.toplamSatis)}
              </h3>
            </div>
          </div>

          {/* Tamamlanan Sipariş / Hesap */}
          <div className="bg-[#0E121E] p-4 rounded-2xl border border-[#1E2538] flex flex-col justify-between relative overflow-hidden shadow-lg group hover:border-emerald-500/40 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Package size={20} />
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                <ArrowUpRight size={13} />
                <span>+5.2%</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">Kapanan Hesap</p>
              <h3 className="text-2xl lg:text-3xl font-mono font-black text-white mt-1 tracking-tight">
                {istatistikler.toplamSiparis} <span className="text-sm font-normal text-slate-400">Adisyon</span>
              </h3>
            </div>
          </div>

          {/* Ortalama Sepet */}
          <div className="bg-[#0E121E] p-4 rounded-2xl border border-[#1E2538] flex flex-col justify-between relative overflow-hidden shadow-lg group hover:border-amber-500/40 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <TrendingUp size={20} />
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-rose-400 bg-rose-950/40 border border-rose-500/30 px-2 py-0.5 rounded-lg">
                <ArrowDownRight size={13} />
                <span>-1.4%</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">Ortalama Adisyon</p>
              <h3 className="text-2xl lg:text-3xl font-mono font-black text-white mt-1 tracking-tight">
                {formatPara(istatistikler.ortalamaSepet)}
              </h3>
            </div>
          </div>

          {/* Anlık Aktif Masa */}
          <div className="bg-[#0E121E] p-4 rounded-2xl border border-[#1E2538] flex flex-col justify-between relative overflow-hidden shadow-lg group hover:border-indigo-500/40 transition-colors">
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Users size={20} />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-sky-400 bg-sky-950/40 border border-sky-500/30 px-2 py-0.5 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>CANLI</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">Aktif Açık Masa</p>
              <h3 className="text-2xl lg:text-3xl font-mono font-black text-white mt-1 tracking-tight">
                {istatistikler.aktifMasalar} <span className="text-sm font-normal text-slate-400">Masa</span>
              </h3>
            </div>
          </div>

        </div>

        {/* GRAFİKLER BÖLÜMÜ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          {/* 1. Ana Satış Grafiği (Area / Gradient Line Chart) */}
          <div className="lg:col-span-2 bg-[#0E121E] p-5 rounded-2xl border border-[#1E2538] shadow-xl flex flex-col">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#1A2234]">
              <div className="flex items-center gap-2.5">
                <BarChart2 size={18} className="text-sky-400" />
                <h3 className="font-mono font-bold text-sm lg:text-base text-slate-100 uppercase tracking-wider">
                  Zamana Göre Satış Akışı
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-[#121724] px-2.5 py-1 rounded-lg border border-[#222C42]">
                Saatlik Hacim
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={satisGrafigi} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="satisGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2538" vertical={false} />
                  <XAxis 
                    dataKey="saat" 
                    stroke="#64748B" 
                    fontSize={11} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#1E2538' }}
                  />
                  <YAxis 
                    stroke="#64748B" 
                    fontSize={11} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#1E2538' }}
                    tickFormatter={(val) => `₺${val}`} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="satis" 
                    stroke="#3B82F6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#satisGradient)" 
                    activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Kategori Satış Dağılımı (Modern Donut Chart) */}
          <div className="bg-[#0E121E] p-5 rounded-2xl border border-[#1E2538] shadow-xl flex flex-col justify-between">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-[#1A2234]">
              <div className="flex items-center gap-2.5">
                <PieIcon size={18} className="text-emerald-400" />
                <h3 className="font-mono font-bold text-sm lg:text-base text-slate-100 uppercase tracking-wider">
                  Kategori Dağılımı
                </h3>
              </div>
            </div>

            <div className="h-64 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kategoriDagilimi}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={88}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="#0E121E"
                    strokeWidth={3}
                  >
                    {kategoriDagilimi.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={GRAFIK_RENKLERI[index % GRAFIK_RENKLERI.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    formatter={(val) => <span className="text-xs font-mono text-slate-300 ml-1">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Personel Satış Performansı (Industrial Bar Chart) */}
          <div className="lg:col-span-3 bg-[#0E121E] p-5 rounded-2xl border border-[#1E2538] shadow-xl">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#1A2234]">
              <div className="flex items-center gap-2.5">
                <Users size={18} className="text-amber-400" />
                <h3 className="font-mono font-bold text-sm lg:text-base text-slate-100 uppercase tracking-wider">
                  Personel Satış & Ciro Performansı
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-[#121724] px-2.5 py-1 rounded-lg border border-[#222C42]">
                Personel Bazlı
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={personelSatis} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2538" vertical={false} />
                  <XAxis 
                    dataKey="ad" 
                    stroke="#64748B" 
                    fontSize={11} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#1E2538' }}
                  />
                  <YAxis 
                    stroke="#64748B" 
                    fontSize={11} 
                    fontFamily="monospace"
                    tickLine={false}
                    axisLine={{ stroke: '#1E2538' }}
                    tickFormatter={(val) => `₺${val}`} 
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }} />
                  <Bar dataKey="satis" radius={[6, 6, 0, 0]} barSize={36}>
                    {personelSatis.map((_, index) => (
                      <Cell key={`bar-${index}`} fill={GRAFIK_RENKLERI[(index + 1) % GRAFIK_RENKLERI.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

