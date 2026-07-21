// =====================================================
// Doğrulama Fonksiyonları
// Form ve giriş validasyonları
// =====================================================

/**
 * Şifre gücünü kontrol eder (En az 6 karakter)
 */
export function gecerliSifreMi(sifre: string): boolean {
  return typeof sifre === 'string' && sifre.length >= 6
}

/**
 * PIN kodunun geçerliliğini kontrol eder (4 haneli rakam)
 */
export function gecerliPinMi(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}

/**
 * Miktar girişinin geçerliliğini kontrol eder (Sıfırdan büyük sayı)
 */
export function gecerliMiktarMi(miktar: string | number): boolean {
  const sayi = typeof miktar === 'string' ? parseFloat(miktar) : miktar
  return !isNaN(sayi) && sayi > 0
}

/**
 * Tutar girişinin geçerliliğini kontrol eder (Sıfır veya daha büyük)
 */
export function gecerliTutarMi(tutar: string | number): boolean {
  const sayi = typeof tutar === 'string' ? parseFloat(tutar) : tutar
  return !isNaN(sayi) && sayi >= 0
}

/**
 * Telefon numarasının formatını kontrol eder (TR formatı)
 */
export function gecerliTelefonMu(telefon: string): boolean {
  const temiz = telefon.replace(/\D/g, '')
  // TR numaraları alan koduyla birlikte 10 veya 0 ile başlayıp 11 haneli olur
  return temiz.length === 10 || (temiz.length === 11 && temiz.startsWith('0'))
}
