// =====================================================
// Migration 006: Varsayılan Izgaralar ve İçecekler Tohumlama (Seed)
// Gerçekçi Unsplash CDN görselleri, porsiyonlar ve seçenekler ile
// =====================================================

import type Database from 'better-sqlite3'
import type { Migration } from './index'
import { varsayilanIzgaraVeIcecekleriEkle } from '../seed'
import { sutunYoksaEkle } from '../migration-runner'

export const migration006: Migration = {
  version: 6,
  name: 'seed_izgara_ve_icecekler_defaults',
  up: (db: Database.Database) => {
    // Ürün tablosunda 'aciklama' ve 'satis_turleri' sütunları yoksa ekle (Seed için gerekli)
    sutunYoksaEkle(db, 'urun', 'aciklama', 'TEXT')
    sutunYoksaEkle(db, 'urun', 'satis_turleri', 'TEXT')
    // Seed INSERT sira_no kullanır; sütun ancak migration 010'da ekleniyordu.
    // Eğitim DB gibi sıfırdan kurulumda 006, 010'dan önce çalışır.
    sutunYoksaEkle(db, 'kategori', 'sira', 'INTEGER DEFAULT 0')
    sutunYoksaEkle(db, 'kategori', 'sira_no', 'INTEGER DEFAULT 999')
    
    // Varsayılan verileri tohumla
    varsayilanIzgaraVeIcecekleriEkle(db)
  },
}
