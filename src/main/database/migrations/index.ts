// =====================================================
// Veritabanı Migration (Göç) Kayıt Defteri
// Sıralı migration listesi ve arayüz tanımları
// =====================================================

import type Database from 'better-sqlite3'
import { migration001 } from './001_initial_schema'
import { migration002 } from './002_add_missing_columns'
import { migration003 } from './003_seed_defaults'
import { migration004 } from './004_add_cost_price_and_stock_improvements'
import { migration005 } from './005_performance_indexes'
import { migration006 } from './006_seed_izgara_ve_icecekler'
import { migration007 } from './007_add_multi_unit_pricing'
import { migration008 } from './008_add_gramaj_and_satis_birim_to_siparis'
import { migration009 } from './009_add_porsiyon_and_kilo_fiyati_to_urun'
import { migration010 } from './010_add_category_order'

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
  migration004,
  migration005,
  migration006,
  migration007,
  migration008,
  migration009,
  migration010,
]
