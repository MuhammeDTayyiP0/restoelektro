import React, { useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { useMenuStore } from '../../../stores/useMenuStore'
import { usePosStore } from '../../../stores/usePosStore'
import { formatPara } from '../../../utils/formatters'
import type { Urun } from '../../../../common/types/menu.types'
import { SearchInput } from '../../../components/ui/SearchInput'

export default function PosMenu() {
  const { seciliKategoriId, kategoriSec } = usePosStore(state => ({
    seciliKategoriId: state.seciliKategoriId,
    kategoriSec: state.kategoriSec
  }))
  const { kategoriler: tumKategoriler, urunler: tumUrunler } = useMenuStore()
  const { sepeteEkle } = usePosStore()

  const [aramaMetni, setAramaMetni] = useState('')

  // Görüntülenecek ürünleri filtrele
  const gosterilenUrunler = useMemo(() => {
    let sonuc = tumUrunler

    if (aramaMetni) {
      const kucukArama = aramaMetni.toLowerCase()
      sonuc = sonuc.filter(u => u.ad.toLowerCase().includes(kucukArama) || (u.barkod && u.barkod.includes(aramaMetni)))
    } else if (seciliKategoriId) {
      sonuc = sonuc.filter(u => u.kategori_id === seciliKategoriId)
    }

    return sonuc
  }, [tumUrunler, seciliKategoriId, aramaMetni])

  const urunTikla = (urun: Urun) => {
    // Burada varyant/opsiyon seçimi için bir Modal açılabilir. 
    // Şimdilik doğrudan sepete ekliyoruz.
    sepeteEkle(urun)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-surface-50 dark:bg-surface-950">
      
      {/* Üst Kısım: Arama ve Hızlı Filtreler */}
      <div className="p-4 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 shadow-sm shrink-0">
        <SearchInput 
          value={aramaMetni}
          onChange={(val) => {
            setAramaMetni(val)
            if (val && seciliKategoriId) kategoriSec(null) // Arama yaparken kategori filtresini kaldır
          }}
          placeholder="Ürün adı veya barkod ara..."
          className="h-14 text-lg"
        />
      </div>

      {/* Kategoriler (Yatay Kaydırılabilir) */}
      {!aramaMetni && (
        <div className="flex overflow-x-auto pos-scrollbar p-4 gap-3 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 shrink-0">
          <button
            onClick={() => kategoriSec(null)}
            className={clsx(
              'flex-shrink-0 h-16 px-6 rounded-pos-lg font-bold text-pos-base transition-all touch-feedback shadow-sm',
              seciliKategoriId === null 
                ? 'bg-surface-800 text-white dark:bg-surface-100 dark:text-surface-900' 
                : 'bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700'
            )}
          >
            Tümü
          </button>
          
          {tumKategoriler.map(kat => (
            <button
              key={kat.id}
              onClick={() => kategoriSec(kat.id)}
              className={clsx(
                'flex-shrink-0 h-16 px-6 rounded-pos-lg font-bold text-pos-base transition-all touch-feedback shadow-sm border',
                seciliKategoriId === kat.id
                  ? 'border-transparent text-white ring-2 ring-offset-2 ring-brand-500'
                  : 'border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-800'
              )}
              style={seciliKategoriId === kat.id ? { backgroundColor: kat.renk || '#3b82f6' } : {}}
            >
              {kat.ad}
            </button>
          ))}
        </div>
      )}

      {/* Ürünler Grid */}
      <div className="flex-1 overflow-y-auto pos-scrollbar p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
          {gosterilenUrunler.map(urun => (
            <button
              key={urun.id}
              onClick={() => urunTikla(urun)}
              className="flex flex-col bg-white dark:bg-surface-800 rounded-pos-lg shadow-pos overflow-hidden transition-transform active:scale-95 touch-feedback border border-surface-200 dark:border-surface-700"
            >
              {/* Resim veya Placeholder */}
              <div className="w-full h-32 bg-surface-100 dark:bg-surface-700 relative">
                {urun.resim_yolu ? (
                  <img src={urun.resim_yolu} alt={urun.ad} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-pos-4xl font-bold text-surface-300 dark:text-surface-600">
                    {urun.ad.charAt(0)}
                  </div>
                )}
                {urun.hizli_satis && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-yellow-400 rounded-full shadow-md" />
                )}
              </div>
              
              {/* Ürün Bilgisi */}
              <div className="p-3 flex flex-col items-start w-full h-24">
                <span className="text-pos-base font-bold text-surface-900 dark:text-white line-clamp-2 text-left leading-tight">
                  {urun.ad}
                </span>
                <span className="mt-auto text-pos-lg font-bold text-brand-600 dark:text-brand-400">
                  {formatPara(urun.fiyat)}
                </span>
              </div>
            </button>
          ))}
        </div>
        
        {gosterilenUrunler.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-surface-400">
            <p className="text-pos-xl font-medium">Bu kategoride ürün bulunmuyor.</p>
          </div>
        )}
      </div>

    </div>
  )
}
