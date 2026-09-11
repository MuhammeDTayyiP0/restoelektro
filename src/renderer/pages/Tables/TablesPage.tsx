import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Users, 
  Search,
  RefreshCw, 
  Layers, 
  Link2,
  UtensilsCrossed, 
  Sparkles,
  Bike,
  Printer,
  StickyNote,
  CalendarDays,
  X,
  DoorOpen
} from 'lucide-react'
import { useIPC, useIPCListener, ipcInvoke } from '../../hooks/useIPC'
import { MASA_KANALLARI, HESAP_KANALLARI, AYAR_KANALLARI, REZERVASYON_KANALLARI } from '../../../common/ipc-channels'
import type { Masa, Bolum } from '../../../common/types/table.types'
import { formatPara, gecenDakikaHesapla, parseSqliteZamani } from '../../utils/formatters'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '../../stores/useAuthStore'
import { useToast } from '../../components/ui/Toast'
import { yazdirAdisyon } from '../../utils/print.utils'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'

// Süre formatlama (örn: 75 dk -> 1s 15dk)
function formatGecenSure(dakika: number): string {
  if (dakika < 60) return `${dakika} dk`
  const saat = Math.floor(dakika / 60)
  const kalanDk = dakika % 60
  return `${saat}s ${kalanDk}d`
}

interface TableCardProps {
  masa: Masa
  onClick: (masa: Masa) => void
  onLongPress: (masa: Masa) => void
  simdi: number
}

function masaDoluMu(masa: Masa) {
  return masa.durum === 'dolu' || !!masa.aktif_hesap_id
}

function masaRezerveMi(masa: Masa) {
  return !masaDoluMu(masa) && (masa.durum === 'rezerve' || !!masa.rezervasyon_id)
}

function masaGecenDk(masa: Masa, simdi: number): number {
  if (!masaDoluMu(masa)) return 0
  if (masa.acilis_zamani && parseSqliteZamani(masa.acilis_zamani)) {
    return gecenDakikaHesapla(masa.acilis_zamani, simdi)
  }
  return parseInt(String(masa.acik_sure || '0'), 10) || 0
}

/**
 * Performans ve re-render optimizasyonlu Masa Kartı bileşeni
 */
