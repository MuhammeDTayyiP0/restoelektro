import React, { useCallback } from 'react'
import { Flame, SlidersHorizontal, Scale } from 'lucide-react'
import type { Urun } from '../../../../common/types/menu.types'
import { formatPara, formatResimUrl } from '../../../utils/formatters'
import { useMenuStore } from '../../../stores/useMenuStore'

export interface ProductCardProps {
  urun: Urun
  aktifPorsiyon: number
  onTikla?: (urun: Urun) => void
  onClick?: () => void
}

export const ProductCard = React.memo(function ProductCard({ urun, aktifPorsiyon, onTikla, onClick }: ProductCardProps) {
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

  const handleClick = useCallback(() => {
    if (onTikla) {
      onTikla(urun)
    } else if (onClick) {
      onClick()
    }
  }, [onTikla, onClick, urun])

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{ transform: 'translateZ(0)' }}
      className="relative z-0 w-full aspect-[4/3] rounded-xl border border-[#222634] hover:border-cyan-400/60 active:border-cyan-500/80 active:scale-[0.97] hover:-translate-y-0.5 text-left transition-all duration-100 ease-out touch-feedback group overflow-hidden shadow-sm bg-[#141414] select-none flex flex-col justify-between cursor-pointer"
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
      <div className="relative z-0 flex-1 flex flex-col justify-between p-3 min-h-0">
        {/* Üst Badges: Seçim / Porsiyon / Hızlı Satış */}
        <div className="flex items-center justify-between w-full pointer-events-none min-h-[18px]">
          <div>
            {(hasVaryant || hasOpsiyon) && (
              <div className="flex items-center gap-1 bg-violet-950/90 text-violet-300 border border-violet-500/40 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md shadow-sm">
                <SlidersHorizontal size={10} />
                <span>SEÇİM</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            {aktifPorsiyon !== 1 && (
              <span className="bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                {aktifPorsiyon === 0.5 ? '0.5x' : aktifPorsiyon === 2 ? '2x' : `${aktifPorsiyon}x`}
              </span>
            )}
            {(urun as any).hizli_satis && (
              <div className="flex items-center gap-1 bg-amber-500/25 text-amber-300 border border-amber-500/50 text-[9px] font-mono font-bold px-2 py-0.5 rounded-md shadow-sm">
                <Flame size={10} className="fill-amber-400" />
                <span>HIZLI</span>
              </div>
            )}
          </div>
        </div>

        {/* Çizginin Üstünde Sol Tarafta Ürün İsmi */}
        <div
          className="pt-2 pb-1.5 px-3 -mx-3 -mb-3 mt-auto"
          style={
            hasImage
              ? { background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 65%, transparent 100%)' }
              : undefined
          }
        >
          <span
            className={`font-bold text-[16px] sm:text-[17px] xl:text-[1.1rem] line-clamp-2 leading-tight tracking-tight block ${
              hasImage
                ? 'text-white'
                : 'text-slate-100 group-hover:text-white'
            }`}
            style={
              hasImage
                ? { textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.7)' }
                : undefined
            }
          >
            {urun.ad}
          </span>
        </div>
      </div>

      {/* ── ALT BİLGİ ALANI (FOOTER): TAM 45PX YÜKSEKLİK + AYIRICI ÇİZGİ + SOL KATEGORİ & SAĞ FİYAT ── */}
      <div
        className="h-[45px] min-h-[45px] max-h-[45px] px-3 flex items-center justify-between relative z-0 w-full shrink-0"
        style={
          hasImage
            ? {
                background: 'rgba(10, 10, 10, 0.90)',
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
    </button>
  )
})

export default ProductCard
