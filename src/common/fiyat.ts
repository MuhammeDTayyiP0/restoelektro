// =====================================================
// Ortak Fiyat & Para Hesapları
// Masaüstü sepet, garson API ve ana işlem aynı formülü kullanır
// =====================================================

/** Kuruş altı farkları yok saymak için tolerans (yarım kuruş) */
export const PARA_TOLERANS = 0.005

/** Tutarı 2 ondalığa yuvarlar (kayan nokta artıklarını temizler) */
export function paraYuvarla(tutar: number): number {
  const n = Number(tutar)
  if (!Number.isFinite(n)) return 0
  return Math.round((n + Number.EPSILON) * 100) / 100
}

export interface SatisTuru {
  birim: string
  fiyat: number
}

/**
 * Ürünün satış türleri dizisini döndürür
 */
export function getUrunSatisTurleri(urun: any): SatisTuru[] {
  if (!urun) return []
  let turler: SatisTuru[] = []

  if (typeof urun.satis_turleri === 'string') {
    try {
      turler = JSON.parse(urun.satis_turleri)
    } catch {
      turler = []
    }
  } else if (Array.isArray(urun.satis_turleri)) {
    turler = urun.satis_turleri
  }

  // Geriye dönük uyumluluk
  if ((!turler || turler.length === 0) && (urun.porsiyon_fiyati || urun.kilo_fiyati)) {
    turler = []
    if (urun.porsiyon_fiyati) turler.push({ birim: 'porsiyon', fiyat: Number(urun.porsiyon_fiyati) })
    if (urun.kilo_fiyati) turler.push({ birim: 'kg', fiyat: Number(urun.kilo_fiyati) })
  }

  if (!turler || turler.length === 0) {
    const birim = (urun.birim || 'porsiyon').toLowerCase()
    turler = [{ birim: birim === 'kg' ? 'kg' : (birim === 'adet' ? 'adet' : 'porsiyon'), fiyat: Number(urun.fiyat) || 0 }]
  }

  return turler.filter(t => t && t.fiyat !== undefined && t.fiyat !== null)
}

/**
 * Ürünün Kilo / KG birim fiyatını döndürür
 */
export function getUrunKiloFiyati(urun: any): number {
  if (!urun) return 0
  if (urun.kilo_fiyati) return Number(urun.kilo_fiyati)
  const turler = getUrunSatisTurleri(urun)
  const kgTur = turler.find(t => {
    const b = (t.birim || '').trim().toLowerCase()
    return b === 'kg' || b === 'kilo'
  })
  if (kgTur) return Number(kgTur.fiyat)
  return Number(urun.fiyat) || 0
}

/**
 * Ürünün Porsiyon / Adet birim fiyatını döndürür
 */
export function getUrunPorsiyonFiyati(urun: any): number {
  if (!urun) return 0
  if (urun.porsiyon_fiyati) return Number(urun.porsiyon_fiyati)
  const turler = getUrunSatisTurleri(urun)
  const porsTur = turler.find(t => {
    const b = (t.birim || '').trim().toLowerCase()
    return b === 'porsiyon' || b === 'adet' || b === 'pors'
  })
  if (porsTur) return Number(porsTur.fiyat)
  return Number(urun.fiyat) || 0
}

export interface KalemFiyatGirdisi {
  /** 'kg' ise kilo fiyatı × gramaj, değilse porsiyon fiyatı × porsiyon */
  isKg: boolean
  miktar: number
  porsiyon?: number
  gramaj?: number
  /** Varyant fiyat farkı + seçili opsiyon fiyatları toplamı */
  ekFiyat?: number
}

/**
 * Sepet kalemi için birim fiyat ve toplam tutarı hesaplar:
 * kg  → (kilo_fiyati + ek) × gramaj × adet
 * diğer → (porsiyon_fiyati + ek) × porsiyon × adet
 */
export function kalemFiyatiHesapla(urun: any, girdi: KalemFiyatGirdisi): { birimFiyat: number; toplamFiyat: number } {
  const ek = Number(girdi.ekFiyat) || 0
  const miktar = Number(girdi.miktar) || 1
  const carpan = girdi.isKg
    ? (girdi.gramaj && girdi.gramaj > 0 ? girdi.gramaj : 1)
    : (girdi.porsiyon || 1)
  const taban = girdi.isKg ? getUrunKiloFiyati(urun) : getUrunPorsiyonFiyati(urun)
  const birimFiyat = (taban + ek) * carpan
  return { birimFiyat: paraYuvarla(birimFiyat), toplamFiyat: paraYuvarla(birimFiyat * miktar) }
}

/**
 * Hesaba uygulanacak indirim tutarını hesaplar.
 * Yüzde indirim her toplam değişiminde yeniden hesaplanır; tutar indirim toplamı aşamaz.
 */
export function indirimTutariHesapla(toplam: number, tip: string | null | undefined, deger: number | null | undefined): number {
  const d = Number(deger) || 0
  if (d <= 0 || toplam <= 0) return 0
  const tutar = tip === 'yuzde' ? toplam * (Math.min(d, 100) / 100) : d
  return paraYuvarla(Math.min(tutar, toplam))
}

/**
 * Bir ödemenin hesaba yazılacak kısmını ve para üstünü ayırır.
 * Müşterinin verdiği fazla nakit ciroya/kasaya yazılmaz.
 */
export function odemeyiAyir(alinan: number, kalan: number): { tutar: number; paraUstu: number } {
  const a = paraYuvarla(alinan)
  const k = paraYuvarla(Math.max(0, kalan))
  const tutar = Math.min(a, k)
  return { tutar, paraUstu: paraYuvarla(a - tutar) }
}
