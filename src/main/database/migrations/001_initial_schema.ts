// =====================================================
// Migration 001: Başlangıç Veritabanı Şeması
// Tüm temel modül tabloları ve performans indeksleri
// =====================================================

import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration001: Migration = {
  version: 1,
  name: 'initial_schema',
  up: (db: Database.Database) => {
    // 1. PERSONEL & YETKİLENDİRME
    db.exec(`
      CREATE TABLE IF NOT EXISTS personel (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL,
        soyad TEXT NOT NULL,
        kullanici_adi TEXT UNIQUE NOT NULL,
        sifre_hash TEXT NOT NULL,
        rol TEXT NOT NULL DEFAULT 'garson',
        pin_kodu TEXT,
        aktif INTEGER DEFAULT 1,
        telefon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS yetki (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rol TEXT NOT NULL,
        modul TEXT NOT NULL,
        islem TEXT NOT NULL,
        izin INTEGER DEFAULT 0
      );
    `)

    // 2. MENÜ YÖNETİMİ
    db.exec(`
      CREATE TABLE IF NOT EXISTS kategori (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL,
        ust_kategori_id INTEGER,
        sira INTEGER DEFAULT 0,
        renk TEXT DEFAULT '#3B82F6',
        ikon TEXT,
        aktif INTEGER DEFAULT 1,
        FOREIGN KEY (ust_kategori_id) REFERENCES kategori(id)
      );

      CREATE TABLE IF NOT EXISTS urun (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kategori_id INTEGER NOT NULL,
        barkod TEXT,
        ad TEXT NOT NULL,
        kisaltma TEXT,
        fiyat REAL NOT NULL,
        kdv_orani REAL DEFAULT 10,
        birim TEXT DEFAULT 'Porsiyon',
        satis_turleri TEXT,
        aciklama TEXT,
        resim_yolu TEXT,
        yazici_grup TEXT DEFAULT 'mutfak',
        aktif INTEGER DEFAULT 1,
        sira INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kategori_id) REFERENCES kategori(id)
      );

      CREATE TABLE IF NOT EXISTS urun_varyant (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        urun_id INTEGER NOT NULL,
        ad TEXT NOT NULL,
        fiyat_farki REAL DEFAULT 0,
        aktif INTEGER DEFAULT 1,
        FOREIGN KEY (urun_id) REFERENCES urun(id)
      );

      CREATE TABLE IF NOT EXISTS urun_opsiyonu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        urun_id INTEGER NOT NULL,
        ad TEXT NOT NULL,
        fiyat REAL DEFAULT 0,
        aktif INTEGER DEFAULT 1,
        FOREIGN KEY (urun_id) REFERENCES urun(id)
      );
    `)

    // 3. MASA & BÖLÜM YÖNETİMİ
    db.exec(`
      CREATE TABLE IF NOT EXISTS bolum (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL,
        sira INTEGER DEFAULT 0,
        aktif INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS masa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bolum_id INTEGER NOT NULL,
        numara TEXT NOT NULL,
        kapasite INTEGER DEFAULT 4,
        durum TEXT DEFAULT 'bos',
        konum_x INTEGER DEFAULT 0,
        konum_y INTEGER DEFAULT 0,
        sira INTEGER DEFAULT 0,
        aktif INTEGER DEFAULT 1,
        FOREIGN KEY (bolum_id) REFERENCES bolum(id)
      );
    `)

    // 4. MÜŞTERİ, HESAP & SİPARİŞ
    db.exec(`
      CREATE TABLE IF NOT EXISTS musteri (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL,
        soyad TEXT,
        telefon TEXT UNIQUE,
        email TEXT,
        adres TEXT,
        vergi_no TEXT,
        vergi_dairesi TEXT,
        unvan TEXT,
        notlar TEXT,
        toplam_harcama REAL DEFAULT 0,
        ziyaret_sayisi INTEGER DEFAULT 0,
        son_ziyaret DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS musteri_adres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        musteri_id INTEGER NOT NULL,
        adres_baslik TEXT DEFAULT 'Ev',
        adres TEXT NOT NULL,
        ilce TEXT,
        il TEXT,
        varsayilan INTEGER DEFAULT 0,
        FOREIGN KEY (musteri_id) REFERENCES musteri(id)
      );

      CREATE TABLE IF NOT EXISTS hesap (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        masa_id INTEGER,
        hesap_no TEXT UNIQUE NOT NULL,
        hesap_tipi TEXT DEFAULT 'masa',
        personel_id INTEGER NOT NULL,
        durum TEXT DEFAULT 'acik',
        acilis_zamani DATETIME DEFAULT CURRENT_TIMESTAMP,
        kapanis_zamani DATETIME,
        musteri_id INTEGER,
        kisi_sayisi INTEGER DEFAULT 1,
        notlar TEXT,
        toplam_tutar REAL DEFAULT 0,
        indirim_tutar REAL DEFAULT 0,
        net_tutar REAL DEFAULT 0,
        FOREIGN KEY (masa_id) REFERENCES masa(id),
        FOREIGN KEY (personel_id) REFERENCES personel(id),
        FOREIGN KEY (musteri_id) REFERENCES musteri(id)
      );

      CREATE TABLE IF NOT EXISTS siparis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hesap_id INTEGER NOT NULL,
        urun_id INTEGER NOT NULL,
        varyant_id INTEGER,
        miktar REAL NOT NULL DEFAULT 1,
        birim_fiyat REAL NOT NULL,
        toplam_fiyat REAL NOT NULL,
        durum TEXT DEFAULT 'bekliyor',
        siparis_zamani DATETIME DEFAULT CURRENT_TIMESTAMP,
        hazir_zamani DATETIME,
        personel_id INTEGER NOT NULL,
        iptal_nedeni TEXT,
        notlar TEXT,
        ikram INTEGER DEFAULT 0,
        ikram_onaylayan_id INTEGER,
        yazici_grup TEXT DEFAULT 'mutfak',
        porsiyon REAL DEFAULT 1,
        FOREIGN KEY (hesap_id) REFERENCES hesap(id),
        FOREIGN KEY (urun_id) REFERENCES urun(id),
        FOREIGN KEY (varyant_id) REFERENCES urun_varyant(id),
        FOREIGN KEY (personel_id) REFERENCES personel(id),
        FOREIGN KEY (ikram_onaylayan_id) REFERENCES personel(id)
      );

      CREATE TABLE IF NOT EXISTS siparis_opsiyonlari (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        siparis_id INTEGER NOT NULL,
        opsiyon_id INTEGER NOT NULL,
        FOREIGN KEY (siparis_id) REFERENCES siparis(id),
        FOREIGN KEY (opsiyon_id) REFERENCES urun_opsiyonu(id)
      );
    `)

    // 5. ÖDEME & FATURA
    db.exec(`
      CREATE TABLE IF NOT EXISTS odeme (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hesap_id INTEGER NOT NULL,
        odeme_tipi TEXT NOT NULL,
        tutar REAL NOT NULL,
        odeme_zamani DATETIME DEFAULT CURRENT_TIMESTAMP,
        personel_id INTEGER NOT NULL,
        referans_no TEXT,
        notlar TEXT,
        FOREIGN KEY (hesap_id) REFERENCES hesap(id),
        FOREIGN KEY (personel_id) REFERENCES personel(id)
      );

      CREATE TABLE IF NOT EXISTS fatura (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hesap_id INTEGER NOT NULL,
        fatura_tipi TEXT NOT NULL,
        fatura_no TEXT,
        uuid TEXT,
        alici_vkn TEXT,
        alici_unvan TEXT,
        toplam_tutar REAL NOT NULL,
        kdv_tutar REAL NOT NULL,
        durum TEXT DEFAULT 'olusturuldu',
        gonderim_zamani DATETIME,
        xml_icerik TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hesap_id) REFERENCES hesap(id)
      );
    `)

    // 6. SADAKAT SİSTEMİ
    db.exec(`
      CREATE TABLE IF NOT EXISTS sadakat_kart (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        musteri_id INTEGER NOT NULL,
        kart_no TEXT UNIQUE NOT NULL,
        kart_tipi TEXT DEFAULT 'puan',
        bakiye REAL DEFAULT 0,
        puan INTEGER DEFAULT 0,
        stamp_sayisi INTEGER DEFAULT 0,
        aktif INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (musteri_id) REFERENCES musteri(id)
      );

      CREATE TABLE IF NOT EXISTS sadakat_hareket (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kart_id INTEGER NOT NULL,
        islem_tipi TEXT NOT NULL,
        tutar REAL DEFAULT 0,
        puan INTEGER DEFAULT 0,
        aciklama TEXT,
        hesap_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kart_id) REFERENCES sadakat_kart(id),
        FOREIGN KEY (hesap_id) REFERENCES hesap(id)
      );
    `)

    // 7. STOK & REÇETE YÖNETİMİ
    db.exec(`
      CREATE TABLE IF NOT EXISTS hammadde (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL,
        birim TEXT NOT NULL,
        mevcut_stok REAL DEFAULT 0,
        min_stok REAL DEFAULT 0,
        maliyet_birim REAL DEFAULT 0,
        tedarikci TEXT,
        aktif INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS recete (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        urun_id INTEGER NOT NULL,
        hammadde_id INTEGER NOT NULL,
        miktar REAL NOT NULL,
        birim TEXT NOT NULL,
        FOREIGN KEY (urun_id) REFERENCES urun(id),
        FOREIGN KEY (hammadde_id) REFERENCES hammadde(id)
      );

      CREATE TABLE IF NOT EXISTS stok_hareket (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hammadde_id INTEGER NOT NULL,
        islem_tipi TEXT NOT NULL,
        miktar REAL NOT NULL,
        birim_maliyet REAL DEFAULT 0,
        aciklama TEXT,
        personel_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hammadde_id) REFERENCES hammadde(id),
        FOREIGN KEY (personel_id) REFERENCES personel(id)
      );
    `)

    // 8. KASA & KASA HAREKETLERİ
    db.exec(`
      CREATE TABLE IF NOT EXISTS kasa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL,
        aktif INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS kasa_hareket (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kasa_id INTEGER NOT NULL,
        islem_tipi TEXT NOT NULL,
        tutar REAL NOT NULL,
        aciklama TEXT,
        personel_id INTEGER,
        hesap_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kasa_id) REFERENCES kasa(id),
        FOREIGN KEY (personel_id) REFERENCES personel(id),
        FOREIGN KEY (hesap_id) REFERENCES hesap(id)
      );
    `)

    // 9. CALLER ID, HARİCİ SİPARİŞ & AYARLAR
    db.exec(`
      CREATE TABLE IF NOT EXISTS arayan_kayit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telefon TEXT NOT NULL,
        musteri_id INTEGER,
        arama_zamani DATETIME DEFAULT CURRENT_TIMESTAMP,
        durum TEXT DEFAULT 'cevapsiz',
        FOREIGN KEY (musteri_id) REFERENCES musteri(id)
      );

      CREATE TABLE IF NOT EXISTS harici_siparis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        platform TEXT NOT NULL,
        harici_siparis_id TEXT NOT NULL,
        durum TEXT DEFAULT 'yeni',
        siparis_detay TEXT,
        toplam_tutar REAL,
        hesap_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (hesap_id) REFERENCES hesap(id)
      );

      CREATE TABLE IF NOT EXISTS ayar (
        anahtar TEXT PRIMARY KEY,
        deger TEXT,
        aciklama TEXT
      );
    `)

    // İndeksler — Hızlı Arama & Performans
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_urun_kategori ON urun(kategori_id);
      CREATE INDEX IF NOT EXISTS idx_hesap_masa ON hesap(masa_id);
      CREATE INDEX IF NOT EXISTS idx_hesap_durum ON hesap(durum);
      CREATE INDEX IF NOT EXISTS idx_hesap_tarih ON hesap(acilis_zamani);
      CREATE INDEX IF NOT EXISTS idx_hesap_masa_durum ON hesap(masa_id, durum);
      CREATE INDEX IF NOT EXISTS idx_hesap_durum_acilis ON hesap(durum, acilis_zamani);
      CREATE INDEX IF NOT EXISTS idx_hesap_kapanis ON hesap(kapanis_zamani);
      CREATE INDEX IF NOT EXISTS idx_hesap_personel ON hesap(personel_id);
      CREATE INDEX IF NOT EXISTS idx_hesap_musteri ON hesap(musteri_id);
      CREATE INDEX IF NOT EXISTS idx_siparis_hesap ON siparis(hesap_id);
      CREATE INDEX IF NOT EXISTS idx_siparis_durum ON siparis(durum);
      CREATE INDEX IF NOT EXISTS idx_siparis_hesap_durum ON siparis(hesap_id, durum);
      CREATE INDEX IF NOT EXISTS idx_siparis_urun ON siparis(urun_id);
      CREATE INDEX IF NOT EXISTS idx_siparis_personel ON siparis(personel_id);
      CREATE INDEX IF NOT EXISTS idx_siparis_zamani ON siparis(siparis_zamani);
      CREATE INDEX IF NOT EXISTS idx_siparis_opsiyon_siparis ON siparis_opsiyonlari(siparis_id);
      CREATE INDEX IF NOT EXISTS idx_siparis_opsiyon_opsiyon ON siparis_opsiyonlari(opsiyon_id);
      CREATE INDEX IF NOT EXISTS idx_odeme_hesap ON odeme(hesap_id);
      CREATE INDEX IF NOT EXISTS idx_odeme_tarih ON odeme(odeme_zamani);
      CREATE INDEX IF NOT EXISTS idx_musteri_telefon ON musteri(telefon);
      CREATE INDEX IF NOT EXISTS idx_stok_hareket_hammadde ON stok_hareket(hammadde_id);
      CREATE INDEX IF NOT EXISTS idx_stok_hareket_tarih ON stok_hareket(created_at);
      CREATE INDEX IF NOT EXISTS idx_kasa_hareket_tarih ON kasa_hareket(created_at);
      CREATE INDEX IF NOT EXISTS idx_masa_bolum ON masa(bolum_id);
      CREATE INDEX IF NOT EXISTS idx_masa_durum ON masa(durum);
      CREATE INDEX IF NOT EXISTS idx_urun_varyant_urun ON urun_varyant(urun_id);
      CREATE INDEX IF NOT EXISTS idx_urun_opsiyonu_urun ON urun_opsiyonu(urun_id);
    `)
  },
}
