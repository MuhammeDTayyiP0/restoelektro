import { useState, useMemo } from 'react'
import { Clock, Users } from 'lucide-react'
import { clsx } from 'clsx'


const MOCK_TABLES = [
  { id: 1, ad: 'Masa 1', bolum: 'Salon', tutar: 450.50, acilis: '19:30', kisi: 3, garson: 'Ahmet Y.', sureDk: 45 },
  { id: 2, ad: 'Masa 4', bolum: 'Salon', tutar: 1250.00, acilis: '18:45', kisi: 5, garson: 'Mehmet K.', sureDk: 90 },
  { id: 3, ad: 'Bahçe 2', bolum: 'Bahçe', tutar: 220.00, acilis: '20:15', kisi: 2, garson: 'Ayşe S.', sureDk: 18 },
  { id: 4, ad: 'Bahçe 5', bolum: 'Bahçe', tutar: 890.75, acilis: '19:00', kisi: 4, garson: 'Ayşe S.', sureDk: 75 },
  { id: 5, ad: 'Bar 1', bolum: 'Bar', tutar: 150.00, acilis: '20:45', kisi: 1, garson: 'Can T.', sureDk: 12 },
  { id: 6, ad: 'Teras 3', bolum: 'Teras', tutar: 620.00, acilis: '19:55', kisi: 3, garson: 'Mehmet K.', sureDk: 35 },
]

export default function LiveSales() {
  const [seciliBolum, setSeciliBolum] = useState<string>('tum')

  const bolumler = useMemo(() => {
    const list = Array.from(new Set(MOCK_TABLES.map(m => m.bolum)))
    return ['tum', ...list]
  }, [])

  const filtrelenmisMasalar = useMemo(() => {
    if (seciliBolum === 'tum') return MOCK_TABLES
    return MOCK_TABLES.filter(m => m.bolum === seciliBolum)
  }, [seciliBolum])

  const toplamAcikTutar = useMemo(() => {
    return filtrelenmisMasalar.reduce((toplam, m) => toplam + m.tutar, 0)
  }, [filtrelenmisMasalar])

  return (
    <div className="space-y-5 pb-8">
      
      {/* 1. ÜST BAŞLIK & BİLGİ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#1A2234]">
        <div>
          <h2 className="text-xl lg:text-2xl font-mono font-black text-white uppercase tracking-tight">
            CANLI MASALAR
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Anlık açık adisyonlar ve masa durumu
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0E131F] border border-[#222C42] px-3 py-1.5 rounded-xl shadow-sm font-mono text-xs">
            <span className="text-slate-400">Açık Tutar:</span>
            <span className="text-emerald-400 font-black">
              ₺{toplamAcikTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <span className="bg-amber-950/50 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl text-xs font-mono font-bold">
            {filtrelenmisMasalar.length} Masa
          </span>
        </div>
      </div>

      {/* 2. BÖLÜM FİLTRELEME ÇUBUĞU */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {bolumler.map((b) => (
          <button
            key={b}
            onClick={() => setSeciliBolum(b)}
            className={clsx(
              "px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0",
              seciliBolum === b
                ? "bg-[#1E293B] text-white shadow-sm border border-slate-600/50"
                : "bg-[#0C1017] text-slate-400 border border-[#1A2234] hover:text-slate-200"
            )}
          >
            {b === 'tum' ? 'Tüm Masalar' : b}
          </button>
        ))}
      </div>

      {/* 3. MASA KARTLARI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtrelenmisMasalar.map(masa => {
          const uzunSure = masa.sureDk > 60

          return (
            <div 
              key={masa.id} 
              className="bg-[#0E121E] rounded-2xl p-4 sm:p-5 border border-[#1E2538] hover:border-slate-600/50 shadow-xl transition-all duration-200 flex flex-col justify-between group"
            >
              {/* Kart Başlığı (Masa Adı, Bölüm & Tutar) */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-mono font-black text-white uppercase tracking-tight">
                      {masa.ad}
                    </h3>
                    <span className="text-[11px] font-mono font-bold text-sky-400 bg-sky-950/50 border border-sky-800/40 px-2 py-0.5 rounded-lg">
                      {masa.bolum}
                    </span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 mt-1 block">
                    Açılış: {masa.acilis} ({masa.sureDk} dk)
                  </span>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-mono font-black text-emerald-400 tracking-tight tabular-nums">
                    ₺{masa.tutar.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Alt Detaylar (Süre, Kişi, Garson Rozeti) */}
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400 pt-3 border-t border-[#1A2234]">
                <div className={clsx(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded-lg border",
                  uzunSure 
                    ? "bg-amber-950/40 text-amber-300 border-amber-500/30" 
                    : "bg-[#141926] text-slate-300 border-[#222C42]"
                )}>
                  <Clock size={13} />
                  <span>{masa.sureDk} dk</span>
                </div>

                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#141926] text-slate-300 border border-[#222C42]">
                  <Users size={13} className="text-slate-400" />
                  <span>{masa.kisi} Kişi</span>
                </div>

                <div className="flex items-center gap-1.5 ml-auto">
                  <div className="w-5 h-5 rounded-full bg-sky-950 border border-sky-500/30 text-sky-300 flex items-center justify-center text-[10px] font-mono font-black">
                    {masa.garson.charAt(0)}
                  </div>
                  <span className="text-slate-300 font-semibold text-xs">{masa.garson}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

