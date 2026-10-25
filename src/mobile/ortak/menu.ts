// Menü / satış türü yardımcıları — fiyat formülü masaüstü ve sunucuyla ortak (common/fiyat)
import { getUrunSatisTurleri, getUrunKiloFiyati, getUrunPorsiyonFiyati } from '../../common/fiyat'

export { getUrunKiloFiyati, getUrunPorsiyonFiyati, kalemFiyatiHesapla } from '../../common/fiyat'

/** Hem porsiyon hem kg gibi birden fazla satış türü var mı? */
export function cokluSatisTuruMu(urun: any): boolean {
  if (!urun) return false
  if (getUrunSatisTurleri(urun).length > 1) return true
  return Boolean(urun.kilo_fiyati && urun.fiyat && Number(urun.kilo_fiyati) !== Number(urun.fiyat))
}

/** Tek satış türü tartılı (kg, gram, litre) mı? */
export function tartiliMi(urun: any): boolean {
  return ['KG', 'GRAM', 'GR', 'LITRE', 'LT', 'L'].includes(String(urun?.birim || '').toUpperCase())
}

function birimAdi(b: string): string {
  const s = (b || '').trim().toLowerCase()
  if (s === 'kg' || s === 'kilo') return 'KG'
  if (s === 'porsiyon') return 'Porsiyon'
  if (s === 'adet') return 'Adet'
  if (s === 'gram' || s === 'gr') return 'Gram'
  return b ? b.charAt(0).toUpperCase() + b.slice(1) : 'Porsiyon'
}

/** "Porsiyon: 350 ₺ | KG: 1400 ₺" — porsiyon fiyatı seçili porsiyon çarpanıyla */
export function satisTurleriYazisi(urun: any, porsiyonCarpan = 1): string {
  if (!urun) return '0 ₺'
  return getUrunSatisTurleri(urun)
    .map((t) => {
      const porsiyonMu = (t.birim || '').toLowerCase() === 'porsiyon'
      return `${birimAdi(t.birim)}: ${Math.round((Number(t.fiyat) || 0) * (porsiyonMu ? porsiyonCarpan : 1))} ₺`
    })
    .join(' | ')
}

export const tl0 = (n: number) => '₺' + Number(n || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
