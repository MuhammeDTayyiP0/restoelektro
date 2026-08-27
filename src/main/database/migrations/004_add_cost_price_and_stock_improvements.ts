// =====================================================
// Migration 004: Sipariş Reçete Maliyeti ve Stok İyileştirmeleri
// siparis tablosuna cost_price eklenmesi ve performans indeksleri
// =====================================================

import type Database from 'better-sqlite3'
import type { Migration } from './index'
import { sutunYoksaEkle, indeksYoksaEkle } from '../migration-runner'

export const migration004: Migration = {
  version: 4,
  name: 'add_cost_price_and_stock_improvements',
  up: (db: Database.Database) => {
    // 1. Sipariş tablosuna cost_price sütununu ekle
    sutunYoksaEkle(db, 'siparis', 'cost_price', 'REAL DEFAULT 0')

    // 2. Performans İndeksleri
    indeksYoksaEkle(db, 'idx_recete_urun', 'CREATE INDEX IF NOT EXISTS idx_recete_urun ON recete(urun_id);')
    indeksYoksaEkle(db, 'idx_recete_hammadde', 'CREATE INDEX IF NOT EXISTS idx_recete_hammadde ON recete(hammadde_id);')
    indeksYoksaEkle(db, 'idx_stok_hareket_tarih', 'CREATE INDEX IF NOT EXISTS idx_stok_hareket_tarih ON stok_hareket(created_at);')
    indeksYoksaEkle(db, 'idx_odeme_tarih', 'CREATE INDEX IF NOT EXISTS idx_odeme_tarih ON odeme(odeme_zamani);')

    // 3. Mevcut geçmiş siparişler için (varsa) reçete maliyetlerini hesapla ve doldur
    try {
      db.exec(`
        UPDATE siparis
        SET cost_price = (
          SELECT COALESCE(SUM(r.miktar * h.maliyet_birim), 0) * siparis.miktar * COALESCE(siparis.porsiyon, 1)
          FROM recete r
          JOIN hammadde h ON h.id = r.hammadde_id
          WHERE r.urun_id = siparis.urun_id
        )
        WHERE cost_price IS NULL OR cost_price = 0;
      `)
      console.log('✅ [Migration 004] Geçmiş sipariş maliyetleri (cost_price) başarıyla güncellendi.')
    } catch (err) {
      console.warn('⚠️ [Migration 004] Geçmiş sipariş maliyetleri güncellenirken uyarı:', err)
    }
  },
}
