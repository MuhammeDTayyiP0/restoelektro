// =====================================================
// Migration 010: Kategori Tablosuna sira_no Sütunu Ekleme
// Kategorilerin dinamik Sıra Numarası ve Alfabetik yedek sıralaması için
// =====================================================

import type Database from 'better-sqlite3'
import type { Migration } from './index'
import { sutunYoksaEkle } from '../migration-runner'

export const migration010: Migration = {
  version: 10,
  name: 'add_category_order',
  up: (db: Database.Database) => {
    // 1. kategori tablosuna sira_no (INTEGER, default 999) sütununu ekle
    sutunYoksaEkle(db, 'kategori', 'sira_no', 'INTEGER DEFAULT 999')

    // 2. Mevcut kategorilere varsayılan değerleri ata
    try {
      // Önce NULL olan sira_no değerlerini 999 yap
      db.prepare(`UPDATE kategori SET sira_no = 999 WHERE sira_no IS NULL`).run()

      // Izgara kategorisi önceliği = 1
      db.prepare(`
        UPDATE kategori 
        SET sira_no = 1 
        WHERE LOWER(ad) LIKE '%ızgara%' OR LOWER(ad) LIKE '%izgara%' OR LOWER(ad) = 'ızgara' OR LOWER(ad) = 'izgara'
      `).run()

      // Soğuk İçecekler kategorisi önceliği = 2
      db.prepare(`
        UPDATE kategori 
        SET sira_no = 2 
        WHERE LOWER(ad) LIKE '%soğuk içecek%' OR LOWER(ad) LIKE '%soguk icecek%' OR LOWER(ad) LIKE '%i̇çecek%' OR LOWER(ad) LIKE '%icecek%'
      `).run()

      // Diğer mevcut kategorilerin sira_no değerlerini eğer varsa eski 'sira' alanından devral
      db.prepare(`
        UPDATE kategori
        SET sira_no = sira
        WHERE sira IS NOT NULL AND sira > 0 AND (sira_no = 999 OR sira_no IS NULL)
      `).run()
    } catch (err) {
      console.warn('⚠️ [Migration 010] Kategori varsayılan sira_no tohumlama uyarısı:', err)
    }
  },
}
