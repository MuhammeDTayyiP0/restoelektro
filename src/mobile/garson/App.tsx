// =====================================================
// Mobil Garson Terminali
// Masalar → masa detayı → sipariş kataloğu → sepet → mutfak
// Fiyatı sunucu hesaplar; burada gösterilen tutar aynı formülle (common/fiyat) hesaplanır.
// =====================================================

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { istek, ApiHatasi } from '../ortak/api'
import { useCanliOlaylar } from '../ortak/soket'
import { PinTuslari } from '../ortak/PinTuslari'
import { cokluSatisTuruMu, tartiliMi, satisTurleriYazisi, getUrunKiloFiyati, getUrunPorsiyonFiyati, kalemFiyatiHesapla, tl0 } from '../ortak/menu'
import * as I from './ikonlar'

type Sayfa = 'masalar' | 'masaDetay' | 'siparis'
interface AktifMasa { id: number; numara: string; hesap_id: number | null }
interface SepetKalemi {
  id: string
  urun: any
  ad: string
  birim: string
  isKg: boolean
  gramaj?: number
  porsiyon: number
  miktar: number
  notlar: string
  ikram: boolean
  ekFiyat: number
  varyant_id: number | null
  opsiyon_idleri: number[]
}
interface Menu { kategoriler: any[]; urunler: any[]; opsiyonlar: any[]; varyantlar: any[] }

const PORSIYONLAR = [0.5, 1, 1.5, 2]
const HAZIR_NOTLAR = ['Acısız', 'Az Pişmiş', 'Çok Pişmiş', 'Buzsuz', 'Paket', 'Alerji', 'Sossuz', 'Sıcak']
const GRAMAJ_HAZIR = [['0.250', '250g'], ['0.500', '500g'], ['0.750', '750g'], ['1.000', '1 KG'], ['1.500', '1.5 KG'], ['2.000', '2 KG'], ['2.500', '2.5 KG'], ['3.000', '3 KG']]

const titret = (ms: number | number[]) => { try { navigator.vibrate?.(ms) } catch { /* yok say */ } }
const yeniId = () => Math.random().toString(36).slice(2, 9)
const porsiyonYazisi = (p: number) => (!p || p === 1 ? '' : p === 0.5 ? '(0.5 Porsiyon) ' : p === 2 ? '(Double) ' : `(${p} Porsiyon) `)
const kalemTutari = (k: SepetKalemi) => kalemFiyatiHesapla(k.urun, { isKg: k.isKg, miktar: k.miktar, porsiyon: k.porsiyon, gramaj: k.gramaj, ekFiyat: k.ekFiyat })

/** Alt panellerin iki aşamalı açılış/kapanışı (arka plan → kayma animasyonu) */
function useAltPanel(acik: boolean): [boolean, boolean] {
  const [arka, setArka] = useState(false)
  const [panel, setPanel] = useState(false)
  useEffect(() => {
    if (acik) {
      setArka(true)
      const t = window.setTimeout(() => setPanel(true), 10)
      return () => window.clearTimeout(t)
    }
    setPanel(false)
    const t = window.setTimeout(() => setArka(false), 250)
    return () => window.clearTimeout(t)
  }, [acik])
  return [arka, panel]
}

function AltPanel({ acik, onKapat, baslik, altBaslik, govde, alt, govdeId }: { acik: boolean; onKapat: () => void; baslik: React.ReactNode; altBaslik?: React.ReactNode; govde: React.ReactNode; alt?: React.ReactNode; govdeId?: string }) {
  const [arka, panel] = useAltPanel(acik)
  return (
    <>
      <div className={'picker-modal-bg' + (arka ? ' active' : '')} onClick={onKapat} />
      <div className={'picker-sheet' + (panel ? ' active' : '')}>
        <div className="picker-header">
          <div>
            <div className="picker-title">{baslik}</div>
            {altBaslik}
          </div>
          <button className="btn-modal-close" onClick={onKapat}><I.Kapat /></button>
        </div>
        <div className="picker-body" id={govdeId}>{govde}</div>
        {alt ? <div className="picker-footer">{alt}</div> : null}
      </div>
    </>
  )
}

const PIN_ETIKETLERI = { C: 'C', B: <I.SilTus /> }
const pinTusSinifi = (fn: boolean) => (fn ? 'action-btn' : 'num-btn')

function PinNoktalari({ uzunluk }: { uzunluk: number }) {
  return (
    <div className="pin-display">
      {[0, 1, 2, 3].map((i) => <div key={i} className={'pin-dot' + (i < uzunluk ? ' filled' : '')} />)}
    </div>
  )
}

// ===== Giriş =====

function Giris({ onGiris }: { onGiris: (token: string, personel: any) => void }) {
  const [pin, setPin] = useState('')
  const [hata, setHata] = useState('')
  const gonderiliyor = useRef(false)

  const gonder = async (deger: string) => {
    gonderiliyor.current = true
    try {
      const data = await istek<any>('/api/garson/pin-giris', { govde: { pin_kodu: deger } })
      titret(30)
      onGiris(data.token, data.personel)
    } catch (e: any) {
      setHata(e?.message || 'Geçersiz PIN Kodu')
      titret([40, 60, 40])
      setPin('')
    } finally {
      gonderiliyor.current = false
    }
  }

  const tus = (k: string) => {
    if (gonderiliyor.current) return
    titret(10)
    setHata('')
    if (k === 'C') return setPin('')
    if (k === 'B') return setPin((p) => p.slice(0, -1))
    if (pin.length >= 4) return
    const yeni = pin + k
    setPin(yeni)
    if (yeni.length === 4) void gonder(yeni)
  }

  return (
    <div id="loginScreen" className="login-screen">
      <div className="pos-badge-top"><I.Kilit /> Mobil garson</div>
      <div className="login-brand-icon"><I.Fincan /></div>
      <div className="login-title">Garson Girişi</div>
      <div className="login-sub">PIN kodunuzu tuşlayarak giriş yapın</div>
      <PinNoktalari uzunluk={pin.length} />
      <PinTuslari className="numpad" id="numpad" onTus={tus} tusSinifi={pinTusSinifi} etiketler={PIN_ETIKETLERI} />
      <div className="login-error">{hata}</div>
    </div>
  )
}

