// =====================================================
// SQLite Veritabanı Bağlantı ve Yaşam Döngüsü Yöneticisi
// better-sqlite3 ile userData tabanlı, WAL modlu ve güvenli mimari
// =====================================================

import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, copyFileSync } from 'fs'
import { migrationlariCalistir } from './migration-runner'
import { otomatikYedekAl } from './backup'
import { varsayilanIzgaraVeIcecekleriEkle } from './seed'

// Veritabanı örneği (singleton)
let db: Database.Database | null = null

/**
 * Eski konumlardaki veritabanı dosyalarını tespit edip userData altına güvenle taşır
 */
function eskiVeritabaniniGocEt(hedefYol: string): void {
  if (existsSync(hedefYol)) return // Zaten hedef dosya mevcut, taşımaya gerek yok

  const userData = app.getPath('userData')
  const appData = app.getPath('appData')

  const olasiEskiKonumlar = [
    join(userData, 'data', 'restoelektro.db'),
    join(userData, 'restoelektro.db'),
    join(userData, 'data', 'database.sqlite'),
    join(appData, 'etibol-resto', 'data', 'restoelektro.db'),
    join(appData, 'etibol-pos', 'data', 'restoelektro.db'),
    join(process.cwd(), 'restoelektro.db'),
    join(process.cwd(), 'database.sqlite'),
  ]

  for (const eskiYol of olasiEskiKonumlar) {
    if (existsSync(eskiYol)) {
      try {
        console.log(`📦 Eski veritabanı bulundu: ${eskiYol}`)
        console.log(`🚚 Veriler yeni konuma taşınıyor: ${hedefYol}...`)
        copyFileSync(eskiYol, hedefYol)
        console.log('✅ Eski veritabanı verileri başarıyla yeni userData konumuna aktarıldı.')
        return
      } catch (err) {
        console.error(`❌ Eski veritabanı kopyalanırken hata (${eskiYol}):`, err)
      }
    }
  }
}

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

  const dbYolu = join(userData, 'database.sqlite')

  // Geriye dönük uyumluluk: Eski veritabanı varsa taşı
  eskiVeritabaniniGocEt(dbYolu)

  return dbYolu
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
