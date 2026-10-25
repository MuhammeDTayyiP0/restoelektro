// =====================================================
// Migration 014: PIN'ler düz metin yerine özet olarak saklanır
// Düz PIN'lerin özetlenmesi açılışta services/pin.service.ts ile yapılır
// (özet anahtarı veritabanında değil userData/guvenlik.json içindedir)
// =====================================================

import type Database from 'better-sqlite3'
import type { Migration } from './index'
import { sutunYoksaEkle } from '../migration-runner'

export const migration014: Migration = {
  version: 14,
  name: 'pin_hash',
  up: (db: Database.Database) => {
    sutunYoksaEkle(db, 'personel', 'pin_hash', 'TEXT')
    sutunYoksaEkle(db, 'personel', 'pin_degismeli', 'INTEGER DEFAULT 0')
    db.exec('CREATE INDEX IF NOT EXISTS idx_personel_pin_hash ON personel(pin_hash)')
  },
}
