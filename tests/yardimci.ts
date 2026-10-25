// Testler için bellek içi veritabanı: gerçek migration'larla kurulur
import Database from 'better-sqlite3'
import { migrationlariCalistir } from '../src/main/database/migration-runner'

export async function testVeritabani(): Promise<Database.Database> {
  const db = new Database(':memory:')
  db.pragma('foreign_keys = ON')
  const log = console.log
  console.log = () => {}
  try {
    await migrationlariCalistir(db)
  } finally {
    console.log = log
  }
  return db
}

export function bosMasa(db: Database.Database): number {
  const bolum = db.prepare('SELECT id FROM bolum LIMIT 1').get() as any
  const sonuc = db.prepare("INSERT INTO masa (bolum_id, numara) VALUES (?, ?)").run(bolum.id, 'T' + Math.random().toString(36).slice(2, 6))
  return Number(sonuc.lastInsertRowid)
}

export function urunEkle(db: Database.Database, fiyat: number, ekstra: Record<string, any> = {}): number {
  const kategori = db.prepare('SELECT id FROM kategori LIMIT 1').get() as any
  const sonuc = db.prepare(`
    INSERT INTO urun (kategori_id, ad, fiyat, porsiyon_fiyati, kilo_fiyati, satis_turleri)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(kategori.id, ekstra.ad || 'Test Ürün', fiyat, ekstra.porsiyon_fiyati ?? null, ekstra.kilo_fiyati ?? null, ekstra.satis_turleri ?? null)
  return Number(sonuc.lastInsertRowid)
}

export function adminId(db: Database.Database): number {
  return (db.prepare("SELECT id FROM personel WHERE rol = 'admin' LIMIT 1").get() as any).id
}
