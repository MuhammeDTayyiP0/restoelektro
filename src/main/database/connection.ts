// =====================================================
// SQLite Veritabanı Bağlantı Yöneticisi
// better-sqlite3 ile yerel veritabanı yönetimi
// WAL modu ve foreign key desteği ile optimize edilmiş
// =====================================================

import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// Veritabanı örneği (singleton)
let db: Database.Database | null = null

/**
 * Veritabanı dosya yolunu belirler
 * Geliştirme: proje kökü, Üretim: userData klasörü
 */
function veritabaniYoluGetir(): string {
  const kullaniciVeri = app.getPath('userData')
  const veriKlasoru = join(kullaniciVeri, 'data')

  // Veri klasörünü oluştur (yoksa)
  if (!existsSync(veriKlasoru)) {
    mkdirSync(veriKlasoru, { recursive: true })
  }

  return join(veriKlasoru, 'restoelektro.db')
}

/**
 * Veritabanı bağlantısını başlatır ve yapılandırır
 */
export async function veritabaniBaslat(): Promise<void> {
  if (db) {
    console.log('⚠️ Veritabanı zaten bağlı')
    return
  }

  const yol = veritabaniYoluGetir()
  console.log(`📂 Veritabanı yolu: ${yol}`)

  // Veritabanını aç/oluştur
  db = new Database(yol)

  // Performans optimizasyonları
  db.pragma('journal_mode = WAL')        // Write-Ahead Logging — eşzamanlı okuma/yazma
  db.pragma('synchronous = NORMAL')      // Dengeli güvenlik/performans
  db.pragma('foreign_keys = ON')         // Foreign key kısıtlamalarını etkinleştir
  db.pragma('cache_size = -64000')       // 64MB önbellek
  db.pragma('busy_timeout = 5000')       // 5 saniye meşgul bekleme

  // Tabloları oluştur (migration)
  tablolariOlustur()

  console.log('✅ Veritabanı başarıyla başlatıldı')
}

/**
 * Tüm tabloları oluşturur (yoksa)
 */
