import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/Toast'
import { ipcInvoke } from '../../../hooks/useIPC'
import { MENU_KANALLARI } from '../../../../common/ipc-channels'
import { 
  Edit2, 
  Trash2, 
  Plus, 
  LayoutGrid, 
  Package, 
  Search, 
  DollarSign, 
  Percent, 
  Printer, 
  Barcode, 
  Sparkles, 
  Check, 
  X, 
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  FolderPlus,
  UploadCloud,
  Image as ImageIcon,
  Camera
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPara, formatResimUrl } from '../../../utils/formatters'

export default function MenuSettings() {
  const [subTab, setSubTab] = useState<'urunler' | 'fiyat-guncelleme' | 'kategoriler'>('urunler')
  const [kategoriler, setKategoriler] = useState<any[]>([])
  const [urunler, setUrunler] = useState<any[]>([])
  const [seciliKategoriId, setSeciliKategoriId] = useState<number | null>(null)
  const [aramaMetni, setAramaMetni] = useState('')
  const [yukleniyor, setYukleniyor] = useState(false)
  const { success, error, info } = useToast()

  // Modallar
  const [katModalAcik, setKatModalAcik] = useState(false)
  const [urunModalAcik, setUrunModalAcik] = useState(false)
  const [duzenlenenKat, setDuzenlenenKat] = useState<any>(null)
  const [duzenlenenUrun, setDuzenlenenUrun] = useState<any>(null)

  // Form State (Kategori)
  const [katAd, setKatAd] = useState('')
  const [katRenk, setKatRenk] = useState('#3B82F6')

  // Form State (Ürün)
  const [urunAd, setUrunAd] = useState('')
  const [urunKisaltma, setUrunKisaltma] = useState('')
  const [urunFiyat, setUrunFiyat] = useState('')
  const [urunKategoriId, setUrunKategoriId] = useState('')
  const [urunBarkod, setUrunBarkod] = useState('')
  const [urunBirim, setUrunBirim] = useState('Porsiyon')
  const [urunKdv, setUrunKdv] = useState('10')
  const [urunYaziciGrup, setUrunYaziciGrup] = useState('mutfak')
  const [urunResimYolu, setUrunResimYolu] = useState('')
  const [resimYukleniyor, setResimYukleniyor] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Toplu Fiyat Güncelleme State
  const [topluKategoriId, setTopluKategoriId] = useState<string>('tum')
  const [artisTipi, setArtisTipi] = useState<'yuzde' | 'tutar'>('yuzde')
  const [artisDegeri, setArtisDegeri] = useState<string>('10')
  const [fiyatOnizleme, setFiyatOnizleme] = useState<Record<number, number>>({})
  const [topluKayitYukleniyor, setTopluKayitYukleniyor] = useState(false)

  // Renk Paleti Seçenekleri
  const hazirRenkler = [
    '#3B82F6', // Brand Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Rose
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#6366F1', // Indigo
    '#14B8A6'  // Teal
  ]

  const verileriGetir = async () => {
    setYukleniyor(true)
    try {
      const katData = await ipcInvoke<any[]>(MENU_KANALLARI.KATEGORILER)
      setKategoriler(katData || [])
      
      const urunData = await ipcInvoke<any[]>(MENU_KANALLARI.URUNLER)
      setUrunler(urunData || [])
    } catch (err: any) {
      error('Hata', err.message || 'Veriler yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  useEffect(() => {
    verileriGetir()
  }, [])

  // Filtrelenmiş Ürünler
  const gosterilenUrunler = useMemo(() => {
    return urunler.filter(u => {
      // Kategori filtresi
      if (seciliKategoriId !== null && u.kategori_id !== seciliKategoriId) {
        return false
      }
      // Arama filtresi
      if (aramaMetni.trim()) {
        const q = aramaMetni.toLowerCase().trim()
        const adEslesir = (u.ad || '').toLowerCase().includes(q)
        const barkodEslesir = (u.barkod || '').toLowerCase().includes(q)
        const katEslesir = (u.kategori_adi || '').toLowerCase().includes(q)
        return adEslesir || barkodEslesir || katEslesir
      }
      return true
    })
  }, [urunler, seciliKategoriId, aramaMetni])

  // Kategori İşlemleri
  const katModaliniAc = (kat?: any) => {
    if (kat) {
      setDuzenlenenKat(kat)
      setKatAd(kat.ad || '')
      setKatRenk(kat.renk || '#3B82F6')
    } else {
      setDuzenlenenKat(null)
      setKatAd('')
      setKatRenk('#3B82F6')
    }
    setKatModalAcik(true)
  }

  const katKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!katAd.trim()) return

    try {
      if (duzenlenenKat) {
        await ipcInvoke(MENU_KANALLARI.KATEGORI_GUNCELLE, duzenlenenKat.id, { 
          ad: katAd.trim(), 
          renk: katRenk 
        })
        success('Başarılı', 'Kategori güncellendi.')
      } else {
        await ipcInvoke(MENU_KANALLARI.KATEGORI_EKLE, { 
          ad: katAd.trim(), 
          renk: katRenk 
        })
        success('Başarılı', 'Yeni kategori eklendi.')
      }
      setKatModalAcik(false)
      verileriGetir()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  const katSil = async (id: number) => {
    if (!window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return
    try {
      await ipcInvoke(MENU_KANALLARI.KATEGORI_SIL, id)
      success('Başarılı', 'Kategori silindi.')
      if (seciliKategoriId === id) setSeciliKategoriId(null)
      verileriGetir()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  // Ürün İşlemleri
  const urunModaliniAc = (urun?: any) => {
    if (urun) {
      setDuzenlenenUrun(urun)
      setUrunAd(urun.ad || '')
      setUrunKisaltma(urun.aciklama || urun.kisaltma || '')
      setUrunFiyat(urun.fiyat ? String(urun.fiyat) : '')
      setUrunKategoriId(String(urun.kategori_id))
      setUrunBarkod(urun.barkod || '')
      setUrunBirim(urun.birim || 'Porsiyon')
      setUrunKdv(urun.kdv_orani ? String(urun.kdv_orani) : '10')
      setUrunYaziciGrup(urun.yazici_grup || 'mutfak')
      setUrunResimYolu(urun.resim_yolu || '')
    } else {
      setDuzenlenenUrun(null)
      setUrunAd('')
      setUrunKisaltma('')
      setUrunFiyat('')
      setUrunKategoriId(seciliKategoriId ? String(seciliKategoriId) : (kategoriler.length > 0 ? String(kategoriler[0].id) : ''))
      setUrunBarkod('')
      setUrunBirim('Porsiyon')
      setUrunKdv('10')
      setUrunYaziciGrup('mutfak')
      setUrunResimYolu('')
    }
    setResimYukleniyor(false)
    setIsDragging(false)
    setUrunModalAcik(true)
  }

  // Görsel Seçme & Yükleme İşleyicisi
  const handleResimSec = async (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      error('Geçersiz Dosya', 'Lütfen geçerli bir görsel formatı (JPG, PNG, WEBP, SVG) seçiniz.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      error('Dosya Çok Büyük', 'Görsel boyutu maksimum 10MB olmalıdır.')
      return
    }

    setResimYukleniyor(true)
    try {
      // 1. Öncelik: Fetch ile Express REST API (/api/upload)
      try {
        const formData = new FormData()
        formData.append('image', file)
        const res = await fetch('http://localhost:3847/api/upload', {
          method: 'POST',
          body: formData
        })
        if (res.ok) {
          const data = await res.json()
          if (data.basarili && data.resim_yolu) {
            setUrunResimYolu(data.resim_yolu)
            success('Görsel Yüklendi', 'Ürün görseli başarıyla yüklendi.')
            setResimYukleniyor(false)
            return
          }
        }
      } catch (fetchErr) {
        console.warn('Fetch upload başarısız oldu, IPC yedek mekanizması deneniyor...', fetchErr)
      }

      // 2. Yedek Öncelik: Electron IPC üzerinden base64 aktarımı
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = reader.result as string
          const res = await ipcInvoke<any>(MENU_KANALLARI.RESIM_YUKLE, {
            base64,
            dosyaAdi: file.name
          })
          if (res && res.basarili && res.resim_yolu) {
            setUrunResimYolu(res.resim_yolu)
            success('Görsel Yüklendi', 'Ürün görseli başarıyla yüklendi.')
          } else {
            error('Yükleme Hatası', res?.hata || 'Görsel kaydedilemedi')
          }
        } catch (ipcErr: any) {
          error('Yükleme Hatası', ipcErr.message || 'Görsel kaydedilemedi')
        } finally {
          setResimYukleniyor(false)
        }
      }
      reader.onerror = () => {
        error('Dosya Hatası', 'Görsel dosyası okunamadı')
        setResimYukleniyor(false)
      }
      reader.readAsDataURL(file)
    } catch (err: any) {
      error('Hata', err.message || 'Görsel yüklenirken bir hata oluştu')
      setResimYukleniyor(false)
    }
  }

  // Görsel Kaldırma İşleyicisi
  const handleResimKaldir = () => {
    setUrunResimYolu('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    info('Görsel Kaldırıldı', 'Ürün görseli kaldırıldı.')
  }

  const urunKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urunAd.trim() || !urunFiyat) return

    try {
      const payload = {
        ad: urunAd.trim(),
        kisaltma: urunKisaltma.trim() || null,
        aciklama: urunKisaltma.trim() || null,
        fiyat: Number(urunFiyat),
        kategori_id: Number(urunKategoriId),
        barkod: urunBarkod.trim() || null,
        birim: urunBirim,
        kdv_orani: Number(urunKdv),
        yazici_grup: urunYaziciGrup,
        resim_yolu: urunResimYolu.trim() || null
      }

      if (duzenlenenUrun) {
        await ipcInvoke(MENU_KANALLARI.URUN_GUNCELLE, duzenlenenUrun.id, payload)
        success('Başarılı', 'Ürün güncellendi.')
      } else {
        await ipcInvoke(MENU_KANALLARI.URUN_EKLE, payload)
        success('Başarılı', 'Yeni ürün menüye eklendi.')
      }
      setUrunModalAcik(false)
      verileriGetir()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  const urunSil = async (id: number) => {
    if (!window.confirm('Bu ürünü menüden kaldırmak istediğinize emin misiniz?')) return
    try {
      await ipcInvoke(MENU_KANALLARI.URUN_SIL, id)
      success('Başarılı', 'Ürün silindi.')
      verileriGetir()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  // Toplu Fiyat Hesaplama
  const topluFiyatHedefUrunler = useMemo(() => {
    return urunler.filter(u => {
      if (topluKategoriId === 'tum') return true
      return String(u.kategori_id) === topluKategoriId
    })
  }, [urunler, topluKategoriId])

  const handleTopluFiyatHesapla = (yeniArtisDegeri?: string, yeniArtisTipi?: 'yuzde' | 'tutar') => {
    const val = Number(yeniArtisDegeri !== undefined ? yeniArtisDegeri : artisDegeri) || 0
    const tip = yeniArtisTipi || artisTipi
    const harita: Record<number, number> = {}

    topluFiyatHedefUrunler.forEach(u => {
      const eski = Number(u.fiyat || 0)
      let yeni = eski
      if (tip === 'yuzde') {
        yeni = Math.round((eski * (1 + val / 100)) * 100) / 100
      } else {
        yeni = Math.max(0, eski + val)
      }
      harita[u.id] = yeni
    })
    setFiyatOnizleme(harita)
  }

  // Otomatik hesaplama tetikleyici
  useEffect(() => {
    if (subTab === 'fiyat-guncelleme') {
      handleTopluFiyatHesapla()
    }
  }, [subTab, topluKategoriId, artisTipi, artisDegeri, urunler])

  // Toplu Fiyat Değişikliklerini Kaydet
  const handleTopluFiyatKaydet = async () => {
    const urunIdList = Object.keys(fiyatOnizleme).map(Number)
    if (urunIdList.length === 0) return

    if (!window.confirm(`${urunIdList.length} adet ürünün satış fiyatı güncellenecektir. Onaylıyor musunuz?`)) {
      return
    }

    setTopluKayitYukleniyor(true)
    try {
      for (const id of urunIdList) {
        const yeniFiyat = fiyatOnizleme[id]
        if (yeniFiyat !== undefined) {
          await ipcInvoke(MENU_KANALLARI.URUN_GUNCELLE, id, { fiyat: yeniFiyat })
        }
      }
      success('Fiyatlar Güncellendi', `${urunIdList.length} ürünün fiyatı başarıyla kaydedildi.`)
      verileriGetir()
    } catch (err: any) {
      error('Hata', err.message || 'Fiyatlar güncellenirken hata oluştu')
    } finally {
      setTopluKayitYukleniyor(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0D101A] text-surface-100 p-2 sm:p-4 overflow-hidden select-none">
      
      {/* Üst Sekme & Kontrol Barı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0 pb-3 border-b border-[#1A1F30]">
        
        {/* Modül Sekmeleri */}
        <div className="flex items-center gap-1.5 p-1 bg-[#090B12] border border-[#1E2436] rounded-xl overflow-x-auto pos-scrollbar">
          <button
            type="button"
            onClick={() => setSubTab('urunler')}
            className={clsx(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap touch-feedback",
              subTab === 'urunler'
                ? "bg-brand-600 text-white shadow-md shadow-brand-950/50 border border-brand-400/40"
                : "text-surface-400 hover:text-surface-200 hover:bg-[#121624]"
            )}
          >
            <Package size={15} />
            <span>Ürün & Menü Listesi</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-surface-300 font-mono">
              {urunler.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('fiyat-guncelleme')}
            className={clsx(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap touch-feedback",
              subTab === 'fiyat-guncelleme'
                ? "bg-brand-600 text-white shadow-md shadow-brand-950/50 border border-brand-400/40"
                : "text-surface-400 hover:text-surface-200 hover:bg-[#121624]"
            )}
          >
            <TrendingUp size={15} />
            <span>Hızlı & Toplu Fiyat Güncelleme</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('kategoriler')}
            className={clsx(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap touch-feedback",
              subTab === 'kategoriler'
                ? "bg-brand-600 text-white shadow-md shadow-brand-950/50 border border-brand-400/40"
                : "text-surface-400 hover:text-surface-200 hover:bg-[#121624]"
            )}
          >
            <LayoutGrid size={15} />
            <span>Kategoriler</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/40 text-surface-300 font-mono">
              {kategoriler.length}
            </span>
          </button>
        </div>

        {/* Aksiyon Butonları & Hızlı Arama */}
        <div className="flex items-center gap-2.5">
          {subTab === 'urunler' && (
            <>
              <div className="relative flex-1 sm:w-56">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
                <input
                  type="text"
                  placeholder="Ürün adı veya barkod ara..."
                  value={aramaMetni}
                  onChange={e => setAramaMetni(e.target.value)}
                  className="w-full h-9 pl-9 pr-8 text-xs rounded-xl bg-[#090C15] border border-[#1E2436] text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500"
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

              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={16} />}
                onClick={() => urunModaliniAc()}
                className="font-bold text-xs shadow-md shadow-brand-900/30"
              >
                Ürün Ekle
              </Button>
            </>
          )}

          {subTab === 'kategoriler' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={() => katModaliniAc()}
              className="font-bold text-xs"
            >
              Yeni Kategori
            </Button>
          )}
        </div>
      </div>

      {/* SUBTAB 1: ÜRÜN & MENÜ YÖNETİMİ (SPLIT PANE) */}
      {subTab === 'urunler' && (
        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4 overflow-hidden">
          
          {/* Sol Kategori Filtre Paneli */}
          <div className="w-full md:w-64 bg-[#090B12] rounded-xl border border-[#1E2436] p-3 flex flex-col shrink-0 overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#1A1F30]">
              <span className="text-[11px] font-mono font-bold text-surface-400 uppercase">Kategoriler</span>
              <button
                type="button"
                onClick={() => katModaliniAc()}
                className="text-[11px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 touch-feedback"
              >
                <Plus size={13} /> Ekle
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pos-scrollbar flex md:flex-col gap-1.5 pr-1">
              <button
                type="button"
                onClick={() => setSeciliKategoriId(null)}
                className={clsx(
                  "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left border touch-feedback",
                  seciliKategoriId === null
                    ? "bg-brand-950/60 text-white border-brand-500/60 shadow-sm"
                    : "bg-[#0E121E] border-transparent text-surface-300 hover:bg-[#141826] hover:text-white"
                )}
              >
                <span>Tüm Ürünler</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-surface-400">
                  {urunler.length}
                </span>
              </button>

              {kategoriler.map(kat => (
                <button
                  key={kat.id}
                  type="button"
                  onClick={() => setSeciliKategoriId(kat.id)}
                  className={clsx(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left border touch-feedback group",
                    seciliKategoriId === kat.id
                      ? "bg-brand-950/60 text-white border-brand-500/60 shadow-sm"
                      : "bg-[#0E121E] border-transparent text-surface-300 hover:bg-[#141826] hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span 
                      className="w-3 h-3 rounded-full shrink-0 shadow-xs" 
                      style={{ backgroundColor: kat.renk || '#3B82F6' }} 
                    />
                    <span className="truncate">{kat.ad}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-surface-400 shrink-0">
                    {kat.urun_sayisi || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Sağ Ürün Listesi */}
          <div className="flex-1 min-h-0 bg-[#090B12] rounded-xl border border-[#1E2436] p-4 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto pos-scrollbar pr-1 pb-4">
              {yukleniyor ? (
                <div className="flex items-center justify-center h-48 text-surface-400 font-mono text-sm">
                  <RefreshCw className="animate-spin mr-2" size={18} /> Ürünler yükleniyor...
                </div>
              ) : gosterilenUrunler.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-56 text-surface-400 border border-dashed border-[#1E2538] rounded-xl my-4">
                  <Package size={36} className="text-surface-600 mb-2" />
                  <p className="font-semibold text-sm">Seçilen kriterde ürün bulunamadı</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={() => urunModaliniAc()}
                  >
                    Yeni Ürün Ekle
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {gosterilenUrunler.map(urun => {
                    const kategori = kategoriler.find(k => k.id === urun.kategori_id)
                    return (
                      <motion.div
                        key={urun.id}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-[#0E121E] border border-[#1E2436] hover:border-brand-500/50 rounded-xl p-3.5 flex flex-col justify-between transition-all group shadow-sm hover:shadow-brand-950/20"
                      >
                        <div>
                          {/* Üst Şerit: Kategori ve Fiyat */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: kategori?.renk || '#3B82F6' }}
                              />
                              <span className="text-[11px] font-semibold text-surface-400 truncate">
                                {urun.kategori_adi}
                              </span>
                            </div>

                            <span className="text-base font-bold text-white font-mono shrink-0">
                              {formatPara(urun.fiyat)}
                            </span>
                          </div>

                          {/* Görsel Thumbnail & Ürün Adı */}
                          <div className="flex items-start gap-2.5 mb-2.5">
                            <div className="w-11 h-11 rounded-xl bg-[#141A26] border border-[#222C42] flex items-center justify-center shrink-0 overflow-hidden text-slate-300 shadow-inner group-hover:border-brand-500/40 transition-colors">
                              {urun.resim_yolu ? (
                                <img src={formatResimUrl(urun.resim_yolu)} alt={urun.ad} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-mono font-black text-xs text-surface-400">
                                  {urun.ad.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-white text-sm tracking-tight line-clamp-2 leading-snug" title={urun.ad}>
                                {urun.ad}
                              </h3>
                              {urun.kisaltma && (
                                <span className="text-[10px] font-mono text-surface-500 block truncate mt-0.5">
                                  #{urun.kisaltma}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Ekstra Bilgi Rozetleri */}
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-surface-400 mb-3">
                            <span className="px-1.5 py-0.5 rounded bg-[#141826] border border-[#1E2538]">
                              {urun.birim || 'Porsiyon'}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-[#141826] border border-[#1E2538]">
                              KDV %{urun.kdv_orani || 10}
                            </span>
                            {urun.barkod && (
                              <span className="px-1.5 py-0.5 rounded bg-[#141826] border border-[#1E2538] flex items-center gap-1">
                                <Barcode size={11} /> {urun.barkod}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Alt Butonlar */}
                        <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-[#1A1F30]">
                          <button
                            type="button"
                            onClick={() => urunModaliniAc(urun)}
                            className="p-1.5 rounded-lg bg-[#141826] hover:bg-brand-950/60 hover:text-brand-300 border border-[#1E2538] hover:border-brand-700/50 text-surface-400 transition-all touch-feedback"
                            title="Düzenle"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => urunSil(urun.id)}
                            className="p-1.5 rounded-lg bg-[#141826] hover:bg-rose-950/60 hover:text-rose-300 border border-[#1E2538] hover:border-rose-700/50 text-surface-400 transition-all touch-feedback"
                            title="Sil"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: HIZLI & TOPLU FİYAT GÜNCELLEME */}
      {subTab === 'fiyat-guncelleme' && (
        <div className="flex-1 min-h-0 bg-[#090B12] rounded-xl border border-[#1E2436] p-4 flex flex-col overflow-hidden">
          
          {/* Kontrol Paneli */}
          <div className="bg-[#0E121E] border border-[#1E2436] rounded-xl p-4 mb-4 shrink-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 items-end">
              
              {/* Kategori Seçici */}
              <div>
                <label className="text-[11px] font-mono text-surface-400 uppercase block mb-1">
                  Uygulanacak Kategori
                </label>
                <select
                  value={topluKategoriId}
                  onChange={e => setTopluKategoriId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#1E2436] bg-[#090C15] text-white text-xs font-semibold focus:outline-none"
                >
                  <option value="tum">Tüm Kategoriler ({urunler.length} Ürün)</option>
                  {kategoriler.map(k => (
                    <option key={k.id} value={String(k.id)}>
                      {k.ad} ({k.urun_sayisi || 0} Ürün)
                    </option>
                  ))}
                </select>
              </div>

              {/* Artış Türü */}
              <div>
                <label className="text-[11px] font-mono text-surface-400 uppercase block mb-1">
                  Artış / Değişim Türü
                </label>
                <div className="grid grid-cols-2 gap-1 bg-[#090C15] p-1 rounded-lg border border-[#1E2436]">
                  <button
                    type="button"
                    onClick={() => { setArtisTipi('yuzde'); handleTopluFiyatHesapla(artisDegeri, 'yuzde') }}
                    className={clsx(
                      "py-1.5 rounded-md text-xs font-bold transition-all",
                      artisTipi === 'yuzde' ? "bg-brand-600 text-white" : "text-surface-400 hover:text-white"
                    )}
                  >
                    Yüzde (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setArtisTipi('tutar'); handleTopluFiyatHesapla(artisDegeri, 'tutar') }}
                    className={clsx(
                      "py-1.5 rounded-md text-xs font-bold transition-all",
                      artisTipi === 'tutar' ? "bg-brand-600 text-white" : "text-surface-400 hover:text-white"
                    )}
                  >
                    Sabit Tutar (₺)
                  </button>
                </div>
              </div>

              {/* Artış Değeri */}
              <div>
                <label className="text-[11px] font-mono text-surface-400 uppercase block mb-1">
                  {artisTipi === 'yuzde' ? 'Artış Yüzdesi (%)' : 'Eklenecek Tutar (₺)'}
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    value={artisDegeri}
                    onChange={e => {
                      setArtisDegeri(e.target.value)
                      handleTopluFiyatHesapla(e.target.value, artisTipi)
                    }}
                    className="w-full h-10 px-3 rounded-lg border border-[#1E2436] bg-[#090C15] text-white font-mono text-sm font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Hızlı Butonlar & Kaydet */}
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={handleTopluFiyatKaydet}
                  isLoading={topluKayitYukleniyor}
                  fullWidth
                  className="h-10 font-bold text-xs shadow-lg shadow-brand-900/40"
                >
                  Fiyatları Güncelle
                </Button>
              </div>

            </div>

            {/* Hızlı Önceden Tanımlı Değer Butonları */}
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#1A1F30] overflow-x-auto pos-scrollbar">
              <span className="text-[10px] font-mono text-surface-500 uppercase mr-1">Hızlı Seçim:</span>
              {artisTipi === 'yuzde' ? (
                [5, 10, 15, 20, 25, 30].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setArtisDegeri(String(p)); handleTopluFiyatHesapla(String(p), 'yuzde') }}
                    className="px-2.5 py-1 rounded-md bg-[#141826] hover:bg-[#1E2538] border border-[#1E2538] text-[11px] font-mono text-surface-300 touch-feedback"
                  >
                    +{p}%
                  </button>
                ))
              ) : (
                [5, 10, 20, 50, 100].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setArtisDegeri(String(t)); handleTopluFiyatHesapla(String(t), 'tutar') }}
                    className="px-2.5 py-1 rounded-md bg-[#141826] hover:bg-[#1E2538] border border-[#1E2538] text-[11px] font-mono text-surface-300 touch-feedback"
                  >
                    +{t} ₺
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Fiyat Değişiklik Tablosu & Önizleme */}
          <div className="flex-1 min-h-0 overflow-y-auto pos-scrollbar pr-1 pb-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1E2436] bg-[#0E111B] text-[11px] font-mono text-surface-400 uppercase sticky top-0 z-10">
                  <th className="py-2.5 px-4">Ürün Adı</th>
                  <th className="py-2.5 px-4">Kategori</th>
                  <th className="py-2.5 px-4 text-right">Eski Fiyat</th>
                  <th className="py-2.5 px-4 text-center">Fark</th>
                  <th className="py-2.5 px-4 text-right">Yeni Satış Fiyatı</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1F30] text-xs">
                {topluFiyatHedefUrunler.map(urun => {
                  const eski = Number(urun.fiyat || 0)
                  const yeni = fiyatOnizleme[urun.id] !== undefined ? fiyatOnizleme[urun.id] : eski
                  const fark = yeni - eski

                  return (
                    <tr key={urun.id} className="hover:bg-[#121626] transition-colors">
                      <td className="py-2.5 px-4 font-bold text-white">
                        {urun.ad}
                      </td>
                      <td className="py-2.5 px-4 text-surface-400">
                        {urun.kategori_adi}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-surface-400">
                        {formatPara(eski)}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-semibold">
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-[10px]",
                          fark > 0 ? "bg-emerald-950/60 text-emerald-300 border border-emerald-600/40" :
                          fark < 0 ? "bg-rose-950/60 text-rose-300 border border-rose-600/40" :
                          "bg-[#141826] text-surface-400"
                        )}>
                          {fark > 0 ? `+${formatPara(fark)}` : fark < 0 ? formatPara(fark) : '0.00 ₺'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <input
                          type="number"
                          step="0.5"
                          value={yeni}
                          onChange={e => {
                            const val = Number(e.target.value) || 0
                            setFiyatOnizleme(prev => ({ ...prev, [urun.id]: val }))
                          }}
                          className="w-28 h-8 px-2 text-right font-mono font-bold text-emerald-400 rounded-lg border border-[#1E2538] bg-[#090C15] focus:border-brand-500 focus:outline-none"
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: KATEGORİ YÖNETİMİ */}
      {subTab === 'kategoriler' && (
        <div className="flex-1 min-h-0 bg-[#090B12] rounded-xl border border-[#1E2436] p-4 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pos-scrollbar pr-1 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {kategoriler.map(kat => (
                <div
                  key={kat.id}
                  className="bg-[#0E121E] border border-[#1E2436] hover:border-brand-500/40 rounded-xl p-4 flex flex-col justify-between transition-all group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#1A1F30]">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-4 h-4 rounded-full shadow-xs"
                          style={{ backgroundColor: kat.renk || '#3B82F6' }}
                        />
                        <h3 className="font-bold text-white text-base tracking-tight">{kat.ad}</h3>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-surface-400">
                        {kat.urun_sayisi || 0} Ürün
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-surface-400 mb-3">
                      <span>Renk Kodu:</span>
                      <span className="font-bold text-surface-200">{kat.renk || '#3B82F6'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1A1F30]">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Edit2 size={13} />}
                      onClick={() => katModaliniAc(kat)}
                      className="text-xs h-8"
                    >
                      Düzenle
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => katSil(kat.id)}
                      className="text-xs h-8 text-rose-400 hover:bg-rose-950/30"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODALLAR */}

      {/* KATEGORİ MODALI */}
      <Modal
        isOpen={katModalAcik}
        onClose={() => setKatModalAcik(false)}
        title={duzenlenenKat ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
        size="sm"
      >
        <form onSubmit={katKaydet} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Kategori Adı</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Örn: Ana Yemekler, İçecekler vb."
              value={katAd}
              onChange={e => setKatAd(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-[#1E2436] bg-[#090C15] text-white text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Kategori Rengi</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {hazirRenkler.map(renk => (
                <button
                  key={renk}
                  type="button"
                  onClick={() => setKatRenk(renk)}
                  className={clsx(
                    "w-8 h-8 rounded-lg transition-transform touch-feedback border flex items-center justify-center",
                    katRenk === renk ? "scale-110 border-white shadow-md" : "border-transparent opacity-80 hover:opacity-100"
                  )}
                  style={{ backgroundColor: renk }}
                >
                  {katRenk === renk && <Check size={14} className="text-white" />}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="color"
                value={katRenk}
                onChange={e => setKatRenk(e.target.value)}
                className="h-10 w-16 rounded-xl border border-[#1E2436] bg-[#090C15] cursor-pointer p-0"
              />
              <span className="text-xs font-mono uppercase text-surface-400">{katRenk}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[#1A1F30]">
            <Button type="button" variant="ghost" onClick={() => setKatModalAcik(false)}>
              İptal
            </Button>
            <Button type="submit" variant="primary" className="px-6 font-bold">
              {duzenlenenKat ? 'Değişiklikleri Kaydet' : 'Kategori Ekle'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ÜRÜN MODALI */}
      <Modal
        isOpen={urunModalAcik}
        onClose={() => setUrunModalAcik(false)}
        title={duzenlenenUrun ? `Ürün Düzenle: ${duzenlenenUrun.ad}` : 'Yeni Ürün Ekle'}
        size="md"
      >
        <form onSubmit={urunKaydet} className="flex flex-col gap-4">
          
          {/* Ad & Kısa Ad */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Ürün Adı</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Örn: Izgara Köfte Porsiyon"
                value={urunAd}
                onChange={e => setUrunAd(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[#1E2436] bg-[#090C15] text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Kısa / Mutfak Adı</label>
              <input
                type="text"
                placeholder="Örn: Köfte Pors."
                value={urunKisaltma}
                onChange={e => setUrunKisaltma(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#1E2436] bg-[#090C15] text-white text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Fiyat & KDV */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Satış Fiyatı (₺)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={urunFiyat}
                onChange={e => setUrunFiyat(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[#1E2436] bg-[#090C15] text-white font-mono text-lg font-bold focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">KDV Oranı (%)</label>
              <select
                value={urunKdv}
                onChange={e => setUrunKdv(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#1E2436] bg-[#090C15] text-white text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="1">%1 (Temel Gıda)</option>
                <option value="10">%10 (Standart Restoran)</option>
                <option value="20">%20 (Alkollü / Hizmet)</option>
              </select>
            </div>
          </div>

          {/* Kategori & Ölçü Birimi */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Kategori</label>
              <select
                required
                value={urunKategoriId}
                onChange={e => setUrunKategoriId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#1E2436] bg-[#090C15] text-white text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="" disabled>Kategori Seçiniz...</option>
                {kategoriler.map(k => (
                  <option key={k.id} value={String(k.id)}>{k.ad}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Ölçü Birimi</label>
              <select
                value={urunBirim}
                onChange={e => setUrunBirim(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#1E2436] bg-[#090C15] text-white text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="Porsiyon">Porsiyon</option>
                <option value="Kilo / Gramaj">Kilo / Gramaj</option>
                <option value="Adet">Adet</option>
                <option value="Tane">Tane</option>
                <option value="KG">KG</option>
                <option value="Gram">Gram</option>
                <option value="Litre">Litre</option>
                <option value="Dilim">Dilim</option>
                <option value="Şişe">Şişe</option>
                <option value="Kutu">Kutu</option>
              </select>
            </div>
          </div>

          {/* Barkod & Yazıcı Grubu */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Barkod (Opsiyonel)</label>
              <input
                type="text"
                placeholder="Barkod okutun veya yazın..."
                value={urunBarkod}
                onChange={e => setUrunBarkod(e.target.value)}
                className="w-full h-11 px-4 rounded-xl border border-[#1E2436] bg-[#090C15] text-white font-mono text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Mutfak / Yazıcı İstasyonu</label>
              <select
                value={urunYaziciGrup}
                onChange={e => setUrunYaziciGrup(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-[#1E2436] bg-[#090C15] text-white text-sm focus:border-brand-500 focus:outline-none"
              >
                <option value="mutfak">Ana Mutfak</option>
                <option value="bar">Bar / İçecek</option>
                <option value="firin">Fırın / Pide & Lahmacun</option>
                <option value="kasa">Sadece Kasa / Fiş</option>
              </select>
            </div>
          </div>

          {/* Ürün Görseli (Upload, Sürükle-Bırak & Önizleme) */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label className="text-xs font-mono text-surface-400 uppercase flex items-center justify-between">
              <span>Ürün Görseli (Fotoğraf)</span>
              {urunResimYolu && (
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Görsel Yüklendi
                </span>
              )}
            </label>

            {urunResimYolu ? (
              // Görsel Yüklü İse: Önizleme & Kaldır / Değiştir
              <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#090C15] border border-[#1E2436]">
                <div className="relative w-20 h-20 rounded-xl bg-[#141A26] border border-[#222C42] overflow-hidden shrink-0 shadow-md group">
                  <img
                    src={formatResimUrl(urunResimYolu)}
                    alt="Ürün Görsel Önizleme"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-white block truncate mb-0.5">
                    {urunResimYolu.split('/').pop()}
                  </span>
                  <span className="text-[10px] font-mono text-surface-400 block mb-2.5">
                    Menü, POS ve QR Menü ekranlarında gösterilecek
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={resimYukleniyor}
                      className="px-2.5 py-1.5 rounded-lg bg-[#141826] hover:bg-brand-950/70 hover:text-brand-300 border border-[#1E2538] hover:border-brand-600/50 text-xs font-semibold text-surface-300 transition-all touch-feedback flex items-center gap-1.5"
                    >
                      {resimYukleniyor ? (
                        <RefreshCw size={13} className="animate-spin text-brand-400" />
                      ) : (
                        <UploadCloud size={13} />
                      )}
                      <span>Görseli Değiştir</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResimKaldir}
                      disabled={resimYukleniyor}
                      className="px-2.5 py-1.5 rounded-lg bg-[#141826] hover:bg-rose-950/70 hover:text-rose-300 border border-[#1E2538] hover:border-rose-600/50 text-xs font-semibold text-surface-400 transition-all touch-feedback flex items-center gap-1.5"
                    >
                      <Trash2 size={13} />
                      <span>Görseli Kaldır</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Görsel Yok İse: Sürükle-Bırak / Dosya Seçme Alanı
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleResimSec(e.dataTransfer.files[0])
                  }
                }}
                onClick={() => !resimYukleniyor && fileInputRef.current?.click()}
                className={clsx(
                  "relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer touch-feedback group",
                  isDragging
                    ? "border-brand-400 bg-brand-950/40"
                    : "border-[#1E2436] hover:border-brand-500/60 bg-[#090C15] hover:bg-[#0E1322]"
                )}
              >
                {resimYukleniyor ? (
                  <div className="flex flex-col items-center py-2 text-brand-400">
                    <RefreshCw size={24} className="animate-spin mb-1.5" />
                    <span className="text-xs font-mono font-bold">Görsel yükleniyor...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-xl bg-[#141826] border border-[#222C42] flex items-center justify-center text-surface-400 group-hover:text-brand-400 group-hover:border-brand-500/40 mb-2 transition-colors">
                      <UploadCloud size={20} />
                    </div>
                    <p className="text-xs font-semibold text-white mb-0.5">
                      Görsel yüklemek için tıklayın veya sürükleyip bırakın
                    </p>
                    <p className="text-[10px] font-mono text-surface-500">
                      PNG, JPG, JPEG, WEBP, SVG • Maksimum 10MB
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Gizli Dosya Girişi */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml, image/gif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleResimSec(e.target.files[0])
                }
              }}
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[#1A1F30]">
            <Button type="button" variant="ghost" onClick={() => setUrunModalAcik(false)}>
              İptal
            </Button>
            <Button type="submit" variant="primary" className="px-6 font-bold">
              {duzenlenenUrun ? 'Değişiklikleri Kaydet' : 'Ürün Ekle'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
