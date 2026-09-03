// =====================================================
// Migration 009: Ürün Tablosuna porsiyon_fiyati ve kilo_fiyati Sütunlarını Ekleme
// Esnek satış türlerinin veritabanı düzeyinde hızlı sorgulanabilmesi ve toplu güncellemeler için
// =====================================================

import type Database from 'better-sqlite3'
import type { Migration } from './index'
import { sutunYoksaEkle } from '../migration-runner'

export const migration009: Migration = {
  version: 9,
  name: 'add_porsiyon_and_kilo_fiyati_to_urun',
  up: (db: Database.Database) => {
    // 1. urun tablosuna porsiyon_fiyati ve kilo_fiyati sütunlarını ekle
    sutunYoksaEkle(db, 'urun', 'porsiyon_fiyati', 'REAL DEFAULT NULL')
    sutunYoksaEkle(db, 'urun', 'kilo_fiyati', 'REAL DEFAULT NULL')

    // 2. Mevcut urunlerin satis_turleri JSON verisine göre porsiyon_fiyati ve kilo_fiyati tohumla
    try {
      const urunler = db.prepare('SELECT id, fiyat, birim, satis_turleri, porsiyon_fiyati, kilo_fiyati FROM urun').all() as any[]
      const guncelleStmt = db.prepare('UPDATE urun SET porsiyon_fiyati = ?, kilo_fiyati = ? WHERE id = ?')

      for (const urun of urunler) {
        let turler: any[] = []
        if (typeof urun.satis_turleri === 'string') {
          try {
            turler = JSON.parse(urun.satis_turleri)
          } catch {
            turler = []
          }
        } else if (Array.isArray(urun.satis_turleri)) {
          turler = urun.satis_turleri
        }

        const porsiyon = turler.find((t: any) => (t.birim || '').toLowerCase() === 'porsiyon')
        const kilo = turler.find((t: any) => ['kilo', 'kg'].includes((t.birim || '').toLowerCase()))

        const porsiyonFiyat = porsiyon ? porsiyon.fiyat : ((urun.birim || '').toLowerCase() === 'porsiyon' ? urun.fiyat : null)
        const kiloFiyat = kilo ? kilo.fiyat : (['kg', 'kilo'].includes((urun.birim || '').toLowerCase()) ? urun.fiyat : null)

        guncelleStmt.run(porsiyonFiyat, kiloFiyat, urun.id)
      }
    } catch (err) {
      console.warn('⚠️ [Migration 009] porsiyon_fiyati/kilo_fiyati tohumlama uyarısı:', err)
    }
  },
}
