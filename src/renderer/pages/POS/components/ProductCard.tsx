import React from 'react'
import { motion } from 'framer-motion'
import { Flame, SlidersHorizontal, Scale } from 'lucide-react'
import type { Urun } from '../../../../common/types/menu.types'
import { formatPara, formatResimUrl } from '../../../utils/formatters'
import { useMenuStore } from '../../../stores/useMenuStore'

export interface ProductCardProps {
  urun: Urun
  aktifPorsiyon: number
  onClick: () => void
}

export function ProductCard({ urun, aktifPorsiyon, onClick }: ProductCardProps) {
  const birimUpper = (urun.birim || '').toUpperCase()
  const isAgirlik = ['KG', 'GRAM', 'GR', 'LITRE', 'LT', 'L'].includes(birimUpper)
  const hasImage = !!urun.resim_yolu
  const hasVaryant = urun.varyantlar && urun.varyantlar.length > 0
  const hasOpsiyon = urun.opsiyonlar && urun.opsiyonlar.length > 0
  const hesaplananFiyat = urun.fiyat * aktifPorsiyon

  // Kategori adını bul
  const kategori = useMenuStore(state =>
    state.kategoriler.find(k => k.id === urun.kategori_id)
  )
  const altEtiket = urun.kategori_adi || kategori?.ad || urun.kisaltma || 'POS'

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.12 }}
      onClick={onClick}
      className="relative w-full aspect-[4/3] rounded-xl border border-[#222634] hover:border-cyan-400/60 active:border-cyan-500/80 text-left transition-all touch-feedback group overflow-hidden shadow-md bg-[#141414] select-none flex flex-col justify-between"
    >
      {/* ── RESİMLİ KART İÇİN GÖRSEL (Üstten başlayıp kart zeminini kaplar, blur sadece alt şeritte) ── */}
      {hasImage && (
        <img
          src={formatResimUrl(urun.resim_yolu)}
          alt={urun.ad}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          loading="lazy"
        />
      )}

      {/* ── ÜST ALAN (Çizginin Üstü: Badge'ler + Sol Tarafta Ürün İsmi) ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-3 min-h-0">
        {/* Üst Badges: Seçim / Porsiyon / Hızlı Satış */}
        <div className="flex items-center justify-between w-full pointer-events-none min-h-[18px]">
          <div>
            {(hasVaryant || hasOpsiyon) && (
              <div className="flex items-center gap-1 bg-violet-950/80 backdrop-blur-md text-violet-300 border border-violet-500/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md shadow-sm">
                <SlidersHorizontal size={10} />
                <span>SEÇİM</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {aktifPorsiyon !== 1 && (
              <span className="bg-cyan-950/80 backdrop-blur-md text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                {aktifPorsiyon === 0.5 ? '0.5x' : aktifPorsiyon === 2 ? '2x' : `${aktifPorsiyon}x`}
              </span>
            )}
            {(urun as any).hizli_satis && (
              <div className="flex items-center gap-1 bg-amber-500/30 backdrop-blur-md text-amber-300 border border-amber-500/50 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md shadow-sm">
                <Flame size={10} className="fill-amber-400" />
                <span>HIZLI</span>
              </div>
            )}
          </div>
        </div>

        {/* Çizginin Üstünde Sol Tarafta Ürün İsmi */}
        <div className="pt-1">
          <span
            className={`font-bold text-[13px] sm:text-[14px] line-clamp-2 leading-tight block ${
              hasImage
                ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] [text-shadow:_0_1px_4px_rgba(0,0,0,0.9)]'
                : 'text-slate-100 group-hover:text-white'
            }`}
          >
            {urun.ad}
          </span>
        </div>
      </div>

      {/* ── ALT BİLGİ ALANI (FOOTER): TAM 45PX YÜKSEKLİK + AYIRICI ÇİZGİ + SOL KATEGORİ & SAĞ FİYAT ── */}
      <div
        className="h-[45px] min-h-[45px] max-h-[45px] px-3 flex items-center justify-between relative z-10 w-full shrink-0"
        style={
          hasImage
            ? {
                background: 'rgba(10, 10, 10, 0.75)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }
            : {
                background: '#141414',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }
        }
      >
        {/* Çizginin Altında Sol Taraf: Kategori Adı / Ağırlık Birimi */}
        <div className="flex items-center gap-1.5 min-w-0">
          {isAgirlik ? (
            <span className="flex items-center gap-0.5 text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-1.5 py-0.5 rounded shadow-sm">
              <Scale size={9} />
              {urun.birim || 'KG'}
            </span>
          ) : (
            <span className="text-[11px] font-mono text-slate-300 font-semibold uppercase tracking-wider truncate max-w-[110px]">
              {altEtiket}
            </span>
          )}
        </div>

        {/* Çizginin Altında Sağ Taraf: Fiyat */}
        <span className="text-sm sm:text-[15px] font-black font-mono text-emerald-400 group-hover:text-emerald-300 transition-colors tabular-nums leading-none ml-2 shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          {formatPara(hesaplananFiyat)}
        </span>
      </div>
    </motion.button>
  )
}

export default ProductCard
