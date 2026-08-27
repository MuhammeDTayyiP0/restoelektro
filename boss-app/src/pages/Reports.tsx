import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { PieChart as PieIcon, Layers } from 'lucide-react'
import { clsx } from 'clsx'


const KATEGORI_DATA = [
  { name: 'Ana Yemekler', value: 18500, color: '#3B82F6' },
  { name: 'İçecekler', value: 8200, color: '#10B981' },
  { name: 'Başlangıçlar', value: 6100, color: '#6366F1' },
  { name: 'Tatlılar', value: 4300, color: '#F59E0B' },
  { name: 'Yan Ürünler', value: 2150, color: '#06B6D4' },
]

export default function Reports() {
  const [aralik, setAralik] = useState<'bugun' | 'buhafta' | 'buay'>('bugun')
  const toplam = KATEGORI_DATA.reduce((acc, curr) => acc + curr.value, 0)

  return (
    <div className="space-y-5 pb-8">
      
      {/* 1. ÜST BAŞLIK & ZAMAN SEÇİMİ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1A2234]">
        <div>
          <h2 className="text-xl lg:text-2xl font-mono font-black text-white uppercase tracking-tight">
            SATIŞ RAPORLARI
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Kategori ve ürün grubu bazlı gelir dağılımı
          </p>
        </div>
        
        {/* Segmented Filter */}
        <div className="flex items-center gap-1 bg-[#0C1017] p-1 rounded-xl border border-[#1A2234] self-start sm:self-auto">
          <button
            onClick={() => setAralik('bugun')}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all",
              aralik === 'bugun'
                ? "bg-[#1E293B] text-white shadow-sm border border-slate-600/50"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Bugün
          </button>
          <button
            onClick={() => setAralik('buhafta')}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all",
              aralik === 'buhafta'
                ? "bg-[#1E293B] text-white shadow-sm border border-slate-600/50"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Bu Hafta
          </button>
          <button
            onClick={() => setAralik('buay')}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all",
              aralik === 'buay'
                ? "bg-[#1E293B] text-white shadow-sm border border-slate-600/50"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            Bu Ay
          </button>
        </div>
      </div>

      {/* 2. GRAFİK VE LİSTE BÖLÜMÜ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Kategori Dağılımı (Donut PieChart) */}
        <div className="bg-[#0E121E] p-5 rounded-3xl border border-[#1E2538] shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#1A2234]">
            <div className="flex items-center gap-2">
              <PieIcon size={18} className="text-emerald-400" />
              <h3 className="font-mono font-bold text-sm lg:text-base text-white uppercase tracking-wider">
                Oransal Dağılım
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-[#121724] px-2 py-0.5 rounded-md border border-[#222C42]">
              Gelir Payı
            </span>
          </div>
          
          <div className="h-64 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={KATEGORI_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={88}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="#0E121E"
                  strokeWidth={3}
                >
                  {KATEGORI_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  formatter={(value: any) => [`₺${Number(value).toLocaleString('tr-TR')}`, 'Tutar']}
                  contentStyle={{ 
                    backgroundColor: '#0E121E', 
                    borderColor: '#1E2538', 
                    borderRadius: '12px', 
                    color: '#F1F5F9',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Merkez Toplam Tutarı */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] text-slate-400 font-mono font-semibold uppercase">Toplam</span>
              <span className="text-lg lg:text-xl font-mono font-black text-white">
                ₺{toplam.toLocaleString('tr-TR')}
              </span>
            </div>
          </div>
        </div>

        {/* Detaylı Kategori Sıralaması */}
        <div className="lg:col-span-2 bg-[#0E121E] p-5 rounded-3xl border border-[#1E2538] shadow-xl flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-[#1A2234]">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-sky-400" />
              <h3 className="font-mono font-bold text-sm lg:text-base text-white uppercase tracking-wider">
                Kategori Hasılat Sıralaması
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-[#121724] px-2 py-0.5 rounded-md border border-[#222C42]">
              {KATEGORI_DATA.length} Kategori
            </span>
          </div>
          
          <div className="space-y-4">
            {KATEGORI_DATA.sort((a,b) => b.value - a.value).map((kategori, idx) => {
              const oran = ((kategori.value / toplam) * 100).toFixed(1)

              return (
                <div key={idx} className="bg-[#121724] p-3.5 rounded-2xl border border-[#1C2538] flex items-center gap-4">
                  {/* Yüzde Rozeti */}
                  <div 
                    className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border"
                    style={{ 
                      backgroundColor: `${kategori.color}15`, 
                      borderColor: `${kategori.color}40`,
                      color: kategori.color 
                    }}
                  >
                    <span className="font-mono font-black text-xs">%{oran}</span>
                  </div>

                  {/* Kategori Adı ve İlerleme Çubuğu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-mono font-bold text-sm text-slate-200 truncate">
                        {kategori.name}
                      </span>
                      <span className="font-mono font-black text-sm text-white tabular-nums">
                        ₺{kategori.value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="w-full h-2 bg-[#090D16] rounded-full overflow-hidden border border-[#1E2538]">
                      <div 
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${oran}%`, backgroundColor: kategori.color }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}

