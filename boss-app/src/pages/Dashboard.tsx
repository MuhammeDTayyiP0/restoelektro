import { useEffect, useState } from 'react'
import { 
  Users, 
  Receipt, 
  CreditCard, 
  ArrowUpRight, 
  BarChart3,
  Activity
} from 'lucide-react'


// Mock Data (Geliştirici / Demo Verisi)
const MOCK_DATA = {
  toplam_ciro: 45250.00,
  kapanan_hesap: 142,
  acik_hesap: 18,
  toplam_masa: 28,
  ortalama_hesap: 318.66,
  ciro_degisim: +12.5,
  saatlik: [
    { saat: 10, tutar: 1200 },
    { saat: 11, tutar: 3500 },
    { saat: 12, tutar: 8400 },
    { saat: 13, tutar: 9200 },
    { saat: 14, tutar: 4500 },
    { saat: 15, tutar: 3800 },
    { saat: 16, tutar: 5100 },
    { saat: 17, tutar: 9550 },
  ]
}

export default function Dashboard() {
  const [data] = useState(MOCK_DATA)
  const [loading, setLoading] = useState(true)
  const [aktifSaat, setAktifSaat] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 rounded-2xl bg-[#121724] border border-[#222C42] flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  const dolulukOrani = Math.round((data.acik_hesap / data.toplam_masa) * 100)
  const maxTutar = Math.max(...data.saatlik.map(x => x.tutar))

  return (
    <div className="space-y-5 pb-8">
      
      {/* 1. ÜST BAŞLIK & CANLI DURUM SİNYALİ */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#1A2234]">
        <div>
          <h2 className="text-xl lg:text-2xl font-mono font-black text-white uppercase tracking-tight">
            GÜNLÜK YÖNETİCİ ÖZETİ
          </h2>
          <p className="text-xs font-mono text-slate-400">
            {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#0E131F] border border-[#222C42] px-3 py-1.5 rounded-xl shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">CANLI</span>
        </div>
      </div>

      {/* 2. HERO METRİK: ANLIK TOPLAM CİRO */}
      <div className="p-5 lg:p-6 rounded-3xl bg-gradient-to-br from-[#101726] via-[#0E121E] to-[#0A0D15] border border-[#1E273D] shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400 bg-sky-950/50 border border-sky-500/30 px-2.5 py-0.5 rounded-lg">
              Bugünkü Net Ciro
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono font-black text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
            <ArrowUpRight size={15} />
            <span>+{data.ciro_degisim}% düne göre</span>
          </div>
        </div>

        <div className="mt-3">
          <h3 className="text-3xl lg:text-5xl font-mono font-black text-white tracking-tight tabular-nums">
            ₺{data.toplam_ciro.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h3>
        </div>

        {/* Doluluk ve Mini Gösterge */}
        <div className="mt-5 pt-4 border-t border-[#1C2538] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Activity size={15} className="text-amber-400" />
            <span>Restoran Doluluk Oranı: <strong className="text-white">%{dolulukOrani}</strong></span>
            <span className="text-slate-500">({data.acik_hesap}/{data.toplam_masa} Masa)</span>
          </div>
          <div className="w-full sm:w-44 h-2 bg-[#141A28] rounded-full overflow-hidden border border-[#222C42]">
            <div 
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-700" 
              style={{ width: `${dolulukOrani}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. KPI İKİNCİL KARTLAR (3'LÜ GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        
        {/* Kapanan Hesap */}
        <div className="bg-[#0E121E] p-4 rounded-2xl border border-[#1E2538] flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Receipt size={18} />
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-[#141926] px-2 py-0.5 rounded-md border border-[#222C42]">
              Tamamlanan
            </span>
          </div>
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase font-semibold">Kapanan Hesap</p>
            <h4 className="text-2xl font-mono font-black text-white mt-0.5 tracking-tight tabular-nums">
              {data.kapanan_hesap} <span className="text-xs font-normal text-slate-400">Adisyon</span>
            </h4>
          </div>
        </div>

        {/* Açık Masa */}
        <div className="bg-[#0E121E] p-4 rounded-2xl border border-[#1E2538] flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users size={18} />
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-500/30">
              Hizmette
            </span>
          </div>
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase font-semibold">Açık Masalar</p>
            <h4 className="text-2xl font-mono font-black text-white mt-0.5 tracking-tight tabular-nums">
              {data.acik_hesap} <span className="text-xs font-normal text-slate-400">Masa Dolu</span>
            </h4>
          </div>
        </div>

        {/* Ortalama Sepet */}
        <div className="bg-[#0E121E] p-4 rounded-2xl border border-[#1E2538] flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <CreditCard size={18} />
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-[#141926] px-2 py-0.5 rounded-md border border-[#222C42]">
              Adisyon Başı
            </span>
          </div>
          <div>
            <p className="text-xs font-mono text-slate-400 uppercase font-semibold">Ortalama Hesap</p>
            <h4 className="text-2xl font-mono font-black text-white mt-0.5 tracking-tight tabular-nums">
              ₺{data.ortalama_hesap.toFixed(2)}
            </h4>
          </div>
        </div>

      </div>

      {/* 4. SAATLİK SATIŞ TRENDİ (DOKUNMATİK ETKİLEŞİMLİ ÇUBUK GRAFİĞİ) */}
      <div className="bg-[#0E121E] p-5 rounded-3xl border border-[#1E2538] shadow-xl">
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-[#1A2234]">
          <div className="flex items-center gap-2">
            <BarChart3 size={18} className="text-sky-400" />
            <h3 className="font-mono font-bold text-sm lg:text-base text-white uppercase tracking-wider">
              Saatlik Satış Dağılımı
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-[#121724] px-2.5 py-1 rounded-lg border border-[#222C42]">
            Bugün
          </span>
        </div>

        {/* Bar Histogram */}
        <div className="h-56 flex items-end gap-2 sm:gap-4 pt-6 px-1">
          {data.saatlik.map((s, i) => {
            const height = (s.tutar / maxTutar) * 100
            const isHighest = s.tutar === maxTutar
            const isSelected = aktifSaat === s.saat

            return (
              <div 
                key={i} 
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end cursor-pointer group"
                onClick={() => setAktifSaat(aktifSaat === s.saat ? null : s.saat)}
              >
                {/* Tooltip / Tutar Balonu */}
                <div className={`transition-all duration-200 text-[11px] font-mono font-bold py-1 px-2 rounded-lg whitespace-nowrap shadow-lg ${
                  isSelected || isHighest 
                    ? 'bg-sky-500 text-white opacity-100 scale-100' 
                    : 'bg-[#151D2F] text-slate-300 opacity-0 group-hover:opacity-100 -translate-y-1'
                }`}>
                  ₺{s.tutar.toLocaleString('tr-TR')}
                </div>

                {/* Çubuk */}
                <div className="w-full bg-[#121724] rounded-t-xl h-full flex flex-col justify-end overflow-hidden border-t border-x border-[#1A2336]">
                  <div 
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isHighest
                        ? 'bg-gradient-to-t from-sky-600 to-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)]'
                        : isSelected
                          ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                          : 'bg-gradient-to-t from-slate-700 to-slate-500 group-hover:from-sky-700 group-hover:to-sky-500'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>

                {/* Saat Etiketi */}
                <span className={`text-[11px] font-mono font-bold transition-colors ${
                  isSelected || isHighest ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}>
                  {s.saat}:00
                </span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

