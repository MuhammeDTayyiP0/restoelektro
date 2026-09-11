import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Button } from '../../../components/ui/Button'
import { Modal } from '../../../components/ui/Modal'
import { useToast } from '../../../components/ui/Toast'
import { ipcInvoke } from '../../../hooks/useIPC'
import { MENU_KANALLARI, STOK_KANALLARI } from '../../../../common/ipc-channels'
import type { HedefFiyatBirimi, FiyatIslemTuru, TopluFiyatGuncellemeIstegi } from '../../../../common/types/menu.types'
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
  TrendingDown,
  RefreshCw,
  RotateCcw,
  FolderPlus,
  UploadCloud,
  Image as ImageIcon,
  Camera,
  CheckSquare,
  Square,
  CheckCheck,
  Scale,
  Eye,
  AlertCircle,
  Layers,
  ChevronUp,
  ChevronDown,
  GripVertical
} from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPara, formatResimUrl, formatSatisTurleri, getUrunSatisTurleri, getUrunPorsiyonFiyati, getUrunKiloFiyati } from '../../../utils/formatters'
import { ProductImageCropper } from './ProductImageCropper'

const ISTEK_ZAMAN_ASIMI = 12_000

const zamanAsimliFetch = async (input: RequestInfo | URL, init?: RequestInit, timeout = ISTEK_ZAMAN_ASIMI) => {
  const controller = new AbortController()
  const zamanAsimi = window.setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('İstek zaman aşımına uğradı. Lütfen tekrar deneyin.')
    }
    throw err
  } finally {
    window.clearTimeout(zamanAsimi)
  }
}

