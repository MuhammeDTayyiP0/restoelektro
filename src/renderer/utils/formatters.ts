// =====================================================
// Yardımcı Fonksiyonlar — Formatlayıcılar
// Tarih, para, telefon ve miktar formatlama işlemleri
// =====================================================

import { format } from 'date-fns'
import { tr } from 'date-fns/locale'
import { getUrunSatisTurleri, getUrunKiloFiyati, getUrunPorsiyonFiyati, kalemFiyatiHesapla } from '../../common/fiyat'

export { getUrunSatisTurleri, getUrunKiloFiyati, getUrunPorsiyonFiyati }

/**
 * SQLite DATETIME / CURRENT_TIMESTAMP değerini doğru Date'e çevirir.
 * SQLite CURRENT_TIMESTAMP UTC tutar ve 'YYYY-MM-DD HH:MM:SS' (offset yok) döner.
 * Chromium bunu yerel saat sanır → Türkiye'de süre +3 saat görünür.
 */
export function parseSqliteZamani(isoTarih: string | undefined | null): Date | null {
  if (!isoTarih) return null
  const ham = String(isoTarih).trim()
  if (!ham) return null
  try {
    if (/[zZ]$/.test(ham) || /[+-]\d{2}:?\d{2}$/.test(ham)) {
      const d = new Date(ham)
      return Number.isNaN(d.getTime()) ? null : d
    }
    const iso = ham.includes('T') ? ham : ham.replace(' ', 'T')
    const d = new Date(`${iso}Z`)
    return Number.isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

/**
 * Tutarı Türk Lirası formatında biçimlendirir (Örn: 1.250,50 ₺)
 */
export function formatPara(tutar: number | undefined | null): string {
  if (tutar === undefined || tutar === null || isNaN(tutar)) return '0,00 ₺'
  
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(tutar)
}

const TARTILI_BIRIMLER = ['kg', 'kilo', 'gram', 'gr', 'litre', 'lt', 'l']

export function isTartiliBirim(birim?: string | null): boolean {
  const b = (birim || '').trim().toLowerCase()
  if (TARTILI_BIRIMLER.indexOf(b) !== -1) return true
  return b.indexOf('kg') !== -1 || b.indexOf('kilo') !== -1 || b.indexOf('gramaj') !== -1
}

/** Ürünün tek satış türü tartılı/kg ise true (porsiyon varsayılmaz) */
export function urunTartiliMi(urun: any): boolean {
  if (!urun) return false
  if (isTartiliBirim(urun.birim)) return true
  const turler = getUrunSatisTurleri(urun)
  if (!turler.length) return false
  const kgVar = turler.some(t => isTartiliBirim(t.birim))
  const porsiyonVar = turler.some(t => !isTartiliBirim(t.birim))
  return kgVar && !porsiyonVar
}

/**
 * Ürünün birden fazla satış türü (örn hem porsiyon hem kg) olup olmadığını kontrol eder
 */
export function hasCokluSatisTuru(urun: any): boolean {
  if (!urun) return false
  const turler = getUrunSatisTurleri(urun)
  if (turler.length > 1) return true
  // Eğer satis_turleri 1 elemanlıysa ama ürün porsiyon + kilo_fiyati tanımlıysa
  if (urun.kilo_fiyati && urun.fiyat && urun.kilo_fiyati !== urun.fiyat) return true
  return false
}

/**
 * Sepet Kalemi için birim fiyat ve toplam tutarı kurallara göre hesaplar.
 * Formül ana işlemle ortaktır (common/fiyat) — sunucu aynı tutarı yeniden hesaplar.
 */
export function hesaplaKalemTutari(kalem: any): { birimHesapliFiyat: number; toplamKalemFiyat: number; kiloFiyati: number; isKg: boolean } {
  if (!kalem || !kalem.urun) {
    return { birimHesapliFiyat: 0, toplamKalemFiyat: 0, kiloFiyati: 0, isKg: false }
  }

  const satisTuru = (kalem.secilenSatisTuru || kalem.satisBirim || (kalem.urun.birim?.toLowerCase() === 'kg' ? 'kg' : 'porsiyon')).toLowerCase()
  const isKg = satisTuru === 'kg' || satisTuru === 'kilo'
  const varyantFark = (kalem.varyant?.fiyat_farki ?? kalem.varyant?.ek_fiyat ?? 0)
  const opsiyonlarFark = (kalem.opsiyonlar || []).reduce((t: number, o: any) => t + (o.fiyat ?? o.ek_fiyat ?? 0), 0)

  const { birimFiyat, toplamFiyat } = kalemFiyatiHesapla(kalem.urun, {
    isKg,
    miktar: kalem.miktar || 1,
    porsiyon: kalem.porsiyon || 1,
    gramaj: kalem.gramaj,
    ekFiyat: varyantFark + opsiyonlarFark,
  })
  const kiloFiyati = isKg ? getUrunKiloFiyati(kalem.urun) + varyantFark + opsiyonlarFark : getUrunKiloFiyati(kalem.urun)
  return { birimHesapliFiyat: birimFiyat, toplamKalemFiyat: toplamFiyat, kiloFiyati, isKg }
}

/**
 * Ürünün tanımlı satış türlerini kart üzerinde gösterilecek formatta döndürür.
 * Örn: "Porsiyon: 350 ₺ | KG: 1400 ₺"
 */
export function formatSatisTurleri(urun: any, porsiyonCarpan: number = 1): string {
  if (!urun) return '0 ₺'

  const turler = getUrunSatisTurleri(urun)

  const formatBirim = (b: string) => {
    const s = (b || '').trim().toLowerCase()
    if (s === 'kg' || s === 'kilo') return 'KG'
    if (s === 'porsiyon') return 'Porsiyon'
    if (s === 'adet') return 'Adet'
    if (s === 'gram' || s === 'gr') return 'Gram'
    return b ? b.charAt(0).toUpperCase() + b.slice(1) : 'Porsiyon'
  }

  if (!turler || turler.length === 0) {
    const birim = formatBirim(urun.birim || 'Porsiyon')
    const fiyat = Math.round((Number(urun.fiyat) || 0) * porsiyonCarpan)
    return `${birim}: ${fiyat} ₺`
  }

  return turler
    .map(t => {
      const isPors = (t.birim || '').toLowerCase() === 'porsiyon'
      const fiyat = Math.round((Number(t.fiyat) || 0) * (isPors ? porsiyonCarpan : 1))
      return `${formatBirim(t.birim)}: ${fiyat} ₺`
    })
    .join(' | ')
}

/**
 * Stok ve hammadde miktarını virgülden sonra gereksiz sıfır ve hassasiyet taşmalarını engelleyerek biçimlendirir
 * Örn: 3.4000004 => '3,4', 5 => '5', 0.150 => '0,15'
 */
export function formatMiktar(miktar: number | undefined | null, ondalik: number = 3): string {
  if (miktar === undefined || miktar === null || isNaN(miktar)) return '0'
  const yuvarlanmis = Number(Number(miktar).toFixed(ondalik))
  return yuvarlanmis.toLocaleString('tr-TR', { maximumFractionDigits: ondalik })
}

/**
 * ISO / SQLite tarih stringini okunabilir formata dönüştürür
 * @param formatStr date-fns format stringi (Varsayılan: dd.MM.yyyy HH:mm)
 */
export function formatTarih(isoTarih: string | undefined | null, formatStr: string = 'dd.MM.yyyy HH:mm'): string {
  if (!isoTarih) return '-'
  try {
    const tarih = parseSqliteZamani(isoTarih)
    if (!tarih) return isoTarih
    return format(tarih, formatStr, { locale: tr })
  } catch (error) {
    return isoTarih
  }
}

/**
 * Sadece saat ve dakikayı döndürür (Örn: 14:30)
 */
export function formatSaat(isoTarih: string | undefined | null): string {
  return formatTarih(isoTarih, 'HH:mm')
}

/**
 * Telefon numarasını biçimlendirir (Örn: 0555 555 55 55)
 */
export function formatTelefon(telefon: string | undefined | null): string {
  if (!telefon) return ''
  
  // Sadece rakamları al
  const temiz = telefon.replace(/\D/g, '')
  
  if (temiz.length === 10) {
    // Başında 0 yoksa
    return `0${temiz.slice(0, 3)} ${temiz.slice(3, 6)} ${temiz.slice(6, 8)} ${temiz.slice(8, 10)}`
  } else if (temiz.length === 11 && temiz.startsWith('0')) {
    // Başında 0 varsa
    return `${temiz.slice(0, 4)} ${temiz.slice(4, 7)} ${temiz.slice(7, 9)} ${temiz.slice(9, 11)}`
  }
  
  return telefon // Formatlanamıyorsa orijinalini dön
}

/**
 * İki tarih arasındaki farkı dakika olarak hesaplar (Sipariş bekleme süresi için)
 * SQLite UTC kaydını yerel saat gibi okumamak için parseSqliteZamani kullanır.
 */
export function gecenDakikaHesapla(baslangicIso: string | undefined | null, simdiMs?: number): number {
  const baslangic = parseSqliteZamani(baslangicIso)
  if (!baslangic) return 0
  const simdi = simdiMs ?? Date.now()
  return Math.max(0, Math.floor((simdi - baslangic.getTime()) / 60000))
}

/**
 * Ürün veya medya görsel URL'sini formatlar.
 * Relative path (/uploads/products/xyz.jpg) durumunda API sunucu portuyla (3847) tam URL üretir.
 */
export function formatResimUrl(resimYolu: string | null | undefined, apiPort: number = 3847): string {
  if (!resimYolu) return ''
  if (resimYolu.startsWith('http://') || resimYolu.startsWith('https://') || resimYolu.startsWith('data:') || resimYolu.startsWith('blob:')) {
    return resimYolu
  }
  const temizYol = resimYolu.startsWith('/') ? resimYolu : `/${resimYolu}`
  return `http://localhost:${apiPort}${temizYol}`
}