function tablolariOlustur(): void {
  if (!db) throw new Error('Veritabanı bağlantısı yok')

  // Transaction içinde tüm tabloları oluştur — atomik işlem
  const migration = db.transaction(() => {
    // 1. PERSONEL & YETKİLENDİRME
    db!.exec(`
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
      )
    `)

    db!.exec(`
      CREATE TABLE IF NOT EXISTS yetki (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rol TEXT NOT NULL,
        modul TEXT NOT NULL,
        islem TEXT NOT NULL,
        izin INTEGER DEFAULT 0
      )
    `)

    // 2. MENÜ YÖNETİMİ
    db!.exec(`
      CREATE TABLE IF NOT EXISTS kategori (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL,
        ust_kategori_id INTEGER,
        sira INTEGER DEFAULT 0,
        renk TEXT DEFAULT '#3B82F6',
        ikon TEXT,
        aktif INTEGER DEFAULT 1,
        FOREIGN KEY (ust_kategori_id) REFERENCES kategori(id)
      )
    `)

    db!.exec(`
      CREATE TABLE IF NOT EXISTS urun (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kategori_id INTEGER NOT NULL,
        barkod TEXT,
        ad TEXT NOT NULL,
        kisaltma TEXT,
        fiyat REAL NOT NULL,
        kdv_orani REAL DEFAULT 10,
        birim TEXT DEFAULT 'adet',
        resim_yolu TEXT,
        yazici_grup TEXT DEFAULT 'mutfak',
        aktif INTEGER DEFAULT 1,
        sira INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (kategori_id) REFERENCES kategori(id)
      )
    `)

    db!.exec(`
      CREATE TABLE IF NOT EXISTS urun_varyant (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        urun_id INTEGER NOT NULL,
        ad TEXT NOT NULL,
        fiyat_farki REAL DEFAULT 0,
        aktif INTEGER DEFAULT 1,
        FOREIGN KEY (urun_id) REFERENCES urun(id)
      )
    `)

    db!.exec(`
      CREATE TABLE IF NOT EXISTS urun_opsiyonu (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        urun_id INTEGER NOT NULL,
        ad TEXT NOT NULL,
        fiyat REAL DEFAULT 0,
        aktif INTEGER DEFAULT 1,
        FOREIGN KEY (urun_id) REFERENCES urun(id)
      )
    `)

    // 3. MASA YÖNETİMİ
    db!.exec(`
      CREATE TABLE IF NOT EXISTS bolum (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL,
        aktif INTEGER DEFAULT 1
      )
    `)

    db!.exec(`
      CREATE TABLE IF NOT EXISTS masa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bolum_id INTEGER NOT NULL,
        numara TEXT NOT NULL,
        kapasite INTEGER DEFAULT 4,
        durum TEXT DEFAULT 'bos',
        konum_x INTEGER DEFAULT 0,
        konum_y INTEGER DEFAULT 0,
        aktif INTEGER DEFAULT 1,
        FOREIGN KEY (bolum_id) REFERENCES bolum(id)
      )
    `)

    // 4. HESAP & SİPARİŞ
    db!.exec(`
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
      )
    `)

    db!.exec(`
      CREATE TABLE IF NOT EXISTS musteri_adres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        musteri_id INTEGER NOT NULL,
        adres_baslik TEXT DEFAULT 'Ev',
        adres TEXT NOT NULL,
        ilce TEXT,
        il TEXT,
        varsayilan INTEGER DEFAULT 0,
        FOREIGN KEY (musteri_id) REFERENCES musteri(id)
      )
    `)

    db!.exec(`
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
      )
    `)

    db!.exec(`
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
        FOREIGN KEY (hesap_id) REFERENCES hesap(id),
        FOREIGN KEY (urun_id) REFERENCES urun(id),
        FOREIGN KEY (varyant_id) REFERENCES urun_varyant(id),
        FOREIGN KEY (personel_id) REFERENCES personel(id),
        FOREIGN KEY (ikram_onaylayan_id) REFERENCES personel(id)
      )
    `)

    db!.exec(`
      CREATE TABLE IF NOT EXISTS siparis_opsiyonlari (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        siparis_id INTEGER NOT NULL,
        opsiyon_id INTEGER NOT NULL,
        FOREIGN KEY (siparis_id) REFERENCES siparis(id),
        FOREIGN KEY (opsiyon_id) REFERENCES urun_opsiyonu(id)
      )
    `)

    // 5. ÖDEME
    db!.exec(`
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
      )
    `)

    // 6. FATURA
    db!.exec(`
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
      )
    `)

    // 7. SADAKAT & ÖN ÖDEMELİ KART
    db!.exec(`
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
      )
    `)

    db!.exec(`
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
      )
    `)

    // 8. STOK & REÇETE
    db!.exec(`
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
      )
    `)

    db!.exec(`
      CREATE TABLE IF NOT EXISTS recete (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        urun_id INTEGER NOT NULL,
        hammadde_id INTEGER NOT NULL,
        miktar REAL NOT NULL,
        birim TEXT NOT NULL,
        FOREIGN KEY (urun_id) REFERENCES urun(id),
        FOREIGN KEY (hammadde_id) REFERENCES hammadde(id)
      )
    `)

    db!.exec(`
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
      )
    `)

    // 9. KASA HAREKETLERİ
    db!.exec(`
      CREATE TABLE IF NOT EXISTS kasa (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT NOT NULL,
        aktif INTEGER DEFAULT 1
      )
    `)

    db!.exec(`
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
      )
    `)

    // 10. CALLER ID
    db!.exec(`
      CREATE TABLE IF NOT EXISTS arayan_kayit (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telefon TEXT NOT NULL,
        musteri_id INTEGER,
        arama_zamani DATETIME DEFAULT CURRENT_TIMESTAMP,
        durum TEXT DEFAULT 'cevapsiz',
        FOREIGN KEY (musteri_id) REFERENCES musteri(id)
      )
    `)

    // 11. HARİCİ SİPARİŞLER
    db!.exec(`
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
      )
    `)

    // 12. AYARLAR
    db!.exec(`
      CREATE TABLE IF NOT EXISTS ayar (
        anahtar TEXT PRIMARY KEY,
        deger TEXT,
        aciklama TEXT
      )
    `)

    // İndeksler — sorgu performansı için
    db!.exec(`
      CREATE INDEX IF NOT EXISTS idx_urun_kategori ON urun(kategori_id);
      CREATE INDEX IF NOT EXISTS idx_hesap_masa ON hesap(masa_id);
      CREATE INDEX IF NOT EXISTS idx_hesap_durum ON hesap(durum);
      CREATE INDEX IF NOT EXISTS idx_hesap_tarih ON hesap(acilis_zamani);
      CREATE INDEX IF NOT EXISTS idx_siparis_hesap ON siparis(hesap_id);
      CREATE INDEX IF NOT EXISTS idx_siparis_durum ON siparis(durum);
      CREATE INDEX IF NOT EXISTS idx_odeme_hesap ON odeme(hesap_id);
      CREATE INDEX IF NOT EXISTS idx_musteri_telefon ON musteri(telefon);
      CREATE INDEX IF NOT EXISTS idx_stok_hareket_hammadde ON stok_hareket(hammadde_id);
      CREATE INDEX IF NOT EXISTS idx_kasa_hareket_tarih ON kasa_hareket(created_at);
    `)

    // Migrations
    try { db!.exec('ALTER TABLE bolum ADD COLUMN sira INTEGER DEFAULT 0') } catch (e) { /* sütun zaten var */ }
    try { db!.exec('ALTER TABLE masa ADD COLUMN sira INTEGER DEFAULT 0') } catch (e) { /* sütun zaten var */ }

    console.log('✅ Tüm tablolar ve indeksler oluşturuldu')
  })

  // Migration'ı çalıştır
  migration()

  // Varsayılan veriler ekle
  varsayilanVerileriEkle()
}

