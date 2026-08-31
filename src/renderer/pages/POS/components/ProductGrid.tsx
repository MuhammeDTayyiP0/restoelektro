import React from 'react'
import { AnimatePresence } from 'framer-motion'
import { Search } from 'lucide-react'
import type { Urun } from '../../../../common/types/menu.types'
import { ProductCard } from './ProductCard'

export interface ProductGridProps {
  urunler: Urun[]
  aktifPorsiyon: number
  onUrunTikla: (urun: Urun) => void
}

export function ProductGrid({ urunler, aktifPorsiyon, onUrunTikla }: ProductGridProps) {
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-3 pb-16">
      <AnimatePresence mode="popLayout">
        {urunler.map(urun => (
          <ProductCard
            key={urun.id}
            urun={urun}
            aktifPorsiyon={aktifPorsiyon}
            onClick={() => onUrunTikla(urun)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default ProductGrid
