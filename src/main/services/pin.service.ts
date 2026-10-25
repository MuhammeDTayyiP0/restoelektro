// =====================================================
// Personel PIN'leri — yalnızca HMAC özeti saklanır
// Özet fonksiyonu dışarıdan verilir (uygulamada guvenlik.service.pinOzeti)
// =====================================================

import type Database from 'better-sqlite3'

export type PinOzetFn = (pin: string) => string

/** İlk kurulumda tohumlanan ve herkesin bildiği PIN'ler — kullanılmaya devam edilemez */
export const VARSAYILAN_PINLER = ['0000', '1234', '5678']

export function pinBicimiGecerliMi(pin: unknown): pin is string {
  return typeof pin === 'string' && /^\d{4}$/.test(pin)
}

/** Eski sürümlerden kalan düz PIN'leri özete çevirir; varsayılan PIN'leri değiştirilmeye işaretler */
export function duzPinleriDonustur(db: Database.Database, ozet: PinOzetFn): number {
  const satirlar = db.prepare(
    "SELECT id, pin_kodu FROM personel WHERE pin_kodu IS NOT NULL AND pin_kodu != '' AND pin_hash IS NULL"
  ).all() as Array<{ id: number; pin_kodu: string }>

  const guncelle = db.prepare('UPDATE personel SET pin_hash = ?, pin_degismeli = ?, pin_kodu = NULL WHERE id = ?')
  db.transaction(() => {
    for (const s of satirlar) {
      const pin = String(s.pin_kodu)
      guncelle.run(ozet(pin), VARSAYILAN_PINLER.includes(pin) ? 1 : 0, s.id)
    }
    // Özeti zaten olan satırlarda düz metin kalmasın
    db.prepare("UPDATE personel SET pin_kodu = NULL WHERE pin_hash IS NOT NULL AND pin_kodu IS NOT NULL").run()
  })()
  return satirlar.length
}

export function pinIlePersonelBul(db: Database.Database, pin: string, ozet: PinOzetFn): any | null {
  if (!pinBicimiGecerliMi(pin)) return null
  return db.prepare('SELECT * FROM personel WHERE pin_hash = ? AND aktif = 1').get(ozet(pin)) || null
}

export function personelPiniDogruMu(personel: any, pin: string, ozet: PinOzetFn): boolean {
  return Boolean(personel?.pin_hash) && pinBicimiGecerliMi(pin) && personel.pin_hash === ozet(pin)
}

/**
 * Yeni PIN için hata metni (yoksa null).
 * PIN ile giriş kişiyi PIN'den bulduğu için başka aktif personelde kullanılamaz.
 */
export function pinHatasi(db: Database.Database, pin: unknown, ozet: PinOzetFn, haricId?: number): string | null {
  if (pin === null || pin === undefined || pin === '') return null
  if (!pinBicimiGecerliMi(pin)) return 'PIN 4 haneli rakam olmalı'
  if (VARSAYILAN_PINLER.includes(pin)) return 'Bu PIN herkesçe bilinen varsayılan PIN — başka bir PIN seçin'
  const cakisan = db.prepare('SELECT id FROM personel WHERE pin_hash = ? AND aktif = 1 AND id != ?').get(ozet(pin), haricId ?? -1)
  return cakisan ? 'Bu PIN başka bir personel tarafından kullanılıyor' : null
}

/** Yanıta asla gönderilmeyecek alanları çıkarır; PIN'in varlığını bayrakla bildirir */
export function personelGuvenli(personel: any): any {
  const { sifre_hash, pin_kodu, pin_hash, ...guvenli } = personel
  return { ...guvenli, pin_tanimli: Boolean(pin_hash) }
}
