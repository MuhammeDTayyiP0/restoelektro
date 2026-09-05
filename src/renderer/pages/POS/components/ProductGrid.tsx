import React from 'react'
import { Search } from 'lucide-react'
import type { Urun } from '../../../../common/types/menu.types'
import { ProductCard } from './ProductCard'

export interface ProductGridProps {
  urunler: Urun[]
  aktifPorsiyon: number
  onUrunTikla: (urun: Urun) => void
}

export const ProductGrid = React.memo(function ProductGrid({ urunler, aktifPorsiyon, onUrunTikla }: ProductGridProps) {
  if (urunler.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-72 text-slate-400 text-center">
        <div className="w-14 h-14 mb-3 rounded-2xl bg-[#0E121B] border border-[#1E2436] flex items-center justify-center text-slate-400">
          <Search size={24} />
        </div>
        <p className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider">
          Ürün Bulunamadı
        </p>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Arama kriterini değiştirin veya kategori filtresini sıfırlayın.
        </p>
      </div>
    )
  }

  return (
    <div 
      className="pos-product-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-2.5 2xl:gap-3 pb-16"
      style={{ transform: 'translateZ(0)' }}
    >
      {urunler.map(urun => (
        <ProductCard
          key={urun.id}
          urun={urun}
          aktifPorsiyon={aktifPorsiyon}
          onTikla={onUrunTikla}
        />
      ))}
    </div>
  )
})

export default ProductGrid
