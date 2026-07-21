// =====================================================
// Yardımcı Fonksiyonlar — Formatlayıcılar
// Tarih, para, telefon formatlama işlemleri
// =====================================================

import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'

/**
 * Tutarı Türk Lirası formatında biçimlendirir (Örn: 1.250,50 ₺)
 */
export function formatPara(tutar: number | undefined | null): string {
  if (tutar === undefined || tutar === null) return '0,00 ₺'
  
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(tutar)
}

/**
 * ISO tarih stringini okunabilir formata dönüştürür
 * @param formatStr date-fns format stringi (Varsayılan: dd.MM.yyyy HH:mm)
 */
export function formatTarih(isoTarih: string | undefined | null, formatStr: string = 'dd.MM.yyyy HH:mm'): string {
  if (!isoTarih) return '-'
  try {
    const tarih = parseISO(isoTarih)
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
 */
export function gecenDakikaHesapla(baslangicIso: string | undefined | null): number {
  if (!baslangicIso) return 0
  
  try {
    const baslangic = parseISO(baslangicIso).getTime()
    const simdi = new Date().getTime()
    return Math.floor((simdi - baslangic) / 60000)
  } catch (error) {
    return 0
  }
}
