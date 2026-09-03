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
    // Ürün tablosunda 'aciklama' sütunu yoksa ekle (Seed için gerekli)
    sutunYoksaEkle(db, 'urun', 'aciklama', 'TEXT')
    
    // Varsayılan verileri tohumla
    varsayilanIzgaraVeIcecekleriEkle(db)
  },
}
