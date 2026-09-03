// =====================================================
// Migration 008: Sipariş Tablosuna Gramaj ve Satış Birimi Ekleme
// Gramajlı / Kilogramlık satışların stok ve fiş takibi için
// =====================================================

import type Database from 'better-sqlite3'
import type { Migration } from './index'
import { sutunYoksaEkle } from '../migration-runner'

export const migration008: Migration = {
  version: 8,
  name: 'add_gramaj_and_satis_birim_to_siparis',
  up: (db: Database.Database) => {
    // 1. siparis tablosuna satis_birim ve gramaj sütunlarını ekle
    sutunYoksaEkle(db, 'siparis', 'satis_birim', "TEXT DEFAULT 'porsiyon'")
    sutunYoksaEkle(db, 'siparis', 'gramaj', 'REAL DEFAULT NULL')
  },
}