// ===== Yönetici onayı (iptal / ikram) =====

function YoneticiOnayi({ istek: onay }: { istek: { mesaj: string; coz: (pin: string | null) => void } | null }) {
  const [pin, setPin] = useState('')
  useEffect(() => setPin(''), [onay])
  const tus = (k: string) => {
    if (!onay) return
    titret(10)
    if (k === 'C') return setPin('')
    if (k === 'B') return setPin((p) => p.slice(0, -1))
    if (pin.length >= 4) return
    const yeni = pin + k
    setPin(yeni)
    if (yeni.length === 4) onay.coz(yeni)
  }
  return (
    <AltPanel
      acik={Boolean(onay)}
      onKapat={() => onay?.coz(null)}
      baslik="Yönetici Onayı"
      altBaslik={<div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{onay?.mesaj}</div>}
      govde={
        <>
          <PinNoktalari uzunluk={pin.length} />
          {onay ? <PinTuslari className="numpad" onTus={tus} tusSinifi={pinTusSinifi} etiketler={PIN_ETIKETLERI} /> : null}
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>Yetkili bir personel PIN'ini girsin</div>
        </>
      }
    />
  )
}

// ===== Ürün kartı =====

const gorselDurumu = new Map<string, 'loaded' | 'failed'>()

function UrunKarti({ urun, ekstraVar, coklu, porsiyon, onSec }: { urun: any; ekstraVar: boolean; coklu: boolean; porsiyon: number; onSec: () => void }) {
  const kaynak = typeof urun.resim_yolu === 'string' && urun.resim_yolu.trim() ? urun.resim_yolu : ''
  const [durum, setDurum] = useState(kaynak ? gorselDurumu.get(kaynak) : undefined)
  return (
    <div className={'urun-pos-card ' + (kaynak ? 'has-img' : 'no-img')} onClick={onSec}>
      {coklu ? <span className="urun-varyant-badge" title="Porsiyon / KG Seçenekleri">⚖️</span> : ekstraVar ? <span className="urun-varyant-badge" title="Opsiyon/Varyant mevcut">⚙</span> : null}
      {kaynak ? (
        <div className="urun-thumb-wrap">
          <div className="urun-thumb-placeholder"><I.Gorsel /></div>
          {durum !== 'failed' ? (
            <img
              alt={urun.ad}
              loading="lazy"
              decoding="async"
              src={kaynak}
              className={durum === 'loaded' ? 'loaded' : undefined}
              style={durum === 'loaded' ? { display: 'block', opacity: 1 } : undefined}
              onLoad={() => { gorselDurumu.set(kaynak, 'loaded'); setDurum('loaded') }}
              onError={() => { if (gorselDurumu.get(kaynak) !== 'loaded') { gorselDurumu.set(kaynak, 'failed'); setDurum('failed') } }}
            />
          ) : <img alt={urun.ad} className="failed" />}
        </div>
      ) : null}
      <div className="urun-card-body">
        <div className="urun-pos-title">{urun.ad}</div>
        <div className="urun-pos-bottom"><span className="urun-pos-price">{satisTurleriYazisi(urun, porsiyon)}</span></div>
      </div>
    </div>
  )
}

// ===== Ana uygulama =====

