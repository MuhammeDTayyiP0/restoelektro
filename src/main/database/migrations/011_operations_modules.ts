// =====================================================
// Migration 011: Günlük operasyon modülleri
// Kasa vardiya / Z, rezervasyon, denetim, satın alma, teslimat, masa kilidi
// Mevcut tabloların yapısı korunur — yalnızca yeni tablo/sütun eklenir
// =====================================================

import type Database from 'better-sqlite3'
import type { Migration } from './index'

function sutunEkle(db: Database.Database, tablo: string, sutun: string, tanim: string): void {
  try {
    const sutunlar = db.prepare(`PRAGMA table_info(${tablo})`).all() as Array<{ name: string }>
    if (sutunlar.some((c) => c.name.toLowerCase() === sutun.toLowerCase())) return
    db.exec(`ALTER TABLE ${tablo} ADD COLUMN ${sutun} ${tanim}`)
  } catch (err) {
    console.warn(`[011] Sütun eklenemedi ${tablo}.${sutun}:`, err)
  }
}

export const migration011: Migration = {
  version: 11,
  name: 'operations_modules',
  up: (db: Database.Database) => {
    db.exec(`
      CREATE TABLE IF NOT EXISTS kasa_vardiya (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kasa_id INTEGER NOT NULL DEFAULT 1,
        z_no TEXT,
        acilis_zamani DATETIME DEFAULT CURRENT_TIMESTAMP,
        kapanis_zamani DATETIME,
        acan_personel_id INTEGER,
        kapatan_personel_id INTEGER,
        acilis_nakit REAL DEFAULT 0,
        kapanis_nakit_sayim REAL,
        beklenen_nakit REAL,
        nakit_fark REAL,
        nakit_satis REAL DEFAULT 0,
        kart_satis REAL DEFAULT 0,
        yemek_karti_satis REAL DEFAULT 0,
        diger_satis REAL DEFAULT 0,
        gider REAL DEFAULT 0,
        iptal_tutar REAL DEFAULT 0,
        ikram_tutar REAL DEFAULT 0,
        indirim_tutar REAL DEFAULT 0,
        hesap_sayisi INTEGER DEFAULT 0,
        durum TEXT DEFAULT 'acik',
        notlar TEXT,
        FOREIGN KEY (kasa_id) REFERENCES kasa(id)
      );

      CREATE TABLE IF NOT EXISTS rezervasyon (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        masa_id INTEGER,
        musteri_id INTEGER,
        musteri_ad TEXT NOT NULL,
        telefon TEXT,
        kisi_sayisi INTEGER DEFAULT 2,
        tarih TEXT NOT NULL,
        saat TEXT NOT NULL,
        durum TEXT DEFAULT 'bekliyor',
        notlar TEXT,
        personel_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (masa_id) REFERENCES masa(id),
        FOREIGN KEY (musteri_id) REFERENCES musteri(id)
      );

      CREATE TABLE IF NOT EXISTS denetim_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        zaman DATETIME DEFAULT CURRENT_TIMESTAMP,
        personel_id INTEGER,
        personel_adi TEXT,
        islem TEXT NOT NULL,
        modul TEXT,
        hedef_tip TEXT,
        hedef_id INTEGER,
        ozet TEXT,
        detay TEXT
      );

      CREATE TABLE IF NOT EXISTS tedarikci (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL,
        telefon TEXT,
        adres TEXT,
        vergi_no TEXT,
        yetkili TEXT,
        aktif INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS stok_alis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tedarikci_id INTEGER,
        fatura_no TEXT,
        tarih DATETIME DEFAULT CURRENT_TIMESTAMP,
        toplam REAL DEFAULT 0,
        notlar TEXT,
        personel_id INTEGER,
        durum TEXT DEFAULT 'onaylandi',
        FOREIGN KEY (tedarikci_id) REFERENCES tedarikci(id)
      );

      CREATE TABLE IF NOT EXISTS stok_alis_kalem (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        alis_id INTEGER NOT NULL,
        hammadde_id INTEGER NOT NULL,
        miktar REAL NOT NULL,
        birim_maliyet REAL DEFAULT 0,
        toplam REAL DEFAULT 0,
        FOREIGN KEY (alis_id) REFERENCES stok_alis(id),
        FOREIGN KEY (hammadde_id) REFERENCES hammadde(id)
      );

      CREATE TABLE IF NOT EXISTS masa_kilit (
        masa_id INTEGER PRIMARY KEY,
        terminal_id TEXT NOT NULL,
        personel_id INTEGER,
        personel_adi TEXT,
        kilit_zamani DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `)

    sutunEkle(db, 'hesap', 'teslimat_durumu', 'TEXT DEFAULT NULL')
    sutunEkle(db, 'hesap', 'teslimat_telefon', 'TEXT')
    sutunEkle(db, 'hesap', 'teslimat_adres', 'TEXT')
    sutunEkle(db, 'hesap', 'teslimat_musteri', 'TEXT')
    sutunEkle(db, 'hesap', 'kurye', 'TEXT')

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_kasa_vardiya_durum ON kasa_vardiya(durum);
      CREATE INDEX IF NOT EXISTS idx_kasa_vardiya_acilis ON kasa_vardiya(acilis_zamani);
      CREATE INDEX IF NOT EXISTS idx_rezervasyon_tarih ON rezervasyon(tarih, saat);
      CREATE INDEX IF NOT EXISTS idx_rezervasyon_durum ON rezervasyon(durum);
      CREATE INDEX IF NOT EXISTS idx_denetim_zaman ON denetim_log(zaman);
      CREATE INDEX IF NOT EXISTS idx_denetim_islem ON denetim_log(islem);
      CREATE INDEX IF NOT EXISTS idx_denetim_personel ON denetim_log(personel_id);
      CREATE INDEX IF NOT EXISTS idx_stok_alis_tarih ON stok_alis(tarih);
      CREATE INDEX IF NOT EXISTS idx_hesap_tipi_durum ON hesap(hesap_tipi, durum);
    `)
  },
}
