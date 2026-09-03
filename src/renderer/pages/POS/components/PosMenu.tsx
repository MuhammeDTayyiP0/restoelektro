import React, { useMemo, useState, useRef, useCallback } from 'react'
import { clsx } from 'clsx'
import { useMenuStore } from '../../../stores/useMenuStore'
import { usePosStore } from '../../../stores/usePosStore'
import { formatPara, formatResimUrl } from '../../../utils/formatters'
import type { Urun, UrunVaryant, UrunOpsiyonu } from '../../../../common/types/menu.types'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { Numpad } from '../../../components/ui/Numpad'
import {
  Search,
  Flame,
  Layers,
  Scale,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  SlidersHorizontal
} from 'lucide-react'
import { motion } from 'framer-motion'
import { ProductGrid } from './ProductGrid'

// ─── ANA MENU BİLEŞENİ ──────────────────────────────────────

export default function PosMenu() {
  const { seciliKategoriId, kategoriSec } = usePosStore(state => ({
    seciliKategoriId: state.seciliKategoriId,
    kategoriSec: state.kategoriSec
  }))
  const { kategoriler: tumKategoriler, urunler: tumUrunler } = useMenuStore()
  const { sepeteEkle } = usePosStore()

  const [aramaMetni, setAramaMetni] = useState('')
  const [miktarSoranUrun, setMiktarSoranUrun] = useState<Urun | null>(null)
  const [girilenMiktar, setGirilenMiktar] = useState('1')
  const [aktifPorsiyon, setAktifPorsiyon] = useState<number>(1)
  const [hizliFiltre, setHizliFiltre] = useState<'hepsi' | 'populer' | 'indirimli'>('hepsi')

  // Varyasyon/Opsiyon seçim state'leri
  const [varyantModalUrun, setVaryantModalUrun] = useState<Urun | null>(null)
  const [secilenVaryant, setSecilenVaryant] = useState<UrunVaryant | null>(null)
  const [secilenOpsiyonlar, setSecilenOpsiyonlar] = useState<UrunOpsiyonu[]>([])

  const kategoriScrollRef = useRef<HTMLDivElement>(null)

  // Kategori bazlı ürün sayıları
  const kategoriUrunSayilari = useMemo(() => {
    const map: Record<number, number> = {}
    tumUrunler.forEach(u => {
      if (u.kategori_id) {
        map[u.kategori_id] = (map[u.kategori_id] || 0) + 1
      }
    })
    return map
  }, [tumUrunler])

  // Görüntülenecek ürünleri filtrele
  const gosterilenUrunler = useMemo(() => {
    let sonuc = tumUrunler

    if (aramaMetni) {
      const kucukArama = aramaMetni.toLowerCase().trim()
      sonuc = sonuc.filter(u =>
        u.ad.toLowerCase().includes(kucukArama) ||
        (u.barkod && u.barkod.includes(aramaMetni)) ||
        (u.kisaltma && u.kisaltma.toLowerCase().includes(kucukArama))
      )
    } else if (seciliKategoriId) {
      sonuc = sonuc.filter(u => u.kategori_id === seciliKategoriId)
    }

    if (hizliFiltre === 'populer') {
      sonuc = sonuc.filter(u => (u as any).hizli_satis)
    }

    return sonuc
  }, [tumUrunler, seciliKategoriId, aramaMetni, hizliFiltre])

  // Ürüne tıklanınca: tartılı → miktar modalı, varyantlı → varyant modalı, diğer → direkt sepet
  const urunTikla = useCallback((urun: Urun) => {
    const birimUpper = (urun.birim || '').toUpperCase()
    const tartili = ['KG', 'GRAM', 'GR', 'LITRE', 'LT', 'L'].includes(birimUpper)
    const hasVaryant = urun.varyantlar && urun.varyantlar.length > 0
    const hasOpsiyon = urun.opsiyonlar && urun.opsiyonlar.length > 0

    if (hasVaryant || hasOpsiyon) {
      // Varyant/opsiyon seçim modalı aç
      setVaryantModalUrun(urun)
      setSecilenVaryant(null)
      setSecilenOpsiyonlar([])
    } else if (tartili) {
      setGirilenMiktar('1')
      setMiktarSoranUrun(urun)
    } else {
      sepeteEkle(urun, 1, aktifPorsiyon)
    }
  }, [aktifPorsiyon, sepeteEkle])

  // Varyant modalında onaylama
  const varyantOnayla = useCallback(() => {
    if (!varyantModalUrun) return

    const birimUpper = (varyantModalUrun.birim || '').toUpperCase()
    const tartili = ['KG', 'GRAM', 'GR', 'LITRE', 'LT', 'L'].includes(birimUpper)

    if (tartili) {
      // Tartılı ürünlerde varyant seçildikten sonra miktar modalına yönlendir
      setVaryantModalUrun(null)
      setGirilenMiktar('1')
      setMiktarSoranUrun(varyantModalUrun)
    } else {
      sepeteEkle(varyantModalUrun, 1, aktifPorsiyon, secilenVaryant || undefined, secilenOpsiyonlar)
      setVaryantModalUrun(null)
    }
  }, [varyantModalUrun, secilenVaryant, secilenOpsiyonlar, aktifPorsiyon, sepeteEkle])

  const opsiyonToggle = useCallback((opsiyon: UrunOpsiyonu) => {
    setSecilenOpsiyonlar(prev => {
      const exists = prev.find(o => o.id === opsiyon.id)
      if (exists) return prev.filter(o => o.id !== opsiyon.id)
      return [...prev, opsiyon]
    })
  }, [])

  const scrollKategori = (direction: 'left' | 'right') => {
    if (kategoriScrollRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250
      kategoriScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  // Grid: Tüm ürünler aynı boyutta, tek bir ızgara

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#090A0F] text-slate-100 select-none">

      {/* 1. ÜST KOMUTA ÇUBUĞU: ARAMA, PORSIYON & HIZLI FİLTRELER */}
      <div className="p-3 bg-[#0C1017] border-b border-[#1E2436] shrink-0 flex flex-col md:flex-row items-stretch md:items-center gap-3">

        {/* Arama & Barkod Inputu */}
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={aramaMetni}
            onChange={(e) => {
              setAramaMetni(e.target.value)
              if (e.target.value && seciliKategoriId) kategoriSec(null)
            }}
            placeholder="Ürün adı, kod veya barkod ara..."
            className="w-full h-12 pl-10 pr-9 bg-[#090D15] border border-[#1F293D] focus:border-cyan-400 rounded-xl font-mono text-sm text-slate-100 placeholder:text-slate-400 focus:outline-none transition-colors shadow-inner"
          />
          {aramaMetni && (
            <button
              onClick={() => setAramaMetni('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Porsiyon Seçici Segmented Toggle */}
        <div className="flex items-center bg-[#090D15] p-1 rounded-xl border border-[#1F293D] h-12 w-full md:w-auto shrink-0 shadow-inner">
          {[
            { p: 0.5, label: '0.5x Yarım', short: '0.5x' },
            { p: 1, label: '1x Porsiyon', short: '1x' },
            { p: 1.5, label: '1.5x Porsiyon', short: '1.5x' },
            { p: 2, label: '2x Double', short: '2x' }
          ].map(({ p, label, short }) => (
            <motion.button
              key={p}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAktifPorsiyon(p)}
              className={clsx(
                'flex-1 md:flex-initial px-2.5 sm:px-3.5 h-10 flex items-center justify-center font-mono font-bold text-xs rounded-lg transition-all',
                aktifPorsiyon === p
                  ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)] border border-cyan-300'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#141B29]'
              )}
            >
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{short}</span>
            </motion.button>
          ))}
        </div>

        {/* Hızlı Popüler Filtresi */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setHizliFiltre(hizliFiltre === 'populer' ? 'hepsi' : 'populer')}
          className={clsx(
            'h-12 px-3.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-1.5 border transition-all shrink-0',
            hizliFiltre === 'populer'
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : 'bg-[#090D15] text-slate-400 border-[#1F293D] hover:text-slate-200 hover:bg-[#141B29]'
          )}
        >
          <Flame size={15} className={hizliFiltre === 'populer' ? 'text-amber-400 fill-amber-400' : ''} />
          <span>Hızlı Satış</span>
        </motion.button>
      </div>

      {/* 2. KATEGORİ SEÇİCİ (ERGONOMIC HIGH-SPEED CAROUSEL BAR) */}
      {!aramaMetni && (
        <div className="relative flex items-center bg-[#0C1017] border-b border-[#1E2436] px-2 py-2 shrink-0">

          {/* Sol Kaydırma Butonu */}
          <button
            onClick={() => scrollKategori('left')}
            className="hidden md:flex w-8 h-12 rounded-lg bg-[#121724] border border-[#222C42] text-slate-400 hover:text-white items-center justify-center shrink-0 mr-1.5 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Kategori Butonları Listesi */}
          <div
            ref={kategoriScrollRef}
            className="flex items-center gap-2 overflow-x-auto pos-scrollbar py-0.5 w-full scroll-smooth"
          >
            {/* Tümü Butonu */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => kategoriSec(null)}
              className={clsx(
                'flex-shrink-0 h-12 px-4 rounded-xl font-mono font-black text-xs uppercase tracking-wider flex items-center gap-2 border transition-all shadow-sm',
                seciliKategoriId === null
                  ? 'bg-[#1E293B] text-white border-slate-500 shadow-[0_0_12px_rgba(255,255,255,0.1)]'
                  : 'bg-[#0E131E] text-slate-400 border-[#1E2638] hover:bg-[#151D2C] hover:text-slate-200'
              )}
            >
              <Layers size={15} />
              <span>TÜM MENÜ</span>
              <span className="bg-[#090A0F] text-slate-400 px-1.5 py-0.5 rounded text-[10px]">
                {tumUrunler.length}
              </span>
            </motion.button>

            {/* Dinamik Kategoriler */}
            {tumKategoriler.map(kat => {
              const isActive = seciliKategoriId === kat.id
              const count = kategoriUrunSayilari[kat.id] || 0
              const katColor = kat.renk || '#3b82f6'

              return (
                <motion.button
                  key={kat.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => kategoriSec(kat.id)}
                  className={clsx(
                    'flex-shrink-0 h-12 px-4 rounded-xl font-mono font-bold text-xs uppercase tracking-tight flex items-center gap-2 border transition-all shadow-sm relative overflow-hidden',
                    isActive
                      ? 'border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)] bg-[#121B2A]'
                      : 'bg-[#0E131E] text-slate-300 border-[#1E2638] hover:bg-[#151D2C] hover:text-white'
                  )}
                >
                  {/* Renk Çizgisi */}
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: katColor }}
                  />
                  <span>{kat.ad}</span>
                  <span className={clsx(
                    "px-1.5 py-0.5 rounded text-[10px]",
                    isActive ? "bg-cyan-950 text-cyan-300 border border-cyan-500/30" : "bg-[#090A0F] text-slate-400"
                  )}>
                    {count}
                  </span>
                </motion.button>
              )
            })}
          </div>

          {/* Sağ Kaydırma Butonu */}
          <button
            onClick={() => scrollKategori('right')}
            className="hidden md:flex w-8 h-12 rounded-lg bg-[#121724] border border-[#222C42] text-slate-400 hover:text-white items-center justify-center shrink-0 ml-1.5 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* 3. ÜRÜN KARTLARI — ADAPTİF GRİD */}
      <div className="flex-1 overflow-y-auto pos-scrollbar p-3.5">
        <ProductGrid
          urunler={gosterilenUrunler}
          aktifPorsiyon={aktifPorsiyon}
          onUrunTikla={urunTikla}
        />
      </div>

      {/* 4. TARTILI ÜRÜN / MİKTAR BELİRLEME MODALI */}
      {miktarSoranUrun && (
        <Modal
          isOpen={!!miktarSoranUrun}
          onClose={() => setMiktarSoranUrun(null)}
          title="Tartılı Ürün Miktarı"
          size="md"
        >
          <div 
            className="flex flex-col gap-2.5 sm:gap-3.5 bg-[#0E121B] text-slate-100 select-none overflow-hidden"
            style={{ transform: 'translateZ(0)' }}
          >

            {/* Ürün Başlığı */}
            <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl bg-[#141926] border border-[#222C42] flex-shrink-0 shrink-0">
              <div className="flex items-center gap-2">
                <Scale size={18} className="text-cyan-400" />
                <span className="font-mono text-xs sm:text-sm font-bold text-white">
                  {miktarSoranUrun.ad}
                </span>
              </div>
              <span className="font-mono text-[11px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded-lg uppercase">
                Birim: {miktarSoranUrun.birim || 'KG'}
              </span>
            </div>

            {/* Büyük Dijital Gösterge */}
            <div className="relative flex items-center justify-center flex-shrink-0 shrink-0">
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                value={girilenMiktar}
                onChange={e => {
                  const val = e.target.value.replace(/[^0-9.,]/g, '')
                  setGirilenMiktar(val.replace(',', '.'))
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const parsed = parseFloat(girilenMiktar)
                    if (!isNaN(parsed) && parsed > 0) {
                      sepeteEkle(miktarSoranUrun, parsed, aktifPorsiyon, secilenVaryant || undefined, secilenOpsiyonlar)
                      setMiktarSoranUrun(null)
                      setSecilenVaryant(null)
                      setSecilenOpsiyonlar([])
                    }
                  }
                }}
                className="w-full h-12 sm:h-14 px-4 border rounded-xl sm:rounded-2xl bg-[#090D15] border-[#222C42] focus:border-cyan-400 text-2xl sm:text-3xl font-black font-mono text-cyan-400 text-center outline-none shadow-inner"
              />
              <span className="absolute right-4 font-mono font-bold text-slate-400 text-xs sm:text-sm">
                {miktarSoranUrun.birim || 'KG'}
              </span>
            </div>

            {/* Hızlı Önayar Butonları */}
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 flex-shrink-0 shrink-0">
              {['0.25', '0.5', '1', '1.5', '2', '2.5', '3', '5'].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setGirilenMiktar(val)}
                  className={clsx(
                    "h-8 sm:h-9 rounded-lg sm:rounded-xl font-mono text-xs font-bold border transition-colors",
                    girilenMiktar === val
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                      : "bg-[#141926] text-slate-300 border-[#222C42] hover:bg-[#1C2336]"
                  )}
                >
                  {val} {miktarSoranUrun.birim || 'KG'}
                </button>
              ))}
            </div>

            {/* Dokunmatik Numpad */}
            <div className="flex justify-center w-full my-0.5 flex-shrink-0 shrink-0">
              <Numpad
                layout={[
                  ['1', '2', '3'],
                  ['4', '5', '6'],
                  ['7', '8', '9'],
                  ['C', '0', '.'],
                  ['⌫']
                ]}
                onKeyPress={(key) => {
                  if (key === '⌫') {
                    setGirilenMiktar(prev => prev.slice(0, -1))
                  } else if (key === '.') {
                    if (!girilenMiktar.includes('.')) {
                      setGirilenMiktar(prev => prev + '.')
                    }
                  } else if (key !== 'C') {
                    setGirilenMiktar(prev => prev === '0' ? key : prev + key)
                  }
                }}
                onClear={() => setGirilenMiktar('0')}
              />
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex gap-2.5 justify-end mt-1 pt-2.5 sm:pt-3 border-t border-[#1E2436] flex-shrink-0 shrink-0">
              <Button
                variant="ghost"
                size="md"
                onClick={() => { setMiktarSoranUrun(null); setSecilenVaryant(null); setSecilenOpsiyonlar([]) }}
                className="font-mono text-xs h-10"
              >
                İptal
              </Button>
              <Button
                variant="primary"
                size="md"
                className="font-mono font-bold text-xs px-6 h-10"
                onClick={() => {
                  const parsed = parseFloat(girilenMiktar)
                  if (!isNaN(parsed) && parsed > 0) {
                    sepeteEkle(miktarSoranUrun, parsed, aktifPorsiyon, secilenVaryant || undefined, secilenOpsiyonlar)
                    setMiktarSoranUrun(null)
                    setSecilenVaryant(null)
                    setSecilenOpsiyonlar([])
                  }
                }}
              >
                Sepete Ekle
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. VARYASYON / OPSİYON SEÇİM MODALI */}
      {varyantModalUrun && (
        <Modal
          isOpen={!!varyantModalUrun}
          onClose={() => setVaryantModalUrun(null)}
          title={varyantModalUrun.ad}
          size="md"
        >
          <div 
            className="flex flex-col gap-4 bg-[#0E121B] text-slate-100 select-none"
            style={{ transform: 'translateZ(0)' }}
          >

            {/* Ürün Özet Başlığı */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[#141926] border border-[#222C42]">
              {varyantModalUrun.resim_yolu && (
                <img
                  src={formatResimUrl(varyantModalUrun.resim_yolu)}
                  alt={varyantModalUrun.ad}
                  className="w-14 h-14 rounded-xl object-cover border border-[#222C42]"
                />
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-white truncate">{varyantModalUrun.ad}</span>
                <span className="text-xs font-mono text-emerald-400 font-bold">
                  {formatPara(varyantModalUrun.fiyat * aktifPorsiyon)}
                </span>
              </div>
            </div>

            {/* Varyantlar (Pirzola: Kilo/Porsiyon vb.) */}
            {varyantModalUrun.varyantlar && varyantModalUrun.varyantlar.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <SlidersHorizontal size={14} className="text-violet-400" />
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Varyant Seçimi
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {varyantModalUrun.varyantlar.filter(v => v.aktif).map(varyant => {
                    const isSelected = secilenVaryant?.id === varyant.id
                    return (
                      <button
                        key={varyant.id}
                        type="button"
                        onClick={() => setSecilenVaryant(isSelected ? null : varyant)}
                        className={clsx(
                          'relative flex items-center justify-between h-14 px-3.5 rounded-xl border font-mono text-sm font-bold transition-all active:scale-95 duration-100',
                          isSelected
                            ? 'bg-violet-500/15 border-violet-400 text-violet-200'
                            : 'bg-[#0C1017] border-[#1E2638] text-slate-300 hover:border-slate-500 hover:bg-[#121824]'
                        )}
                      >
                        <span className="truncate">{varyant.ad}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {varyant.fiyat_farki !== 0 && (
                            <span className={clsx(
                              'text-[11px] font-mono font-bold',
                              varyant.fiyat_farki > 0 ? 'text-amber-400' : 'text-emerald-400'
                            )}>
                              {varyant.fiyat_farki > 0 ? '+' : ''}{formatPara(varyant.fiyat_farki)}
                            </span>
                          )}
                          {isSelected && (
                            <Check size={16} className="text-violet-400" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Opsiyonlar (Şalgam: Acılı/Acısız vb.) */}
            {varyantModalUrun.opsiyonlar && varyantModalUrun.opsiyonlar.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2.5">
                  <Plus size={14} className="text-cyan-400" />
                  <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                    Opsiyonlar
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">(Birden fazla seçilebilir)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {varyantModalUrun.opsiyonlar.filter(o => o.aktif).map(opsiyon => {
                    const isSelected = secilenOpsiyonlar.some(o => o.id === opsiyon.id)
                    return (
                      <button
                        key={opsiyon.id}
                        type="button"
                        onClick={() => opsiyonToggle(opsiyon)}
                        className={clsx(
                          'relative flex items-center justify-between h-12 px-3 rounded-xl border font-mono text-sm font-bold transition-all active:scale-95 duration-100',
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-400 text-cyan-200'
                            : 'bg-[#0C1017] border-[#1E2638] text-slate-300 hover:border-slate-500 hover:bg-[#121824]'
                        )}
                      >
                        <span className="truncate">{opsiyon.ad}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {opsiyon.fiyat > 0 && (
                            <span className="text-[11px] font-mono font-bold text-amber-400">
                              +{formatPara(opsiyon.fiyat)}
                            </span>
                          )}
                          {isSelected && (
                            <Check size={16} className="text-cyan-400" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Toplam Fiyat Önizleme */}
            {(secilenVaryant || secilenOpsiyonlar.length > 0) && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#090D15] border border-[#1E2638]">
                <span className="text-xs font-mono text-slate-400 uppercase">Toplam</span>
                <span className="text-lg font-black font-mono text-emerald-400 tabular-nums">
                  {formatPara(
                    (varyantModalUrun.fiyat + (secilenVaryant?.fiyat_farki || 0) + secilenOpsiyonlar.reduce((t, o) => t + o.fiyat, 0)) * aktifPorsiyon
                  )}
                </span>
              </div>
            )}

            {/* Aksiyon Butonları */}
            <div className="flex gap-2.5 justify-end pt-3 border-t border-[#1E2436]">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setVaryantModalUrun(null)}
                className="font-mono text-xs h-10"
              >
                İptal
              </Button>
              <Button
                variant="primary"
                size="md"
                className="font-mono font-bold text-xs px-6 h-10"
                onClick={varyantOnayla}
              >
                <Check size={14} className="mr-1.5" />
                Sepete Ekle
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