function Terminal({ token, kullanici, cikisYap, api, yetkiliPost, toast }: {
  token: string
  kullanici: any
  cikisYap: () => void
  api: <T = any>(yol: string, govde?: unknown) => Promise<T>
  yetkiliPost: <T = any>(yol: string, govde: Record<string, unknown>) => Promise<T | null>
  toast: (m: string, hata?: boolean) => void
}) {
  const [sayfa, setSayfa] = useState<Sayfa>('masalar')
  const [sadeceAcik, setSadeceAcik] = useState(false)
  const [seciliBolum, setSeciliBolum] = useState<string | null>(null)
  const [masalar, setMasalar] = useState<any[]>([])
  const [menu, setMenu] = useState<Menu>({ kategoriler: [], urunler: [], opsiyonlar: [], varyantlar: [] })
  const [aktifMasa, setAktifMasa] = useState<AktifMasa | null>(null)
  const [detay, setDetay] = useState<{ hesap: any; siparisler: any[] } | null>(null)
  const [aktifKategori, setAktifKategori] = useState<number | null>(null)
  const [aktifPorsiyon, setAktifPorsiyon] = useState(1)
  const [arama, setArama] = useState('')
  const [sepet, setSepet] = useState<SepetKalemi[]>([])
  const [sepetAcik, setSepetAcik] = useState(false)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const [satisTuruUrun, setSatisTuruUrun] = useState<any>(null)
  const [gramajUrun, setGramajUrun] = useState<any>(null)
  const [girilenGramaj, setGirilenGramaj] = useState('0.500')
  const [secici, setSecici] = useState<{ urun: any; satisTuru: 'porsiyon' | 'kg'; gramaj?: number } | null>(null)
  const [secim, setSecim] = useState<{ varyant: any | null; opsiyonlar: any[] }>({ varyant: null, opsiyonlar: [] })
  const sepetCubugu = useRef<HTMLDivElement>(null)

  // ---- Veri yükleme ----
  const masalariYukle = useCallback(async () => {
    try { setMasalar(await api<any[]>('/api/garson/masalar')) } catch (e: any) { if (e?.durum !== 401) toast('Bağlantı hatası', true) }
  }, [api, toast])

  const masaDetayYukle = useCallback(async (masaId: number) => {
    try {
      const res = await api<any>('/api/garson/masa/' + masaId)
      if (!res?.hesap) {
        setDetay(null)
        setSayfa('masalar')
        setAktifMasa(null)
        void masalariYukle()
        return
      }
      setDetay(res)
    } catch (e: any) {
      if (e?.durum !== 401) toast('Bağlantı hatası', true)
    }
  }, [api, toast, masalariYukle])

  useEffect(() => {
    void masalariYukle()
    api<Menu>('/api/garson/menu').then((data) => {
      const kategoriler = [...(data.kategoriler || [])].sort((a, b) => {
        const sa = a.sira_no ?? 999, sb = b.sira_no ?? 999
        return sa !== sb ? sa - sb : String(a.ad || '').localeCompare(String(b.ad || ''), 'tr')
      })
      setMenu({ kategoriler, urunler: data.urunler || [], opsiyonlar: data.opsiyonlar || [], varyantlar: data.varyantlar || [] })
      if (kategoriler[0]) setAktifKategori((k) => k ?? kategoriler[0].id)
    }).catch(() => {})
  }, [api, masalariYukle])

  useCanliOlaylar(token, {
    'masalar:guncellendi': () => { if (sayfa === 'masalar') void masalariYukle() },
    'siparis:guncellendi': (hesapId: number, masaId: number) => {
      if (sayfa === 'masaDetay' && aktifMasa && (aktifMasa.hesap_id === hesapId || aktifMasa.id === masaId)) void masaDetayYukle(aktifMasa.id)
    },
  })

  // ---- Gezinme ----
  const masalaraGeri = () => {
    titret(12)
    setSayfa('masalar')
    setAktifMasa(null)
    void masalariYukle()
  }
  const altMenu = (acik: boolean) => {
    titret(10)
    setSadeceAcik(acik)
    if (acik) setSeciliBolum(null)
    setSayfa('masalar')
  }
  const masaSec = (m: any) => {
    titret(15)
    const masa = { id: m.id, numara: String(m.numara), hesap_id: m.hesap_id || null }
    setAktifMasa(masa)
    if (masa.hesap_id) {
      setDetay(null)
      setSayfa('masaDetay')
      void masaDetayYukle(masa.id)
    } else {
      setSepet([])
      setSayfa('siparis')
    }
  }
  const siparisEkleyeGec = () => {
    titret(15)
    setSepet([])
    setSayfa('siparis')
  }

  // ---- Sepet ----
  const sepetTitret = () => {
    const bar = sepetCubugu.current
    if (!bar) return
    bar.classList.remove('haptic-active')
    void bar.offsetWidth
    bar.classList.add('haptic-active')
  }

  const ekstralar = (urunId: number) => ({
    opsiyonlar: menu.opsiyonlar.filter((o) => o.urun_id === urunId),
    varyantlar: menu.varyantlar.filter((v) => v.urun_id === urunId),
  })

  const sepeteEkle = (urun: any, kalem: Partial<SepetKalemi> & { isKg: boolean }, birlestir: boolean) => {
    titret(15)
    setSepet((onceki) => {
      if (birlestir) {
        const mevcut = onceki.find((s) => s.urun.id === urun.id && s.isKg === kalem.isKg && !s.notlar && !s.ikram && !s.varyant_id && !s.opsiyon_idleri.length &&
          (kalem.isKg ? s.gramaj === kalem.gramaj : s.porsiyon === (kalem.porsiyon ?? aktifPorsiyon)))
        if (mevcut) return onceki.map((s) => (s === mevcut ? { ...s, miktar: s.miktar + 1 } : s))
      }
      return [...onceki, {
        id: yeniId(),
        urun,
        ad: kalem.ad || urun.ad,
        birim: kalem.isKg ? 'KG' : urun.birim || 'Porsiyon',
        isKg: kalem.isKg,
        gramaj: kalem.gramaj,
        porsiyon: kalem.isKg ? 1 : kalem.porsiyon ?? aktifPorsiyon,
        miktar: 1,
        notlar: kalem.notlar || '',
        ikram: false,
        ekFiyat: kalem.ekFiyat || 0,
        varyant_id: kalem.varyant_id ?? null,
        opsiyon_idleri: kalem.opsiyon_idleri || [],
      }]
    })
    sepetTitret()
    toast((kalem.isKg ? `${kalem.gramaj} KG ` : '') + (kalem.ad || urun.ad) + ' eklendi')
  }

  const urunSec = (urun: any) => {
    titret(15)
    const { opsiyonlar, varyantlar } = ekstralar(urun.id)
    if (cokluSatisTuruMu(urun)) setSatisTuruUrun(urun)
    else if (tartiliMi(urun)) gramajAc(urun)
    else if (opsiyonlar.length || varyantlar.length) seciciAc(urun, 'porsiyon')
    else sepeteEkle(urun, { isKg: false }, true)
  }

  const seciciAc = (urun: any, satisTuru: 'porsiyon' | 'kg', gramaj?: number) => {
    setSecim({ varyant: null, opsiyonlar: [] })
    setSecici({ urun, satisTuru, gramaj })
  }

  const gramajAc = (urun: any) => {
    setGirilenGramaj('0.500')
    setGramajUrun(urun)
  }

  const gramajTus = (t: string) => {
    titret(10)
    setGirilenGramaj((g) => {
      if (t === 'C') return '0'
      if (t === ',' || t === '.') return g.includes('.') ? g : (g || '0') + '.'
      return g === '0' || g === '0.000' ? t : g + t
    })
  }

  const gramajOnayla = () => {
    titret(15)
    const deger = parseFloat(girilenGramaj.replace(',', '.'))
    if (isNaN(deger) || deger <= 0) return toast('Lütfen geçerli bir gramaj girin', true)
    const urun = gramajUrun
    setGramajUrun(null)
    const { opsiyonlar, varyantlar } = ekstralar(urun.id)
    if (opsiyonlar.length || varyantlar.length) seciciAc(urun, 'kg', deger)
    else sepeteEkle(urun, { isKg: true, gramaj: deger }, true)
  }

  const seciciOnayla = (atla: boolean) => {
    titret(atla ? 10 : 15)
    if (!secici) return
    const { urun, satisTuru, gramaj } = secici
    setSecici(null)
    const isKg = satisTuru === 'kg'
    if (atla) return sepeteEkle(urun, { isKg, gramaj: isKg ? gramaj || 1 : undefined }, true)

    const notlar = [secim.varyant?.ad, ...secim.opsiyonlar.map((o) => o.ad)].filter(Boolean).join(', ')
    const ekFiyat = Number(secim.varyant?.fiyat_farki || 0) + secim.opsiyonlar.reduce((t, o) => t + Number(o.fiyat || 0), 0)
    sepeteEkle(urun, {
      isKg,
      gramaj: isKg ? gramaj || 1 : undefined,
      ad: urun.ad + (notlar ? ` (${notlar})` : ''),
      notlar,
      ekFiyat,
      // Sunucu fiyatı bu kimliklerden yeniden hesaplar
      varyant_id: secim.varyant?.id ?? null,
      opsiyon_idleri: secim.opsiyonlar.map((o) => o.id),
    }, false)
  }

  /** Bir adet ayrılarak değiştirilir (miktar > 1 ise), yoksa kalemin kendisi */
  const kalemAyirVeDegistir = (id: string, degisim: Partial<SepetKalemi>) => {
    setSepet((onceki) => {
      const i = onceki.findIndex((s) => s.id === id)
      if (i < 0) return onceki
      const kalem = onceki[i]
      if (kalem.miktar > 1) {
        const kopya = [...onceki]
        kopya[i] = { ...kalem, miktar: kalem.miktar - 1 }
        kopya.splice(i + 1, 0, { ...kalem, ...degisim, id: yeniId(), miktar: 1 })
        return kopya
      }
      return onceki.map((s) => (s.id === id ? { ...s, ...degisim } : s))
    })
  }

  const notGuncelle = (id: string, notlar: string) => {
    const kalem = sepet.find((s) => s.id === id)
    if (!kalem || notlar.trim() === (kalem.notlar || '').trim()) return
    kalemAyirVeDegistir(id, { notlar })
  }

  const miktarDegistir = (id: string, fark: number) => {
    titret(10)
    setSepet((onceki) => onceki.map((s) => (s.id === id ? { ...s, miktar: s.miktar + fark } : s)).filter((s) => s.miktar > 0))
  }

  const miktarSor = (kalem: SepetKalemi) => {
    titret(10)
    const yeni = window.prompt(`Yeni miktar giriniz (${kalem.birim}):`, String(kalem.miktar))
    if (yeni === null) return
    const kesirli = ['KG', 'GRAM', 'GR', 'LITRE', 'LT', 'L'].includes(kalem.birim.toUpperCase())
    const deger = kesirli ? parseFloat(yeni.replace(',', '.')) : parseInt(yeni, 10)
    if (!isNaN(deger) && deger > 0) setSepet((onceki) => onceki.map((s) => (s.id === kalem.id ? { ...s, miktar: deger } : s)))
  }

  const sepetAdet = sepet.reduce((a, s) => a + s.miktar, 0)
  const sepetTutar = sepet.reduce((a, s) => a + (s.ikram ? 0 : kalemTutari(s).toplamFiyat), 0)
  useEffect(() => { if (!sepetAdet) setSepetAcik(false) }, [sepetAdet])

  const siparisGonder = async () => {
    if (!sepet.length || !aktifMasa || gonderiliyor) return
    titret(25)
    setGonderiliyor(true)
    try {
      // Fiyat gönderilmez: sunucu ürün, varyant ve opsiyon kayıtlarından hesaplar
      const res = await yetkiliPost<any>('/api/garson/siparis', {
        masa_id: aktifMasa.id,
        siparisler: sepet.map((s) => ({
          urun_id: s.urun.id,
          varyant_id: s.varyant_id || undefined,
          opsiyon_idleri: s.opsiyon_idleri,
          miktar: s.miktar,
          notlar: s.notlar || '',
          ikram: s.ikram,
          porsiyon: s.isKg ? 1 : s.porsiyon,
          secilenSatisTuru: s.isKg ? 'kg' : 'porsiyon',
          gramaj: s.isKg ? s.gramaj : undefined,
        })),
      })
      if (!res) return
      titret([30, 50, 30])
      toast('Sipariş mutfağa iletildi ✓')
      setSepet([])
      setSepetAcik(false)
      const masa = { ...aktifMasa, hesap_id: res.hesap_id }
      setAktifMasa(masa)
      setDetay(null)
      setSayfa('masaDetay')
      void masaDetayYukle(masa.id)
    } catch (e: any) {
      titret([50, 50, 50])
      toast(e?.message || 'Sipariş gönderilemedi', true)
    } finally {
      setGonderiliyor(false)
    }
  }

  // ---- Masa detayı işlemleri ----
  const siparisIptal = async (s: any) => {
    titret(20)
    if (!window.confirm(`${s.urun_adi} siparişini iptal etmek istediğinize emin misiniz?`)) return
    const neden = window.prompt('İptal Nedeni (İsteğe Bağlı):')
    if (neden === null) return
    try {
      if (!(await yetkiliPost('/api/garson/siparis-iptal', { siparis_id: s.id, iptal_nedeni: neden }))) return
      toast('Sipariş kalemi iptal edildi ✓')
      if (aktifMasa) void masaDetayYukle(aktifMasa.id)
    } catch (e: any) {
      toast(e?.message || 'İptal işlemi başarısız', true)
    }
  }

  const ikramDegistir = async (s: any) => {
    titret(15)
    try {
      if (!(await yetkiliPost('/api/garson/siparis-ikram', { siparis_id: s.id, ikram: !s.ikram }))) return
      toast('İkram durumu güncellendi ✓')
      if (aktifMasa) void masaDetayYukle(aktifMasa.id)
    } catch (e: any) {
      toast(e?.message || 'İşlem başarısız', true)
    }
  }

  // ---- Görünümler ----
  const baslik = sayfa !== 'masalar' && aktifMasa
    ? 'Masa ' + aktifMasa.numara
    : sadeceAcik ? 'Açık Masalar' : seciliBolum || 'Bölümler'

  const bolumler = useMemo(() => {
    const harita: Record<string, any[]> = {}
    for (const m of masalar) {
      if (sadeceAcik && m.durum !== 'dolu') continue
      ;(harita[m.bolum_adi] ||= []).push(m)
    }
    return harita
  }, [masalar, sadeceAcik])

  const masaKarti = (m: any) => {
    const dolu = m.durum === 'dolu'
    return (
      <div key={m.id} className={'masa-card ' + (dolu ? 'dolu' : 'bos')} onClick={() => masaSec(m)}>
        <div className="masa-num">{m.numara}</div>
        {dolu && m.toplam_tutar ? <div className="masa-bottom"><span className="masa-price">{tl0(m.toplam_tutar)}</span></div> : null}
      </div>
    )
  }

  const masalarSayfasi = () => {
    if (!seciliBolum && !sadeceAcik) {
      const anahtarlar = Object.keys(bolumler)
      if (!anahtarlar.length) return <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Gösterilecek masa bulunamadı.</div>
      return (
        <>
          <div className="section-header"><div className="section-tag">Restoran Alanları</div><div className="section-count">{anahtarlar.length} Bölüm</div></div>
          <div className="bolum-grid">
            {anahtarlar.map((b) => {
              const liste = bolumler[b]
              const dolu = liste.filter((m) => m.durum === 'dolu').length
              return (
                <div key={b} className="bolum-card" onClick={() => { titret(12); setSeciliBolum(b) }}>
                  <div>
                    <div className="bolum-name">{b}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Toplam {liste.length} Masa</div>
                  </div>
                  <div className="bolum-meta">
                    <span style={{ color: 'var(--text-muted)' }}>{liste.length - dolu} boş</span>
                    <span style={{ color: dolu > 0 ? 'var(--pos-cyan)' : 'var(--text-muted)' }}>{dolu} dolu</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )
    }
    const gruplar = Object.entries(bolumler).filter(([b]) => sadeceAcik || b === seciliBolum)
    return (
      <>
        {!sadeceAcik ? (
          <div className="masa-toolbar">
            <button className="btn-back-square" onClick={() => { titret(12); setSeciliBolum(null) }}><I.Geri /></button>
            <div style={{ fontWeight: 800, fontSize: 17, flex: 1 }}>{seciliBolum} Masaları</div>
          </div>
        ) : null}
        {gruplar.length ? gruplar.map(([b, liste]) => (
          <React.Fragment key={b}>
            {sadeceAcik ? <div className="section-header"><div className="section-tag">{b}</div><div className="section-count">{liste.length} Masa</div></div> : null}
            <div className="masa-grid">{liste.map(masaKarti)}</div>
          </React.Fragment>
        )) : <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Gösterilecek masa bulunamadı.</div>}
      </>
    )
  }

  const masaDetaySayfasi = () => {
    if (!detay) return <div className="center-spinner-box"><div className="pos-spinner" /></div>
    const { hesap, siparisler } = detay
    return (
      <>
        <div className="masa-toolbar">
          <button className="btn-back-square" onClick={masalaraGeri}><I.Geri /></button>
          <div style={{ fontWeight: 800, fontSize: 17, flex: 1 }}>Hesap Detayı</div>
        </div>
        <div className="detay-summary-card">
          <div className="detay-summary-row" style={{ marginBottom: 8 }}>
            <span className="detay-summary-title">Hesap No</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', background: 'var(--bg-base)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>#{hesap.hesap_no}</span>
          </div>
          <div className="detay-summary-row">
            <span className="detay-summary-title">Masa Toplamı</span>
            <span className="detay-summary-total">{tl0(hesap.toplam_tutar)}</span>
          </div>
        </div>
        <button className="btn-new-order-add" onClick={siparisEkleyeGec}><I.Arti /> Masaya Yeni Sipariş Ekle</button>
        {siparisler?.length ? (
          <>
            <div className="section-header"><div className="section-tag">Açık Siparişler</div><div className="section-count">{siparisler.length} Kalem</div></div>
            <div className="siparis-items-list">
              {siparisler.map((s: any) => {
                const iptal = s.durum === 'iptal'
                const durumSinifi = s.durum === 'bekliyor' ? 'status-bekliyor' : s.durum === 'hazir' ? 'status-hazir' : 'status-diger'
                return (
                  <div key={s.id} className={'siparis-item-row ' + (iptal ? 'iptal' : '')}>
                    <div className="siparis-left-info">
                      <div className="siparis-item-title">
                        <span className="siparis-item-qty">{s.miktar} {s.urun_birim || 'Adet'}</span> {porsiyonYazisi(s.porsiyon)}{s.urun_adi}
                        {s.ikram ? <span style={{ color: 'var(--pos-cyan)', fontSize: 11, marginLeft: 6 }}>ikram</span> : null}
                      </div>
                      {s.notlar ? <div className="siparis-item-note"><I.Bilgi /> {s.notlar}</div> : null}
                      {!iptal ? (
                        <div className="siparis-actions-inline">
                          <button className={'btn-table-action ' + (s.ikram ? 'ikram-on' : '')} onClick={() => ikramDegistir(s)}>
                            <I.Hediye /> {s.ikram ? 'İkramı Kaldır' : 'İkram'}
                          </button>
                          <button className="btn-table-action cancel-btn" onClick={() => siparisIptal(s)}><I.Carpi /> İptal</button>
                        </div>
                      ) : null}
                    </div>
                    <div className="siparis-right-info">
                      <div className="siparis-price-text" style={s.ikram ? { textDecoration: 'line-through', color: 'var(--text-muted)' } : undefined}>₺{s.toplam_fiyat}</div>
                      <div className={'siparis-status-badge ' + durumSinifi}>{s.durum}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Bu masada henüz sipariş bulunmuyor.</div>}
      </>
    )
  }

  const siparisSayfasi = () => {
    if (!menu.kategoriler.length || !aktifMasa) return null
    const q = arama.trim().toLowerCase()
    const urunler = q ? menu.urunler.filter((u) => String(u.ad || '').toLowerCase().includes(q)) : menu.urunler.filter((u) => u.kategori_id === aktifKategori)
    return (
      <>
        <div className="masa-toolbar">
          <button className="btn-back-square" onClick={() => (aktifMasa.hesap_id ? setSayfa('masaDetay') : masalaraGeri())}><I.Geri /></button>
          <div style={{ fontWeight: 800, fontSize: 17, flex: 1 }}>Sipariş Al (Masa {aktifMasa.numara})</div>
        </div>
        <div className="search-filter-bar">
          <span className="search-icon-pos"><I.Ara /></span>
          <input className="search-input" placeholder="Menüde ürün ara..." value={arama} onChange={(e) => setArama(e.target.value)} />
        </div>
        {!q ? (
          <div className="kategori-pills-container">
            {menu.kategoriler.map((k) => (
              <button key={k.id} className={'kategori-pill ' + (k.id === aktifKategori ? 'active' : '')} onClick={() => { titret(10); setAktifKategori(k.id) }}>{k.ad}</button>
            ))}
          </div>
        ) : null}
        <div className="porsiyon-control">
          {PORSIYONLAR.map((p) => (
            <button key={p} className={'porsiyon-btn ' + (aktifPorsiyon === p ? 'active' : '')} onClick={() => { titret(10); setAktifPorsiyon(p) }}>
              {p === 0.5 ? '0.5 (Yarım)' : p === 1 ? '1 Porsiyon' : p === 1.5 ? '1.5 Porsiyon' : '2 (Double)'}
            </button>
          ))}
        </div>
        {urunler.length ? (
          <div className="urun-catalog-grid">
            {urunler.map((u) => {
              const { opsiyonlar, varyantlar } = ekstralar(u.id)
              return <UrunKarti key={u.id} urun={u} ekstraVar={Boolean(opsiyonlar.length || varyantlar.length)} coklu={cokluSatisTuruMu(u)} porsiyon={aktifPorsiyon} onSec={() => urunSec(u)} />
            })}
          </div>
        ) : <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontWeight: 600 }}>Eşleşen ürün bulunamadı.</div>}
      </>
    )
  }

  const [sepetArka, sepetPanel] = useAltPanel(sepetAcik)
  const gramajDeger = parseFloat(girilenGramaj.replace(',', '.')) || 0
  const gramajKiloFiyati = gramajUrun ? getUrunKiloFiyati(gramajUrun) : 0

  return (
    <>
      <div id="appScreen" className="app-container active">
        <header className="app-header">
          <div className="header-left">
            <div className="live-indicator" title="Canlı Bağlantı Aktif" />
            <div className="header-titles">
              <div className="header-main-title">{baslik}</div>
              <div className="header-staff-name">{`${kullanici?.ad || ''} ${kullanici?.soyad || ''}`.trim() || 'Garson'}</div>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-header-action" onClick={cikisYap}><I.Cikis /> Çıkış</button>
          </div>
        </header>

        <main className={'app-page' + (sayfa === 'masalar' ? ' active' : '')}>{sayfa === 'masalar' ? masalarSayfasi() : null}</main>
        <main className={'app-page' + (sayfa === 'masaDetay' ? ' active' : '')}>{sayfa === 'masaDetay' ? masaDetaySayfasi() : null}</main>
        <main className={'app-page' + (sayfa === 'siparis' ? ' active' : '')}>{sayfa === 'siparis' ? siparisSayfasi() : null}</main>

        <nav className="app-bottom-nav">
          <div className={'bottom-nav-btn' + (sayfa === 'masalar' && !sadeceAcik ? ' active' : '')} onClick={() => altMenu(false)}><I.Izgara /><span>Tüm Masalar</span></div>
          <div className={'bottom-nav-btn' + (sayfa === 'masalar' && sadeceAcik ? ' active' : '')} onClick={() => altMenu(true)}><I.Saat /><span>Açık Masalar</span></div>
        </nav>
      </div>

      <div ref={sepetCubugu} className={'sepet-floating-bar' + (sepetAdet > 0 ? '' : ' hidden')} onClick={() => { titret(15); setSepetAcik(true) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="sepet-count-pill">{sepetAdet}</div>
          <div>
            <div className="sepet-floating-label">Sepet</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Mutfağa göndermek için dokunun</div>
          </div>
        </div>
        <div className="sepet-floating-total">{tl0(sepetTutar)}</div>
      </div>

      <div className={'modal-backdrop' + (sepetArka ? ' active' : '')} onClick={() => { titret(12); setSepetAcik(false) }} />
      <div className={'modal-sheet' + (sepetPanel ? ' active' : '')}>
        <div className="modal-sheet-header">
          <div className="modal-sheet-title"><I.Sepet /> Gönderilecekler</div>
          <button className="btn-modal-close" onClick={() => setSepetAcik(false)}><I.Kapat /></button>
        </div>
        <div className="modal-sheet-body">
          {sepet.length ? sepet.map((s) => {
            const { birimFiyat, toplamFiyat } = kalemTutari(s)
            return (
              <div key={s.id} className="sepet-cart-item">
                <div className="sepet-item-head">
                  <div className="sepet-item-name">
                    {s.isKg
                      ? <span style={{ color: 'var(--text-secondary)', fontSize: 12, marginRight: 6 }}>{s.gramaj || 1} kg</span>
                      : porsiyonYazisi(s.porsiyon) ? <span style={{ color: 'var(--text-secondary)', fontSize: 12, marginRight: 6 }}>{porsiyonYazisi(s.porsiyon)}</span> : null}
                    {s.ad}
                    {s.ikram ? <span style={{ color: 'var(--pos-cyan)', fontSize: 11, marginLeft: 6 }}>ikram</span> : null}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="sepet-item-price">
                      {s.ikram ? <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)' }}>₺{toplamFiyat.toFixed(0)}</span> : tl0(toplamFiyat)}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>
                      {s.miktar} {s.isKg ? 'Adet' : s.birim} × {tl0(birimFiyat)}
                    </div>
                  </div>
                </div>
                <div className="sepet-item-controls">
                  <div className="sepet-stepper">
                    <button className="btn-stepper" onClick={() => miktarDegistir(s.id, -1)}>−</button>
                    <span className="stepper-val" onClick={() => miktarSor(s)}>{s.miktar}</span>
                    <button className="btn-stepper" onClick={() => miktarDegistir(s.id, 1)}>+</button>
                  </div>
                  <input
                    className="sepet-item-note-input"
                    placeholder="Not (Örn: Az tuzlu)"
                    defaultValue={s.notlar}
                    key={s.id + ':' + s.notlar}
                    onBlur={(e) => notGuncelle(s.id, e.target.value)}
                  />
                  <button className={'btn-cart-ikram ' + (s.ikram ? 'active' : '')} onClick={() => { titret(15); kalemAyirVeDegistir(s.id, { ikram: !s.ikram }) }}>
                    <I.Hediye /> İkram
                  </button>
                </div>
                <div className="quick-notes-bar">
                  {HAZIR_NOTLAR.map((n) => (
                    <button key={n} className="quick-note-chip" onClick={() => { titret(10); notGuncelle(s.id, s.notlar ? `${s.notlar}, ${n}` : n) }}>{n}</button>
                  ))}
                </div>
              </div>
            )
          }) : <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40, fontWeight: 600 }}>Sepetiniz henüz boş</div>}
        </div>
        <div className="modal-sheet-footer">
          <button className="btn-kitchen-send" disabled={gonderiliyor} onClick={siparisGonder}>
            {gonderiliyor
              ? <><div className="pos-spinner" style={{ width: 20, height: 20, borderWidth: 2, borderTopColor: 'var(--text-dark)' }} /> Gönderiliyor...</>
              : <><I.Gonder /> Mutfağa Gönder</>}
          </button>
        </div>
      </div>

      <AltPanel
        acik={Boolean(satisTuruUrun)}
        onKapat={() => setSatisTuruUrun(null)}
        baslik={satisTuruUrun?.ad || 'Satış Türü'}
        govde={satisTuruUrun ? (
          <div className="satis-turu-grid">
            <button className="satis-turu-btn porsiyon" onClick={() => {
              titret(15)
              const u = satisTuruUrun
              setSatisTuruUrun(null)
              const { opsiyonlar, varyantlar } = ekstralar(u.id)
              if (opsiyonlar.length || varyantlar.length) seciciAc(u, 'porsiyon')
              else sepeteEkle(u, { isKg: false }, true)
            }}>
              <div className="satis-turu-btn-left">
                <div className="satis-turu-icon-wrap">🍽️</div>
                <div>
                  <div className="satis-turu-name">Porsiyon</div>
                  <div className="satis-turu-desc">{aktifPorsiyon !== 1 ? `${aktifPorsiyon}x Porsiyon` : '1x Porsiyon'}</div>
                </div>
              </div>
              <div className="satis-turu-price">{tl0(getUrunPorsiyonFiyati(satisTuruUrun) * aktifPorsiyon)}</div>
            </button>
            <button className="satis-turu-btn kg" onClick={() => { titret(15); const u = satisTuruUrun; setSatisTuruUrun(null); gramajAc(u) }}>
              <div className="satis-turu-btn-left">
                <div className="satis-turu-icon-wrap">⚖️</div>
                <div>
                  <div className="satis-turu-name">Kilogram (KG)</div>
                  <div className="satis-turu-desc">Tartılı satış (Gramaj)</div>
                </div>
              </div>
              <div className="satis-turu-price">{tl0(getUrunKiloFiyati(satisTuruUrun))} / KG</div>
            </button>
          </div>
        ) : null}
      />

      <AltPanel
        acik={Boolean(gramajUrun)}
        onKapat={() => setGramajUrun(null)}
        baslik={gramajUrun?.ad || 'Gramaj Belirle'}
        altBaslik={<div style={{ fontSize: 12, color: 'var(--pos-green)', fontWeight: 700, marginTop: 2 }}>1 KG = ₺{gramajKiloFiyati.toLocaleString('tr-TR')}</div>}
        govde={
          <>
            <div className="gramaj-display-box">
              <div>
                <span className="gramaj-val-text">{girilenGramaj || '0'}</span>
                <span className="gramaj-unit-tag">KG</span>
              </div>
              <div className="gramaj-calc-preview">
                {gramajDeger > 0
                  ? <><span style={{ color: 'var(--text-secondary)' }}>{gramajDeger} KG × ₺{gramajKiloFiyati.toLocaleString('tr-TR')} = </span><span style={{ color: 'var(--pos-green)', fontWeight: 800, fontSize: 15 }}> {tl0(gramajKiloFiyati * gramajDeger)}</span></>
                  : <span style={{ color: 'var(--text-muted)' }}>Gramaj giriniz</span>}
              </div>
            </div>
            <div className="gramaj-preset-grid">
              {GRAMAJ_HAZIR.map(([deger, etiket]) => <button key={deger} className="gramaj-preset-btn" onClick={() => { titret(10); setGirilenGramaj(deger) }}>{etiket}</button>)}
            </div>
            <div className="gramaj-numpad">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', ','].map((t) => (
                <button key={t} onClick={() => gramajTus(t)} style={t === 'C' ? { color: 'var(--pos-red)' } : undefined}>{t}</button>
              ))}
            </div>
          </>
        }
        alt={<button className="btn-picker-confirm" onClick={gramajOnayla}>{gramajDeger > 0 ? `Sepete Ekle (${tl0(gramajKiloFiyati * gramajDeger)})` : 'Sepete Ekle'}</button>}
      />

      <AltPanel
        acik={Boolean(secici)}
        onKapat={() => setSecici(null)}
        baslik={secici ? secici.urun.ad + (secici.satisTuru === 'kg' && secici.gramaj ? ` (${secici.gramaj} KG)` : '') : 'Seçenekler'}
        govde={secici ? (() => {
          const { opsiyonlar, varyantlar } = ekstralar(secici.urun.id)
          return (
            <>
              {varyantlar.length ? (
                <>
                  <div className="picker-section-label">Varyant Seçimi</div>
                  <div className="picker-option-grid">
                    {varyantlar.map((v) => {
                      const fark = Number(v.fiyat_farki || 0)
                      return (
                        <button key={v.id} className={'picker-option-btn' + (secim.varyant?.id === v.id ? ' selected' : '')} onClick={() => { titret(10); setSecim((s) => ({ ...s, varyant: v })) }}>
                          {v.ad}{fark ? <span className="picker-option-price"> {fark > 0 ? '+' : '-'}₺{Math.abs(fark).toFixed(0)}</span> : null}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : null}
              {opsiyonlar.length ? (
                <>
                  <div className="picker-section-label">Opsiyonlar{opsiyonlar.length > 1 ? ' (birden fazla seçilebilir)' : ''}</div>
                  <div className="picker-option-grid">
                    {opsiyonlar.map((o) => {
                      const secili = secim.opsiyonlar.some((x) => x.id === o.id)
                      return (
                        <button key={o.id} className={'picker-option-btn' + (secili ? ' selected' : '')} onClick={() => {
                          titret(10)
                          setSecim((s) => ({ ...s, opsiyonlar: secili ? s.opsiyonlar.filter((x) => x.id !== o.id) : [...s.opsiyonlar, o] }))
                        }}>
                          {o.ad}{Number(o.fiyat) > 0 ? <span className="picker-option-price"> +₺{Number(o.fiyat).toFixed(0)}</span> : null}
                        </button>
                      )
                    })}
                  </div>
                </>
              ) : null}
            </>
          )
        })() : null}
        alt={
          <>
            <button className="btn-picker-confirm" onClick={() => seciciOnayla(false)}>Sepete Ekle</button>
            <button className="btn-picker-skip" onClick={() => seciciOnayla(true)}>Seçim Yapmadan Ekle</button>
          </>
        }
      />
    </>
  )
}

// ===== Kök =====

export default function App() {
  const [token, setToken] = useState<string | null>(null)
  const [kullanici, setKullanici] = useState<any>(null)
  const [toastDurum, setToastDurum] = useState<{ mesaj: string; hata: boolean; gorunur: boolean }>({ mesaj: '', hata: false, gorunur: false })
  const [onayIstegi, setOnayIstegi] = useState<{ mesaj: string; coz: (pin: string | null) => void } | null>(null)
  const toastZamani = useRef<number>()

  const toast = useCallback((mesaj: string, hata = false) => {
    setToastDurum({ mesaj, hata, gorunur: true })
    window.clearTimeout(toastZamani.current)
    toastZamani.current = window.setTimeout(() => setToastDurum((t) => ({ ...t, gorunur: false })), 2600)
  }, [])

  const cikisYap = useCallback(() => {
    titret(20)
    setToken(null)
    setKullanici(null)
  }, [])

  const api = useCallback(<T,>(yol: string, govde?: unknown) => istek<T>(yol, {
    token,
    govde,
    oturumKapandi: () => {
      cikisYap()
      toast('Oturum süresi doldu, tekrar giriş yapın', true)
    },
  }), [token, cikisYap, toast])

  /** Yetki gerekirse yönetici PIN'i ister ve isteği PIN ile tekrarlar; vazgeçilirse null döner */
  const yetkiliPost = useCallback(async <T,>(yol: string, govde: Record<string, unknown>): Promise<T | null> => {
    let ekGovde = govde
    for (;;) {
      try {
        return await api<T>(yol, ekGovde)
      } catch (e) {
        if (!(e instanceof ApiHatasi) || e.durum !== 403 || !e.veri?.yetkiGerekli) throw e
        const pin = await new Promise<string | null>((coz) => setOnayIstegi({ mesaj: e.message, coz }))
        setOnayIstegi(null)
        if (!pin) return null
        ekGovde = { ...govde, yonetici_pin: pin }
      }
    }
  }, [api])

  return (
    <>
      {token ? (
        <Terminal token={token} kullanici={kullanici} cikisYap={cikisYap} api={api} yetkiliPost={yetkiliPost} toast={toast} />
      ) : (
        <Giris onGiris={(t, p) => { setToken(t); setKullanici(p) }} />
      )}
      <YoneticiOnayi istek={onayIstegi} />
      <div className={'pos-toast' + (toastDurum.gorunur ? ' show ' + (toastDurum.hata ? 'error' : 'success') : '')}>
        {toastDurum.hata ? <I.Hata /> : <I.Basarili />}
        <span>{toastDurum.mesaj}</span>
      </div>
    </>
  )
}