/**
 * İlk kurulumda gereken varsayılan verileri ekler
 */
function varsayilanVerileriEkle(): void {
  if (!db) return

  // Admin kullanıcı var mı kontrol et
  const adminVar = db.prepare('SELECT COUNT(*) as sayi FROM personel WHERE rol = ?').get('admin') as any
  if (adminVar.sayi > 0) {
    // Admin var ama garson/kasiyer yoksa onları ekle
    const garsonVar = db.prepare("SELECT COUNT(*) as sayi FROM personel WHERE rol = 'garson'").get() as any
    if (garsonVar.sayi === 0) {
      db.prepare(`INSERT INTO personel (ad, soyad, kullanici_adi, sifre_hash, rol, pin_kodu) VALUES (?, ?, ?, ?, ?, ?)`)
        .run('Ahmet', 'Garson', 'garson1', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9xP6h.k2HEQKAOI8k3x5HYlIjW', 'garson', '1234')
      console.log('✅ Varsayılan garson eklendi (PIN: 1234)')
    }
    const kasiyerVar = db.prepare("SELECT COUNT(*) as sayi FROM personel WHERE rol = 'kasiyer'").get() as any
    if (kasiyerVar.sayi === 0) {
      db.prepare(`INSERT INTO personel (ad, soyad, kullanici_adi, sifre_hash, rol, pin_kodu) VALUES (?, ?, ?, ?, ?, ?)`)
        .run('Ayşe', 'Kasiyer', 'kasiyer1', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9xP6h.k2HEQKAOI8k3x5HYlIjW', 'kasiyer', '5678')
      console.log('✅ Varsayılan kasiyer eklendi (PIN: 5678)')
    }
    return // Zaten kurulmuş
  }

  console.log('📝 Varsayılan veriler ekleniyor...')

  const varsayilanlar = db.transaction(() => {
    // Varsayılan admin kullanıcı (şifre: admin123 — bcrypt hash)
    db!.prepare(`
      INSERT INTO personel (ad, soyad, kullanici_adi, sifre_hash, rol, pin_kodu)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Sistem', 'Yöneticisi', 'admin', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9xP6h.k2HEQKAOI8k3x5HYlIjW', 'admin', '0000')

    // Varsayılan garson (şifre: 1234, pin: 1234)
    db!.prepare(`
      INSERT INTO personel (ad, soyad, kullanici_adi, sifre_hash, rol, pin_kodu)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Ahmet', 'Garson', 'garson1', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9xP6h.k2HEQKAOI8k3x5HYlIjW', 'garson', '1234')

    // Varsayılan kasiyer (şifre: 1234, pin: 5678)
    db!.prepare(`
      INSERT INTO personel (ad, soyad, kullanici_adi, sifre_hash, rol, pin_kodu)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('Ayşe', 'Kasiyer', 'kasiyer1', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9xP6h.k2HEQKAOI8k3x5HYlIjW', 'kasiyer', '5678')

    // Varsayılan kasalar
    db!.prepare('INSERT INTO kasa (ad) VALUES (?)').run('Ana Kasa')
    db!.prepare('INSERT INTO kasa (ad) VALUES (?)').run('Bar Kasası')

    // Varsayılan bölümler
    db!.prepare('INSERT INTO bolum (ad) VALUES (?)').run('Salon')
    db!.prepare('INSERT INTO bolum (ad) VALUES (?)').run('Bahçe')
    db!.prepare('INSERT INTO bolum (ad) VALUES (?)').run('Teras')
    db!.prepare('INSERT INTO bolum (ad) VALUES (?)').run('Bar')

    // Varsayılan masalar — Salon
    for (let i = 1; i <= 12; i++) {
      db!.prepare(`
        INSERT INTO masa (bolum_id, numara, kapasite, konum_x, konum_y)
        VALUES (?, ?, ?, ?, ?)
      `).run(1, `M${i}`, 4, ((i - 1) % 4) * 120 + 50, Math.floor((i - 1) / 4) * 120 + 50)
    }
    // Bahçe masaları
    for (let i = 1; i <= 8; i++) {
      db!.prepare(`
        INSERT INTO masa (bolum_id, numara, kapasite, konum_x, konum_y)
        VALUES (?, ?, ?, ?, ?)
      `).run(2, `B${i}`, 6, ((i - 1) % 4) * 120 + 50, Math.floor((i - 1) / 4) * 120 + 50)
    }
    // Bar masaları
    for (let i = 1; i <= 6; i++) {
      db!.prepare(`
        INSERT INTO masa (bolum_id, numara, kapasite, konum_x, konum_y)
        VALUES (?, ?, ?, ?, ?)
      `).run(4, `BR${i}`, 2, (i - 1) * 100 + 50, 50)
    }

    // Varsayılan kategoriler
    const kategoriler = [
      { ad: 'Başlangıçlar', renk: '#10b981' },
      { ad: 'Ana Yemekler', renk: '#f59e0b' },
      { ad: 'Izgara', renk: '#ef4444' },
      { ad: 'Salatalar', renk: '#22c55e' },
      { ad: 'Pizzalar', renk: '#f97316' },
      { ad: 'Tatlılar', renk: '#ec4899' },
      { ad: 'Soğuk İçecekler', renk: '#06b6d4' },
      { ad: 'Sıcak İçecekler', renk: '#8b5cf6' },
      { ad: 'Alkollü İçecekler', renk: '#6366f1' },
    ]
    for (const kat of kategoriler) {
      db!.prepare('INSERT INTO kategori (ad, renk, sira) VALUES (?, ?, ?)').run(kat.ad, kat.renk, kategoriler.indexOf(kat))
    }

    // Örnek ürünler
    const urunler = [
      // Başlangıçlar (kategori 1)
      { kategori_id: 1, ad: 'Mercimek Çorbası', fiyat: 75, yazici_grup: 'mutfak' },
      { kategori_id: 1, ad: 'Ezogelin Çorbası', fiyat: 75, yazici_grup: 'mutfak' },
      { kategori_id: 1, ad: 'Humus', fiyat: 95, yazici_grup: 'mutfak' },
      { kategori_id: 1, ad: 'Sigara Böreği (4 adet)', fiyat: 110, yazici_grup: 'mutfak' },
      { kategori_id: 1, ad: 'Patates Kızartması', fiyat: 85, yazici_grup: 'mutfak' },
      // Ana Yemekler (kategori 2)
      { kategori_id: 2, ad: 'İskender', fiyat: 280, yazici_grup: 'mutfak' },
      { kategori_id: 2, ad: 'Mantı', fiyat: 190, yazici_grup: 'mutfak' },
      { kategori_id: 2, ad: 'Karnıyarık', fiyat: 195, yazici_grup: 'mutfak' },
      { kategori_id: 2, ad: 'Ali Nazik Kebabı', fiyat: 310, yazici_grup: 'mutfak' },
      // Izgara (kategori 3)
      { kategori_id: 3, ad: 'Adana Kebap', fiyat: 320, yazici_grup: 'mutfak' },
      { kategori_id: 3, ad: 'Urfa Kebap', fiyat: 320, yazici_grup: 'mutfak' },
      { kategori_id: 3, ad: 'Tavuk Şiş', fiyat: 240, yazici_grup: 'mutfak' },
      { kategori_id: 3, ad: 'Kuzu Pirzola', fiyat: 450, yazici_grup: 'mutfak' },
      { kategori_id: 3, ad: 'Karışık Izgara', fiyat: 520, yazici_grup: 'mutfak' },
      // Soğuk İçecekler (kategori 7)
      { kategori_id: 7, ad: 'Ayran', fiyat: 35, yazici_grup: 'bar' },
      { kategori_id: 7, ad: 'Kola', fiyat: 50, yazici_grup: 'bar' },
      { kategori_id: 7, ad: 'Fanta', fiyat: 50, yazici_grup: 'bar' },
      { kategori_id: 7, ad: 'Soda', fiyat: 30, yazici_grup: 'bar' },
      { kategori_id: 7, ad: 'Taze Portakal Suyu', fiyat: 75, yazici_grup: 'bar' },
      // Sıcak İçecekler (kategori 8)
      { kategori_id: 8, ad: 'Türk Kahvesi', fiyat: 60, yazici_grup: 'bar' },
      { kategori_id: 8, ad: 'Çay', fiyat: 25, yazici_grup: 'bar' },
      { kategori_id: 8, ad: 'Espresso', fiyat: 70, yazici_grup: 'bar' },
      { kategori_id: 8, ad: 'Latte', fiyat: 85, yazici_grup: 'bar' },
      { kategori_id: 8, ad: 'Cappuccino', fiyat: 85, yazici_grup: 'bar' },
    ]
    for (const u of urunler) {
      db!.prepare(`
        INSERT INTO urun (kategori_id, ad, fiyat, yazici_grup, kdv_orani)
        VALUES (?, ?, ?, ?, ?)
      `).run(u.kategori_id, u.ad, u.fiyat, u.yazici_grup, 10)
    }

    // Varsayılan ayarlar
    const ayarlar = [
      { anahtar: 'isletme_adi', deger: 'ETİBOL RESTO', aciklama: 'İşletme adı' },
      { anahtar: 'vergi_no', deger: '', aciklama: 'Vergi numarası' },
      { anahtar: 'adres', deger: '', aciklama: 'İşletme adresi' },
      { anahtar: 'telefon', deger: '', aciklama: 'İşletme telefonu' },
      { anahtar: 'para_birimi', deger: '₺', aciklama: 'Para birimi sembolü' },
      { anahtar: 'kdv_orani_varsayilan', deger: '10', aciklama: 'Varsayılan KDV oranı (%)' },
      { anahtar: 'yazici_mutfak', deger: '', aciklama: 'Mutfak yazıcısı adresi' },
      { anahtar: 'yazici_bar', deger: '', aciklama: 'Bar yazıcısı adresi' },
      { anahtar: 'yazici_kasa', deger: '', aciklama: 'Kasa fişi yazıcısı' },
      { anahtar: 'api_port', deger: '3847', aciklama: 'REST API port numarası' },
      { anahtar: 'sadakat_puan_oran', deger: '1', aciklama: 'Her 1 TL için kazanılan puan' },
    ]
    for (const a of ayarlar) {
      db!.prepare('INSERT OR IGNORE INTO ayar (anahtar, deger, aciklama) VALUES (?, ?, ?)').run(a.anahtar, a.deger, a.aciklama)
    }

    // Varsayılan yetkiler — admin her şeyi yapabilir
    const moduller = ['pos', 'rapor', 'stok', 'menu', 'personel', 'ayar', 'musteri', 'kasa']
    const islemler = ['okuma', 'yazma', 'silme', 'iptal', 'ikram', 'indirim']
    const roller: Array<{ rol: string; izinler: Record<string, string[]> }> = [
      {
        rol: 'admin',
        izinler: Object.fromEntries(moduller.map(m => [m, islemler])),
      },
      {
        rol: 'mudur',
        izinler: {
          pos: islemler,
          rapor: ['okuma'],
          stok: ['okuma', 'yazma'],
          menu: ['okuma', 'yazma'],
          personel: ['okuma'],
          musteri: ['okuma', 'yazma'],
          kasa: ['okuma', 'yazma'],
          ayar: ['okuma'],
        },
      },
      {
        rol: 'kasiyer',
        izinler: {
          pos: ['okuma', 'yazma', 'indirim'],
          rapor: ['okuma'],
          musteri: ['okuma'],
          kasa: ['okuma', 'yazma'],
        },
      },
      {
        rol: 'garson',
        izinler: {
          pos: ['okuma', 'yazma'],
          musteri: ['okuma'],
        },
      },
      {
        rol: 'mutfak',
        izinler: {
          pos: ['okuma'],
          stok: ['okuma'],
        },
      },
    ]
    for (const { rol, izinler } of roller) {
      for (const modul of moduller) {
        for (const islem of islemler) {
          const izin = izinler[modul]?.includes(islem) ? 1 : 0
          db!.prepare('INSERT INTO yetki (rol, modul, islem, izin) VALUES (?, ?, ?, ?)').run(rol, modul, islem, izin)
        }
      }
    }
  })

  varsayilanlar()
  console.log('✅ Varsayılan veriler eklendi')
}

/**
 * Veritabanı bağlantısını döndürür
 */
export function veritabaniGetir(): Database.Database {
  if (!db) {
    throw new Error('Veritabanı başlatılmamış! Önce veritabaniBaslat() çağrılmalı.')
  }
  return db
}

/**
 * Veritabanı bağlantısını kapatır
 */
export function veritabaniKapat(): void {
  if (db) {
    db.close()
    db = null
    console.log('🔒 Veritabanı bağlantısı kapatıldı')
  }
}
