// =====================================================
// Denetim izi — iptal / ikram / indirim / ödeme / giriş
// Mevcut IPC dönüş değerlerine dokunmaz
// =====================================================

import type Database from 'better-sqlite3'

export interface DenetimKayit {
  personel_id?: number | null
  personel_adi?: string | null
  islem: string
  modul?: string
  hedef_tip?: string
  hedef_id?: number | null
  ozet?: string
  detay?: unknown
}

function personelAdiBul(db: Database.Database, personelId?: number | null): string | null {
  if (!personelId) return null
  try {
    const p = db.prepare('SELECT ad, soyad FROM personel WHERE id = ?').get(personelId) as any
    if (!p) return null
    return `${p.ad || ''} ${p.soyad || ''}`.trim()
  } catch {
    return null
  }
}

export function denetimYaz(db: Database.Database, kayit: DenetimKayit): void {
  try {
    const adi = kayit.personel_adi || personelAdiBul(db, kayit.personel_id)
    const detay =
      kayit.detay === undefined || kayit.detay === null
        ? null
        : typeof kayit.detay === 'string'
          ? kayit.detay
          : JSON.stringify(kayit.detay)
    db.prepare(`
      INSERT INTO denetim_log (personel_id, personel_adi, islem, modul, hedef_tip, hedef_id, ozet, detay)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      kayit.personel_id || null,
      adi,
      kayit.islem,
      kayit.modul || null,
      kayit.hedef_tip || null,
      kayit.hedef_id || null,
      kayit.ozet || null,
      detay
    )
  } catch (err) {
    console.warn('[Denetim] Kayıt yazılamadı:', err)
  }
}
