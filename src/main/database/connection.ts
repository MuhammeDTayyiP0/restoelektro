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

// Veritabanı örneği (singleton)
let db: Database.Database | null = null

/**
 * Veritabanı dosya yolunu belirler (userData/database.sqlite)
 * Uygulama güncellense veya yeniden kurulsa bile userData klasörü korunur.
 */
export function veritabaniYoluGetir(): string {
  const userData = app.getPath('userData')

  // userData klasörünü garanti altına al
  if (!existsSync(userData)) {
    mkdirSync(userData, { recursive: true })
  }

  return join(userData, 'database.sqlite')
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

  // Veritabanını aç/oluştur
  db = new Database(yol)

  // Performans & Veri Güvenliği Optimizasyonları
  db.pragma('journal_mode = WAL')        // Write-Ahead Logging — eşzamanlı okuma/yazma performansı
  db.pragma('synchronous = NORMAL')      // Dengeli veri güvenliği & yüksek performans
  db.pragma('foreign_keys = ON')         // İlişkisel bütünlük kısıtlamalarını etkinleştir
  db.pragma('temp_store = MEMORY')       // Geçici tablo ve sıralamalar bellekte tutulur
  db.pragma('mmap_size = 268435456')     // 256MB bellek haritalı I/O (Memory-Mapped I/O)
  db.pragma('cache_size = -64000')       // ~64MB RAM önbellek
  db.pragma('busy_timeout = 5000')       // 5 saniye kilit bekleme süresi

  // Migration öncesi açılış güvenlik yedeği al
  await otomatikYedekAl(db, 'acilis')

  // Otomatik Migration ve Şema Senkronizasyonu
  await migrationlariCalistir(db)

  // Varsayılan Izgara & İçecekler Veri Kontrolü ve Tamamlama (Seed)
  try {
    varsayilanIzgaraVeIcecekleriEkle(db)
  } catch (seedErr) {
    console.warn('⚠️ [Seed] Varsayılan veriler kontrol edilirken uyarı:', seedErr)
  }

  console.log('✅ Veritabanı başarıyla başlatıldı ve güncellendi')
}

/**
 * Aktif veritabanı bağlantısını döndürür
 */
export function veritabaniGetir(): Database.Database {
  if (!db) {
    throw new Error('Veritabanı başlatılmamış! Önce veritabaniBaslat() çağrılmalı.')
  }
  return db
}

/**
 * Veritabanı bağlantısını güvenli şekilde kapatır
 */
export function veritabaniKapat(): void {
  if (db) {
    try {
      // WAL checkpoint yaparak tüm değişiklikleri ana dosyaya flush et
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
