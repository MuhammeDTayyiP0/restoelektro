// =====================================================
// SQLite Migration Motoru
// Şema versiyon takibi, sıfır veri kaybı ve atomik göç yönetimi
// =====================================================

import type Database from 'better-sqlite3'
import { migrations, type Migration } from './migrations/index'

/**
 * Tabloda belirli bir sütunun var olup olmadığını kontrol eder
 */
export function sutunVarMi(db: Database.Database, tabloAdi: string, sutunAdi: string): boolean {
  try {
    const sutunlar = db.prepare(`PRAGMA table_info(${tabloAdi})`).all() as Array<{ name: string }>
    return sutunlar.some(col => col.name.toLowerCase() === sutunAdi.toLowerCase())
  } catch (error) {
    return false
  }
}

/**
 * Tabloya sütun yoksa güvenli bir şekilde ekler (ALTER TABLE)
 */
export function sutunYoksaEkle(
  db: Database.Database,
  tabloAdi: string,
  sutunAdi: string,
  sutunTanimi: string
): boolean {
  if (!sutunVarMi(db, tabloAdi, sutunAdi)) {
    try {
      db.exec(`ALTER TABLE ${tabloAdi} ADD COLUMN ${sutunAdi} ${sutunTanimi}`)
      console.log(`➕ [Migration] Sütun eklendi: ${tabloAdi}.${sutunAdi}`)
      return true
    } catch (err) {
      console.warn(`⚠️ [Migration] Sütun eklenirken uyarı (${tabloAdi}.${sutunAdi}):`, err)
      return false
    }
  }
  return false
}

/**
 * Tablonun var olup olmadığını kontrol eder
 */
export function tabloVarMi(db: Database.Database, tabloAdi: string): boolean {
  try {
    const row = db
      .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`)
      .get(tabloAdi)
    return !!row
  } catch {
    return false
  }
}

/**
 * İndeksi güvenli şekilde oluşturur
 */
export function indeksYoksaEkle(db: Database.Database, indexAdi: string, sql: string): void {
  try {
    db.exec(sql)
  } catch (error) {
    console.warn(`⚠️ [Migration] İndeks oluşturma uyarısı (${indexAdi}):`, error)
  }
}

/**
 * Migration geçmişini saklayan _migrations tablosunu hazırlar
 */
function migrationTablosunuHazirla(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER UNIQUE NOT NULL,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INTEGER NOT NULL
    );
  `)
}

/**
 * Daha önce çalıştırılmış migration sürümlerini döndürür
 */
function uygulanmisSurumleriGetir(db: Database.Database): Set<number> {
  const kayitlar = db.prepare(`SELECT version FROM _migrations ORDER BY version ASC`).all() as Array<{ version: number }>
  return new Set(kayitlar.map(k => k.version))
}

/**
 * Tüm bekleyen migration'ları sırayla ve transaction içinde çalıştırır
 */
export async function migrationlariCalistir(db: Database.Database): Promise<void> {
  console.log('🔄 Veritabanı şema senkronizasyonu ve migration kontrolü başlatılıyor...')

  migrationTablosunuHazirla(db)
  const uygulanmislar = uygulanmisSurumleriGetir(db)

  // Sıralı migration listesini al
  const siraliMigrationlar = [...migrations].sort((a, b) => a.version - b.version)
  let uygulananSayisi = 0

  for (const m of siraliMigrationlar) {
    if (!uygulanmislar.has(m.version)) {
      console.log(`🚀 [Migration v${m.version}] '${m.name}' uygulanıyor...`)
      const baslangicZamani = Date.now()

      // Her migration'ı atomik bir transaction içinde çalıştır
      const calistir = db.transaction(() => {
        m.up(db)

        const gecenSure = Date.now() - baslangicZamani
        db.prepare(`
          INSERT INTO _migrations (version, name, execution_time_ms)
          VALUES (?, ?, ?)
        `).run(m.version, m.name, gecenSure)

        // SQLite PRAGMA user_version'ı da güncelle
        db.pragma(`user_version = ${m.version}`)
      })

      calistir()
      const sure = Date.now() - baslangicZamani
      console.log(`✅ [Migration v${m.version}] '${m.name}' başarıyla tamamlandı (${sure}ms)`)
      uygulananSayisi++
    }
  }

  if (uygulananSayisi === 0) {
    console.log('✨ Veritabanı şeması zaten en güncel sürümde.')
  } else {
    console.log(`🎉 Toplam ${uygulananSayisi} adet migration başarıyla uygulandı.`)
  }
}
