// =====================================================
// Veritabanı Migration (Göç) Kayıt Defteri
// Sıralı migration listesi ve arayüz tanımları
// =====================================================

import type Database from 'better-sqlite3'
import { migration001 } from './001_initial_schema'
import { migration002 } from './002_add_missing_columns'
import { migration003 } from './003_seed_defaults'

export interface Migration {
  /** Benzersiz sürüm numarası (sıralı artan) */
  version: number
  /** Migration adı / açıklaması */
  name: string
  /** Migration çalıştırma fonksiyonu */
  up: (db: Database.Database) => void | Promise<void>
}

/**
 * Sıralı olarak çalıştırılacak tüm migration'ların listesi
 */
export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
]