const TableCard = React.memo(function TableCard({
  masa,
  onClick,
  onLongPress,
  simdi,
}: TableCardProps) {
  const doluMu = masaDoluMu(masa)
  const rezerveMi = masaRezerveMi(masa)
  const birlestiMi = masa.durum === 'birlesti'
  const uzunBasildi = useRef(false)
  const basTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const gecenSure = masaGecenDk(masa, simdi)

  const sureSeviye: 'normal' | 'uyari' | 'kritik' = !doluMu
    ? 'normal'
    : gecenSure >= 90
      ? 'kritik'
      : gecenSure >= 45
        ? 'uyari'
        : 'normal'

  const handleClick = useCallback(() => {
    if (uzunBasildi.current) {
      uzunBasildi.current = false
      return
    }
    onClick(masa)
  }, [onClick, masa])

  const baslat = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    uzunBasildi.current = false
    if (basTimer.current) clearTimeout(basTimer.current)
    basTimer.current = setTimeout(() => {
      uzunBasildi.current = true
      onLongPress(masa)
    }, 480)
  }, [onLongPress, masa])

  const bitir = useCallback(() => {
    if (basTimer.current) {
      clearTimeout(basTimer.current)
      basTimer.current = null
    }
  }, [])

  useEffect(() => () => bitir(), [bitir])

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileTap={{ scale: 0.96 }}
      transition={{ duration: 0.15 }}
      onClick={handleClick}
      onPointerDown={baslat}
      onPointerUp={bitir}
      onPointerLeave={bitir}
      onPointerCancel={bitir}
      onContextMenu={(e) => {
        e.preventDefault()
        onLongPress(masa)
      }}
      className={clsx(
        "relative aspect-square w-full rounded-full p-2 text-center overflow-hidden touch-feedback",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-12px_20px_rgba(0,0,0,0.4)]",
        doluMu && sureSeviye === 'kritik' && "bg-[#2A1414] border-[1.5px] border-rose-500/50",
        doluMu && sureSeviye === 'uyari' && "bg-[#2A1C12] border-[1.5px] border-orange-500/45",
        doluMu && sureSeviye === 'normal' && "bg-[#2A1E18] border-[1.5px] border-brand-500/50",
        !doluMu && rezerveMi && "bg-[#3A2A12] border-[2.5px] border-amber-400 shadow-[0_0_16px_rgba(251,191,36,0.35)]",
        !doluMu && !rezerveMi && "bg-[#161310] border-[1.5px] border-[#3A342C]"
      )}
    >
      {doluMu && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="46.5" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="3.2" />
          <circle
            cx="50"
            cy="50"
            r="46.5"
            fill="none"
            stroke={sureSeviye === 'kritik' ? '#FB7185' : sureSeviye === 'uyari' ? '#FB923C' : '#9A5F48'}
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeDasharray={`${Math.min(292, Math.max(14, (gecenSure / 90) * 292))} 292`}
            transform="rotate(-90 50 50)"
          />
        </svg>
      )}

      {rezerveMi && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r="46.5" fill="none" stroke="#FBBF24" strokeWidth="3.6" strokeDasharray="7 5" />
        </svg>
      )}

      <div className="relative h-full flex flex-col items-center justify-center px-2.5">
        {masa.bolum_adi && (
          <span className={clsx(
            "mb-0.5 max-w-[85%] truncate rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide leading-none",
            rezerveMi ? "bg-amber-400/25 text-amber-100" : "bg-black/30 text-surface-300"
          )}>
            {masa.bolum_adi}
          </span>
        )}

        <span className={clsx(
          "font-semibold tracking-tight leading-none",
          String(masa.numara).length <= 4 ? "text-[30px] sm:text-[36px]" : "text-[16px] sm:text-[20px]",
          doluMu && sureSeviye === 'kritik' && "text-rose-200",
          rezerveMi ? "text-amber-50" : "text-surface-50"
        )}>
          {masa.numara}
        </span>

        {doluMu ? (
          <div className="mt-1.5 w-full min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-wider text-surface-400 leading-none">Tutar</div>
            <div className="font-mono text-[13px] sm:text-sm font-bold tabular-nums text-surface-50 truncate leading-tight">
              {formatPara(masa.aktif_hesap_tutari || 0)}
            </div>
            <div className={clsx(
              "mt-0.5 text-[11px] font-mono font-semibold leading-none",
              sureSeviye === 'kritik' ? "text-rose-300" : sureSeviye === 'uyari' ? "text-orange-300" : "text-surface-300"
            )}>
              {formatGecenSure(gecenSure)}
            </div>
          </div>
        ) : rezerveMi ? (
          <div className="mt-1.5 w-[88%] min-w-0 rounded-full bg-amber-400 text-[#1A1208] px-2 py-1">
            <div className="text-[9px] font-black uppercase tracking-widest leading-none">Rezerve</div>
            <div className="text-[11px] font-bold truncate leading-tight mt-0.5">
              {masa.rezervasyon_ad || 'Misafir'}
            </div>
            <div className="text-[10px] font-mono font-bold leading-none mt-0.5">
              {masa.rezervasyon_saat || '--:--'}
              {masa.rezervasyon_kisi ? ` · ${masa.rezervasyon_kisi}k` : ''}
            </div>
          </div>
        ) : (
          <div className="mt-1.5 text-[11px] text-surface-500">
            {masa.kapasite || 4} kişilik
          </div>
        )}
      </div>

      {birlestiMi && (
        <div className="absolute top-[14%] right-[14%] text-brand-300" title="Birleşik masa">
          <Link2 size={12} />
        </div>
      )}
    </motion.button>
  )
})

