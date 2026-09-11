// =====================================================
// SQLite Veritabanı Bağlantı ve Yaşam Döngüsü Yöneticisi
// better-sqlite3 ile userData tabanlı, WAL modlu ve güvenli mimari
// =====================================================

import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { migrationlariCalistir } from './migration-runner'
import { otomatikYedekAl } from './backup'
import { varsayilanIzgaraVeIcecekleriEkle } from './seed'
import { egitimModuAktifMi } from '../services/terminal.service'

// Veritabanı örneği (singleton)
let db: Database.Database | null = null

/**
 * Veritabanı dosya yolunu belirler (userData/database.sqlite)
 * Eğitim modunda ayrı dosya kullanılır — gerçek ciroya sızmaz.
 */
export function veritabaniYoluGetir(): string {
  const userData = app.getPath('userData')

  if (!existsSync(userData)) {
    mkdirSync(userData, { recursive: true })
  }

  const dosya = egitimModuAktifMi() ? 'egitim.sqlite' : 'database.sqlite'
  return join(userData, dosya)
}

/**
 * Veritabanı bağlantısını başlatır, optimizasyonları uygular ve migration'ları çalıştırır
 */
export async function veritabaniBaslat(): Promise<void> {
  if (db) {
    console.log('⚠️ Veritabanı zaten bağlı')
    return
  }

  const yol = veritabaniYoluGetir()
  console.log(`📂 SQLite Veritabanı Konumu (userData): ${yol}`)
  if (egitimModuAktifMi()) {
    console.log('🎓 EĞİTİM MODU — egitim.sqlite kullanılıyor')
  }

  db = new Database(yol)

  db.pragma('journal_mode = WAL')
  db.pragma('synchronous = NORMAL')
  db.pragma('foreign_keys = ON')
  db.pragma('temp_store = MEMORY')
  db.pragma('mmap_size = 268435456')
  db.pragma('cache_size = -64000')
  db.pragma('busy_timeout = 5000')

  await otomatikYedekAl(db, 'acilis')
  await migrationlariCalistir(db)

  try {
    varsayilanIzgaraVeIcecekleriEkle(db)
  } catch (seedErr) {
    console.warn('⚠️ [Seed] Varsayılan veriler kontrol edilirken uyarı:', seedErr)
  }

  console.log('✅ Veritabanı başarıyla başlatıldı ve güncellendi')
}

export function veritabaniGetir(): Database.Database {
  if (!db) {
    throw new Error('Veritabanı başlatılmamış! Önce veritabaniBaslat() çağrılmalı.')
  }
  return db
}

export function veritabaniKapat(): void {
  if (db) {
    try {
      db.pragma('wal_checkpoint(TRUNCATE)')
      db.close()
      console.log('🔒 Veritabanı bağlantısı güvenle kapatıldı')
    } catch (err) {
      console.error('❌ Veritabanı kapatılırken hata oluştu:', err)
    } finally {
      db = null
    }
  }
}
