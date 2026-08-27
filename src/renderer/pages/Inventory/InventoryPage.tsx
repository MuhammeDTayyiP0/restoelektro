import React, { useState, useEffect, useMemo } from 'react'
import { 
  Plus, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Calculator, 
  Package, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  History, 
  Layers, 
  TrendingUp, 
  ShieldAlert, 
  DollarSign, 
  Scale, 
  ChefHat, 
  Filter, 
  Boxes, 
  ArrowRight,
  TrendingDown
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useIPC, ipcInvoke } from '../../hooks/useIPC'
import { STOK_KANALLARI, MENU_KANALLARI } from '../../../common/ipc-channels'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { formatPara, formatTarih } from '../../utils/formatters'
import { useToast } from '../../components/ui/Toast'
import { useAuthStore } from '../../stores/useAuthStore'

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'hammaddeler' | 'receteler' | 'maliyet' | 'hareketler'>('hammaddeler')
  const [aramaMetni, setAramaMetni] = useState('')
  const [durumFiltresi, setDurumFiltresi] = useState<'tum' | 'kritik' | 'dusuk' | 'normal'>('tum')
  const [gorunumTipi, setGorunumTipi] = useState<'grid' | 'liste'>('grid')
  const { success, error, info } = useToast()
  const { personel } = useAuthStore()

  // IPC Verileri
  const { veri: hammaddeler, yukleniyor: hamYukleniyor, yenile: hamYenile } = useIPC<any[]>(STOK_KANALLARI.HAMMADDELER, [])
  const { veri: receteler, yukleniyor: recYukleniyor, yenile: recYenile } = useIPC<any[]>(STOK_KANALLARI.RECETELER, [])
  const { veri: maliyetler, yukleniyor: malYukleniyor, yenile: malYenile } = useIPC<any[]>(STOK_KANALLARI.MALIYET_ANALIZI, [])
  const { veri: hareketler, yukleniyor: harYukleniyor, yenile: harYenile } = useIPC<any[]>(STOK_KANALLARI.STOK_HAREKETLERI, [])
  const { veri: urunler, yenile: urunYenile } = useIPC<any[]>(MENU_KANALLARI.URUNLER, [])

  // Modallar
  const [stokIslemModal, setStokIslemModal] = useState<{ acik: boolean; hammadde: any | null; islemTipi: string }>({
    acik: false,
    hammadde: null,
    islemTipi: 'giris'
  })

  const [hammaddeModal, setHammaddeModal] = useState<{ acik: boolean; hammadde: any | null }>({
    acik: false,
    hammadde: null
  })

  const [receteModal, setReceteModal] = useState<{ acik: boolean; urun: any | null }>({
    acik: false,
    urun: null
  })

  // Tab değiştiğinde veriyi yenile
  useEffect(() => {
    if (activeTab === 'hammaddeler') hamYenile()
    else if (activeTab === 'receteler') { recYenile(); urunYenile() }
    else if (activeTab === 'maliyet') malYenile()
    else if (activeTab === 'hareketler') harYenile()
  }, [activeTab, hamYenile, recYenile, malYenile, harYenile, urunYenile])

  // KPI İstatistikleri
  const istatistikler = useMemo(() => {
    const toplamHammadde = hammaddeler.length
    const kritikSayisi = hammaddeler.filter(h => h.stok_durumu === 'kritik' || h.stok_durumu === 'tukendi').length
    const dusukSayisi = hammaddeler.filter(h => h.stok_durumu === 'dusuk').length
    const toplamStokMaliyeti = hammaddeler.reduce((acc, h) => acc + (Number(h.mevcut_stok || 0) * Number(h.maliyet_birim || 0)), 0)
    
    let ortalamaKarMarji = 0
    if (receteler.length > 0) {
      const toplamMarj = receteler.reduce((acc, r) => acc + Number(r.kar_marji || 0), 0)
      ortalamaKarMarji = Math.round(toplamMarj / receteler.length)
    }

    return {
      toplamHammadde,
      kritikSayisi,
      dusukSayisi,
      toplamStokMaliyeti,
      ortalamaKarMarji
    }
  }, [hammaddeler, receteler])

  // Filtrelenmiş Hammaddeler
  const filtrelenmisHammaddeler = useMemo(() => {
    return hammaddeler.filter(h => {
      // Durum Filtresi
      if (durumFiltresi === 'kritik' && h.stok_durumu !== 'kritik' && h.stok_durumu !== 'tukendi') return false
      if (durumFiltresi === 'dusuk' && h.stok_durumu !== 'dusuk') return false
      if (durumFiltresi === 'normal' && h.stok_durumu !== 'normal') return false

      // Arama Filtresi
      if (aramaMetni.trim()) {
        const q = aramaMetni.toLowerCase().trim()
        const adEslesir = (h.ad || '').toLowerCase().includes(q)
        const tedarikciEslesir = (h.tedarikci || '').toLowerCase().includes(q)
        const birimEslesir = (h.birim || '').toLowerCase().includes(q)
        return adEslesir || tedarikciEslesir || birimEslesir
      }
      return true
    })
  }, [hammaddeler, durumFiltresi, aramaMetni])

  // Filtrelenmiş Reçeteler
  const filtrelenmisReceteler = useMemo(() => {
    return receteler.filter(r => {
      if (!aramaMetni.trim()) return true
      const q = aramaMetni.toLowerCase().trim()
      return (r.urun_adi || '').toLowerCase().includes(q) || (r.kategori_adi || '').toLowerCase().includes(q)
    })
  }, [receteler, aramaMetni])

  // Filtrelenmiş Maliyet Analizi
  const filtrelenmisMaliyetler = useMemo(() => {
    return maliyetler.filter(m => {
      if (!aramaMetni.trim()) return true
      const q = aramaMetni.toLowerCase().trim()
      return (m.urun_adi || '').toLowerCase().includes(q) || (m.kategori_adi || '').toLowerCase().includes(q)
    })
  }, [maliyetler, aramaMetni])

  // Durum Rozeti Render Yardımcısı
  const renderStokRozeti = (durum: string) => {
    switch (durum) {
      case 'tukendi':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-600/80 shadow-sm shadow-rose-950/50">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            Tükendi
          </span>
        )
      case 'kritik':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-red-950/60 text-red-300 border border-red-500/70">
            <AlertTriangle size={12} className="text-red-400" />
            Kritik Stok
          </span>
        )
      case 'dusuk':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-950/60 text-amber-300 border border-amber-500/60">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Düşük Seviye
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Yeterli
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#090A0F] text-surface-100 p-4 sm:p-6 overflow-hidden select-none">
      
      {/* 1. Üst Başlık ve KPI Paneli */}
      <div className="shrink-0 mb-5 pb-4 border-b border-[#1A1F30]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Başlık */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#121624] border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-md shadow-brand-950/40">
              <Boxes size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Stok, Reçete & Maliyet Yönetimi
              </h1>
              <p className="text-xs text-surface-400 mt-0.5 font-mono">
                Hammadde envanteri, BOM reçeteleri ve kâr/zarar marj analizi
              </p>
            </div>
          </div>

          {/* Hızlı Butonlar */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'hammaddeler') hamYenile()
                else if (activeTab === 'receteler') recYenile()
                else if (activeTab === 'maliyet') malYenile()
                else harYenile()
                info('Yenilendi', 'Veriler güncellendi.')
              }}
              className="p-2.5 rounded-xl bg-[#121624] border border-[#1E2538] text-surface-400 hover:text-white hover:bg-[#1A2035] transition-all touch-feedback"
              title="Yenile"
            >
              <RefreshCw size={18} />
            </button>

            {activeTab === 'hammaddeler' && (
              <Button
                variant="primary"
                leftIcon={<Plus size={18} />}
                onClick={() => setHammaddeModal({ acik: true, hammadde: null })}
                className="font-bold shadow-lg shadow-brand-900/30"
              >
                Yeni Hammadde
              </Button>
            )}

            {activeTab === 'receteler' && (
              <Button
                variant="primary"
                leftIcon={<Plus size={18} />}
                onClick={() => setReceteModal({ acik: true, urun: null })}
                className="font-bold shadow-lg shadow-brand-900/30"
              >
                Reçete Tanımla
              </Button>
            )}
          </div>
        </div>

        {/* KPI Şeridi */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-[#0E121E] border border-[#1E2436] rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-surface-400 uppercase">Toplam Hammadde</div>
              <div className="text-lg font-bold text-white mt-0.5">{istatistikler.toplamHammadde} <span className="text-xs font-normal text-surface-500">Kalem</span></div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#141826] border border-[#1E2538] flex items-center justify-center text-brand-400">
              <Package size={18} />
            </div>
          </div>

          <div className={clsx(
            "rounded-xl p-3.5 flex items-center justify-between border transition-colors",
            istatistikler.kritikSayisi > 0 
              ? "bg-rose-950/20 border-rose-900/50" 
              : "bg-[#0E121E] border-[#1E2436]"
          )}>
            <div>
              <div className="text-[11px] font-mono text-rose-400 uppercase">Kritik / Tükendi</div>
              <div className="text-lg font-bold text-rose-300 mt-0.5 flex items-center gap-2">
                {istatistikler.kritikSayisi}
                {istatistikler.kritikSayisi > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-900/60 text-rose-200 border border-rose-700/60 font-mono">
                    DİKKAT
                  </span>
                )}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-950/50 border border-rose-800/40 flex items-center justify-center text-rose-400">
              <ShieldAlert size={18} />
            </div>
          </div>

          <div className="bg-[#0E121E] border border-[#1E2436] rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-surface-400 uppercase">Toplam Depo Değeri</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5 font-mono">
                {formatPara(istatistikler.toplamStokMaliyeti)}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-950/30 border border-emerald-800/30 flex items-center justify-center text-emerald-400">
              <DollarSign size={18} />
            </div>
          </div>

          <div className="bg-[#0E121E] border border-[#1E2436] rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-mono text-surface-400 uppercase">Ort. Reçete Kâr Marjı</div>
              <div className="text-lg font-bold text-cyan-400 mt-0.5 font-mono">
                %{istatistikler.ortalamaKarMarji}
              </div>
            </div>
            <div className="w-9 h-9 rounded-lg bg-cyan-950/30 border border-cyan-800/30 flex items-center justify-center text-cyan-400">
              <TrendingUp size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sekme Seçici ve Arama/Filtre Çubuğu */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 shrink-0">
        
        {/* Sekmeler */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0E111B] border border-[#1E2436] rounded-xl overflow-x-auto pos-scrollbar">
          <button
            type="button"
            onClick={() => { setActiveTab('hammaddeler'); setAramaMetni('') }}
            className={clsx(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap touch-feedback",
              activeTab === 'hammaddeler'
                ? "bg-brand-600 text-white shadow-md shadow-brand-950/50 border border-brand-400/40"
                : "text-surface-400 hover:text-surface-200 hover:bg-[#151928]"
            )}
          >
            <Package size={15} />
            <span>Hammaddeler & Stok</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-surface-300 font-mono">
              {hammaddeler.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('receteler'); setAramaMetni('') }}
            className={clsx(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap touch-feedback",
              activeTab === 'receteler'
                ? "bg-brand-600 text-white shadow-md shadow-brand-950/50 border border-brand-400/40"
                : "text-surface-400 hover:text-surface-200 hover:bg-[#151928]"
            )}
          >
            <ChefHat size={15} />
            <span>Ürün Reçeteleri (BOM)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-surface-300 font-mono">
              {receteler.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('maliyet'); setAramaMetni('') }}
            className={clsx(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap touch-feedback",
              activeTab === 'maliyet'
                ? "bg-brand-600 text-white shadow-md shadow-brand-950/50 border border-brand-400/40"
                : "text-surface-400 hover:text-surface-200 hover:bg-[#151928]"
            )}
          >
            <Calculator size={15} />
            <span>Maliyet Analizi</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('hareketler'); setAramaMetni('') }}
            className={clsx(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap touch-feedback",
              activeTab === 'hareketler'
                ? "bg-brand-600 text-white shadow-md shadow-brand-950/50 border border-brand-400/40"
                : "text-surface-400 hover:text-surface-200 hover:bg-[#151928]"
            )}
          >
            <History size={15} />
            <span>Hareket Geçmişi</span>
          </button>
        </div>

        {/* Arama ve Filtre */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'hammaddeler' ? 'Hammadde veya tedarikçi ara...' :
                activeTab === 'receteler' ? 'Reçeteli ürün ara...' : 'Arama yap...'
              }
              value={aramaMetni}
              onChange={e => setAramaMetni(e.target.value)}
              className="w-full h-9 pl-9 pr-8 text-xs rounded-xl bg-[#0E121E] border border-[#1E2436] text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
            {aramaMetni && (
              <button
                type="button"
                onClick={() => setAramaMetni('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {activeTab === 'hammaddeler' && (
            <div className="flex items-center gap-1 bg-[#0E121E] border border-[#1E2436] p-0.5 rounded-xl">
              {(['tum', 'kritik', 'dusuk', 'normal'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDurumFiltresi(d)}
                  className={clsx(
                    "px-2.5 py-1.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition-all",
                    durumFiltresi === d
                      ? d === 'kritik' ? "bg-rose-900/60 text-rose-200 border border-rose-700/60"
                      : d === 'dusuk' ? "bg-amber-900/60 text-amber-200 border border-amber-700/60"
                      : d === 'normal' ? "bg-emerald-900/60 text-emerald-200 border border-emerald-700/60"
                      : "bg-[#1C2237] text-white border border-[#2B3553]"
                      : "text-surface-400 hover:text-surface-200"
                  )}
                >
                  {d === 'tum' ? 'Tümü' : d === 'kritik' ? 'Kritik' : d === 'dusuk' ? 'Düşük' : 'Normal'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Ana İçerik Alanı */}
      <div className="flex-1 min-h-0 bg-[#0B0E17] rounded-2xl border border-[#1E2436] overflow-hidden p-4">
        
        {/* TAB 1: HAMMADDELER & STOK */}
        {activeTab === 'hammaddeler' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto pos-scrollbar pr-1 pb-4">
              {hamYukleniyor ? (
                <div className="flex items-center justify-center h-48 text-surface-400 font-mono text-sm">
                  <RefreshCw className="animate-spin mr-2" size={18} /> Hammaddeler yükleniyor...
                </div>
              ) : filtrelenmisHammaddeler.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-56 text-surface-400 border border-dashed border-[#1E2538] rounded-xl my-4">
                  <Package size={36} className="text-surface-600 mb-2" />
                  <p className="font-semibold text-sm">Eşleşen hammadde bulunamadı</p>
                  <p className="text-xs text-surface-500 mt-1">Arama kriterlerinizi değiştirebilir veya yeni hammadde ekleyebilirsiniz.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {filtrelenmisHammaddeler.map(ham => {
                    const mevcut = Number(ham.mevcut_stok || 0)
                    const minStok = Number(ham.min_stok || 0)
                    const stokYuzdesi = minStok > 0 ? Math.min(100, Math.round((mevcut / minStok) * 100)) : 100
                    const toplamDeger = mevcut * Number(ham.maliyet_birim || 0)

                    return (
                      <motion.div
                        key={ham.id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={clsx(
                          "relative rounded-xl border p-4 transition-all duration-150 flex flex-col justify-between group",
                          ham.stok_durumu === 'tukendi'
                            ? "bg-[#160D12] border-rose-900/60 shadow-lg shadow-rose-950/30"
                            : ham.stok_durumu === 'kritik'
                            ? "bg-[#140E14] border-red-900/50 shadow-md shadow-red-950/20"
                            : ham.stok_durumu === 'dusuk'
                            ? "bg-[#14120D] border-amber-900/40"
                            : "bg-[#0E121E] border-[#1E2436] hover:border-brand-500/40"
                        )}
                      >
                        <div>
                          {/* Kart Başlığı */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white text-base tracking-tight truncate" title={ham.ad}>
                                  {ham.ad}
                                </h3>
                              </div>
                              <div className="text-[11px] text-surface-400 mt-0.5 truncate flex items-center gap-1.5 font-mono">
                                <span>Tedarikçi:</span>
                                <span className="text-surface-300 font-sans">{ham.tedarikci || 'Belirtilmedi'}</span>
                              </div>
                            </div>
                            
                            {/* Durum Rozeti */}
                            <div>
                              {renderStokRozeti(ham.stok_durumu)}
                            </div>
                          </div>

                          {/* Stok Miktar Göstergesi */}
                          <div className="bg-[#090C15] border border-[#1A1F30] rounded-lg p-3 mb-3">
                            <div className="flex items-end justify-between mb-1.5">
                              <div>
                                <span className="text-[10px] uppercase font-mono text-surface-400 block">Mevcut Stok</span>
                                <span className={clsx(
                                  "text-2xl font-bold font-mono tracking-tight",
                                  ham.stok_durumu === 'tukendi' || ham.stok_durumu === 'kritik' ? "text-rose-400" :
                                  ham.stok_durumu === 'dusuk' ? "text-amber-400" : "text-emerald-400"
                                )}>
                                  {ham.mevcut_stok}
                                </span>
                                <span className="text-xs font-semibold text-surface-400 ml-1.5">{ham.birim}</span>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] uppercase font-mono text-surface-400 block">Min. Eşik</span>
                                <span className="text-sm font-semibold text-surface-300 font-mono">
                                  {ham.min_stok || 0} {ham.birim}
                                </span>
                              </div>
                            </div>

                            {/* Stok Seviye İlerleme Çubuğu */}
                            <div className="w-full bg-[#141826] h-2 rounded-full overflow-hidden border border-[#1E2538]">
                              <div
                                className={clsx(
                                  "h-full rounded-full transition-all duration-300",
                                  ham.stok_durumu === 'tukendi' || ham.stok_durumu === 'kritik' ? "bg-rose-500" :
                                  ham.stok_durumu === 'dusuk' ? "bg-amber-500" : "bg-emerald-500"
                                )}
                                style={{ width: `${Math.min(100, (mevcut / (minStok || 1)) * 100)}%` }}
                              />
                            </div>
                          </div>

                          {/* Finansal Bilgiler */}
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4 pt-1 border-t border-[#161B2C]">
                            <div>
                              <span className="text-[10px] text-surface-500 block uppercase">Birim Maliyet</span>
                              <span className="font-bold text-surface-200">{formatPara(ham.maliyet_birim)}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-surface-500 block uppercase">Toplam Envanter</span>
                              <span className="font-bold text-brand-400">{formatPara(toplamDeger)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Aksiyon Butonları */}
                        <div className="flex items-center gap-2 pt-2 border-t border-[#1A1F30]">
                          <button
                            type="button"
                            onClick={() => setStokIslemModal({ acik: true, hammadde: ham, islemTipi: 'giris' })}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 text-xs font-bold transition-all touch-feedback"
                          >
                            <ArrowUpRight size={15} />
                            <span>Giriş</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setStokIslemModal({ acik: true, hammadde: ham, islemTipi: 'cikis' })}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-700/50 text-rose-300 text-xs font-bold transition-all touch-feedback"
                          >
                            <ArrowDownRight size={15} />
                            <span>Çıkış / Fire</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setHammaddeModal({ acik: true, hammadde: ham })}
                            className="p-2 rounded-lg bg-[#141826] hover:bg-[#1E2538] border border-[#1E2538] text-surface-400 hover:text-white transition-all touch-feedback"
                            title="Düzenle"
                          >
                            <Edit2 size={15} />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ÜRÜN REÇETELERİ (BOM) */}
        {activeTab === 'receteler' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto pos-scrollbar pr-1 pb-4">
              {recYukleniyor ? (
                <div className="flex items-center justify-center h-48 text-surface-400 font-mono text-sm">
                  <RefreshCw className="animate-spin mr-2" size={18} /> Reçeteler yükleniyor...
                </div>
              ) : filtrelenmisReceteler.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-56 text-surface-400 border border-dashed border-[#1E2538] rounded-xl my-4">
                  <ChefHat size={36} className="text-surface-600 mb-2" />
                  <p className="font-semibold text-sm">Reçete bulunamadı</p>
                  <p className="text-xs text-surface-500 mt-1">Ürünlerinize hammadde reçetesi (BOM) tanımlayarak porsiyon maliyetlerini otomatik hesaplayabilirsiniz.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setReceteModal({ acik: true, urun: null })}
                  >
                    İlk Reçeteyi Tanımla
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {filtrelenmisReceteler.map(rec => {
                    const karMarji = Number(rec.kar_marji || 0)
                    const toplamMaliyet = Number(rec.toplam_maliyet || 0)
                    const satisFiyati = Number(rec.satis_fiyati || 0)
                    const netKar = satisFiyati - toplamMaliyet

                    return (
                      <motion.div
                        key={rec.urun_id}
                        layout
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0E121E] border border-[#1E2436] hover:border-brand-500/40 rounded-xl p-4 flex flex-col justify-between transition-all group"
                      >
                        <div>
                          {/* Başlık ve Kategori */}
                          <div className="flex items-start justify-between gap-2 mb-3 pb-2.5 border-b border-[#1A1F30]">
                            <div>
                              <h3 className="font-bold text-white text-base tracking-tight">{rec.urun_adi}</h3>
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[#141826] text-surface-400 border border-[#1E2538] inline-block mt-1">
                                {rec.kategori_adi}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] uppercase font-mono text-surface-500 block">Satış Fiyatı</span>
                              <span className="text-base font-bold text-white font-mono">{formatPara(satisFiyati)}</span>
                            </div>
                          </div>

                          {/* Finansal & Maliyet Metrikleri */}
                          <div className="grid grid-cols-3 gap-2 bg-[#090C15] border border-[#1A1F30] rounded-lg p-3 mb-3 text-center">
                            <div>
                              <span className="text-[10px] uppercase font-mono text-surface-400 block">BOM Maliyet</span>
                              <span className="text-sm font-bold text-rose-400 font-mono mt-0.5 block">
                                {formatPara(toplamMaliyet)}
                              </span>
                            </div>

                            <div className="border-x border-[#1A1F30]">
                              <span className="text-[10px] uppercase font-mono text-surface-400 block">Net Kâr</span>
                              <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                                {formatPara(netKar)}
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase font-mono text-surface-400 block">Kâr Marjı</span>
                              <span className={clsx(
                                "text-sm font-bold font-mono mt-0.5 block",
                                karMarji >= 60 ? "text-emerald-400" :
                                karMarji >= 35 ? "text-amber-400" : "text-rose-400"
                              )}>
                                %{karMarji}
                              </span>
                            </div>
                          </div>

                          {/* Marj Gösterge Çubuğu */}
                          <div className="mb-4">
                            <div className="flex justify-between text-[10px] font-mono text-surface-400 mb-1">
                              <span>Maliyet Oranı</span>
                              <span>%{satisFiyati > 0 ? Math.round((toplamMaliyet / satisFiyati) * 100) : 0}</span>
                            </div>
                            <div className="w-full bg-[#141826] h-1.5 rounded-full overflow-hidden border border-[#1E2538]">
                              <div
                                className={clsx(
                                  "h-full rounded-full transition-all",
                                  karMarji >= 60 ? "bg-emerald-500" :
                                  karMarji >= 35 ? "bg-amber-500" : "bg-rose-500"
                                )}
                                style={{ width: `${Math.min(100, karMarji)}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Düzenleme Butonu */}
                        <div className="pt-2 border-t border-[#1A1F30]">
                          <Button
                            size="sm"
                            variant="outline"
                            fullWidth
                            leftIcon={<Edit2 size={14} />}
                            onClick={() => {
                              const targetUrun = (urunler || []).find(u => u.id === rec.urun_id) || { id: rec.urun_id, ad: rec.urun_adi, fiyat: rec.satis_fiyati }
                              setReceteModal({ acik: true, urun: targetUrun })
                            }}
                            className="font-bold text-xs"
                          >
                            Reçeteyi Düzenle (BOM)
                          </Button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: MALİYET & KÂR ANALİZİ */}
        {activeTab === 'maliyet' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto pos-scrollbar pr-1 pb-4">
              {malYukleniyor ? (
                <div className="flex items-center justify-center h-48 text-surface-400 font-mono text-sm">
                  <RefreshCw className="animate-spin mr-2" size={18} /> Maliyet analiz verileri hesaplanıyor...
                </div>
              ) : (
                <div className="overflow-x-auto pos-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1E2436] bg-[#0E111B] text-[11px] font-mono text-surface-400 uppercase">
                        <th className="py-3 px-4">Ürün Adı & Kategori</th>
                        <th className="py-3 px-4 text-right">Satış Fiyatı</th>
                        <th className="py-3 px-4 text-right">BOM Hammadde Maliyeti</th>
                        <th className="py-3 px-4 text-center">Birim Kâr</th>
                        <th className="py-3 px-4 text-center">Kâr Marjı (%)</th>
                        <th className="py-3 px-4 text-right">Satış Adedi</th>
                        <th className="py-3 px-4 text-right">Toplam Kâr</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1F30] text-xs">
                      {filtrelenmisMaliyetler.map(mal => {
                        const karMarji = Number(mal.kar_marji || 0)
                        const satisFiyati = Number(mal.satis_fiyati || 0)
                        const hammaddeMaliyeti = Number(mal.hammadde_maliyeti || 0)
                        const birimKar = satisFiyati - hammaddeMaliyeti
                        const toplamKar = Number(mal.toplam_kar || 0)

                        return (
                          <tr key={mal.urun_id} className="hover:bg-[#121626] transition-colors">
                            <td className="py-3 px-4 font-semibold text-white">
                              <div>{mal.urun_adi}</div>
                              <span className="text-[10px] text-surface-400 font-normal">{mal.kategori_adi}</span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-white">
                              {formatPara(satisFiyati)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-rose-400 font-semibold">
                              {formatPara(hammaddeMaliyeti)}
                            </td>
                            <td className="py-3 px-4 text-center font-mono font-semibold text-surface-200">
                              {formatPara(birimKar)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={clsx(
                                "px-2 py-0.5 rounded text-[11px] font-bold font-mono",
                                karMarji >= 60 ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40" :
                                karMarji >= 35 ? "bg-amber-950/60 text-amber-300 border border-amber-500/40" :
                                "bg-rose-950/60 text-rose-300 border border-rose-500/40"
                              )}>
                                %{karMarji}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-semibold text-surface-300">
                              {mal.satis_adedi || 0} Adet
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                              {formatPara(toplamKar)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: STOK HAREKET GEÇMİŞİ */}
        {activeTab === 'hareketler' && (
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto pos-scrollbar pr-1 pb-4">
              {harYukleniyor ? (
                <div className="flex items-center justify-center h-48 text-surface-400 font-mono text-sm">
                  <RefreshCw className="animate-spin mr-2" size={18} /> Hareketler yükleniyor...
                </div>
              ) : hareketler.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-56 text-surface-400 border border-dashed border-[#1E2538] rounded-xl my-4">
                  <History size={36} className="text-surface-600 mb-2" />
                  <p className="font-semibold text-sm">Henüz stok hareketi kaydedilmemiş</p>
                </div>
              ) : (
                <div className="overflow-x-auto pos-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1E2436] bg-[#0E111B] text-[11px] font-mono text-surface-400 uppercase">
                        <th className="py-3 px-4">Tarih</th>
                        <th className="py-3 px-4">Hammadde</th>
                        <th className="py-3 px-4 text-center">İşlem Tipi</th>
                        <th className="py-3 px-4 text-right">Miktar</th>
                        <th className="py-3 px-4 text-right">Birim Maliyet</th>
                        <th className="py-3 px-4">Personel</th>
                        <th className="py-3 px-4">Açıklama</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1A1F30] text-xs">
                      {hareketler.map(har => {
                        const islemTipi = har.islem_tipi
                        return (
                          <tr key={har.id} className="hover:bg-[#121626] transition-colors">
                            <td className="py-3 px-4 font-mono text-surface-400 whitespace-nowrap">
                              {formatTarih(har.created_at)}
                            </td>
                            <td className="py-3 px-4 font-bold text-white">
                              {har.hammadde_adi}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={clsx(
                                "px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase",
                                islemTipi === 'giris' ? "bg-emerald-950/60 text-emerald-300 border border-emerald-600/50" :
                                islemTipi === 'cikis' ? "bg-rose-950/60 text-rose-300 border border-rose-600/50" :
                                islemTipi === 'fire' ? "bg-amber-950/60 text-amber-300 border border-amber-600/50" :
                                "bg-brand-950/60 text-brand-300 border border-brand-600/50"
                              )}>
                                {islemTipi}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold">
                              <span className={clsx(
                                islemTipi === 'giris' ? "text-emerald-400" : "text-rose-400"
                              )}>
                                {islemTipi === 'giris' ? '+' : '-'}{har.miktar}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-surface-300">
                              {har.birim_maliyet ? formatPara(har.birim_maliyet) : '-'}
                            </td>
                            <td className="py-3 px-4 text-surface-400">
                              {har.personel_adi || 'Sistem'}
                            </td>
                            <td className="py-3 px-4 text-surface-400 max-w-xs truncate" title={har.aciklama}>
                              {har.aciklama || '-'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. MODALLAR */}

      {/* STOK İŞLEM MODALI (GİRİŞ / ÇIKIŞ / FİRE / SAYIM) */}
      <StokIslemModal
        isOpen={stokIslemModal.acik}
        hammadde={stokIslemModal.hammadde}
        islemTipi={stokIslemModal.islemTipi}
        personelId={personel?.id || 1}
        onClose={() => setStokIslemModal({ acik: false, hammadde: null, islemTipi: 'giris' })}
        onSuccess={() => {
          hamYenile()
          harYenile()
          success('İşlem Başarılı', 'Stok hareketi güncellendi.')
          setStokIslemModal({ acik: false, hammadde: null, islemTipi: 'giris' })
        }}
      />

      {/* HAMMADDE EKLEME & DÜZENLEME MODALI */}
      <HammaddeModal
        isOpen={hammaddeModal.acik}
        hammadde={hammaddeModal.hammadde}
        onClose={() => setHammaddeModal({ acik: false, hammadde: null })}
        onSuccess={() => {
          hamYenile()
          setHammaddeModal({ acik: false, hammadde: null })
        }}
      />

      {/* REÇETE DÜZENLEME MODALI (BOM BUILDER) */}
      <ReceteModal
        isOpen={receteModal.acik}
        seciliUrun={receteModal.urun}
        urunler={urunler || []}
        hammaddeler={hammaddeler || []}
        onClose={() => setReceteModal({ acik: false, urun: null })}
        onSuccess={() => {
          recYenile()
          malYenile()
          setReceteModal({ acik: false, urun: null })
        }}
      />

    </div>
  )
}

/**
 * Stok Giriş / Çıkış / Fire / Sayım Modalı
 */
function StokIslemModal({ isOpen, hammadde, islemTipi: baslangicIslemTipi, personelId, onClose, onSuccess }: any) {
  const [islemTipi, setIslemTipi] = useState(baslangicIslemTipi || 'giris')
  const [miktar, setMiktar] = useState('')
  const [birimMaliyet, setBirimMaliyet] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const { error } = useToast()

  useEffect(() => {
    if (isOpen) {
      setIslemTipi(baslangicIslemTipi || 'giris')
      setMiktar('')
      setBirimMaliyet(hammadde?.maliyet_birim ? String(hammadde.maliyet_birim) : '')
      setAciklama('')
    }
  }, [isOpen, baslangicIslemTipi, hammadde])

  const handleKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!miktar || Number(miktar) <= 0) {
      error('Geçersiz Miktar', 'Lütfen 0\'dan büyük bir miktar girin.')
      return
    }

    setYukleniyor(true)
    try {
      const islem = await ipcInvoke(STOK_KANALLARI.STOK_GIRIS, {
        hammadde_id: hammadde.id,
        islem_tipi: islemTipi,
        miktar: Number(miktar),
        birim_maliyet: islemTipi === 'giris' && birimMaliyet ? Number(birimMaliyet) : 0,
        aciklama: aciklama.trim() || null,
        personel_id: personelId || 1
      })

      if (islem.basarili) {
        onSuccess()
      } else {
        error('Hata', islem.hata || 'Stok kaydedilemedi.')
      }
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Stok Hareketi: ${hammadde?.ad || ''}`}
      size="md"
    >
      <form onSubmit={handleKaydet} className="flex flex-col gap-4">
        
        {/* İşlem Tipi Seçici */}
        <div>
          <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">İşlem Türü</label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'giris', label: 'Giriş (+)', color: 'emerald' },
              { id: 'cikis', label: 'Çıkış (-)', color: 'rose' },
              { id: 'fire', label: 'Fire / Zayiat', color: 'amber' },
              { id: 'sayim', label: 'Sayım Düzelt', color: 'brand' }
            ].map(tip => (
              <button
                key={tip.id}
                type="button"
                onClick={() => setIslemTipi(tip.id)}
                className={clsx(
                  "py-2.5 px-2 rounded-xl text-xs font-bold transition-all border text-center touch-feedback",
                  islemTipi === tip.id
                    ? tip.id === 'giris' ? "bg-emerald-950/80 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-950/40"
                    : tip.id === 'cikis' ? "bg-rose-950/80 text-rose-300 border-rose-500 shadow-md shadow-rose-950/40"
                    : tip.id === 'fire' ? "bg-amber-950/80 text-amber-300 border-amber-500 shadow-md shadow-amber-950/40"
                    : "bg-brand-950/80 text-brand-300 border-brand-500 shadow-md shadow-brand-950/40"
                    : "bg-[#090C15] border-[#1E2436] text-surface-400 hover:text-surface-200"
                )}
              >
                {tip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mevcut Durum Bilgisi */}
        <div className="bg-[#090C15] border border-[#1E2436] rounded-xl p-3 flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-surface-500 block uppercase text-[10px]">Mevcut Depo Stoğu</span>
            <span className="text-base font-bold text-white">{hammadde?.mevcut_stok} {hammadde?.birim}</span>
          </div>
          <div className="text-right">
            <span className="text-surface-500 block uppercase text-[10px]">Mevcut Birim Maliyet</span>
            <span className="text-sm font-bold text-emerald-400">{formatPara(hammadde?.maliyet_birim)}</span>
          </div>
        </div>

        {/* Miktar */}
        <div>
          <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">
            İşlem Miktarı ({hammadde?.birim})
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              required
              autoFocus
              placeholder="0.00"
              value={miktar}
              onChange={e => setMiktar(e.target.value)}
              className="flex-1 h-12 px-4 rounded-xl border border-[#1E2436] bg-[#090C15] text-white font-mono text-lg font-bold focus:border-brand-500 focus:outline-none"
            />
          </div>
          
          {/* Hızlı Miktar Butonları */}
          <div className="flex gap-1.5 mt-2">
            {[1, 5, 10, 25, 50].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setMiktar(String(val))}
                className="px-2.5 py-1 rounded-lg bg-[#141826] hover:bg-[#1E2538] border border-[#1E2538] text-[11px] font-mono text-surface-300"
              >
                +{val}
              </button>
            ))}
          </div>
        </div>

        {/* Birim Maliyet (Sadece Giriş işleminde) */}
        {islemTipi === 'giris' && (
          <div>
            <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">
              Yeni Alış Birim Maliyeti (₺)
            </label>
            <input
              type="number"
              step="0.01"
              placeholder={`Örn: ${hammadde?.maliyet_birim || '0.00'}`}
              value={birimMaliyet}
              onChange={e => setBirimMaliyet(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-[#1E2436] bg-[#090C15] text-white font-mono text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        )}

        {/* Açıklama */}
        <div>
          <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Açıklama / Belge No</label>
          <input
            type="text"
            placeholder="Örn: Fatura No, Sayım farkı, Tarihi geçmiş ürün vb."
            value={aciklama}
            onChange={e => setAciklama(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-[#1E2436] bg-[#090C15] text-white text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Footer Butonları */}
        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[#1A1F30]">
          <Button type="button" variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button
            type="submit"
            variant={islemTipi === 'giris' ? 'success' : islemTipi === 'cikis' ? 'danger' : 'primary'}
            isLoading={yukleniyor}
            className="px-6 font-bold"
          >
            Hareketi Kaydet
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Hammadde Ekleme & Düzenleme Modalı
 */
function HammaddeModal({ isOpen, hammadde, onClose, onSuccess }: any) {
  const [ad, setAd] = useState('')
  const [birim, setBirim] = useState('KG')
  const [mevcutStok, setMevcutStok] = useState('0')
  const [minStok, setMinStok] = useState('5')
  const [maliyetBirim, setMaliyetBirim] = useState('0')
  const [tedarikci, setTedarikci] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const { success, error } = useToast()

  useEffect(() => {
    if (isOpen) {
      if (hammadde) {
        setAd(hammadde.ad || '')
        setBirim(hammadde.birim || 'KG')
        setMevcutStok(String(hammadde.mevcut_stok || 0))
        setMinStok(String(hammadde.min_stok || 0))
        setMaliyetBirim(String(hammadde.maliyet_birim || 0))
        setTedarikci(hammadde.tedarikci || '')
      } else {
        setAd('')
        setBirim('KG')
        setMevcutStok('0')
        setMinStok('5')
        setMaliyetBirim('0')
        setTedarikci('')
      }
    }
  }, [isOpen, hammadde])

  const handleKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ad.trim()) return

    setYukleniyor(true)
    try {
      if (hammadde?.id) {
        // Güncelle
        await ipcInvoke(STOK_KANALLARI.HAMMADDE_GUNCELLE, hammadde.id, {
          ad: ad.trim(),
          birim,
          min_stok: Number(minStok),
          maliyet_birim: Number(maliyetBirim),
          tedarikci: tedarikci.trim() || null
        })
        success('Başarılı', 'Hammadde bilgileri güncellendi.')
      } else {
        // Ekle
        await ipcInvoke(STOK_KANALLARI.HAMMADDE_EKLE, {
          ad: ad.trim(),
          birim,
          mevcut_stok: Number(mevcutStok),
          min_stok: Number(minStok),
          maliyet_birim: Number(maliyetBirim),
          tedarikci: tedarikci.trim() || null
        })
        success('Başarılı', 'Yeni hammadde stoğa eklendi.')
      }
      onSuccess()
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hammadde ? `Hammadde Düzenle: ${hammadde.ad}` : 'Yeni Hammadde Ekle'}
      size="md"
    >
      <form onSubmit={handleKaydet} className="flex flex-col gap-4">
        
        {/* Ad & Birim */}
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Hammadde Adı</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Örn: Dana Kıyma, Süt, Domates vb."
              value={ad}
              onChange={e => setAd(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-[#1E2436] bg-[#090C15] text-white text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Ölçü Birimi</label>
            <select
              value={birim}
              onChange={e => setBirim(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-[#1E2436] bg-[#090C15] text-white text-sm focus:border-brand-500 focus:outline-none"
            >
              <option value="KG">KG (Kilogram)</option>
              <option value="Gram">Gram</option>
              <option value="Litre">Litre</option>
              <option value="ML">ML (Mililitre)</option>
              <option value="Adet">Adet</option>
              <option value="Porsiyon">Porsiyon</option>
              <option value="Paket">Paket</option>
              <option value="Koli">Koli</option>
              <option value="Kutu">Kutu</option>
            </select>
          </div>
        </div>

        {/* Stok Miktarları & Maliyet */}
        <div className="grid grid-cols-3 gap-3">
          {!hammadde && (
            <div>
              <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Başlangıç Stoğu</label>
              <input
                type="number"
                step="0.01"
                required
                value={mevcutStok}
                onChange={e => setMevcutStok(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#1E2436] bg-[#090C15] text-white font-mono text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          )}

          <div className={hammadde ? "col-span-1" : ""}>
            <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Kritik Min. Stok</label>
            <input
              type="number"
              step="0.01"
              required
              value={minStok}
              onChange={e => setMinStok(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-[#1E2436] bg-[#090C15] text-white font-mono text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div className={hammadde ? "col-span-2" : ""}>
            <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Birim Maliyet (₺)</label>
            <input
              type="number"
              step="0.01"
              required
              value={maliyetBirim}
              onChange={e => setMaliyetBirim(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-[#1E2436] bg-[#090C15] text-white font-mono text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Tedarikçi */}
        <div>
          <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Tedarikçi / Toptancı</label>
          <input
            type="text"
            placeholder="Örn: Metro Grossmarket, Özlem Et vb."
            value={tedarikci}
            onChange={e => setTedarikci(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-[#1E2436] bg-[#090C15] text-white text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[#1A1F30]">
          <Button type="button" variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" variant="primary" isLoading={yukleniyor} className="px-6 font-bold">
            {hammadde ? 'Değişiklikleri Kaydet' : 'Hammaddeyi Kaydet'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Reçete Oluşturma & Düzenleme Modalı (BOM Builder)
 */
function ReceteModal({ isOpen, seciliUrun, urunler, hammaddeler, onClose, onSuccess }: any) {
  const [urunId, setUrunId] = useState<number | ''>('')
  const [kalemler, setKalemler] = useState<Array<{ hammadde_id: number; miktar: number; birim: string }>>([])
  const [yukleniyor, setYukleniyor] = useState(false)
  const { success, error } = useToast()

  // Seçilen ürüne göre mevcut reçetesini getir
  useEffect(() => {
    if (isOpen) {
      if (seciliUrun?.id) {
        setUrunId(seciliUrun.id)
        ipcInvoke<any[]>(STOK_KANALLARI.RECETELER, seciliUrun.id)
          .then(res => {
            if (res && res.length > 0) {
              setKalemler(res.map(r => ({
                hammadde_id: r.hammadde_id,
                miktar: Number(r.miktar),
                birim: r.birim || 'Gram'
              })))
            } else {
              setKalemler([])
            }
          })
          .catch(() => setKalemler([]))
      } else {
        setUrunId(urunler.length > 0 ? urunler[0].id : '')
        setKalemler([])
      }
    }
  }, [isOpen, seciliUrun, urunler])

  // Ürün değiştiğinde reçeteyi getir
  const handleUrunDegistir = async (id: number) => {
    setUrunId(id)
    try {
      const res = await ipcInvoke<any[]>(STOK_KANALLARI.RECETELER, id)
      if (res && res.length > 0) {
        setKalemler(res.map(r => ({
          hammadde_id: r.hammadde_id,
          miktar: Number(r.miktar),
          birim: r.birim || 'Gram'
        })))
      } else {
        setKalemler([])
      }
    } catch {
      setKalemler([])
    }
  }

  // Kalem Ekle
  const handleKalemEkle = () => {
    if (hammaddeler.length === 0) return
    setKalemler([
      ...kalemler,
      {
        hammadde_id: hammaddeler[0].id,
        miktar: 1,
        birim: hammaddeler[0].birim || 'Gram'
      }
    ])
  }

  // Kalem Sil
  const handleKalemSil = (index: number) => {
    setKalemler(kalemler.filter((_, i) => i !== index))
  }

  // Kalem Güncelle
  const handleKalemGuncelle = (index: number, alan: string, deger: any) => {
    const yeni = [...kalemler]
    yeni[index] = { ...yeni[index], [alan]: deger }
    if (alan === 'hammadde_id') {
      const secilenHam = hammaddeler.find((h: any) => h.id === Number(deger))
      if (secilenHam) {
        yeni[index].birim = secilenHam.birim
      }
    }
    setKalemler(yeni)
  }

  // Canlı Maliyet ve Kâr Hesabı
  const seciliUrunBilgisi = useMemo(() => {
    return urunler.find((u: any) => u.id === Number(urunId)) || seciliUrun
  }, [urunId, urunler, seciliUrun])

  const toplamMaliyet = useMemo(() => {
    return kalemler.reduce((acc, k) => {
      const ham = hammaddeler.find((h: any) => h.id === Number(k.hammadde_id))
      if (!ham) return acc
      return acc + (Number(k.miktar || 0) * Number(ham.maliyet_birim || 0))
    }, 0)
  }, [kalemler, hammaddeler])

  const satisFiyati = Number(seciliUrunBilgisi?.fiyat || 0)
  const netKar = satisFiyati - toplamMaliyet
  const karMarji = satisFiyati > 0 ? Math.round((netKar / satisFiyati) * 100) : 0

  const handleKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urunId) return

    setYukleniyor(true)
    try {
      await ipcInvoke(STOK_KANALLARI.RECETE_EKLE, urunId, kalemler)
      success('Başarılı', 'Ürün reçetesi güncellendi.')
      onSuccess()
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ürün Reçetesi Tanımlama (BOM Builder)"
      size="lg"
    >
      <form onSubmit={handleKaydet} className="flex flex-col gap-4">
        
        {/* Ürün Seçimi */}
        <div>
          <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Reçetesi Tanımlanacak Ürün</label>
          <select
            value={urunId}
            onChange={e => handleUrunDegistir(Number(e.target.value))}
            className="w-full h-11 px-4 rounded-xl border border-[#1E2436] bg-[#090C15] text-white text-sm font-semibold focus:border-brand-500 focus:outline-none"
          >
            {urunler.map((u: any) => (
              <option key={u.id} value={u.id}>
                {u.ad} — {formatPara(u.fiyat)} ({u.kategori_adi || 'Kategorisiz'})
              </option>
            ))}
          </select>
        </div>

        {/* Hammadde Kalemleri Listesi */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono text-surface-400 uppercase">Reçete Kalemleri & Sarfiyat</label>
            <button
              type="button"
              onClick={handleKalemEkle}
              className="flex items-center gap-1 text-xs font-bold text-brand-400 hover:text-brand-300 py-1 px-2.5 rounded-lg bg-brand-950/40 border border-brand-800/40 touch-feedback"
            >
              <Plus size={14} /> Hammadde Ekle
            </button>
          </div>

          <div className="bg-[#090C15] border border-[#1E2436] rounded-xl p-3 min-h-[140px] max-h-64 overflow-y-auto pos-scrollbar flex flex-col gap-2">
            {kalemler.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-28 text-surface-500 text-xs">
                <ChefHat size={24} className="text-surface-600 mb-1" />
                Henüz hammadde kalemi eklenmedi. "Hammadde Ekle" butonunu kullanın.
              </div>
            ) : (
              kalemler.map((kalem, idx) => {
                const seciliHam = hammaddeler.find((h: any) => h.id === Number(kalem.hammadde_id))
                const kalemMaliyet = Number(kalem.miktar || 0) * Number(seciliHam?.maliyet_birim || 0)

                return (
                  <div key={idx} className="flex items-center gap-2 bg-[#0E121E] border border-[#1A1F30] p-2.5 rounded-xl">
                    <div className="flex-1">
                      <select
                        value={kalem.hammadde_id}
                        onChange={e => handleKalemGuncelle(idx, 'hammadde_id', Number(e.target.value))}
                        className="w-full h-9 px-3 rounded-lg border border-[#1E2538] bg-[#090C15] text-white text-xs font-semibold focus:outline-none"
                      >
                        {hammaddeler.map((h: any) => (
                          <option key={h.id} value={h.id}>
                            {h.ad} ({formatPara(h.maliyet_birim)} / {h.birim})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        step="0.001"
                        placeholder="Miktar"
                        value={kalem.miktar}
                        onChange={e => handleKalemGuncelle(idx, 'miktar', Number(e.target.value))}
                        className="w-full h-9 px-2.5 text-center rounded-lg border border-[#1E2538] bg-[#090C15] text-white font-mono text-xs focus:outline-none"
                      />
                    </div>

                    <div className="w-16 text-center text-xs font-mono text-surface-400">
                      {kalem.birim || seciliHam?.birim}
                    </div>

                    <div className="w-24 text-right text-xs font-mono font-bold text-rose-400">
                      {formatPara(kalemMaliyet)}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleKalemSil(idx)}
                      className="p-1.5 rounded-lg text-surface-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                      title="Kalemi Sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Canlı Maliyet & Kâr Özeti */}
        <div className="grid grid-cols-4 gap-2 bg-[#0E121E] border border-[#1E2436] rounded-xl p-3.5 text-center font-mono">
          <div>
            <span className="text-[10px] text-surface-500 uppercase block">Satış Fiyatı</span>
            <span className="text-base font-bold text-white mt-0.5 block">{formatPara(satisFiyati)}</span>
          </div>

          <div>
            <span className="text-[10px] text-surface-500 uppercase block">Reçete Maliyeti</span>
            <span className="text-base font-bold text-rose-400 mt-0.5 block">{formatPara(toplamMaliyet)}</span>
          </div>

          <div>
            <span className="text-[10px] text-surface-500 uppercase block">Net Kâr / Porsiyon</span>
            <span className="text-base font-bold text-emerald-400 mt-0.5 block">{formatPara(netKar)}</span>
          </div>

          <div>
            <span className="text-[10px] text-surface-500 uppercase block">Projelendirilen Marj</span>
            <span className={clsx(
              "text-base font-bold mt-0.5 block",
              karMarji >= 60 ? "text-emerald-400" :
              karMarji >= 35 ? "text-amber-400" : "text-rose-400"
            )}>
              %{karMarji}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-2 pt-3 border-t border-[#1A1F30]">
          <Button type="button" variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button type="submit" variant="primary" isLoading={yukleniyor} className="px-6 font-bold">
            Reçeteyi Kaydet
          </Button>
        </div>
      </form>
    </Modal>
  )
}