export default function TablesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [seciliBolum, setSeciliBolum] = useState<string>(() => sessionStorage.getItem('seciliBolum') || 'tum')
  const [durumFiltresi, setDurumFiltresi] = useState<string>('tum')
  const [aramaMetni, setAramaMetni] = useState<string>('')

  useEffect(() => {
    sessionStorage.setItem('seciliBolum', seciliBolum)
  }, [seciliBolum])

  const { veri: bolumler, yukleniyor: bolumlerYukleniyor, yenile: bolumleriYenile } = useIPC<Bolum[]>(MASA_KANALLARI.BOLUMLER, [])
  const { veri: masalar, yukleniyor: masalarYukleniyor, yenile: masalariYenile } = useIPC<Masa[]>(MASA_KANALLARI.MASALAR, [])

  const personel = useAuthStore(s => s.personel)
  const isAdmin = personel?.rol === 'admin'

  const [seciliHedefBolumId, setSeciliHedefBolumId] = useState<number | null>(null)
  const [onek, setOnek] = useState('S')
  const [masaSayisi, setMasaSayisi] = useState(15)
  const [olusturuluyor, setOlusturuluyor] = useState(false)
  const [aksiyonMasa, setAksiyonMasa] = useState<Masa | null>(null)
  const [notMetni, setNotMetni] = useState('')
  const [notModal, setNotModal] = useState(false)
  const [kisiSayisi, setKisiSayisi] = useState('2')
  const [kisiModal, setKisiModal] = useState(false)
  const [rezForm, setRezForm] = useState({ musteri_ad: '', telefon: '', kisi_sayisi: '2', saat: '19:00', notlar: '' })
  const [rezModal, setRezModal] = useState(false)
  const [simdi, setSimdi] = useState(() => Date.now())

  // İlk açılışta hedef bölümü varsayılan ilk bölüme ayarla
  useEffect(() => {
    if (bolumler.length > 0 && !seciliHedefBolumId) {
      setSeciliHedefBolumId(bolumler[0].id)
    }
  }, [bolumler, seciliHedefBolumId])

  const hedefBolumId = seciliBolum !== 'tum' 
    ? parseInt(seciliBolum, 10) 
    : (seciliHedefBolumId || (bolumler.length > 0 ? bolumler[0].id : null))

  const handleTopluMasaOlustur = useCallback(async () => {
    if (!hedefBolumId || isNaN(hedefBolumId)) {
      toast.error('Hata', 'Lütfen geçerli bir bölüm seçin.')
      return
    }

    if (!onek.trim()) {
      toast.warning('Eksik Bilgi', 'Lütfen bir masa öneki girin (örn: S).')
      return
    }

    if (masaSayisi < 1 || masaSayisi > 200) {
      toast.warning('Geçersiz Sayı', 'Masa sayısı 1 ile 200 arasında olmalıdır.')
      return
    }

    setOlusturuluyor(true)
    try {
      const p = onek.trim().toUpperCase()
      const bolumMasalari = masalar.filter(m => m.bolum_id === hedefBolumId && m.aktif !== false)
      
      // En yüksek mevcut masa numarasını bul
      let maxNum = 0
      const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const regex = new RegExp(`^${escaped}\\s*[-_]?\\s*(\\d+)$`, 'i')
      for (const m of bolumMasalari) {
        const match = m.numara.trim().match(regex)
        if (match) {
          const num = parseInt(match[1], 10)
          if (!isNaN(num) && num > maxNum) maxNum = num
        }
      }

      // Sıralama ve pozisyon başlangıcı
      const maxSira = bolumMasalari.reduce((max, m) => Math.max(max, m.sira || 0), 0)
      const existingCount = bolumMasalari.length

      for (let i = 1; i <= masaSayisi; i++) {
        const num = maxNum + i
        const numara = `${p} ${num}`
        const sira = maxSira + i
        const x = ((existingCount + i - 1) % 5) * 120 + 50
        const y = Math.floor((existingCount + i - 1) / 5) * 120 + 50

        await ipcInvoke(MASA_KANALLARI.MASA_EKLE, {
          bolum_id: hedefBolumId,
          numara,
          kapasite: 4,
          konum_x: x,
          konum_y: y,
          sira
        })
      }

      toast.success('Masalar Oluşturuldu', `${masaSayisi} adet masa başarıyla eklendi.`)
      await masalariYenile()
      await bolumleriYenile()
    } catch (err: any) {
      console.error('IPC Hatası:', err)
      toast.error('İşlem Hatası', err.message || 'Masa oluşturulurken bir hata meydana geldi.')
    } finally {
      setOlusturuluyor(false)
    }
  }, [hedefBolumId, onek, masaSayisi, masalar, toast, masalariYenile, bolumleriYenile])

  // Anlık güncellemeleri dinle (Garson vs)
  useIPCListener('masalar:guncellendi', () => {
    masalariYenile()
  })

  // 15 saniyede bir süreyi güncelle, 60 saniyede bir masaları yenile
  useEffect(() => {
    const sureTimer = setInterval(() => setSimdi(Date.now()), 15000)
    const timer = setInterval(() => {
      masalariYenile()
    }, 60000)
    return () => {
      clearInterval(sureTimer)
      clearInterval(timer)
    }
  }, [masalariYenile])

  // İstatistikler (KPI)
  const istatistikler = useMemo(() => {
    const toplam = masalar.length
    const doluSayisi = masalar.filter(m => m.durum === 'dolu' || !!m.aktif_hesap_id).length
    const bosSayisi = masalar.filter(m => !masaDoluMu(m) && !masaRezerveMi(m)).length
    const rezerveSayisi = masalar.filter(m => masaRezerveMi(m)).length
    const toplamAdisyon = masalar.reduce((toplam, m) => toplam + (m.aktif_hesap_tutari || 0), 0)
    const dolulukOrani = toplam > 0 ? Math.round((doluSayisi / toplam) * 100) : 0

    return { toplam, doluSayisi, bosSayisi, rezerveSayisi, toplamAdisyon, dolulukOrani }
  }, [masalar])

  // Bölüm bazlı masa sayıları haritası
  const bolumMasaSayilari = useMemo(() => {
    const map: Record<string, { toplam: number; dolu: number }> = {}
    masalar.forEach(m => {
      const bId = m.bolum_id.toString()
      if (!map[bId]) map[bId] = { toplam: 0, dolu: 0 }
      map[bId].toplam += 1
      if (m.durum === 'dolu' || !!m.aktif_hesap_id) {
        map[bId].dolu += 1
      }
    })
    return map
  }, [masalar])

  const seciliBolumdekiMasaSayisi = useMemo(() => {
    if (seciliBolum === 'tum') return masalar.length
    return masalar.filter(m => m.bolum_id.toString() === seciliBolum).length
  }, [masalar, seciliBolum])

  const bolumdeHicMasaYok = seciliBolumdekiMasaSayisi === 0 && !aramaMetni.trim() && durumFiltresi === 'tum'

  // Filtreleme mantığı
  const filtrelenmisMasalar = useMemo(() => {
    return masalar.filter(masa => {
      // 1. Bölüm filtresi
      if (seciliBolum !== 'tum' && masa.bolum_id.toString() !== seciliBolum) {
        return false
      }

      // 2. Durum filtresi
      const doluMu = masaDoluMu(masa)
      const rezerveMi = masaRezerveMi(masa)
      const bosMu = !doluMu && !rezerveMi
      const birlestiMi = masa.durum === 'birlesti'

      if (durumFiltresi === 'dolu' && !doluMu) return false
      if (durumFiltresi === 'bos' && !bosMu) return false
      if (durumFiltresi === 'rezerve' && !rezerveMi) return false
      if (durumFiltresi === 'birlesti' && !birlestiMi) return false

      // 3. Arama filtresi
      if (aramaMetni.trim()) {
        const query = aramaMetni.toLowerCase().trim()
        const masaNoStr = masa.numara.toString().toLowerCase()
        const garsonStr = (masa.garson_adi || '').toLowerCase()
        if (!masaNoStr.includes(query) && !garsonStr.includes(query)) {
          return false
        }
      }

      return true
    })
  }, [masalar, seciliBolum, durumFiltresi, aramaMetni])

  const masaTikla = useCallback((masa: Masa) => {
    if (masa.aktif_hesap_id) {
      navigate(`/pos/${masa.aktif_hesap_id}`)
    } else {
      navigate(`/pos?masa=${masa.id}`)
    }
  }, [navigate])

  const masaUzunBas = useCallback((masa: Masa) => {
    setAksiyonMasa(masa)
  }, [])

  const adisyonYazdir = useCallback(async (masa: Masa) => {
    if (!masa.aktif_hesap_id) {
      toast.warning('Adisyon yok', 'Bu masada açık hesap yok.')
      return
    }
    try {
      const hesap = await ipcInvoke<any>(HESAP_KANALLARI.DETAY, masa.aktif_hesap_id)
      const kasaYazici = await ipcInvoke<string>(AYAR_KANALLARI.GETIR, 'kasa_yazici')
      if (!kasaYazici) {
        toast.error('Hata', 'Kasa yazıcısı ayarlanmamış.')
        return
      }
      const ayarlar = await ipcInvoke<Record<string, string>>(AYAR_KANALLARI.TUMU)
      const basarili = await yazdirAdisyon(hesap, kasaYazici, {
        ad: ayarlar?.['restoran_adi'] || '',
        telefon: ayarlar?.['restoran_telefon'] || '',
        adres: ayarlar?.['restoran_adres'] || '',
        altNot: ayarlar?.['fis_alt_not'] || '',
      })
      if (basarili) toast.success('Yazdırıldı', `Masa ${masa.numara} adisyonu`)
      else toast.error('Hata', 'Yazdırma başarısız')
    } catch (err: any) {
      toast.error('Hata', err.message)
    }
  }, [toast])

  const rezervasyonIptal = useCallback(async (masa: Masa) => {
    if (!masa.rezervasyon_id) return
    try {
      const res = await ipcInvoke<any>(REZERVASYON_KANALLARI.DURUM, masa.rezervasyon_id, 'iptal', personel?.id)
      if (!res?.basarili) throw new Error(res?.hata)
      toast.success('İptal', `Masa ${masa.numara} rezervasyonu kaldırıldı`)
      setAksiyonMasa(null)
      masalariYenile()
    } catch (err: any) {
      toast.error('Hata', err.message)
    }
  }, [personel?.id, toast, masalariYenile])

  const notKaydet = useCallback(async () => {
    if (!aksiyonMasa?.aktif_hesap_id) return
    try {
      const res = await ipcInvoke<any>(HESAP_KANALLARI.TESLIMAT_GUNCELLE, aksiyonMasa.aktif_hesap_id, { notlar: notMetni })
      if (!res?.basarili) throw new Error(res?.hata)
      toast.success('Not kaydedildi', `Masa ${aksiyonMasa.numara}`)
      setNotModal(false)
      setAksiyonMasa(null)
      masalariYenile()
    } catch (err: any) {
      toast.error('Hata', err.message)
    }
  }, [aksiyonMasa, notMetni, toast, masalariYenile])

  const kisiKaydet = useCallback(async () => {
    if (!aksiyonMasa?.aktif_hesap_id) return
    try {
      const res = await ipcInvoke<any>(HESAP_KANALLARI.TESLIMAT_GUNCELLE, aksiyonMasa.aktif_hesap_id, {
        kisi_sayisi: Number(kisiSayisi || 1),
      })
      if (!res?.basarili) throw new Error(res?.hata)
      toast.success('Kişi sayısı', `${kisiSayisi} kişi`)
      setKisiModal(false)
      setAksiyonMasa(null)
      masalariYenile()
    } catch (err: any) {
      toast.error('Hata', err.message)
    }
  }, [aksiyonMasa, kisiSayisi, toast, masalariYenile])

  const hizliRezervasyon = useCallback(async () => {
    if (!aksiyonMasa || !rezForm.musteri_ad.trim()) {
      toast.warning('Eksik', 'Misafir adı gerekli')
      return
    }
    const d = new Date()
    const tarih = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    try {
      const res = await ipcInvoke<any>(REZERVASYON_KANALLARI.EKLE, {
        musteri_ad: rezForm.musteri_ad.trim(),
        telefon: rezForm.telefon,
        kisi_sayisi: Number(rezForm.kisi_sayisi || 2),
        saat: rezForm.saat,
        notlar: rezForm.notlar,
        masa_id: aksiyonMasa.id,
        tarih,
        personel_id: personel?.id,
      })
      if (!res?.basarili) throw new Error(res?.hata)
      toast.success('Rezervasyon', `${aksiyonMasa.numara} — ${rezForm.musteri_ad}`)
      setRezModal(false)
      setAksiyonMasa(null)
      setRezForm({ musteri_ad: '', telefon: '', kisi_sayisi: '2', saat: '19:00', notlar: '' })
      masalariYenile()
    } catch (err: any) {
      toast.error('Hata', err.message)
    }
  }, [aksiyonMasa, rezForm, personel?.id, toast, masalariYenile])

  if (bolumlerYukleniyor && masalarYukleniyor) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0B0A08] text-slate-100">
        <div className="w-12 h-12 rounded-2xl bg-[#1e1a16] border border-[#3A342C] flex items-center justify-center mb-4">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
        <p className="text-sm font-mono tracking-widest uppercase text-slate-400 animate-pulse">
          Masa düzeni yükleniyor...
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0A08] text-slate-100 overflow-hidden select-none -m-4 lg:-m-6 p-4 lg:p-6 gap-4">
      
      {/* 1. ÜST BAŞLIK & KOMUTA ÇUBUĞU */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 pb-3 border-b border-[#322C26] shrink-0">
        
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-white">
              Masalar
            </h2>
            <p className="text-xs text-surface-400 mt-0.5">
              {istatistikler.doluSayisi} dolu · {istatistikler.bosSayisi} boş
              {istatistikler.rezerveSayisi ? ` · ${istatistikler.rezerveSayisi} rezerve` : ''}
              {' · '}{formatPara(istatistikler.toplamAdisyon)}
            </p>
          </div>
        </div>

        {/* Sağ Taraf: Hızlı İşlem Araçları */}
        <div className="flex items-center gap-2.5 w-full xl:w-auto justify-between xl:justify-end">
          {/* Arama Inputu */}
          <div className="relative flex-1 sm:w-64 max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={aramaMetni}
              onChange={e => setAramaMetni(e.target.value)}
              placeholder="Masa no veya garson ara..."
              className="w-full h-11 pl-9 pr-8 bg-[#171410] border border-[#322C26] focus:border-emerald-500/60 rounded-xl text-xs font-mono text-slate-200 placeholder:text-slate-400 focus:outline-none transition-colors"
            />
            {aramaMetni && (
              <button
                onClick={() => setAramaMetni('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Müşteriler Butonu */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/customers')}
            className="h-11 px-3.5 rounded-xl bg-[#1e1a16] border border-[#3A342C] hover:border-slate-500 text-slate-300 hover:text-white font-mono text-xs font-bold flex items-center gap-2 transition-colors"
          >
            <Users size={16} />
            <span className="hidden md:inline">Müşteriler</span>
          </motion.button>

          {/* Hızlı Paket Sipariş Butonu */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/pos?tip=gel_al')}
            className="h-11 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
          >
            <Plus size={18} />
            <span>Hızlı Satış</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/pos?tip=paket')}
            className="h-11 px-4 rounded-xl bg-[#1e1a16] border border-brand-500/40 hover:border-brand-400 text-brand-300 hover:text-white font-mono text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all"
          >
            <Bike size={16} />
            <span>Paket</span>
          </motion.button>

          {/* Yenile Butonu */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => masalariYenile()}
            className="h-11 w-11 rounded-xl bg-[#1e1a16] border border-[#3A342C] hover:border-slate-500 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="Masaları Yenile"
          >
            <RefreshCw size={16} />
          </motion.button>
        </div>
      </div>

      {/* 2. BÖLÜMLER & DURUM FİLTRELEME ÇUBUĞU (INDUSTRIAL SEGMENTED BAR) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 shrink-0 bg-[#171410] p-2 rounded-2xl border border-[#322C26]">
        
        {/* Kat / Bölge Sekmeleri */}
        <div className="flex items-center gap-1.5 overflow-x-auto pos-scrollbar pb-1 md:pb-0">
          <button
            onClick={() => setSeciliBolum('tum')}
            className={clsx(
              "h-10 px-4 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shrink-0",
              seciliBolum === 'tum'
                ? "bg-[#322C26] text-white shadow-sm border border-slate-600/50"
                : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-[#1e1a16]"
            )}
          >
            <Layers size={14} />
            <span>Tüm Bölümler</span>
            <span className="bg-[#0B0A08] text-slate-400 px-1.5 py-0.5 rounded text-[10px]">
              {masalar.length}
            </span>
          </button>

          {bolumler.map(bolum => {
            const bStats = bolumMasaSayilari[bolum.id.toString()] || { toplam: 0, dolu: 0 }
            const isActive = seciliBolum === bolum.id.toString()

            return (
              <button
                key={bolum.id}
                onClick={() => setSeciliBolum(bolum.id.toString())}
                className={clsx(
                  "h-10 px-4 rounded-xl text-xs font-medium flex items-center gap-2 transition-all shrink-0",
                  isActive
                    ? "bg-[#2A1E18] text-white border border-brand-500/40"
                    : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-[#1e1a16]"
                )}
              >
                <span>{bolum.ad}</span>
                <span className={clsx(
                  "px-1.5 py-0.5 rounded text-[10px]",
                  isActive ? "bg-brand-950/50 text-brand-200" : "bg-[#0B0A08] text-slate-400"
                )}>
                  {bStats.dolu}/{bStats.toplam}
                </span>
              </button>
            )
          })}
        </div>

        {/* Durum Filtre Çipleri */}
        <div className="flex items-center gap-1 bg-[#110F0C] p-1 rounded-xl border border-[#1E1A16] self-start md:self-auto overflow-x-auto">
          {[
            { id: 'tum', label: 'Tümü' },
            { id: 'bos', label: 'Boş', color: 'text-emerald-400' },
            { id: 'dolu', label: 'Dolu', color: 'text-amber-400' },
            { id: 'rezerve', label: 'Rezerve', color: 'text-amber-300' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setDurumFiltresi(f.id)}
              className={clsx(
                "h-8 px-3 rounded-lg font-mono text-xs font-bold transition-all shrink-0",
                durumFiltresi === f.id
                  ? "bg-[#322C26] text-white shadow-sm border border-slate-700/60"
                  : "text-slate-400 hover:text-slate-200"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. MASA KARTLARI GRİDİ (HIGH-CONTRAST INDUSTRIAL CARDS) */}
      <div className="flex-1 overflow-y-auto pos-scrollbar pr-1 pb-4">
        {filtrelenmisMasalar.length === 0 ? (
          (bolumdeHicMasaYok && isAdmin) ? (
            <div className="flex flex-col items-center justify-center min-h-[380px] text-slate-400 text-center p-6 my-auto">
              <div className="w-20 h-20 mb-5 rounded-3xl bg-[#171410] border border-[#322C26] flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                <Sparkles size={36} />
              </div>
              <h3 className="text-2xl font-black font-mono text-white uppercase tracking-tight mb-2">
                Bu Bölümde Masa Yok
              </h3>
              <p className="text-sm text-slate-400 font-mono max-w-md mb-6">
                Bu bölüme hızlıca toplu masa ekleyebilirsiniz. Önek ve masa sayısını belirleyip oluştur butonuna tıklayın.
              </p>

              <div className="flex flex-col gap-4 bg-[#171410] border border-[#322C26] p-6 rounded-2xl w-full max-w-sm text-left shadow-2xl">
                {seciliBolum === 'tum' && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Hedef Bölüm</label>
                    <select
                      value={hedefBolumId || ''}
                      onChange={e => setSeciliHedefBolumId(parseInt(e.target.value, 10))}
                      className="w-full h-12 px-4 bg-[#1e1a16] border border-[#3A342C] focus:border-emerald-500/60 rounded-xl text-sm font-mono font-bold text-white focus:outline-none transition-colors"
                    >
                      {bolumler.map(b => (
                        <option key={b.id} value={b.id} className="bg-[#171410] text-white">
                          {b.ad}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Masa Öneki (Örn: S)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={onek}
                      onChange={e => setOnek(e.target.value)}
                      placeholder="Örn: S veya M"
                      className="w-full h-12 px-4 bg-[#1e1a16] border border-[#3A342C] focus:border-emerald-500/60 rounded-xl text-sm font-mono font-bold text-white uppercase focus:outline-none transition-colors"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 font-mono">Önizleme:</span>
                      <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/20">
                        {onek.trim() || 'M'} 1
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Masa Sayısı</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={masaSayisi}
                    onChange={e => setMasaSayisi(parseInt(e.target.value) || 1)}
                    className="w-full h-12 px-4 bg-[#1e1a16] border border-[#3A342C] focus:border-emerald-500/60 rounded-xl text-sm font-mono font-bold text-white focus:outline-none transition-colors"
                  />
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleTopluMasaOlustur}
                  disabled={olusturuluyor || !onek.trim() || masaSayisi < 1}
                  className="w-full h-12 mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#322C26] disabled:text-slate-500 disabled:border disabled:border-[#3A342C] text-white font-mono text-sm font-black uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {olusturuluyor ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      <span>Oluşturuluyor...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      <span>Toplu Masa Oluştur</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-80 text-slate-400 text-center">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-[#171410] border border-[#322C26] flex items-center justify-center text-slate-400">
                <UtensilsCrossed size={32} />
              </div>
              <p className="text-base font-mono font-bold text-slate-300 uppercase tracking-wider">
                Kriterlere Uygun Masa Bulunamadı
              </p>
              <p className="text-xs text-slate-400 font-mono mt-1 max-w-sm">
                Seçili filtreleri temizleyerek veya arama kutusunu sıfırlayarak tekrar deneyin.
              </p>
              <button
                onClick={() => { setSeciliBolum('tum'); setDurumFiltresi('tum'); setAramaMetni('') }}
                className="mt-4 px-4 py-2 bg-[#1e1a16] hover:bg-[#322C26] border border-[#3A342C] text-xs font-mono font-bold text-slate-200 rounded-xl transition-colors"
              >
                Filtreleri Sıfırla
              </button>
            </div>
          )
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 sm:gap-3">
            <AnimatePresence>
              {filtrelenmisMasalar.map(masa => (
                <TableCard
                  key={masa.id}
                  masa={masa}
                  onClick={masaTikla}
                  onLongPress={masaUzunBas}
                  simdi={simdi}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AnimatePresence>
        {aksiyonMasa && !notModal && !kisiModal && !rezModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAksiyonMasa(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md mx-3 mb-3 rounded-2xl bg-[#171410] border border-[#322C26] shadow-2xl overflow-hidden"
            >
              <div className="flex items-start justify-between px-4 py-3 border-b border-[#322C26]">
                <div>
                  <div className="text-lg font-black font-mono text-white">MASA {aksiyonMasa.numara}</div>
                  <div className="text-[11px] font-mono text-surface-400 mt-0.5">
                    {masaDoluMu(aksiyonMasa)
                      ? `Açık hesap · ${formatPara(aksiyonMasa.aktif_hesap_tutari || 0)}`
                      : masaRezerveMi(aksiyonMasa)
                        ? `${aksiyonMasa.rezervasyon_ad || 'Rezerve'} · ${aksiyonMasa.rezervasyon_saat || ''}`
                        : `${aksiyonMasa.kapasite || 4} kişilik · boş`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAksiyonMasa(null)}
                  className="w-9 h-9 rounded-xl bg-[#1e1a16] border border-[#322C26] text-surface-400 hover:text-white flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const m = aksiyonMasa
                    setAksiyonMasa(null)
                    masaTikla(m)
                  }}
                  className="h-12 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm flex items-center gap-2.5"
                >
                  <DoorOpen size={18} />
                  {masaDoluMu(aksiyonMasa) ? 'Kasaya git' : masaRezerveMi(aksiyonMasa) ? 'Masaya oturt' : 'Masayı aç'}
                </button>

                {masaDoluMu(aksiyonMasa) && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        adisyonYazdir(aksiyonMasa)
                        setAksiyonMasa(null)
                      }}
                      className="h-12 px-3 rounded-xl bg-[#1e1a16] border border-[#322C26] text-surface-100 font-semibold text-sm flex items-center gap-2.5 hover:border-brand-500/40"
                    >
                      <Printer size={18} className="text-brand-400" />
                      Adisyon yazdır
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setKisiSayisi(String(aksiyonMasa.hesap_kisi || aksiyonMasa.kapasite || 2))
                        setKisiModal(true)
                      }}
                      className="h-12 px-3 rounded-xl bg-[#1e1a16] border border-[#322C26] text-surface-100 font-semibold text-sm flex items-center gap-2.5 hover:border-brand-500/40"
                    >
                      <Users size={18} className="text-brand-400" />
                      Kişi sayısı
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNotMetni(aksiyonMasa.hesap_notlar || '')
                        setNotModal(true)
                      }}
                      className="h-12 px-3 rounded-xl bg-[#1e1a16] border border-[#322C26] text-surface-100 font-semibold text-sm flex items-center gap-2.5 hover:border-brand-500/40"
                    >
                      <StickyNote size={18} className="text-brand-400" />
                      Masa notu
                    </button>
                  </>
                )}

                {masaRezerveMi(aksiyonMasa) && aksiyonMasa.rezervasyon_id && (
                  <button
                    type="button"
                    onClick={() => rezervasyonIptal(aksiyonMasa)}
                    className="h-12 px-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 font-semibold text-sm flex items-center gap-2.5"
                  >
                    <X size={18} />
                    Rezervasyonu iptal
                  </button>
                )}

                {!masaDoluMu(aksiyonMasa) && !masaRezerveMi(aksiyonMasa) && (
                  <button
                    type="button"
                    onClick={() => setRezModal(true)}
                    className="h-12 px-3 rounded-xl bg-[#1e1a16] border border-[#322C26] text-surface-100 font-semibold text-sm flex items-center gap-2.5 hover:border-brand-500/40"
                  >
                    <CalendarDays size={18} className="text-brand-400" />
                    Rezervasyon yaz
                  </button>
                )}
              </div>
              <p className="px-4 pb-3 text-[10px] font-mono text-surface-500">
                Kısa dokunuş masayı açar · uzun basış bu menüyü açar
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Modal isOpen={notModal} onClose={() => setNotModal(false)} title={`Masa ${aksiyonMasa?.numara || ''} notu`} size="sm">
        <div className="flex flex-col gap-3">
          <textarea
            value={notMetni}
            onChange={(e) => setNotMetni(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded-xl bg-[#110F0C] border border-[#322C26] text-white text-sm focus:outline-none focus:border-brand-500"
            placeholder="Alerji, özel istek, iç not..."
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setNotModal(false)}>Vazgeç</Button>
            <Button onClick={notKaydet}>Kaydet</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={kisiModal} onClose={() => setKisiModal(false)} title="Kişi sayısı" size="sm">
        <div className="flex flex-col gap-3">
          <input
            type="number"
            min={1}
            max={50}
            value={kisiSayisi}
            onChange={(e) => setKisiSayisi(e.target.value)}
            className="h-12 px-3 rounded-xl bg-[#110F0C] border border-[#322C26] text-white font-mono text-lg focus:outline-none focus:border-brand-500"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setKisiModal(false)}>Vazgeç</Button>
            <Button onClick={kisiKaydet}>Kaydet</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={rezModal} onClose={() => setRezModal(false)} title={`Rezervasyon — Masa ${aksiyonMasa?.numara || ''}`} size="sm">
        <div className="flex flex-col gap-3">
          <input
            value={rezForm.musteri_ad}
            onChange={(e) => setRezForm({ ...rezForm, musteri_ad: e.target.value })}
            placeholder="Misafir adı"
            className="h-11 px-3 rounded-xl bg-[#110F0C] border border-[#322C26] text-white text-sm focus:outline-none focus:border-brand-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={rezForm.telefon}
              onChange={(e) => setRezForm({ ...rezForm, telefon: e.target.value })}
              placeholder="Telefon"
              className="h-11 px-3 rounded-xl bg-[#110F0C] border border-[#322C26] text-white text-sm focus:outline-none focus:border-brand-500"
            />
            <input
              type="time"
              value={rezForm.saat}
              onChange={(e) => setRezForm({ ...rezForm, saat: e.target.value })}
              className="h-11 px-3 rounded-xl bg-[#110F0C] border border-[#322C26] text-white text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <input
            type="number"
            min={1}
            value={rezForm.kisi_sayisi}
            onChange={(e) => setRezForm({ ...rezForm, kisi_sayisi: e.target.value })}
            className="h-11 px-3 rounded-xl bg-[#110F0C] border border-[#322C26] text-white text-sm focus:outline-none focus:border-brand-500"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRezModal(false)}>Vazgeç</Button>
            <Button onClick={hizliRezervasyon}>Kaydet</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
