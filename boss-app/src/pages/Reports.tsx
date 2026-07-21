import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { Calendar } from 'lucide-react'

const KATEGORI_DATA = [
  { name: 'Ana Yemekler', value: 18500, color: '#3b82f6' },
  { name: 'İçecekler', value: 8200, color: '#10b981' },
  { name: 'Tatlılar', value: 4300, color: '#f59e0b' },
  { name: 'Başlangıçlar', value: 6100, color: '#8b5cf6' },
]

export default function Reports() {
  const toplam = KATEGORI_DATA.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Satış Raporları</h2>
        
        <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-medium hover:bg-slate-50 transition-colors w-full sm:w-auto">
          <Calendar size={18} />
          <span>Bugün</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Kategori Dağılımı (Pasta Grafik) */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2">Kategori Dağılımı</h3>
          <p className="text-sm text-slate-500 mb-6">Satışların kategorilere göre oranı</p>
          
          <div className="flex-1 min-h-[250px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={KATEGORI_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {KATEGORI_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: any) => `₺${Number(value).toLocaleString('tr-TR')}`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-slate-400 font-medium">Toplam</span>
              <span className="text-xl font-black text-slate-800">
                ₺{toplam >= 1000 ? (toplam/1000).toFixed(1) + 'k' : toplam}
              </span>
            </div>
          </div>
        </div>

        {/* Detaylı Liste */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Detaylı Kategori Satışları</h3>
          
          <div className="space-y-4">
            {KATEGORI_DATA.sort((a,b) => b.value - a.value).map((kategori, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${kategori.color}20`, color: kategori.color }}>
                  <span className="font-bold">%{((kategori.value / toplam) * 100).toFixed(0)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-slate-700">{kategori.name}</span>
                    <span className="font-bold text-slate-900">₺{kategori.value.toLocaleString('tr-TR')}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${(kategori.value / toplam) * 100}%`, backgroundColor: kategori.color }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
