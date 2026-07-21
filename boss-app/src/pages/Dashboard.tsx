import { useEffect, useState } from 'react'
import { TrendingUp, Users, Receipt, CreditCard, ArrowUpRight, ArrowDownRight } from 'lucide-react'

// Mock Data
const MOCK_DATA = {
  toplam_ciro: 45250.00,
  kapanan_hesap: 142,
  acik_hesap: 18,
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

  useEffect(() => {
    // Gerçek API entegrasyonu için:
    // axios.get('http://localhost:3847/api/boss/ozet').then(...)
    setTimeout(() => setLoading(false), 800) // Animasyon efekti için bekleme
  }, [])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Günlük Özet</h2>
          <p className="text-sm text-slate-500">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          CANLI
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Toplam Ciro" 
          value={`₺${data.toplam_ciro.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`} 
          icon={<TrendingUp size={24} className="text-blue-500" />}
          trend={data.ciro_degisim}
          color="blue"
        />
        <StatCard 
          title="Kapanan Hesap" 
          value={data.kapanan_hesap.toString()} 
          icon={<Receipt size={24} className="text-emerald-500" />}
          color="emerald"
        />
        <StatCard 
          title="Açık Masa" 
          value={data.acik_hesap.toString()} 
          icon={<Users size={24} className="text-amber-500" />}
          color="amber"
        />
        <StatCard 
          title="Ort. Sepet" 
          value={`₺${data.ortalama_hesap.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`} 
          icon={<CreditCard size={24} className="text-purple-500" />}
          color="purple"
        />
      </div>

      {/* Chart Section */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 mt-8">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Saatlik Satış Trendi</h3>
        <div className="h-64 flex items-end gap-2">
          {data.saatlik.map((s, i) => {
            const max = Math.max(...data.saatlik.map(x => x.tutar))
            const height = (s.tutar / max) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full relative bg-slate-100 rounded-t-lg h-full flex flex-col justify-end">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap pointer-events-none z-10">
                    ₺{s.tutar.toLocaleString('tr-TR')}
                  </div>
                  {/* Bar */}
                  <div 
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-700 hover:brightness-110" 
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-slate-500">{s.saat}:00</span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}

function StatCard({ title, value, icon, trend, color }: { title: string, value: string, icon: React.ReactNode, trend?: number, color: string }) {
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
      <div className={`absolute -right-4 -top-4 w-20 h-20 bg-${color}-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500`}></div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 bg-${color}-50 rounded-2xl`}>
          {icon}
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-2 py-1 rounded-full`}>
            {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="relative z-10">
        <h4 className="text-slate-500 text-sm font-medium mb-1">{title}</h4>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )
}