const zamanAsimli = async <T,>(islem: Promise<T>, timeout = ISTEK_ZAMAN_ASIMI): Promise<T> => {
  let zamanAsimi: number | undefined
  try {
    return await Promise.race([
      islem,
      new Promise<T>((_resolve, reject) => {
        zamanAsimi = window.setTimeout(() => reject(new Error('İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.')), timeout)
      })
    ])
  } finally {
    if (zamanAsimi !== undefined) window.clearTimeout(zamanAsimi)
  }
}

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
  const [katRenk, setKatRenk] = useState('#9A5F48')
  const [katSiraNo, setKatSiraNo] = useState<number | string>(999)
  const [suruklenenKatId, setSuruklenenKatId] = useState<number | null>(null)

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
  const [kirpmaKaynagi, setKirpmaKaynagi] = useState<string | null>(null)
  const [resimUrl, setResimUrl] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Ürün Modal Sekmeleri ('genel' | 'satis' | 'stok')
  const [urunModalTab, setUrunModalTab] = useState<'genel' | 'satis' | 'stok'>('genel')

  // Satış Türleri Form State
  interface SatisTuruRow {
    id: string
    birim: string
    fiyat: string
  }
  const [satisTurleri, setSatisTurleri] = useState<SatisTuruRow[]>([
    { id: '1', birim: 'Porsiyon', fiyat: '' }
  ])

  // Reçete & Stok State
  const [hammaddeler, setHammaddeler] = useState<any[]>([])
  const [receteKalemleri, setReceteKalemleri] = useState<Array<{ hammadde_id: number; miktar: string; birim: string }>>([])
  const [receteYukleniyor, setReceteYukleniyor] = useState(false)

  // Toplu Fiyat Güncelleme State
  const [topluSecimModu, setTopluSecimModu] = useState<'kategori' | 'ozel'>('kategori')
  const [topluKategoriId, setTopluKategoriId] = useState<string>('tum')
  const [ozelSecilenUrunIds, setOzelSecilenUrunIds] = useState<number[]>([])
  const [ozelUrunArama, setOzelUrunArama] = useState<string>('')
  const [ozelKategoriFiltre, setOzelKategoriFiltre] = useState<string>('tum')

  // Dinamik Hedef Birim Desteği
  const [hedefBirimModu, setHedefBirimModu] = useState<'hepsi' | 'belirli'>('hepsi')
  const [seciliOzelBirim, setSeciliOzelBirim] = useState<string>('Porsiyon')
  const [artisTipi, setArtisTipi] = useState<FiyatIslemTuru>('yuzde')
  const [artisDegeri, setArtisDegeri] = useState<string>('10')
  const [yuvarlamaAktif, setYuvarlamaAktif] = useState<boolean>(false)
  const [yuvarlamaKati, setYuvarlamaKati] = useState<5 | 10>(5)

  const [manuelFiyatlar, setManuelFiyatlar] = useState<Record<number, Record<string, string>>>({})
  const [onizlemeModalAcik, setOnizlemeModalAcik] = useState<boolean>(false)
  const [simulasyonArama, setSimulasyonArama] = useState<string>('')
  const [topluKayitYukleniyor, setTopluKayitYukleniyor] = useState(false)

  // Sistemde ve ürünlerde mevcut olan tüm dinamik birimlerin listesi
  const tumBirimler = useMemo<string[]>(() => {
    const birimler = new Set<string>(['Porsiyon', 'KG', 'Adet', 'Gram', 'Litre', 'Paket', 'Dilim', 'Şişe', 'Kutu'])
    for (const u of urunler) {
      if (u.birim) birimler.add(u.birim.trim())
      const turler = getUrunSatisTurleri(u)
      for (const t of turler) {
        if (t.birim) birimler.add(t.birim.trim())
      }
    }
    return Array.from(birimler).filter(Boolean)
  }, [urunler])

  // Aktif hedef birim ('hepsi' veya dinamik birim adı)
  const aktifHedefBirim = useMemo<string>(() => {
    return hedefBirimModu === 'hepsi' ? 'hepsi' : (seciliOzelBirim || 'Porsiyon')
  }, [hedefBirimModu, seciliOzelBirim])

  // Birim eşleştirme kontrolü (büyük/küçük harf ve eş anlamlı duyarlı)
  const birimEslesir = useCallback((birimA: string, hedef: string): boolean => {
    if (!hedef || hedef === 'hepsi') return true
    const a = (birimA || '').trim().toLowerCase()
    const b = (hedef || '').trim().toLowerCase()
    if (a === b) return true
    if (b === 'kg' || b === 'kilo') return ['kg', 'kilo', 'kilogram'].includes(a)
    if (b === 'porsiyon') return ['porsiyon', 'pors'].includes(a)
    if (b === 'adet') return ['adet', 'tane'].includes(a)
    if (b === 'gram' || b === 'gr') return ['gram', 'gr', 'g'].includes(a)
    if (b === 'litre' || b === 'lt') return ['litre', 'lt', 'l'].includes(a)
    return false
  }, [])


  // Renk Paleti Seçenekleri
  const hazirRenkler = [
    '#9A5F48', // Kil
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Rose
    '#8B5CF6', // Mor
    '#EC4899', // Pembe
    '#06B6D4', // Cyan
    '#F97316', // Turuncu
    '#5B7C99', // Slate
    '#14B8A6'  // Teal
  ]

  const verileriGetir = async () => {
    setYukleniyor(true)
    try {
      const katData = await ipcInvoke<any[]>(MENU_KANALLARI.KATEGORILER)
      setKategoriler(katData || [])
      
      const urunData = await ipcInvoke<any[]>(MENU_KANALLARI.URUNLER)
      setUrunler(urunData || [])

      const hammaddeData = await ipcInvoke<any[]>(STOK_KANALLARI.HAMMADDELER)
      setHammaddeler(hammaddeData || [])
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

  // Sıralı Kategoriler: sira_no ASC (küçük numaralar önce), eşitler alfabetik (A-Z)
  const siraliKategoriler = useMemo(() => {
    return [...kategoriler].sort((a, b) => {
      const orderA = a.sira_no !== undefined && a.sira_no !== null ? a.sira_no : 999
      const orderB = b.sira_no !== undefined && b.sira_no !== null ? b.sira_no : 999
      if (orderA !== orderB) return orderA - orderB
      return (a.ad || '').localeCompare(b.ad || '', 'tr')
    })
  }, [kategoriler])

  // Kategori İşlemleri
  const katModaliniAc = (kat?: any) => {
    if (kat) {
      setDuzenlenenKat(kat)
      setKatAd(kat.ad || '')
      setKatRenk(kat.renk || '#9A5F48')
      setKatSiraNo(kat.sira_no ?? 999)
    } else {
      setDuzenlenenKat(null)
      setKatAd('')
      setKatRenk('#9A5F48')
      const mevcutSiraNolari = kategoriler
        .map(k => k.sira_no)
        .filter((s): s is number => typeof s === 'number' && s < 999)
      const sonrakiSira = mevcutSiraNolari.length > 0 ? Math.max(...mevcutSiraNolari) + 1 : 1
      setKatSiraNo(sonrakiSira)
    }
    setKatModalAcik(true)
  }

  const katKaydet = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!katAd.trim()) return

    const siraDegeri = katSiraNo === '' ? 999 : (parseInt(String(katSiraNo), 10) || 999)

    try {
      if (duzenlenenKat) {
        await ipcInvoke(MENU_KANALLARI.KATEGORI_GUNCELLE, duzenlenenKat.id, { 
          ad: katAd.trim(), 
          renk: katRenk,
          sira_no: siraDegeri
        })
        success('Başarılı', 'Kategori güncellendi.')
      } else {
        await ipcInvoke(MENU_KANALLARI.KATEGORI_EKLE, { 
          ad: katAd.trim(), 
          renk: katRenk,
          sira_no: siraDegeri
        })
        success('Başarılı', 'Yeni kategori eklendi.')
      }
      setKatModalAcik(false)
      verileriGetir()
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  // Kategori yukarı / aşağı butonları ile sıralama (sira_no güncelleme)
  const kategoriSirala = async (katId: number, yon: 'yukari' | 'asagi') => {
    const currentIndex = siraliKategoriler.findIndex(k => k.id === katId)
    if (currentIndex === -1) return
    const targetIndex = yon === 'yukari' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= siraliKategoriler.length) return

    const yeniListe = [...siraliKategoriler]
    const temp = yeniListe[currentIndex]
    yeniListe[currentIndex] = yeniListe[targetIndex]
    yeniListe[targetIndex] = temp

    try {
      // Optimistik arayüz güncellemesi
      setKategoriler(yeniListe.map((k, idx) => ({ ...k, sira_no: idx + 1 })))

      for (let i = 0; i < yeniListe.length; i++) {
        const item = yeniListe[i]
        const yeniSira = i + 1
        if (item.sira_no !== yeniSira) {
          await ipcInvoke(MENU_KANALLARI.KATEGORI_GUNCELLE, item.id, { sira_no: yeniSira })
        }
      }
      success('Sıralama Güncellendi', `"${temp.ad}" kategorisi ${yon === 'yukari' ? 'yukarı' : 'aşağı'} taşındı.`)
      verileriGetir()
    } catch (err: any) {
      error('Hata', 'Sıralama güncellenirken hata oluştu: ' + err.message)
      verileriGetir()
    }
  }

  // Sürükle - Bırak (Drag & Drop) ile Sıralama
  const onKatDragStart = (e: React.DragEvent, katId: number) => {
    setSuruklenenKatId(katId)
    e.dataTransfer.setData('text/plain', String(katId))
    e.dataTransfer.effectAllowed = 'move'
  }

  const onKatDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const onKatDrop = async (e: React.DragEvent, hedefKatId: number) => {
    e.preventDefault()
    const kaynakKatId = suruklenenKatId || Number(e.dataTransfer.getData('text/plain'))
    setSuruklenenKatId(null)

    if (!kaynakKatId || kaynakKatId === hedefKatId) return

    const kaynakIndex = siraliKategoriler.findIndex(k => k.id === kaynakKatId)
    const hedefIndex = siraliKategoriler.findIndex(k => k.id === hedefKatId)
    if (kaynakIndex === -1 || hedefIndex === -1) return

    const yeniListe = [...siraliKategoriler]
    const [tasinanItem] = yeniListe.splice(kaynakIndex, 1)
    yeniListe.splice(hedefIndex, 0, tasinanItem)

    try {
      // Optimistik arayüz güncellemesi
      setKategoriler(yeniListe.map((k, idx) => ({ ...k, sira_no: idx + 1 })))

      for (let i = 0; i < yeniListe.length; i++) {
        const item = yeniListe[i]
        const yeniSira = i + 1
        if (item.sira_no !== yeniSira) {
          await ipcInvoke(MENU_KANALLARI.KATEGORI_GUNCELLE, item.id, { sira_no: yeniSira })
        }
      }
      success('Sıralama Güncellendi', `"${tasinanItem.ad}" yeni konumuna taşındı.`)
      verileriGetir()
    } catch (err: any) {
      error('Hata', 'Sürükleme sırası kaydedilemedi: ' + err.message)
      verileriGetir()
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
  const urunModaliniAc = async (urun?: any) => {
    setUrunModalTab('genel')
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

      // Satış türleri çözümle
      let parseEdilmisTurler: any[] = []
      if (typeof urun.satis_turleri === 'string') {
        try {
          parseEdilmisTurler = JSON.parse(urun.satis_turleri)
        } catch {
          parseEdilmisTurler = []
        }
      } else if (Array.isArray(urun.satis_turleri)) {
        parseEdilmisTurler = urun.satis_turleri
      }

      if (parseEdilmisTurler && parseEdilmisTurler.length > 0) {
        setSatisTurleri(
          parseEdilmisTurler.map((t, idx) => ({
            id: String(idx + 1),
            birim: (t.birim || '').toLowerCase() === 'kg' ? 'KG' : (t.birim ? t.birim.charAt(0).toUpperCase() + t.birim.slice(1) : 'Porsiyon'),
            fiyat: String(t.fiyat || '')
          }))
        )
      } else {
        const rows: SatisTuruRow[] = [
          { id: '1', birim: urun.birim || 'Porsiyon', fiyat: urun.fiyat ? String(urun.fiyat) : '' }
        ]
        if (urun.kilo_fiyati) {
          rows.push({ id: '2', birim: 'KG', fiyat: String(urun.kilo_fiyati) })
        }
        setSatisTurleri(rows)
      }

      // Reçeteyi yükle
      setReceteYukleniyor(true)
      try {
        const receteler = await ipcInvoke<any[]>(STOK_KANALLARI.RECETELER, urun.id)
        if (Array.isArray(receteler)) {
          setReceteKalemleri(
            receteler.map(r => ({
              hammadde_id: r.hammadde_id,
              miktar: String(r.miktar || ''),
              birim: r.birim || r.recete_birim || r.hammadde_birim || 'Gram'
            }))
          )
        } else {
          setReceteKalemleri([])
        }
      } catch {
        setReceteKalemleri([])
      } finally {
        setReceteYukleniyor(false)
      }
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
      setSatisTurleri([
        { id: '1', birim: 'Porsiyon', fiyat: '' }
      ])
      setReceteKalemleri([])
    }
    setResimYukleniyor(false)
    setIsDragging(false)
    setUrunModalAcik(true)
  }

  // Dinamik Satış Türleri Yönetimi
  const satisTuruEkle = () => {
    const varMiPorsiyon = satisTurleri.some(t => t.birim.toLowerCase() === 'porsiyon')
    const yeniBirim = varMiPorsiyon ? 'KG' : 'Porsiyon'
    setSatisTurleri(prev => [
      ...prev,
      { id: Date.now().toString(), birim: yeniBirim, fiyat: '' }
    ])
  }

  const satisTuruGuncelle = (id: string, alan: 'birim' | 'fiyat', deger: string) => {
    setSatisTurleri(prev =>
      prev.map(t => (t.id === id ? { ...t, [alan]: deger } : t))
    )
    if (alan === 'fiyat' && id === satisTurleri[0]?.id) {
      setUrunFiyat(deger)
    }
  }

  const satisTuruSil = (id: string) => {
    if (satisTurleri.length <= 1) {
      info('Bilgi', 'En az bir satış türü tanımlı olmalıdır.')
      return
    }
    setSatisTurleri(prev => prev.filter(t => t.id !== id))
  }

  // Reçete Kalemleri Yönetimi
  const receteKalemiEkle = () => {
    const ilkHammadde = hammaddeler[0]
    setReceteKalemleri(prev => [
      ...prev,
      {
        hammadde_id: ilkHammadde ? ilkHammadde.id : 0,
        miktar: '1',
        birim: ilkHammadde ? (ilkHammadde.birim || 'Gram') : 'Gram'
      }
    ])
  }

  const receteKalemiGuncelle = (index: number, alan: string, deger: any) => {
    setReceteKalemleri(prev => {
      const yeni = [...prev]
      if (alan === 'hammadde_id') {
        const hid = Number(deger)
        const hammadde = hammaddeler.find(h => h.id === hid)
        yeni[index] = {
          ...yeni[index],
          hammadde_id: hid,
          birim: hammadde?.birim || yeni[index].birim
        }
      } else {
        yeni[index] = { ...yeni[index], [alan]: deger }
      }
      return yeni
    })
  }

  const receteKalemiSil = (index: number) => {
    setReceteKalemleri(prev => prev.filter((_, i) => i !== index))
  }

  const kirpmaModaliniAc = (base64: string) => {
    setKirpmaKaynagi(base64)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Görsel Seçme İşleyicisi: yüklemeden önce kart oranında kırpma açılır.
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

    const reader = new FileReader()
    reader.onload = () => kirpmaModaliniAc(reader.result as string)
    reader.onerror = () => error('Dosya Hatası', 'Görsel dosyası okunamadı')
    reader.readAsDataURL(file)
  }

  const kirpilmisGorseliYukle = async (gorsel: Blob) => {
    setResimYukleniyor(true)
    try {
      const formData = new FormData()
      formData.append('image', new File([gorsel], 'product.jpg', { type: 'image/jpeg' }))

      const res = await zamanAsimliFetch('http://localhost:3847/api/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.basarili || !data.resim_yolu) throw new Error(data?.hata || 'Görsel sunucuya kaydedilemedi')
      setUrunResimYolu(data.resim_yolu)
      setKirpmaKaynagi(null)
      success('Görsel Hazır', 'Kırpılmış ve optimize edilmiş ürün görseli kaydedildi.')
    } catch (fetchErr: any) {
      try {
        const base64 = await zamanAsimli(new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Görsel verisi okunamadı'))
          reader.onerror = () => reject(new Error('Görsel dosyası okunamadı'))
          reader.readAsDataURL(gorsel)
        }))
        const res = await zamanAsimli(ipcInvoke<any>(MENU_KANALLARI.RESIM_YUKLE, { base64, dosyaAdi: 'product.jpg', uzanti: '.jpg' }))
        if (!res?.basarili || !res.resim_yolu) throw new Error(res?.hata || 'Görsel kaydedilemedi')
        setUrunResimYolu(res.resim_yolu)
        setKirpmaKaynagi(null)
        success('Görsel Hazır', 'Kırpılmış ve optimize edilmiş ürün görseli kaydedildi.')
      } catch (ipcErr: any) {
        error('Yükleme Hatası', ipcErr.message || fetchErr.message || 'Görsel kaydedilemedi')
      }
    } finally {
      setResimYukleniyor(false)
    }
  }

  const urlIleGorselGetir = async () => {
    const url = resimUrl.trim()
    if (!url) return
    setResimYukleniyor(true)
    try {
      const res = await zamanAsimliFetch('http://localhost:3847/api/upload/from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.basarili || !data.image) throw new Error(data?.hata || 'Görsel bağlantısından indirilemedi')
      setResimUrl('')
      kirpmaModaliniAc(data.image)
    } catch (err: any) {
      error('URL Görseli Alınamadı', err.message || 'Görsel bağlantısı kontrol edilemedi')
    } finally {
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
    if (!urunAd.trim()) {
      error('Eksik Bilgi', 'Lütfen ürün adını giriniz.')
      setUrunModalTab('genel')
      return
    }

    // Satış türlerini doğrula ve filtrele
    const gecerliTurler = satisTurleri
      .filter(t => t.birim.trim() && !isNaN(Number(t.fiyat)) && Number(t.fiyat) > 0)
      .map(t => ({
        birim: t.birim.trim().toLowerCase(),
        fiyat: Number(t.fiyat)
      }))

    if (gecerliTurler.length === 0 && (!urunFiyat || isNaN(Number(urunFiyat)) || Number(urunFiyat) <= 0)) {
      error('Eksik Bilgi', 'Lütfen en az bir geçerli satış türü ve fiyatı giriniz.')
      setUrunModalTab('satis')
      return
    }

    const ilkTur = gecerliTurler[0]
    const anaFiyat = ilkTur ? ilkTur.fiyat : Number(urunFiyat || 0)
    const anaBirim = ilkTur
      ? (ilkTur.birim === 'kg' ? 'KG' : ilkTur.birim.charAt(0).toUpperCase() + ilkTur.birim.slice(1))
      : urunBirim

    const porsiyonFiyat = gecerliTurler.find(t => t.birim === 'porsiyon')?.fiyat || (anaBirim.toLowerCase() === 'porsiyon' ? anaFiyat : null)
    const kiloFiyat = gecerliTurler.find(t => ['kg', 'kilo'].includes(t.birim))?.fiyat || (['kg', 'kilo'].includes(anaBirim.toLowerCase()) ? anaFiyat : null)

    try {
      const payload = {
        ad: urunAd.trim(),
        kisaltma: urunKisaltma.trim() || null,
        aciklama: urunKisaltma.trim() || null,
        fiyat: anaFiyat,
        kategori_id: Number(urunKategoriId),
        barkod: urunBarkod.trim() || null,
        birim: anaBirim,
        kdv_orani: Number(urunKdv),
        yazici_grup: urunYaziciGrup,
        resim_yolu: urunResimYolu.trim() || null,
        satis_turleri: JSON.stringify(gecerliTurler.length > 0 ? gecerliTurler : [{ birim: anaBirim.toLowerCase(), fiyat: anaFiyat }]),
        porsiyon_fiyati: porsiyonFiyat,
        kilo_fiyati: kiloFiyat
      }

      let targetUrunId = duzenlenenUrun?.id
      if (duzenlenenUrun) {
        await ipcInvoke(MENU_KANALLARI.URUN_GUNCELLE, duzenlenenUrun.id, payload)
        success('Başarılı', 'Ürün güncellendi.')
      } else {
        const sonuc = await ipcInvoke<any>(MENU_KANALLARI.URUN_EKLE, payload)
        targetUrunId = sonuc?.id
        success('Başarılı', 'Yeni ürün menüye eklendi.')
      }

      // Reçete kalemleri varsa kaydet
      if (targetUrunId && receteKalemleri.length > 0) {
        const gecerliReceteler = receteKalemleri
          .filter(k => k.hammadde_id && Number(k.miktar) > 0)
          .map(k => ({
            hammadde_id: k.hammadde_id,
            miktar: Number(k.miktar),
            birim: k.birim
          }))
        await ipcInvoke(STOK_KANALLARI.RECETE_EKLE, targetUrunId, gecerliReceteler)
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

  // Mod Değişimi & Ürün Seçimi
  const handleModDegistir = (yeniMod: 'kategori' | 'ozel') => {
    setTopluSecimModu(yeniMod)
    if (yeniMod === 'ozel' && ozelSecilenUrunIds.length === 0) {
      if (topluKategoriId === 'tum') {
        setOzelSecilenUrunIds(urunler.map(u => u.id))
      } else {
        setOzelSecilenUrunIds(urunler.filter(u => String(u.kategori_id) === topluKategoriId).map(u => u.id))
      }
    }
  }

  // Toplu İşleme Dahil Olan Ürünler
  const hedefUrunler = useMemo(() => {
    if (topluSecimModu === 'kategori') {
      if (topluKategoriId === 'tum') return urunler
      return urunler.filter(u => String(u.kategori_id) === topluKategoriId)
    } else {
      return urunler.filter(u => ozelSecilenUrunIds.includes(u.id))
    }
  }, [urunler, topluSecimModu, topluKategoriId, ozelSecilenUrunIds])

  // Tek Tek Ürün Seçim Listesi (Arama ve Kategori Filtresi ile)
  const ozelGosterilenUrunler = useMemo(() => {
    return urunler.filter(u => {
      if (ozelKategoriFiltre !== 'tum' && String(u.kategori_id) !== ozelKategoriFiltre) return false
      if (!ozelUrunArama.trim()) return true
      const q = ozelUrunArama.toLowerCase()
      return (
        (u.ad || '').toLowerCase().includes(q) ||
        (u.barkod || '').toLowerCase().includes(q) ||
        (u.kisaltma || '').toLowerCase().includes(q)
      )
    })
  }, [urunler, ozelKategoriFiltre, ozelUrunArama])

  const handleTumunuSec = () => {
    const ids = ozelGosterilenUrunler.map(u => u.id)
    setOzelSecilenUrunIds(prev => Array.from(new Set([...prev, ...ids])))
  }

  const handleSecimiTemizle = () => {
    if (ozelUrunArama.trim() || ozelKategoriFiltre !== 'tum') {
      const cikarilacaklar = new Set(ozelGosterilenUrunler.map(u => u.id))
      setOzelSecilenUrunIds(prev => prev.filter(id => !cikarilacaklar.has(id)))
    } else {
      setOzelSecilenUrunIds([])
    }
  }

  const handleUrunSecimToggle = (urunId: number) => {
    setOzelSecilenUrunIds(prev =>
      prev.includes(urunId) ? prev.filter(id => id !== urunId) : [...prev, urunId]
    )
  }

  // Fiyat Hesaplama Formülü
  const hesaplaYeniFiyat = useCallback((eskiFiyat: number): number => {
    const val = Number(artisDegeri) || 0
    let yeni = Number(eskiFiyat) || 0
    if (artisTipi === 'yuzde') {
      yeni = eskiFiyat * (1 + val / 100)
    } else {
      yeni = eskiFiyat + val
    }

    if (yuvarlamaAktif) {
      yeni = Math.max(yuvarlamaKati, Math.round(yeni / yuvarlamaKati) * yuvarlamaKati)
    } else {
      yeni = Math.max(0, Math.round(yeni * 100) / 100)
    }
    return yeni
  }, [artisDegeri, artisTipi, yuvarlamaAktif, yuvarlamaKati])

  // Simülasyon Veri Yapısı
  interface SimulasyonKalemi {
    id: string
    urunId: number
    urunAdi: string
    kategoriAdi: string
    birim: string
    eskiFiyat: number
    yeniFiyat: number
    yeniFiyatStr: string
    fark: number
    yuzdeFark: number
    etkileniyor: boolean
  }

  const simulasyonListesi = useMemo<SimulasyonKalemi[]>(() => {
    const list: SimulasyonKalemi[] = []
    for (const u of hedefUrunler) {
      const turler = getUrunSatisTurleri(u)
      for (const t of turler) {
        const b = (t.birim || '').trim()
        const etkileniyor = birimEslesir(b, aktifHedefBirim)

        const eski = Number(t.fiyat) || 0
        const manuelStr = manuelFiyatlar[u.id]?.[b]
        const autoYeni = etkileniyor ? hesaplaYeniFiyat(eski) : eski
        const yeniStr = manuelStr !== undefined ? manuelStr : String(autoYeni)
        const yeni = manuelStr !== undefined ? (Number(manuelStr) || 0) : autoYeni
        const fark = yeni - eski
        const yuzdeFark = eski > 0 ? Math.round((fark / eski) * 1000) / 10 : 0

        list.push({
          id: `${u.id}-${b}`,
          urunId: u.id,
          urunAdi: u.ad,
          kategoriAdi: u.kategori_adi || 'Genel',
          birim: b,
          eskiFiyat: eski,
          yeniFiyat: yeni,
          yeniFiyatStr: yeniStr,
          fark,
          yuzdeFark,
          etkileniyor
        })
      }
    }
    return list
  }, [hedefUrunler, aktifHedefBirim, birimEslesir, hesaplaYeniFiyat, manuelFiyatlar])

  const etkilenenFiyatSayisi = useMemo(() => {
    return simulasyonListesi.filter(s => s.etkileniyor).length
  }, [simulasyonListesi])

  const etkilenenUrunSayisi = useMemo(() => {
    const ids = new Set(simulasyonListesi.filter(s => s.etkileniyor).map(s => s.urunId))
    return ids.size
  }, [simulasyonListesi])

  const filtreliSimulasyonListesi = useMemo(() => {
    if (!simulasyonArama.trim()) return simulasyonListesi
    const q = simulasyonArama.toLowerCase()
    return simulasyonListesi.filter(s =>
      s.urunAdi.toLowerCase().includes(q) ||
      s.kategoriAdi.toLowerCase().includes(q) ||
      s.birim.toLowerCase().includes(q)
    )
  }, [simulasyonListesi, simulasyonArama])

  const handleManuelFiyatDegistir = (urunId: number, birim: string, deger: string) => {
    setManuelFiyatlar(prev => ({
      ...prev,
      [urunId]: {
        ...(prev[urunId] || {}),
        [birim]: deger
      }
    }))
  }

  // Toplu Fiyat Güncellemesini Kaydet (Tek Transaction)
  const handleTopluFiyatKaydet = async () => {
    if (hedefUrunler.length === 0) {
      error('Hata', 'İşlem yapılacak hiçbir ürün seçilmedi.')
      return
    }

    if (etkilenenFiyatSayisi === 0) {
      error('Uyarı', 'Seçilen hedef satış türüne uygun güncellenecek ürün bulunamadı.')
      return
    }

    const onay = window.confirm(
      `${etkilenenUrunSayisi} adet ürünün (${etkilenenFiyatSayisi} farklı satış fiyatı) güncellenecektir. Onaylıyor musunuz?`
    )
    if (!onay) return

    setTopluKayitYukleniyor(true)
    try {
      const urunIds = hedefUrunler.map(u => u.id)

      let structuredManuel: Record<number, any> | undefined = undefined
      if (Object.keys(manuelFiyatlar).length > 0) {
        structuredManuel = {}
        for (const u of hedefUrunler) {
          if (manuelFiyatlar[u.id]) {
            const turler = getUrunSatisTurleri(u)
            const guncelTurler = turler.map(t => {
              const b = (t.birim || '').trim()
              if (manuelFiyatlar[u.id]?.[b] !== undefined) {
                return { ...t, fiyat: Number(manuelFiyatlar[u.id][b]) || 0 }
              }
              return t
            })
            const porsiyon = guncelTurler.find(t => birimEslesir(t.birim, 'porsiyon'))
            const kilo = guncelTurler.find(t => birimEslesir(t.birim, 'kg'))
            const anaTur = guncelTurler.find(t => birimEslesir(t.birim, u.birim || '')) || guncelTurler[0]

            structuredManuel[u.id] = {
              satis_turleri: guncelTurler,
              fiyat: anaTur ? anaTur.fiyat : u.fiyat,
              porsiyon_fiyati: porsiyon?.fiyat ?? null,
              kilo_fiyati: kilo?.fiyat ?? null
            }
          }
        }
      }

      const res = await ipcInvoke<any>(MENU_KANALLARI.TOPLU_FIYAT_GUNCELLE, {
        urunIds,
        hedefBirim: aktifHedefBirim,
        islemTuru: artisTipi,
        deger: Number(artisDegeri) || 0,
        yuvarlama: yuvarlamaAktif ? yuvarlamaKati : null,
        manuelFiyatlar: structuredManuel
      })

      if (res?.basarili) {
        success('Fiyatlar Güncellendi', `${etkilenenUrunSayisi} adet ürünün fiyatları başarıyla güncellendi.`)
        setOnizlemeModalAcik(false)
        setManuelFiyatlar({})
        verileriGetir()
      } else {
        error('Hata', res?.hata || 'Fiyatlar güncellenirken bir hata oluştu.')
      }
    } catch (err: any) {
      error('Hata', err.message || 'Fiyatlar güncellenirken bir hata oluştu')
    } finally {
      setTopluKayitYukleniyor(false)
    }
  }


  return (
    <div className="flex flex-col h-full w-full bg-[#171410] text-surface-100 p-2 sm:p-3.5 overflow-hidden select-none min-h-0">
      
      {/* Üst Sekme & Kontrol Barı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 shrink-0 pb-2.5 border-b border-[#322C26]">
        
        {/* Modül Sekmeleri */}
        <div className="flex items-center gap-1.5 p-1 bg-[#110F0C] border border-[#322C26] rounded-xl overflow-x-auto pos-scrollbar">
          <button
            type="button"
            onClick={() => setSubTab('urunler')}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap touch-feedback",
              subTab === 'urunler'
                ? "bg-brand-600 text-white shadow-md shadow-brand-950/50 border border-brand-400/40"
                : "text-surface-400 hover:text-surface-200 hover:bg-[#1e1a16]"
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
              "flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap touch-feedback",
              subTab === 'fiyat-guncelleme'
                ? "bg-brand-600 text-white shadow-md shadow-brand-950/50 border border-brand-400/40"
                : "text-surface-400 hover:text-surface-200 hover:bg-[#1e1a16]"
            )}
          >
            <TrendingUp size={15} />
            <span>Hızlı & Toplu Fiyat Güncelleme</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('kategoriler')}
            className={clsx(
              "flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap touch-feedback",
              subTab === 'kategoriler'
                ? "bg-brand-600 text-white shadow-md shadow-brand-950/50 border border-brand-400/40"
                : "text-surface-400 hover:text-surface-200 hover:bg-[#1e1a16]"
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
                  className="w-full h-9 pl-9 pr-8 text-xs rounded-xl bg-[#110F0C] border border-[#322C26] text-white placeholder:text-surface-500 focus:outline-none focus:border-brand-500"
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
                className="font-bold text-xs shadow-md shadow-brand-900/30 whitespace-nowrap"
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
              className="font-bold text-xs whitespace-nowrap"
            >
              Yeni Kategori
            </Button>
          )}
        </div>
      </div>

      {/* SUBTAB 1: ÜRÜN & MENÜ YÖNETİMİ (SPLIT PANE) */}
      {subTab === 'urunler' && (
        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-3 sm:gap-4 overflow-hidden">
          
          {/* Sol Kategori Filtre Paneli */}
          <div className="w-full md:w-52 lg:w-60 xl:w-64 bg-[#110F0C] rounded-xl border border-[#322C26] p-2.5 sm:p-3 flex flex-col shrink-0 overflow-hidden max-h-44 md:max-h-none">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#322C26] shrink-0">
              <span className="text-[11px] font-mono font-bold text-surface-400 uppercase">Kategoriler</span>
              <button
                type="button"
                onClick={() => katModaliniAc()}
                className="text-[11px] font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1 touch-feedback"
              >
                <Plus size={13} /> Ekle
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto pos-scrollbar flex md:flex-col gap-1.5 pr-1">
              <button
                type="button"
                onClick={() => setSeciliKategoriId(null)}
                className={clsx(
                  "flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-lg text-xs font-bold transition-all text-left border touch-feedback shrink-0 md:shrink",
                  seciliKategoriId === null
                    ? "bg-brand-950/60 text-white border-brand-500/60 shadow-sm"
                    : "bg-[#171410] border-transparent text-surface-300 hover:bg-[#1e1a16] hover:text-white"
                )}
              >
                <span>Tüm Ürünler</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-surface-400">
                  {urunler.length}
                </span>
              </button>

              {siraliKategoriler.map(kat => (
                <button
                  key={kat.id}
                  type="button"
                  onClick={() => setSeciliKategoriId(kat.id)}
                  className={clsx(
                    "flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-lg text-xs font-bold transition-all text-left border touch-feedback group shrink-0 md:shrink",
                    seciliKategoriId === kat.id
                      ? "bg-brand-950/60 text-white border-brand-500/60 shadow-sm"
                      : "bg-[#171410] border-transparent text-surface-300 hover:bg-[#1e1a16] hover:text-white"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0 shadow-xs" 
                      style={{ backgroundColor: kat.renk || '#9A5F48' }} 
                    />
                    <span className="truncate">{kat.ad}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300">
                      #{kat.sira_no ?? 999}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-surface-400">
                      {kat.urun_sayisi || 0}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sağ Ürün Listesi */}
          <div className="flex-1 min-h-0 bg-[#110F0C] rounded-xl border border-[#322C26] p-3 sm:p-4 flex flex-col overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto pos-scrollbar pr-1 pb-4">
              {yukleniyor ? (
                <div className="flex items-center justify-center h-48 text-surface-400 font-mono text-sm">
                  <RefreshCw className="animate-spin mr-2" size={18} /> Ürünler yükleniyor...
                </div>
              ) : gosterilenUrunler.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-56 text-surface-400 border border-dashed border-[#322C26] rounded-xl my-4">
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
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
                  {gosterilenUrunler.map(urun => {
                    const kategori = kategoriler.find(k => k.id === urun.kategori_id)
                    const satisTurleriListesi = getUrunSatisTurleri(urun)
                    return (
                      <motion.div
                        key={urun.id}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative bg-[#171410] border border-[#322C26] hover:border-brand-500/50 rounded-xl p-3 flex items-center gap-3 transition-all group shadow-sm hover:shadow-brand-950/20 min-w-0"
                      >
                        {/* Sol Taraf: Küçük Ürün Görseli */}
                        <div className="w-16 h-16 rounded-lg bg-[#1E1A16] border border-[#3A342C] flex items-center justify-center flex-shrink-0 overflow-hidden text-slate-300 shadow-inner group-hover:border-brand-500/40 transition-colors">
                          {urun.resim_yolu ? (
                            <img
                              src={formatResimUrl(urun.resim_yolu)}
                              alt={urun.ad}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <span className="font-mono font-black text-base text-surface-400">
                              {urun.ad ? urun.ad.charAt(0).toUpperCase() : '?'}
                            </span>
                          )}
                        </div>

                        {/* Orta Kısım: Ürün Adı, Kategori Rozeti ve Fiyat Rozetleri */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 overflow-hidden">
                          <div className="min-w-0">
                            <h3
                              className="font-semibold text-white text-xs sm:text-sm truncate break-words"
                              title={urun.ad}
                            >
                              {urun.ad}
                            </h3>
                            {urun.kisaltma && (
                              <span className="text-[10px] font-mono text-surface-500 block truncate">
                                #{urun.kisaltma}
                              </span>
                            )}
                          </div>

                          {/* Kategori & Fiyat Rozetleri */}
                          <div className="flex flex-wrap items-center gap-1 min-w-0">
                            {urun.kategori_adi && (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1e1a16] border border-[#322C26] max-w-full truncate">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: kategori?.renk || '#9A5F48' }}
                                />
                                <span className="text-[10px] font-medium text-surface-400 truncate">
                                  {urun.kategori_adi}
                                </span>
                              </div>
                            )}

                            {satisTurleriListesi && satisTurleriListesi.length > 0 ? (
                              satisTurleriListesi.map((st, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] sm:text-[11px] font-bold text-emerald-400 font-mono bg-emerald-950/50 border border-emerald-800/40 px-1.5 py-0.5 rounded whitespace-nowrap truncate max-w-full"
                                  title={`${st.birim}: ${Math.round(Number(st.fiyat) || 0)} ₺`}
                                >
                                  {st.birim}: {Math.round(Number(st.fiyat) || 0)} ₺
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 font-mono bg-emerald-950/50 border border-emerald-800/40 px-1.5 py-0.5 rounded whitespace-nowrap truncate max-w-full">
                                {formatSatisTurleri(urun)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Sağ Taraf: Düzenle / Sil Butonları */}
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => urunModaliniAc(urun)}
                            className="p-1.5 rounded-lg bg-[#1e1a16] hover:bg-brand-950/60 hover:text-brand-300 border border-[#322C26] hover:border-brand-700/50 text-surface-400 transition-all touch-feedback"
                            title="Düzenle"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => urunSil(urun.id)}
                            className="p-1.5 rounded-lg bg-[#1e1a16] hover:bg-rose-950/60 hover:text-rose-300 border border-[#322C26] hover:border-rose-700/50 text-surface-400 transition-all touch-feedback"
                            title="Sil"
                          >
                            <Trash2 size={13} />
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
        <div className="flex-1 min-h-0 bg-[#0B0A08] rounded-xl border border-[#322C26] p-2.5 sm:p-4 flex flex-col overflow-y-auto lg:overflow-hidden pos-scrollbar">
          <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
            
            {/* SOL TARAF: FİLTRELEME & PARAMETRELER */}
            <div className="w-full lg:w-[380px] xl:w-[440px] flex flex-col shrink-0 bg-[#171410] border border-[#322C26] rounded-xl overflow-hidden shadow-lg min-h-0">
              
              {/* Sol Panel Başlığı */}
              <div className="px-3.5 py-2.5 border-b border-[#322C26] bg-[#171410] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-brand-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Filtreleme & Parametreler
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#1e1a16] border border-[#322C26] text-brand-300">
                  {hedefUrunler.length} / {urunler.length} Ürün
                </span>
              </div>

              {/* Sol Panel Kaydırılabilir İçerik */}
              <div className="flex-1 min-h-0 overflow-y-auto pos-scrollbar p-3 sm:p-3.5 space-y-3">
                
                {/* 1. Ürün Seçim Kapsamı */}
                <div className="bg-[#0B0A08] border border-[#322C26] rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-surface-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                      1. Ürün Seçim Kapsamı
                    </span>
                    <span className="text-[10px] font-mono text-surface-400">
                      {topluSecimModu === 'kategori' ? 'Kategori Bazlı' : `${ozelSecilenUrunIds.length} Seçili`}
                    </span>
                  </div>

                  {/* Mod Seçici */}
                  <div className="grid grid-cols-2 gap-1 bg-[#171410] p-1 rounded-lg border border-[#322C26]">
                    <button
                      type="button"
                      onClick={() => handleModDegistir('kategori')}
                      className={clsx(
                        "flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all touch-feedback",
                        topluSecimModu === 'kategori'
                          ? "bg-brand-600 text-white shadow-xs"
                          : "text-surface-400 hover:text-white"
                      )}
                    >
                      <LayoutGrid size={13} />
                      <span>Kategori Bazlı</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleModDegistir('ozel')}
                      className={clsx(
                        "flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all touch-feedback",
                        topluSecimModu === 'ozel'
                          ? "bg-brand-600 text-white shadow-xs"
                          : "text-surface-400 hover:text-white"
                      )}
                    >
                      <CheckSquare size={13} />
                      <span>Tekil Ürün Seçimi</span>
                    </button>
                  </div>

                  {/* Kategori Bazlı Seçim Alanı */}
                  {topluSecimModu === 'kategori' && (
                    <div className="space-y-2 pt-0.5">
                      <label className="text-[10px] font-mono text-surface-400 uppercase block">
                        Uygulanacak Kategori
                      </label>
                      <select
                        value={topluKategoriId}
                        onChange={e => setTopluKategoriId(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#322C26] bg-[#171410] text-white text-xs font-semibold focus:border-brand-500 focus:outline-none"
                      >
                        <option value="tum">Tüm Kategoriler ({urunler.length} Ürün)</option>
                        {siraliKategoriler.map(k => (
                          <option key={k.id} value={String(k.id)}>
                            {k.ad} ({k.urun_sayisi || 0} Ürün)
                          </option>
                        ))}
                      </select>
                      <div className="px-2.5 py-1.5 rounded-lg bg-[#171410] border border-[#322C26] text-[11px] font-mono text-surface-300 flex items-center justify-between">
                        <span className="text-surface-400 text-[10px]">Hedef Kapsam:</span>
                        <strong className="text-white text-[11px]">
                          {topluKategoriId === 'tum' ? 'Tüm Menü' : kategoriler.find(k => String(k.id) === topluKategoriId)?.ad || ''} ({hedefUrunler.length} Ürün)
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* Tekil Ürün Seçimi Alanı */}
                  {topluSecimModu === 'ozel' && (
                    <div className="space-y-2 pt-0.5">
                      {/* Arama & Kategori Filtresi */}
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500" />
                          <input
                            type="text"
                            value={ozelUrunArama}
                            onChange={e => setOzelUrunArama(e.target.value)}
                            placeholder="Ürün adı veya barkod..."
                            className="w-full h-8 pl-8 pr-2 rounded-lg border border-[#322C26] bg-[#171410] text-white placeholder-surface-500 text-xs focus:border-brand-500 focus:outline-none"
                          />
                        </div>
                        <select
                          value={ozelKategoriFiltre}
                          onChange={e => setOzelKategoriFiltre(e.target.value)}
                          className="h-8 px-2 rounded-lg border border-[#322C26] bg-[#171410] text-white text-xs font-semibold focus:border-brand-500 focus:outline-none max-w-[125px]"
                        >
                          <option value="tum">Tüm Kat.</option>
                          {siraliKategoriler.map(k => (
                            <option key={k.id} value={String(k.id)}>{k.ad}</option>
                          ))}
                        </select>
                      </div>

                      {/* Rozetler ve Sayaç */}
                      <div className="flex items-center justify-between gap-1.5 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleTumunuSec}
                            className="text-[10px] font-mono text-brand-400 hover:text-brand-300 underline"
                          >
                            Tümünü Seç ({ozelGosterilenUrunler.length})
                          </button>
                          <span className="text-surface-600">•</span>
                          <button
                            type="button"
                            onClick={handleSecimiTemizle}
                            className="text-[10px] font-mono text-surface-400 hover:text-surface-200 underline"
                          >
                            Temizle
                          </button>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">
                          {ozelSecilenUrunIds.length} Seçili
                        </span>
                      </div>

                      {/* Ürün Seçim Listesi */}
                      <div className="max-h-40 overflow-y-auto pos-scrollbar border border-[#322C26] rounded-lg bg-[#171410] divide-y divide-[#322C26]">
                        {ozelGosterilenUrunler.length === 0 ? (
                          <div className="p-3 text-center text-surface-500 text-xs font-mono">
                            Ürün bulunamadı
                          </div>
                        ) : (
                          ozelGosterilenUrunler.map((u: any) => {
                            const secili = ozelSecilenUrunIds.includes(u.id)
                            return (
                              <div
                                key={u.id}
                                onClick={() => handleUrunSecimToggle(u.id)}
                                className={clsx(
                                  "px-2.5 py-1.5 flex items-center justify-between cursor-pointer transition-colors text-xs select-none",
                                  secili ? "bg-brand-950/40 text-white" : "hover:bg-[#1e1a16] text-surface-300"
                                )}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {secili ? (
                                    <CheckSquare size={14} className="text-brand-400 shrink-0" />
                                  ) : (
                                    <Square size={14} className="text-surface-500 shrink-0" />
                                  )}
                                  <span className="truncate">{u.ad}</span>
                                </div>
                                <span className="text-[10px] font-mono text-surface-400 shrink-0 ml-2">
                                  {u.fiyat} ₺
                                </span>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Hedef Satış Türü / Birim */}
                <div className="bg-[#0B0A08] border border-[#322C26] rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-surface-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                      2. Hedef Satış Türü (Birim)
                    </span>
                    <span className="text-[10px] font-mono text-surface-400">
                      {hedefBirimModu === 'hepsi' ? 'Tüm Birimler' : seciliOzelBirim}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 bg-[#171410] p-1 rounded-lg border border-[#322C26]">
                    <button
                      type="button"
                      onClick={() => setHedefBirimModu('hepsi')}
                      className={clsx(
                        "py-1.5 rounded-md text-xs font-bold transition-all touch-feedback",
                        hedefBirimModu === 'hepsi' ? "bg-brand-600 text-white shadow-xs" : "text-surface-400 hover:text-white"
                      )}
                    >
                      Tüm Satış Türleri
                    </button>
                    <button
                      type="button"
                      onClick={() => setHedefBirimModu('belirli')}
                      className={clsx(
                        "py-1.5 rounded-md text-xs font-bold transition-all touch-feedback",
                        hedefBirimModu === 'belirli' ? "bg-brand-600 text-white shadow-xs" : "text-surface-400 hover:text-white"
                      )}
                    >
                      Belirli Birim
                    </button>
                  </div>

                  {hedefBirimModu === 'belirli' && (
                    <div className="space-y-1.5 pt-0.5">
                      <label className="text-[10px] font-mono text-surface-400 uppercase block">
                        Yalnızca Bu Birimi Güncelle
                      </label>
                      <select
                        value={seciliOzelBirim}
                        onChange={e => setSeciliOzelBirim(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-[#322C26] bg-[#171410] text-white text-xs font-bold focus:border-brand-500 focus:outline-none uppercase"
                      >
                        {tumBirimler.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* 3. Fiyat Değişim Kuralı */}
                <div className="bg-[#0B0A08] border border-[#322C26] rounded-xl p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-surface-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                      3. Değişim Kuralı
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      {artisTipi === 'yuzde' ? `+%${artisDegeri}` : `+${artisDegeri} ₺`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 bg-[#171410] p-1 rounded-lg border border-[#322C26]">
                    <button
                      type="button"
                      onClick={() => setArtisTipi('yuzde')}
                      className={clsx(
                        "flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all touch-feedback",
                        artisTipi === 'yuzde' ? "bg-brand-600 text-white shadow-xs" : "text-surface-400 hover:text-white"
                      )}
                    >
                      <Percent size={13} />
                      <span>Yüzde (%)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setArtisTipi('tutar')}
                      className={clsx(
                        "flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all touch-feedback",
                        artisTipi === 'tutar' ? "bg-brand-600 text-white shadow-xs" : "text-surface-400 hover:text-white"
                      )}
                    >
                      <DollarSign size={13} />
                      <span>Sabit Tutar (₺)</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={artisDegeri}
                      onChange={e => {
                        let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.-]/g, '')
                        setArtisDegeri(val)
                      }}
                      placeholder="Değer giriniz (Örn: 10 veya -5)"
                      className="w-full h-10 px-3 pr-10 rounded-lg border border-[#322C26] bg-[#171410] text-white font-mono text-sm font-bold focus:border-brand-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 font-mono text-xs font-bold">
                      {artisTipi === 'yuzde' ? '%' : '₺'}
                    </span>
                  </div>

                  {/* Hızlı Butonlar */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pos-scrollbar pb-0.5">
                    {artisTipi === 'yuzde' ? (
                      [5, 10, 15, 20, 25, -5, -10].map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setArtisDegeri(String(p))}
                          className={clsx(
                            "px-2 py-0.5 rounded text-[10px] font-mono border whitespace-nowrap transition-all touch-feedback",
                            artisDegeri === String(p)
                              ? "bg-brand-600 text-white border-brand-500"
                              : "bg-[#171410] hover:bg-[#322C26] border-[#322C26] text-surface-300"
                          )}
                        >
                          {p > 0 ? `+${p}%` : `${p}%`}
                        </button>
                      ))
                    ) : (
                      [10, 20, 50, 100, 200, -10, -20].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setArtisDegeri(String(t))}
                          className={clsx(
                            "px-2 py-0.5 rounded text-[10px] font-mono border whitespace-nowrap transition-all touch-feedback",
                            artisDegeri === String(t)
                              ? "bg-brand-600 text-white border-brand-500"
                              : "bg-[#171410] hover:bg-[#322C26] border-[#322C26] text-surface-300"
                          )}
                        >
                          {t > 0 ? `+${t}₺` : `${t}₺`}
                        </button>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Sol Panel Alt Aksiyon Butonları (Sticky Bottom) */}
              <div className="p-3 border-t border-[#322C26] bg-[#171410] flex items-center gap-2 shrink-0 sticky bottom-0 z-10">
                <Button
                  variant="ghost"
                  onClick={() => setOnizlemeModalAcik(true)}
                  className="h-10 text-xs font-bold border border-[#322C26] hover:bg-[#1e1a16] text-surface-300 flex items-center justify-center gap-1.5 flex-1"
                >
                  <Eye size={14} />
                  <span>Geniş Önizleme</span>
                </Button>
                <Button
                  variant="primary"
                  onClick={handleTopluFiyatKaydet}
                  isLoading={topluKayitYukleniyor}
                  disabled={etkilenenFiyatSayisi === 0}
                  className="h-10 text-xs font-bold shadow-lg shadow-brand-900/40 flex-1 flex items-center justify-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Uygula & Kaydet</span>
                </Button>
              </div>

            </div>

            {/* SAĞ TARAF: CANLI DEĞİŞİM SİMÜLASYON KARTI */}
            <div className="w-full lg:flex-1 flex flex-col min-h-0 bg-[#171410] border border-[#322C26] rounded-xl overflow-hidden shadow-lg">
              
              {/* Sağ Panel Başlık & Kontroller */}
              <div className="px-3.5 py-2.5 border-b border-[#322C26] bg-[#171410] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <TrendingUp size={14} className="text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                    Canlı Değişim Simülasyonu
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/70 text-emerald-300 border border-emerald-600/40 font-bold">
                    {etkilenenFiyatSayisi} Kalem Fiyat
                  </span>
                  {Object.keys(manuelFiyatlar).length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/70 text-amber-300 border border-amber-600/40 font-bold">
                        {Object.keys(manuelFiyatlar).length} Özel Fiyat
                      </span>
                      <button
                        type="button"
                        onClick={() => setManuelFiyatlar({})}
                        className="text-[10px] font-mono text-rose-400 hover:text-rose-300 underline flex items-center gap-0.5"
                        title="Manuel fiyat değişikliklerini sıfırla"
                      >
                        <RotateCcw size={10} />
                        <span>Sıfırla</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500" />
                    <input
                      type="text"
                      value={simulasyonArama}
                      onChange={e => setSimulasyonArama(e.target.value)}
                      placeholder="Simülasyonda ara..."
                      className="h-8 pl-8 pr-2 rounded-lg border border-[#322C26] bg-[#0B0A08] text-white text-xs placeholder-surface-500 focus:border-brand-500 focus:outline-none w-36 sm:w-44 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Canlı Simülasyon Tablosu (max-h-[300px] overflow-y-auto) */}
              <div className="flex-1 min-h-0 max-h-[300px] lg:max-h-none overflow-y-auto pos-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#322C26] bg-[#171410] text-[10px] font-mono text-surface-400 uppercase sticky top-0 z-10">
                      <th className="py-2.5 px-3">Ürün Adı</th>
                      <th className="py-2.5 px-2.5">Birim</th>
                      <th className="py-2.5 px-2.5 text-right">Eski Fiyat</th>
                      <th className="py-2.5 px-2.5 text-center">Değişim</th>
                      <th className="py-2.5 px-2.5 text-right">Yeni Fiyat</th>
                      <th className="py-2.5 px-2.5 text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#322C26] text-xs">
                    {filtreliSimulasyonListesi.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-16 text-surface-500 font-mono text-xs">
                          Kriterlere uygun ürün veya fiyat kalemi bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filtreliSimulasyonListesi.map(satir => (
                        <tr key={satir.id} className="hover:bg-[#1e1a16] transition-colors">
                          <td className="py-2 px-3">
                            <p className="font-bold text-white text-xs truncate max-w-[150px] sm:max-w-[200px]">
                              {satir.urunAdi}
                            </p>
                            <span className="text-[10px] text-surface-500 font-mono">
                              {satir.kategoriAdi}
                            </span>
                          </td>
                          <td className="py-2 px-2.5">
                            <span className={clsx(
                              "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border",
                              ['kg', 'kilo'].includes(satir.birim.toLowerCase())
                                ? "bg-amber-950/60 text-amber-300 border-amber-600/40"
                                : ['adet', 'tane'].includes(satir.birim.toLowerCase())
                                ? "bg-teal-950/60 text-teal-300 border-teal-600/40"
                                : ['litre', 'lt'].includes(satir.birim.toLowerCase())
                                ? "bg-indigo-950/60 text-indigo-300 border-indigo-600/40"
                                : "bg-blue-950/60 text-blue-300 border-blue-600/40"
                            )}>
                              {satir.birim}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-right font-mono text-surface-400 text-xs">
                            {formatPara(satir.eskiFiyat)}
                          </td>
                          <td className="py-2 px-2.5 text-center font-mono">
                            {satir.etkileniyor ? (
                              <span className={clsx(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border",
                                satir.fark > 0
                                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-600/40"
                                  : satir.fark < 0
                                  ? "bg-rose-950/60 text-rose-300 border-rose-600/40"
                                  : "bg-[#1e1a16] text-surface-400 border-[#322C26]"
                              )}>
                                {satir.fark > 0 ? (
                                  <>
                                    <TrendingUp size={10} />
                                    <span>+{formatPara(satir.fark)} (+%{satir.yuzdeFark})</span>
                                  </>
                                ) : satir.fark < 0 ? (
                                  <>
                                    <TrendingDown size={10} />
                                    <span>{formatPara(satir.fark)} (%{satir.yuzdeFark})</span>
                                  </>
                                ) : (
                                  '0 ₺'
                                )}
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-surface-500">
                                Etkilenmez
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-right">
                            {satir.etkileniyor ? (
                              <div className="inline-flex items-center justify-end gap-1">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  autoComplete="off"
                                  value={satir.yeniFiyatStr}
                                  onChange={e => {
                                    let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '')
                                    const parts = val.split('.')
                                    if (parts.length > 2) {
                                      val = parts[0] + '.' + parts.slice(1).join('')
                                    }
                                    handleManuelFiyatDegistir(satir.urunId, satir.birim, val)
                                  }}
                                  className="w-24 h-7 px-2 text-right font-mono font-bold text-emerald-400 rounded-md border border-[#322C26] bg-[#0B0A08] focus:border-brand-500 focus:outline-none text-xs"
                                />
                              </div>
                            ) : (
                              <span className="font-mono text-surface-500 text-xs">
                                {formatPara(satir.eskiFiyat)}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-center">
                            {satir.etkileniyor ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold">
                                <Check size={11} /> Güncellenecek
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-surface-500">
                                Korumada
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sağ Panel Alt Özet & Kaydet Çubuğu (sticky bottom-0) */}
              <div className="p-3 border-t border-[#322C26] bg-[#171410] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 sticky bottom-0 z-20">
                <div className="text-xs font-mono text-surface-400">
                  Toplam <strong className="text-white font-bold">{etkilenenUrunSayisi}</strong> ürün (<strong className="text-emerald-400 font-bold">{etkilenenFiyatSayisi}</strong> satış fiyatı) etkilenecek.
                </div>
                <Button
                  variant="primary"
                  onClick={handleTopluFiyatKaydet}
                  isLoading={topluKayitYukleniyor}
                  disabled={etkilenenFiyatSayisi === 0}
                  className="h-9 px-5 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-900/30 w-full sm:w-auto"
                >
                  <Check size={14} />
                  <span>Fiyatları Kaydet ({etkilenenUrunSayisi})</span>
                </Button>
              </div>

            </div>

          </div>
        </div>
      )}


      {/* SUBTAB 3: KATEGORİ YÖNETİMİ */}
      {subTab === 'kategoriler' && (
        <div className="flex-1 min-h-0 bg-[#110F0C] rounded-xl border border-[#322C26] p-4 flex flex-col overflow-hidden">
          {/* Bilgi ve İpucu Çubuğu */}
          <div className="mb-3 p-2.5 px-3.5 rounded-lg bg-[#171410] border border-[#322C26] flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-surface-300">
              <Sparkles size={14} className="text-cyan-400" />
              <span>
                <strong className="text-white">Kategori Sıralama Mantığı:</strong> Sıra numarası küçük olanlar (1, 2, 3...) her zaman en başta görünür. Eşit olanlar alfabetik sıralanır.
              </span>
            </div>
            <span className="text-[11px] text-surface-400">
              Kartları sürükleyip bırakabilir veya <strong className="text-cyan-300">▲ / ▼</strong> butonlarıyla sıralayabilirsiniz.
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pos-scrollbar pr-1 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
              {siraliKategoriler.map((kat, index) => (
                <div
                  key={kat.id}
                  draggable
                  onDragStart={e => onKatDragStart(e, kat.id)}
                  onDragOver={onKatDragOver}
                  onDrop={e => onKatDrop(e, kat.id)}
                  className={clsx(
                    "bg-[#171410] border rounded-xl p-4 flex flex-col justify-between transition-all group shadow-sm select-none",
                    suruklenenKatId === kat.id
                      ? "opacity-40 border-cyan-500 border-dashed scale-95"
                      : "border-[#322C26] hover:border-brand-500/40"
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#322C26]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span title="Sürükleyip bırakarak sıralayın" className="inline-flex items-center">
                          <GripVertical
                            size={15}
                            className="text-slate-500 group-hover:text-slate-300 cursor-grab active:cursor-grabbing shrink-0"
                          />
                        </span>
                        <span
                          className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0"
                          style={{ backgroundColor: kat.renk || '#9A5F48' }}
                        />
                        <h3 className="font-bold text-white text-base tracking-tight truncate" title={kat.ad}>
                          {kat.ad}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        {/* Sıra Numarası Rozeti (Badge) */}
                        <span
                          title={`Görüntülenme Sıra Numarası: ${kat.sira_no ?? 999}`}
                          className="px-2 py-0.5 rounded-md text-[11px] font-mono font-black bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 shadow-sm"
                        >
                          #{kat.sira_no ?? 999}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-surface-400">
                          {kat.urun_sayisi || 0} Ürün
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-surface-400 mb-3">
                      <span>Renk Kodu:</span>
                      <span className="font-bold text-surface-200">{kat.renk || '#9A5F48'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#322C26] gap-2">
                    {/* Hızlı Yukarı / Aşağı Ok Butonları */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => kategoriSirala(kat.id, 'yukari')}
                        title="Yukarı / Öne Taşı"
                        className="w-7 h-7 rounded-lg bg-[#1E1A16] border border-[#3A342C] text-slate-300 hover:text-white hover:bg-cyan-950/50 hover:border-cyan-500/50 flex items-center justify-center transition-all disabled:opacity-25 disabled:pointer-events-none touch-feedback"
                      >
                        <ChevronUp size={15} />
                      </button>
                      <button
                        type="button"
                        disabled={index === siraliKategoriler.length - 1}
                        onClick={() => kategoriSirala(kat.id, 'asagi')}
                        title="Aşağı / Arkaya Taşı"
                        className="w-7 h-7 rounded-lg bg-[#1E1A16] border border-[#3A342C] text-slate-300 hover:text-white hover:bg-cyan-950/50 hover:border-cyan-500/50 flex items-center justify-center transition-all disabled:opacity-25 disabled:pointer-events-none touch-feedback"
                      >
                        <ChevronDown size={15} />
                      </button>
                    </div>

                    {/* Düzenle & Sil */}
                    <div className="flex items-center gap-1.5 shrink-0">
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
        <form key={duzenlenenKat ? `kat-${duzenlenenKat.id}` : 'kat-yeni'} onSubmit={katKaydet} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Kategori Adı</label>
            <input
              type="text"
              required
              autoFocus
              autoComplete="off"
              placeholder="Örn: Ana Yemekler, İçecekler vb."
              value={katAd}
              onChange={e => setKatAd(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-[#322C26] bg-[#110F0C] text-white text-sm focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-surface-400 uppercase">Sıra Numarası (Öncelik)</label>
              <span className="text-[11px] font-mono text-cyan-400 font-bold">1 = En Başta</span>
            </div>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Örn: 1, 2, 3... (Varsayılan: 999)"
              value={katSiraNo}
              onChange={e => setKatSiraNo(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
              className="w-full h-11 px-4 rounded-xl border border-[#322C26] bg-[#110F0C] text-white text-sm font-mono focus:border-brand-500 focus:outline-none"
            />
            <p className="text-[11px] text-surface-500 mt-1 font-mono">
              Küçük sayılar (1, 2, 3...) menüde en başta gösterilir. Eşit olanlar kendi arasında alfabetik sıralanır.
            </p>
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
                className="h-10 w-16 rounded-xl border border-[#322C26] bg-[#110F0C] cursor-pointer p-0"
              />
              <span className="text-xs font-mono uppercase text-surface-400">{katRenk}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-[#322C26]">
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
        size="lg"
      >
        <form key={duzenlenenUrun ? `urun-${duzenlenenUrun.id}` : 'urun-yeni'} onSubmit={urunKaydet} className="flex flex-col gap-4 max-h-[85vh] overflow-y-auto pos-scrollbar pr-1">
          
          {/* Sekme Butonları (Tabs) */}
          <div className="flex items-center gap-1.5 p-1 bg-[#110F0C] border border-[#322C26] rounded-xl overflow-x-auto pos-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => setUrunModalTab('genel')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all touch-feedback whitespace-nowrap",
                urunModalTab === 'genel'
                  ? "bg-brand-600 text-white shadow-md shadow-brand-950/50 border border-brand-400/40"
                  : "text-surface-400 hover:text-surface-200 hover:bg-[#1e1a16]"
              )}
            >
              <Package size={15} />
              <span>1. Genel Bilgiler</span>
            </button>
            <button
              type="button"
              onClick={() => setUrunModalTab('satis')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all touch-feedback whitespace-nowrap",
                urunModalTab === 'satis'
                  ? "bg-brand-600 text-white shadow-md shadow-brand-950/50 border border-brand-400/40"
                  : "text-surface-400 hover:text-surface-200 hover:bg-[#1e1a16]"
              )}
            >
              <DollarSign size={15} />
              <span>2. Satış & Fiyatlandırma</span>
              {satisTurleri.length > 1 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  {satisTurleri.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setUrunModalTab('stok')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all touch-feedback whitespace-nowrap",
                urunModalTab === 'stok'
                  ? "bg-brand-600 text-white shadow-md shadow-brand-950/50 border border-brand-400/40"
                  : "text-surface-400 hover:text-surface-200 hover:bg-[#1e1a16]"
              )}
            >
              <SlidersHorizontal size={15} />
              <span>3. Stok & Reçete</span>
              {receteKalemleri.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  {receteKalemleri.length}
                </span>
              )}
            </button>
          </div>

          {/* ═════════════════════════════════════════════════════════ */}
          {/* SEKME 1: GENEL BİLGİLER */}
          {/* ═════════════════════════════════════════════════════════ */}
          {urunModalTab === 'genel' && (
            <div className="flex flex-col gap-4 animate-in fade-in-50 duration-150">
              {/* Ad, Kategori ve Kod Bilgileri (Responsive Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Ürün Adı *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    autoComplete="off"
                    placeholder="Örn: Izgara Köfte Porsiyon"
                    value={urunAd}
                    onChange={e => setUrunAd(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-[#322C26] bg-[#110F0C] text-white text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Kısa / Mutfak Adı</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Örn: Köfte Pors."
                    value={urunKisaltma}
                    onChange={e => setUrunKisaltma(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-[#322C26] bg-[#110F0C] text-white text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Kategori *</label>
                  <select
                    required
                    value={urunKategoriId}
                    onChange={e => setUrunKategoriId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-[#322C26] bg-[#110F0C] text-white text-sm focus:border-brand-500 focus:outline-none"
                  >
                    <option value="" disabled>Kategori Seçiniz...</option>
                    {siraliKategoriler.map(k => (
                      <option key={k.id} value={String(k.id)}>{k.ad}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Barkod (Opsiyonel)</label>
                  <input
                    type="text"
                    autoComplete="off"
                    placeholder="Barkod okutun veya yazın..."
                    value={urunBarkod}
                    onChange={e => setUrunBarkod(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-[#322C26] bg-[#110F0C] text-white font-mono text-sm focus:border-brand-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Mutfak / Yazıcı Grubu</label>
                  <select
                    value={urunYaziciGrup}
                    onChange={e => setUrunYaziciGrup(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-[#322C26] bg-[#110F0C] text-white text-sm focus:border-brand-500 focus:outline-none"
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
                      Görsel Tanımlı
                    </span>
                  )}
                </label>

                {urunResimYolu ? (
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#110F0C] border border-[#322C26]">
                    <div className="relative w-16 h-16 rounded-xl bg-[#1E1A16] border border-[#3A342C] overflow-hidden shrink-0 shadow-md group">
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
                      <span className="text-[10px] font-mono text-surface-400 block mb-2">
                        POS, Garson ve QR Menü kartlarında görüntülenir
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={resimYukleniyor}
                          className="px-2.5 py-1 rounded-lg bg-[#1e1a16] hover:bg-brand-950/70 hover:text-brand-300 border border-[#322C26] hover:border-brand-600/50 text-xs font-semibold text-surface-300 transition-all touch-feedback flex items-center gap-1.5"
                        >
                          {resimYukleniyor ? (
                            <RefreshCw size={13} className="animate-spin text-brand-400" />
                          ) : (
                            <UploadCloud size={13} />
                          )}
                          <span>Değiştir</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleResimKaldir}
                          disabled={resimYukleniyor}
                          className="px-2.5 py-1 rounded-lg bg-[#1e1a16] hover:bg-rose-950/70 hover:text-rose-300 border border-[#322C26] hover:border-rose-600/50 text-xs font-semibold text-surface-400 transition-all touch-feedback flex items-center gap-1.5"
                        >
                          <Trash2 size={13} />
                          <span>Kaldır</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
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
                        : "border-[#322C26] hover:border-brand-500/60 bg-[#110F0C] hover:bg-[#171410]"
                    )}
                  >
                    {resimYukleniyor ? (
                      <div className="flex flex-col items-center py-2 text-brand-400">
                        <RefreshCw size={22} className="animate-spin mb-1.5" />
                        <span className="text-xs font-mono font-bold">Görsel yükleniyor...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <div className="w-9 h-9 rounded-xl bg-[#1e1a16] border border-[#3A342C] flex items-center justify-center text-surface-400 group-hover:text-brand-400 group-hover:border-brand-500/40 mb-1.5 transition-colors">
                          <UploadCloud size={18} />
                        </div>
                        <p className="text-xs font-semibold text-white mb-0.5">
                          Görsel yüklemek için tıklayın veya sürükleyin
                        </p>
                        <p className="text-[10px] font-mono text-surface-500">
                          PNG, JPG, WEBP • Kart oranında otomatik kırpılır
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-1 rounded-xl border border-[#322C26] bg-[#110F0C] p-2 mt-1">
                  <label htmlFor="urun-gorsel-url" className="text-[10px] font-mono uppercase text-surface-500">URL ile İndir & Ekle</label>
                  <div className="flex gap-2">
                    <input
                      id="urun-gorsel-url"
                      type="url"
                      inputMode="url"
                      placeholder="https://ornek.com/urun-fotografi.jpg"
                      value={resimUrl}
                      onChange={event => setResimUrl(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          urlIleGorselGetir()
                        }
                      }}
                      disabled={resimYukleniyor}
                      className="min-w-0 flex-1 h-9 px-3 rounded-lg border border-[#322C26] bg-[#171410] text-white text-xs placeholder:text-surface-600 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={urlIleGorselGetir}
                      disabled={resimYukleniyor || !resimUrl.trim()}
                      className="shrink-0 h-9 px-3 rounded-lg border border-brand-500/40 bg-brand-950/40 text-xs font-semibold text-brand-300 hover:bg-brand-900/55 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-1"
                    >
                      {resimYukleniyor ? <RefreshCw size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                      <span>İndir</span>
                    </button>
                  </div>
                </div>

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
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* SEKME 2: SATIŞ & FİYATLANDIRMA */}
          {/* ═════════════════════════════════════════════════════════ */}
          {urunModalTab === 'satis' && (
            <div className="flex flex-col gap-4 animate-in fade-in-50 duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
                <div>
                  <h4 className="text-xs font-mono uppercase text-surface-300 font-bold">Dinamik Satış Türleri & Fiyatlandırma</h4>
                  <p className="text-[11px] text-surface-500">Bu ürün için geçerli satış birimlerini (Porsiyon, KG vb.) ve fiyatlarını alt alta tanımlayın.</p>
                </div>
                <button
                  type="button"
                  onClick={satisTuruEkle}
                  className="px-3 py-1.5 rounded-lg bg-brand-950/80 border border-brand-500/50 hover:bg-brand-900/80 text-brand-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all touch-feedback shadow-sm shrink-0 whitespace-nowrap"
                >
                  <Plus size={14} />
                  <span>Satış Türü Ekle</span>
                </button>
              </div>

              {/* Satış Türleri Tablosu */}
              <div className="flex flex-col gap-2 max-h-56 sm:max-h-64 overflow-y-auto pos-scrollbar pr-1">
                {satisTurleri.map((tur, index) => (
                  <div key={tur.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-2.5 p-2.5 rounded-xl bg-[#110F0C] border border-[#322C26]">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1e1a16] border border-[#322C26] flex items-center justify-center text-xs font-mono font-bold text-surface-400 shrink-0">
                      {index + 1}
                    </div>

                    <div className="w-28 sm:w-36 shrink-0">
                      <label className="text-[10px] font-mono text-surface-500 uppercase block mb-1">Birim</label>
                      <select
                        value={tur.birim}
                        onChange={e => satisTuruGuncelle(tur.id, 'birim', e.target.value)}
                        className="w-full h-9 px-2.5 rounded-lg border border-[#322C26] bg-[#171410] text-white text-xs font-bold focus:border-brand-500 focus:outline-none"
                      >
                        <option value="Porsiyon">Porsiyon</option>
                        <option value="KG">KG (Kilo)</option>
                        <option value="Adet">Adet</option>
                        <option value="Gram">Gram</option>
                        <option value="Tane">Tane</option>
                        <option value="Dilim">Dilim</option>
                        <option value="Şişe">Şişe</option>
                        <option value="Kutu">Kutu</option>
                        <option value="Litre">Litre</option>
                      </select>
                    </div>

                    <div className="flex-1 min-w-[120px]">
                      <label className="text-[10px] font-mono text-surface-500 uppercase block mb-1">Satış Fiyatı (₺)</label>
                      <div className="relative">
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          placeholder="0.00"
                          value={tur.fiyat}
                          onChange={e => {
                            let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '')
                            const parts = val.split('.')
                            if (parts.length > 2) {
                              val = parts[0] + '.' + parts.slice(1).join('')
                            }
                            satisTuruGuncelle(tur.id, 'fiyat', val)
                          }}
                          className="w-full h-9 px-3 pr-8 rounded-lg border border-[#322C26] bg-[#171410] text-emerald-400 font-mono text-sm font-bold focus:border-brand-500 focus:outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-500 font-mono text-xs font-bold">₺</span>
                      </div>
                    </div>

                    <div className="shrink-0 pt-4">
                      <button
                        type="button"
                        onClick={() => satisTuruSil(tur.id)}
                        disabled={satisTurleri.length <= 1}
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-[#1e1a16] hover:bg-rose-950/60 hover:text-rose-300 border border-[#322C26] hover:border-rose-700/50 text-surface-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all touch-feedback"
                        title="Bu Satış Türünü Kaldır"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* + Satış Türü Ekle Butonu */}
              <button
                type="button"
                onClick={satisTuruEkle}
                className="w-full py-2.5 px-4 rounded-xl border border-dashed border-[#3A342C] hover:border-brand-500/60 bg-[#110F0C] hover:bg-brand-950/20 text-brand-400 hover:text-brand-300 text-xs font-bold flex items-center justify-center gap-2 transition-all touch-feedback shrink-0"
              >
                <Plus size={15} />
                <span>+ Yeni Satış Türü Ekle (Örn: KG, Adet)</span>
              </button>

              {/* KDV Oranı & Kart Önizleme */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">KDV Oranı (%)</label>
                  <select
                    value={urunKdv}
                    onChange={e => setUrunKdv(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-[#322C26] bg-[#110F0C] text-white text-sm focus:border-brand-500 focus:outline-none"
                  >
                    <option value="1">%1 (Temel Gıda)</option>
                    <option value="10">%10 (Standart Restoran)</option>
                    <option value="20">%20 (Alkollü / Hizmet)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="text-xs font-mono text-surface-400 uppercase block mb-1.5">Kart Fiyat Önizleme</label>
                  <div className="h-11 px-3.5 rounded-xl bg-[#110F0C] border border-[#322C26] flex items-center overflow-x-auto pos-scrollbar">
                    <span className="text-xs font-mono font-bold text-emerald-400 truncate">
                      {satisTurleri.filter(t => t.fiyat && Number(t.fiyat) > 0).map(t => `${t.birim}: ${Number(t.fiyat).toLocaleString('tr-TR')} ₺`).join(' | ') || 'Fiyat girilmedi'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════ */}
          {/* SEKME 3: STOK & REÇETE */}
          {/* ═════════════════════════════════════════════════════════ */}
          {urunModalTab === 'stok' && (
            <div className="flex flex-col gap-4 animate-in fade-in-50 duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
                <div>
                  <h4 className="text-xs font-mono uppercase text-surface-300 font-bold">Reçete Kalemleri (Hammadde Kullanımı)</h4>
                  <p className="text-[11px] text-surface-500">Sipariş satıldığında hammadde stoklarından düşülecek sarfiyat miktarları.</p>
                </div>
                <button
                  type="button"
                  onClick={receteKalemiEkle}
                  className="px-3 py-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/50 hover:bg-cyan-900/80 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all touch-feedback shadow-sm shrink-0 whitespace-nowrap"
                >
                  <Plus size={14} />
                  <span>Hammadde Ekle</span>
                </button>
              </div>

              {receteYukleniyor ? (
                <div className="flex items-center justify-center py-12 text-brand-400 font-mono text-xs">
                  <RefreshCw size={18} className="animate-spin mr-2" />
                  <span>Reçete bilgileri yükleniyor...</span>
                </div>
              ) : receteKalemleri.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-[#322C26] bg-[#110F0C] text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#1e1a16] border border-[#322C26] flex items-center justify-center text-surface-400 mx-auto mb-2.5">
                    <SlidersHorizontal size={20} />
                  </div>
                  <p className="text-xs font-semibold text-surface-300 mb-1">Bu ürün için henüz reçete / hammadde tanımlanmamış.</p>
                  <p className="text-[11px] text-surface-500 font-mono mb-3">Satış yapıldığında otomatik stok düşümü için yukarıdaki butondan hammadde ekleyin.</p>
                  <button
                    type="button"
                    onClick={receteKalemiEkle}
                    className="px-3.5 py-1.5 rounded-lg bg-[#1e1a16] hover:bg-[#322C26] border border-[#322C26] text-xs font-bold text-surface-200 inline-flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>İlk Hammaddeyi Ekle</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-56 sm:max-h-60 overflow-y-auto pos-scrollbar pr-1">
                  {receteKalemleri.map((kalem, idx) => (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded-xl bg-[#110F0C] border border-[#322C26]">
                      <select
                        value={kalem.hammadde_id}
                        onChange={e => receteKalemiGuncelle(idx, 'hammadde_id', e.target.value)}
                        className="flex-1 min-w-[140px] h-9 px-2.5 rounded-lg border border-[#322C26] bg-[#171410] text-white text-xs font-bold focus:border-brand-500 focus:outline-none"
                      >
                        {hammaddeler.length === 0 ? (
                          <option value="0">Tanımlı hammadde bulunamadı</option>
                        ) : (
                          hammaddeler.map(h => (
                            <option key={h.id} value={h.id}>{h.ad} ({h.birim})</option>
                          ))
                        )}
                      </select>

                      <div className="w-28 sm:w-32 relative shrink-0">
                        <input
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          value={kalem.miktar}
                          onChange={e => {
                            let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '')
                            const parts = val.split('.')
                            if (parts.length > 2) {
                              val = parts[0] + '.' + parts.slice(1).join('')
                            }
                            receteKalemiGuncelle(idx, 'miktar', val)
                          }}
                          placeholder="Miktar"
                          className="w-full h-9 px-2.5 pr-10 rounded-lg border border-[#322C26] bg-[#171410] text-white font-mono text-xs font-bold focus:border-brand-500 focus:outline-none"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-surface-500 uppercase">
                          {kalem.birim}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => receteKalemiSil(idx)}
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-[#1e1a16] hover:bg-rose-950/60 hover:text-rose-300 border border-[#322C26] hover:border-rose-700/50 text-surface-400 transition-all touch-feedback shrink-0"
                        title="Bu Hammaddeyi Kaldır"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mt-4 pt-3 border-t border-[#322C26] shrink-0">
            <div className="flex items-center gap-2">
              {urunModalTab !== 'genel' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUrunModalTab(urunModalTab === 'stok' ? 'satis' : 'genel')}
                  className="text-xs flex-1 sm:flex-none"
                >
                  ← Önceki Sekme
                </Button>
              )}
              {urunModalTab !== 'stok' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUrunModalTab(urunModalTab === 'genel' ? 'satis' : 'stok')}
                  className="text-xs text-brand-400 hover:text-brand-300 flex-1 sm:flex-none"
                >
                  Sonraki Sekme →
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 justify-end">
              <Button type="button" variant="ghost" onClick={() => setUrunModalAcik(false)}>
                İptal
              </Button>
              <Button type="submit" variant="primary" className="px-6 font-bold">
                {duzenlenenUrun ? 'Değişiklikleri Kaydet' : 'Ürün Ekle'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* TOPLU FİYAT GÜNCELLEME — CANLI ÖNİZLEME VE ONAY MODALI */}
      <Modal
        isOpen={onizlemeModalAcik}
        onClose={() => setOnizlemeModalAcik(false)}
        title="Toplu Fiyat Güncelleme — Canlı Önizleme & Onay"
        size="xl"
      >
        <div className="flex flex-col gap-3 max-h-[75vh]">
          
          {/* Özet Kartları */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <div className="bg-[#110F0C] border border-[#322C26] p-2.5 rounded-lg">
              <span className="text-[10px] font-mono text-surface-500 uppercase block">Seçilen Ürün</span>
              <strong className="text-white font-mono text-base">{hedefUrunler.length} Adet</strong>
            </div>
            <div className="bg-[#110F0C] border border-[#322C26] p-2.5 rounded-lg">
              <span className="text-[10px] font-mono text-surface-500 uppercase block">Hedef Birim</span>
              <strong className="text-brand-400 font-mono text-xs uppercase">
                {hedefBirimModu === 'hepsi' ? 'Tüm Satış Türleri' : `Sadece ${seciliOzelBirim}`}
              </strong>
            </div>
            <div className="bg-[#110F0C] border border-[#322C26] p-2.5 rounded-lg">
              <span className="text-[10px] font-mono text-surface-500 uppercase block">Uygulanan Kural</span>
              <strong className="text-emerald-400 font-mono text-xs">
                {artisTipi === 'yuzde' ? `+%${artisDegeri}` : `+${artisDegeri} ₺`}
                {yuvarlamaAktif ? ` (${yuvarlamaKati} ₺ Yuvarlama)` : ''}
              </strong>
            </div>
            <div className="bg-[#110F0C] border border-[#322C26] p-2.5 rounded-lg">
              <span className="text-[10px] font-mono text-surface-500 uppercase block">Güncellenecek Fiyat</span>
              <strong className="text-emerald-300 font-mono text-base">{etkilenenFiyatSayisi} Kalem</strong>
            </div>
          </div>

          {/* Modal Tablo Filtresi */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 pt-1">
            <span className="text-[11px] font-mono text-surface-400">
              Aşağıdaki simülasyon tablosunda yeni fiyatları inceleyebilir, gerektiğinde değerleri doğrudan düzenleyebilirsiniz:
            </span>
            <div className="relative w-56 shrink-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-500" />
              <input
                type="text"
                value={simulasyonArama}
                onChange={e => setSimulasyonArama(e.target.value)}
                placeholder="Önizlemede filtrele..."
                className="h-8 pl-8 pr-2.5 rounded-lg border border-[#322C26] bg-[#110F0C] text-white text-xs placeholder-surface-500 focus:border-brand-500 focus:outline-none w-full"
              />
            </div>
          </div>

          {/* Modal Simülasyon Tablosu */}
          <div className="flex-1 min-h-[260px] max-h-[45vh] overflow-y-auto pos-scrollbar border border-[#322C26] rounded-lg bg-[#110F0C]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#322C26] bg-[#171410] text-[10px] font-mono text-surface-400 uppercase sticky top-0 z-10">
                  <th className="py-2.5 px-3">Ürün</th>
                  <th className="py-2.5 px-3">Tür</th>
                  <th className="py-2.5 px-3 text-right">Eski Fiyat</th>
                  <th className="py-2.5 px-3 text-center">Fark</th>
                  <th className="py-2.5 px-3 text-right">Yeni Fiyat</th>
                  <th className="py-2.5 px-3 text-center">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#322C26] text-xs font-mono">
                {filtreliSimulasyonListesi.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-surface-500 font-mono">
                      Filtreye uygun ürün bulunamadı.
                    </td>
                  </tr>
                ) : (
                  filtreliSimulasyonListesi.map(satir => (
                    <tr key={`modal-${satir.id}`} className="hover:bg-[#1e1a16] transition-colors">
                      <td className="py-2 px-3 font-bold text-white font-sans text-xs">
                        {satir.urunAdi}
                        <span className="block text-[10px] text-surface-500 font-mono font-normal">
                          {satir.kategoriAdi}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        <span className={clsx(
                          "px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border",
                          ['kg', 'kilo'].includes(satir.birim.toLowerCase())
                            ? "bg-amber-950/60 text-amber-300 border-amber-600/40"
                            : ['adet', 'tane'].includes(satir.birim.toLowerCase())
                            ? "bg-teal-950/60 text-teal-300 border-teal-600/40"
                            : ['litre', 'lt'].includes(satir.birim.toLowerCase())
                            ? "bg-indigo-950/60 text-indigo-300 border-indigo-600/40"
                            : "bg-blue-950/60 text-blue-300 border-blue-600/40"
                        )}>
                          {satir.birim}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-surface-400">
                        {formatPara(satir.eskiFiyat)}
                      </td>
                      <td className="py-2 px-3 text-center font-semibold">
                        {satir.etkileniyor ? (
                          <span className={clsx(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border",
                            satir.fark > 0
                              ? "bg-emerald-950/60 text-emerald-300 border-emerald-600/40"
                              : satir.fark < 0
                              ? "bg-rose-950/60 text-rose-300 border-rose-600/40"
                              : "bg-[#1e1a16] text-surface-400 border-[#322C26]"
                          )}>
                            {satir.fark > 0 ? (
                              <>
                                <TrendingUp size={10} />
                                <span>+{formatPara(satir.fark)}</span>
                              </>
                            ) : satir.fark < 0 ? (
                              <>
                                <TrendingDown size={10} />
                                <span>{formatPara(satir.fark)}</span>
                              </>
                            ) : (
                              '0 ₺'
                            )}
                          </span>
                        ) : (
                          <span className="text-surface-600 text-[10px]">Etkilenmez</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {satir.etkileniyor ? (
                          <input
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            value={satir.yeniFiyatStr}
                            onChange={e => {
                              let val = e.target.value.replace(/,/g, '.').replace(/[^0-9.]/g, '')
                              const parts = val.split('.')
                              if (parts.length > 2) {
                                val = parts[0] + '.' + parts.slice(1).join('')
                              }
                              handleManuelFiyatDegistir(satir.urunId, satir.birim, val)
                            }}
                            className="w-24 h-7 px-2 text-right font-bold text-emerald-400 rounded border border-[#322C26] bg-[#171410] focus:border-brand-500 focus:outline-none text-xs"
                          />
                        ) : (
                          <span className="text-surface-500">{formatPara(satir.eskiFiyat)}</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {satir.etkileniyor ? (
                          <span className="text-[10px] text-emerald-400 font-bold">Güncellenecek</span>
                        ) : (
                          <span className="text-[10px] text-surface-600">Korumada</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Modal Alt Çubuk */}
          <div className="flex items-center justify-between pt-3 border-t border-[#322C26] shrink-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOnizlemeModalAcik(false)}
            >
              Vazgeç
            </Button>
            <Button
              variant="primary"
              onClick={handleTopluFiyatKaydet}
              isLoading={topluKayitYukleniyor}
              disabled={etkilenenFiyatSayisi === 0}
              className="px-6 font-bold flex items-center gap-2"
            >
              <Check size={16} />
              <span>Fiyat Değişikliklerini Uygula ({etkilenenUrunSayisi} Ürün)</span>
            </Button>
          </div>

        </div>
      </Modal>

      <ProductImageCropper
        kaynak={kirpmaKaynagi}
        yukleniyor={resimYukleniyor}
        onIptal={() => setKirpmaKaynagi(null)}
        onKaydet={kirpilmisGorseliYukle}
      />

    </div>
  )
}
