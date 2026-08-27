// =====================================================
// Migration 002: Eksik ve Yeni Sütunların Güvenli Eklenmesi
// ALTER TABLE ile müşteri verilerine dokunmadan şema genişletme
// =====================================================

import type Database from 'better-sqlite3'
import type { Migration } from './index'
import { sutunYoksaEkle } from '../migration-runner'

export const migration002: Migration = {
  version: 2,
  name: 'add_missing_columns_and_normalize',
  up: (db: Database.Database) => {
    // Bölüm ve Masa sıralama sütunları
    sutunYoksaEkle(db, 'bolum', 'sira', 'INTEGER DEFAULT 0')
    sutunYoksaEkle(db, 'masa', 'sira', 'INTEGER DEFAULT 0')

    // Sipariş porsiyon çarpanı
    sutunYoksaEkle(db, 'siparis', 'porsiyon', 'REAL DEFAULT 1')

    // Ürün sıralama ve birim
    sutunYoksaEkle(db, 'urun', 'sira', 'INTEGER DEFAULT 0')
    sutunYoksaEkle(db, 'urun', 'birim', "TEXT DEFAULT 'Porsiyon'")

    // Ürün birim normalizasyonu
    try {
      db.exec("UPDATE urun SET birim = 'Porsiyon' WHERE birim = 'adet' OR birim = 'Adet' OR birim IS NULL")
    } catch (err) {
      console.warn('⚠️ [Migration 002] Ürün birim normalizasyonu uyarısı:', err)
    }

    // Personel telefon ve PIN kontrolleri
    sutunYoksaEkle(db, 'personel', 'telefon', 'TEXT')
    sutunYoksaEkle(db, 'personel', 'pin_kodu', 'TEXT')
  },
}
