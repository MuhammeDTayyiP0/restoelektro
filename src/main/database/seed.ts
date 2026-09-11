// =====================================================
// ETİBOL POS — Varsayılan Menü & Tohumlama (Seed) Servisi
// Izgara, Soğuk İçecekler, Sıcak İçecekler — yerel ürün görselleri
// Tamamen İdempotent & Sıfır Veri Kaybı Garantisi
// =====================================================

import type Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

export interface TohumUrunOpsiyon {
  ad: string
  fiyat?: number
  fiyat_farki?: number
}

export interface TohumUrun {
  ad: string
  aciklama: string
  kisaltma?: string
  fiyat: number
  kdv_orani?: number
  birim: string
  satis_turleri?: Array<{ birim: string; fiyat: number }>
  porsiyon_fiyati?: number | null
  kilo_fiyati?: number | null
  resim_yolu: string
  dosya_adi: string
  resim_url: string
  yazici_grup: 'mutfak' | 'bar' | 'firin' | 'kasa'
  sira?: number
  secenekler?: TohumUrunOpsiyon[]
  alternatifAdlar?: string[]
}

export interface TohumKategori {
  ad: string
  alternatifAdlar?: string[]
  renk: string
  ikon?: string
  sira: number
  urunler: TohumUrun[]
}

/**
 * Ürün görsellerinin kopyalanacağı ve sunulacağı tüm yerel dizinleri döndürür
 */
export function urunGorselDizinleriniGetir(): string[] {
  const dizinler: string[] = [
    path.join(process.cwd(), 'public', 'uploads', 'products'),
    path.join(process.cwd(), 'uploads', 'products')
  ]

  // Paketlenmiş Electron extraResources ve unpacked yolları
  if (process.resourcesPath) {
    dizinler.push(path.join(process.resourcesPath, 'uploads', 'products'))
    dizinler.push(path.join(process.resourcesPath, 'public', 'uploads', 'products'))
    dizinler.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'public', 'uploads', 'products'))
    dizinler.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'uploads', 'products'))
  }

  // Modül ve derleme yolları
  dizinler.push(path.join(__dirname, '..', 'renderer', 'uploads', 'products'))
  dizinler.push(path.join(__dirname, 'uploads', 'products'))
  dizinler.push(path.join(process.cwd(), 'dist', 'uploads', 'products'))
  dizinler.push(path.join(process.cwd(), 'out', 'uploads', 'products'))

  try {
    const { app } = require('electron')
    if (app && app.getPath) {
      dizinler.push(path.join(app.getPath('userData'), 'public', 'uploads', 'products'))
      dizinler.push(path.join(app.getPath('userData'), 'uploads', 'products'))
    }
  } catch {}

  const appData = process.env.APPDATA
  if (appData) {
    dizinler.push(path.join(appData, 'ETİBOL POS', 'public', 'uploads', 'products'))
    dizinler.push(path.join(appData, 'ETİBOL POS', 'uploads', 'products'))
    dizinler.push(path.join(appData, 'etibol-resto', 'public', 'uploads', 'products'))
    dizinler.push(path.join(appData, 'etibol-resto', 'uploads', 'products'))
  }

  for (const d of dizinler) {
    if (!fs.existsSync(d)) {
      try {
        fs.mkdirSync(d, { recursive: true })
      } catch {}
    }
  }

  return Array.from(new Set(dizinler))
}

/**
 * Görseli internetten indirip yerel uploads/products klasörlerine yazar.
 * Eğer dosya yerel bundle veya herhangi bir dizinde zaten varsa indirme yapmadan diğer dizinleri senkronize eder.
 */
export async function gorseliIndirVeKaydet(url: string, dosyaAdi: string): Promise<string> {
  const hedefDizinler = urunGorselDizinleriniGetir()

  // 1. Önce tüm aday yerel dizinleri kontrol et (Paket/build içi hazır görseller)
  let bulunanKaynakYol: string | null = null
  for (const d of hedefDizinler) {
    const adayDosya = path.join(d, dosyaAdi)
    if (fs.existsSync(adayDosya)) {
      try {
        if (fs.statSync(adayDosya).size > 1000) {
          bulunanKaynakYol = adayDosya
          break
        }
      } catch {}
    }
  }

  // Eğer yerelde bulunduysa, diğer tüm dizinlere kopyalayıp hemen dön (Çevrimdışı/production garantisi)
  if (bulunanKaynakYol) {
    for (const d of hedefDizinler) {
      const digerHedef = path.join(d, dosyaAdi)
      if (digerHedef !== bulunanKaynakYol && !fs.existsSync(digerHedef)) {
        try { fs.copyFileSync(bulunanKaynakYol, digerHedef) } catch {}
      }
    }
    return `/uploads/products/${dosyaAdi}`
  }

  // 2. Yerelde bulunamazsa internetten indir
  if (!url) {
    return `/uploads/products/${dosyaAdi}`
  }
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) })
    if (res.ok) {
      const buffer = Buffer.from(await res.arrayBuffer())
      for (const d of hedefDizinler) {
        try {
          fs.writeFileSync(path.join(d, dosyaAdi), buffer)
        } catch {}
      }
      console.log(`📥 [Seed] ${dosyaAdi} başarıyla indirildi (${buffer.length} byte)`)
    } else {
      console.warn(`⚠️ [Seed] Görsel indirme başarısız (${dosyaAdi}): HTTP ${res.status}`)
    }
  } catch (err: any) {
    console.warn(`⚠️ [Seed] ${dosyaAdi} indirilirken hata:`, err.message)
  }

  return `/uploads/products/${dosyaAdi}`
}

/**
 * İlk kurulum varsayılan menüsü: Izgara, Soğuk İçecekler, Sıcak İçecekler
 */
export const VARSAYILAN_MENU_VERILERI: TohumKategori[] = [
  {
    ad: 'Izgara',
    alternatifAdlar: ['Izgaralar'],
    renk: '#EF4444',
    ikon: 'flame',
    sira: 1,
    urunler: [
      {
        ad: 'Karışık Izgara',
        aciklama: 'Adana, kuşbaşı, tavuk ve pirzola karışık ızgara tabağı',
        kisaltma: 'Karışık Izgara',
        fiyat: 1600,
        kdv_orani: 10,
        birim: 'KG',
        satis_turleri: [{ birim: 'kg', fiyat: 1600 }],
        kilo_fiyati: 1600,
        dosya_adi: 'karisik-izgara.jpg',
        resim_yolu: '/uploads/products/karisik-izgara.jpg',
        resim_url: '',
        yazici_grup: 'mutfak',
        sira: 1
      },
      {
        ad: 'Adana Kebap',
        aciklama: 'Zırh kıyması Adana kebap, közlenmiş biber ve domates ile',
        kisaltma: 'Adana Kebap',
        fiyat: 350,
        kdv_orani: 10,
        birim: 'Porsiyon',
        satis_turleri: [
          { birim: 'porsiyon', fiyat: 350 },
          { birim: 'kg', fiyat: 1600 }
        ],
        porsiyon_fiyati: 350,
        kilo_fiyati: 1600,
        dosya_adi: 'adana-kebap.jpg',
        resim_yolu: '/uploads/products/adana-kebap.jpg',
        resim_url: '',
        yazici_grup: 'mutfak',
        sira: 2
      },
      {
        ad: 'Kuşbaşı',
        aciklama: 'Izgara kuzu kuşbaşı, közlenmiş garnitürler',
        kisaltma: 'Kuşbaşı',
        fiyat: 350,
        kdv_orani: 10,
        birim: 'Porsiyon',
        satis_turleri: [
          { birim: 'porsiyon', fiyat: 350 },
          { birim: 'kg', fiyat: 1600 }
        ],
        porsiyon_fiyati: 350,
        kilo_fiyati: 1600,
        dosya_adi: 'kusbasi.jpg',
        resim_yolu: '/uploads/products/kusbasi.jpg',
        resim_url: '',
        yazici_grup: 'mutfak',
        sira: 3
      },
      {
        ad: 'Tavuk Şiş',
        aciklama: 'Izgara tavuk göğsü şiş',
        kisaltma: 'Tavuk Şiş',
        fiyat: 350,
        kdv_orani: 10,
        birim: 'Porsiyon',
        satis_turleri: [
          { birim: 'porsiyon', fiyat: 350 },
          { birim: 'kg', fiyat: 1200 }
        ],
        porsiyon_fiyati: 350,
        kilo_fiyati: 1200,
        dosya_adi: 'tavuk-sis.jpg',
        resim_yolu: '/uploads/products/tavuk-sis.jpg',
        resim_url: '',
        yazici_grup: 'mutfak',
        sira: 4
      },
      {
        ad: 'Tavuk Kanat',
        aciklama: 'Izgarada kızarmış tavuk kanatları',
        kisaltma: 'Tavuk Kanat',
        fiyat: 350,
        kdv_orani: 10,
        birim: 'Porsiyon',
        satis_turleri: [
          { birim: 'porsiyon', fiyat: 350 },
          { birim: 'kg', fiyat: 1200 }
        ],
        porsiyon_fiyati: 350,
        kilo_fiyati: 1200,
        dosya_adi: 'tavuk-kanat.jpg',
        resim_yolu: '/uploads/products/tavuk-kanat.jpg',
        resim_url: '',
        yazici_grup: 'mutfak',
        sira: 5
      },
      {
        ad: 'Pirzola',
        aciklama: 'Izgara kuzu pirzola',
        kisaltma: 'Pirzola',
        fiyat: 550,
        kdv_orani: 10,
        birim: 'Porsiyon',
        satis_turleri: [
          { birim: 'porsiyon', fiyat: 550 },
          { birim: 'kg', fiyat: 1600 }
        ],
        porsiyon_fiyati: 550,
        kilo_fiyati: 1600,
        dosya_adi: 'pirzola.jpg',
        resim_yolu: '/uploads/products/pirzola.jpg',
        resim_url: '',
        yazici_grup: 'mutfak',
        sira: 6
      }
    ]
  },
  {
    ad: 'Soğuk İçecekler',
    alternatifAdlar: ['İçecekler', 'İçecek'],
    renk: '#06B6D4',
    ikon: 'glass-water',
    sira: 2,
    urunler: [
      {
        ad: 'Pepsi Cam',
        aciklama: 'Cam şişe Pepsi',
        kisaltma: 'Pepsi Cam',
        fiyat: 50,
        kdv_orani: 10,
        birim: 'Adet',
        satis_turleri: [{ birim: 'adet', fiyat: 50 }],
        dosya_adi: 'pepsi-cam.jpg',
        resim_yolu: '/uploads/products/pepsi-cam.jpg',
        resim_url: '',
        yazici_grup: 'bar',
        sira: 1
      },
      {
        ad: 'Coca-Cola Cam',
        aciklama: 'Cam şişe Coca-Cola',
        kisaltma: 'Coca-Cola Cam',
        fiyat: 50,
        kdv_orani: 10,
        birim: 'Adet',
        satis_turleri: [{ birim: 'adet', fiyat: 50 }],
        dosya_adi: 'coca-cola-cam.jpg',
        resim_yolu: '/uploads/products/coca-cola-cam.jpg',
        resim_url: '',
        yazici_grup: 'bar',
        sira: 2
      },
      {
        ad: 'FuseTea Karpuz',
        aciklama: 'Karpuz aromalı soğuk çay',
        kisaltma: 'FuseTea Karpuz',
        fiyat: 75,
        kdv_orani: 10,
        birim: 'Adet',
        satis_turleri: [{ birim: 'adet', fiyat: 75 }],
        dosya_adi: 'fusetea-karpuz.jpg',
        resim_yolu: '/uploads/products/fusetea-karpuz.jpg',
        resim_url: '',
        yazici_grup: 'bar',
        sira: 3
      },
      {
        ad: 'FuseTea Mango',
        aciklama: 'Mango aromalı soğuk çay',
        kisaltma: 'FuseTea Mango',
        fiyat: 75,
        kdv_orani: 10,
        birim: 'Adet',
        satis_turleri: [{ birim: 'adet', fiyat: 75 }],
        dosya_adi: 'fusetea-mango.jpg',
        resim_yolu: '/uploads/products/fusetea-mango.jpg',
        resim_url: '',
        yazici_grup: 'bar',
        sira: 4
      },
      {
        ad: 'FuseTea Çilek',
        aciklama: 'Çilek aromalı soğuk çay',
        kisaltma: 'FuseTea Çilek',
        fiyat: 75,
        kdv_orani: 10,
        birim: 'Adet',
        satis_turleri: [{ birim: 'adet', fiyat: 75 }],
        dosya_adi: 'fusetea-cilek.jpg',
        resim_yolu: '/uploads/products/fusetea-cilek.jpg',
        resim_url: '',
        yazici_grup: 'bar',
        sira: 5
      },
      {
        ad: 'FuseTea Şeftali',
        aciklama: 'Şeftali aromalı soğuk çay',
        kisaltma: 'FuseTea Şeftali',
        fiyat: 75,
        kdv_orani: 10,
        birim: 'Adet',
        satis_turleri: [{ birim: 'adet', fiyat: 75 }],
        dosya_adi: 'fusetea-seftali.jpg',
        resim_yolu: '/uploads/products/fusetea-seftali.jpg',
        resim_url: '',
        yazici_grup: 'bar',
        sira: 6
      },
      {
        ad: 'Beypazarı Soda',
        aciklama: 'Beypazarı cam şişe sade maden suyu',
        kisaltma: 'Beypazarı',
        fiyat: 30,
        kdv_orani: 10,
        birim: 'Adet',
        satis_turleri: [{ birim: 'adet', fiyat: 30 }],
        dosya_adi: 'sade-soda.jpg',
        resim_yolu: '/uploads/products/sade-soda.jpg',
        resim_url: '',
        yazici_grup: 'bar',
        sira: 7,
        alternatifAdlar: ['Kızılay Soda', 'Sade Soda', 'Kızılay']
      },
      {
        ad: 'Erikli Su',
        aciklama: 'Erikli 0.5L pet şişe içme suyu',
        kisaltma: 'Erikli',
        fiyat: 15,
        kdv_orani: 10,
        birim: 'Adet',
        satis_turleri: [{ birim: 'adet', fiyat: 15 }],
        dosya_adi: 'su.jpg',
        resim_yolu: '/uploads/products/su.jpg',
        resim_url: '',
        yazici_grup: 'bar',
        sira: 8
      },
      {
        ad: 'Coca-Cola Kutu',
        aciklama: 'Kutu Coca-Cola',
        kisaltma: 'Coca-Cola Kutu',
        fiyat: 75,
        kdv_orani: 10,
        birim: 'Adet',
        satis_turleri: [{ birim: 'adet', fiyat: 75 }],
        dosya_adi: 'coca-cola-kutu.jpg',
        resim_yolu: '/uploads/products/coca-cola-kutu.jpg',
        resim_url: '',
        yazici_grup: 'bar',
        sira: 9
      },
      {
        ad: 'Fanta Kutu',
        aciklama: 'Kutu Fanta',
        kisaltma: 'Fanta Kutu',
        fiyat: 75,
        kdv_orani: 10,
        birim: 'Adet',
        satis_turleri: [{ birim: 'adet', fiyat: 75 }],
        dosya_adi: 'fanta-kutu.jpg',
        resim_yolu: '/uploads/products/fanta-kutu.jpg',
        resim_url: '',
        yazici_grup: 'bar',
        sira: 10
      },
      {
        ad: 'Pepsi Kutu',
        aciklama: 'Kutu Pepsi',
        kisaltma: 'Pepsi Kutu',
        fiyat: 75,
        kdv_orani: 10,
        birim: 'Adet',
        satis_turleri: [{ birim: 'adet', fiyat: 75 }],
        dosya_adi: 'pepsi-kutu.jpg',
        resim_yolu: '/uploads/products/pepsi-kutu.jpg',
        resim_url: '',
        yazici_grup: 'bar',
        sira: 11
      },
      {
        ad: 'Adaman Şalgam (Acılı/Acısız)',
        aciklama: 'Adaman şalgam suyu, acılı veya acısız',
        kisaltma: 'Adaman Şalgam',
        fiyat: 50,
        kdv_orani: 10,
        birim: 'Adet',
        satis_turleri: [{ birim: 'adet', fiyat: 50 }],
        dosya_adi: 'salgam.jpg',
        resim_yolu: '/uploads/products/salgam.jpg',
        resim_url: '',
        yazici_grup: 'bar',
        sira: 12,
        alternatifAdlar: ['Doğanay Şalgam (Acılı/Acısız)', 'Şalgam (Acılı/Acısız)', 'Doğanay Şalgam', 'Şalgam'],
        secenekler: [
          { ad: 'Acılı', fiyat: 0, fiyat_farki: 0 },
          { ad: 'Acısız', fiyat: 0, fiyat_farki: 0 }
        ]
      },
      {
        ad: 'Açık Ayran',
        aciklama: 'Köpüklü açık ayran',
        kisaltma: 'Açık Ayran',
        fiyat: 50,
        kdv_orani: 10,
        birim: 'Adet',
        satis_turleri: [{ birim: 'adet', fiyat: 50 }],
        dosya_adi: 'acik-ayran.jpg',
        resim_yolu: '/uploads/products/acik-ayran.jpg',
        resim_url: '',
        yazici_grup: 'bar',
        sira: 13
      }
    ]
  },
  {
    ad: 'Sıcak İçecekler',
    alternatifAdlar: ['Sıcaklar', 'Çay Kahve'],
    renk: '#D97706',
    ikon: 'coffee',
    sira: 3,
    urunler: [
      {
        ad: 'Çay',
        aciklama: 'İnce belli bardakta demli çay',
        kisaltma: 'Çay',
        fiyat: 15,
        kdv_orani: 10,
        birim: 'Adet',
        satis_turleri: [{ birim: 'adet', fiyat: 15 }],
        dosya_adi: 'cay.jpg',
        resim_yolu: '/uploads/products/cay.jpg',
        resim_url: '',
        yazici_grup: 'bar',
        sira: 1
      },
      {
        ad: 'Kahve',
        aciklama: 'Fincanda sıcak kahve',
        kisaltma: 'Kahve',
        fiyat: 50,
        kdv_orani: 10,
        birim: 'Adet',
        satis_turleri: [{ birim: 'adet', fiyat: 50 }],
        dosya_adi: 'kahve.jpg',
        resim_yolu: '/uploads/products/kahve.jpg',
        resim_url: '',
        yazici_grup: 'bar',
        sira: 2
      }
    ]
  }
]

/**
 * Veritabanını tamamen temizler ve SADECE yukarıdaki Izgara & Soğuk İçecekler ürünlerini tohumlar.
 * Görselleri yerel uploads/products/ klasörüne indirir ve DB'ye yerel yol (/uploads/products/...) olarak kaydeder.
 */
export function varsayilanIzgaraVeIcecekleriEkle(db: Database.Database): void {
  // İlk Kurulum Kontrolü (First-Time Initialization Only)
  // Eğer veritabanında zaten kayıtlı kategori veya ürün varsa,
  // mevcut verileri (kullanıcının eklediği/düzenlediği) korumak için işlemi atla.
  const kategoriSayisi = db.prepare('SELECT COUNT(*) as count FROM kategori').get() as { count: number }
  const urunSayisi = db.prepare('SELECT COUNT(*) as count FROM urun').get() as { count: number }

  if (kategoriSayisi.count > 0 || urunSayisi.count > 0) {
    console.log('🌱 [Seed] Veritabanında mevcut veri bulundu. Varsayılan menü yüklemesi atlanıyor. (Mevcut veriler korundu)')
    return
  }

  const kategoriSutunlari = (db.prepare('PRAGMA table_info(kategori)').all() as Array<{ name: string }>).map(c => c.name.toLowerCase())
  const urunSutunlari = (db.prepare('PRAGMA table_info(urun)').all() as Array<{ name: string }>).map(c => c.name.toLowerCase())
  const siraNoVar = kategoriSutunlari.includes('sira_no')
  const porsiyonFiyatVar = urunSutunlari.includes('porsiyon_fiyati')
  const kiloFiyatVar = urunSutunlari.includes('kilo_fiyati')

  console.log('🌱 [Seed] Veritabanı boş, varsayılan menü kategorileri ve ürünleri yükleniyor (İlk Kurulum)...')

  // 2. Görsellerin yerel klasörlerde mevcut olduğundan emin ol
  for (const kat of VARSAYILAN_MENU_VERILERI) {
    for (const urun of kat.urunler) {
      if (urun.resim_url) {
        gorseliIndirVeKaydet(urun.resim_url, urun.dosya_adi).catch(() => {})
      } else {
        gorseliIndirVeKaydet('', urun.dosya_adi).catch(() => {})
      }
    }
  }

  // 3. Kategorileri ve ürünleri güvenli, idempotent şekilde ekle/güncelle (Foreign key hatası olmadan)
  for (const kat of VARSAYILAN_MENU_VERILERI) {
    let kategoriRow = db.prepare('SELECT id FROM kategori WHERE LOWER(ad) = LOWER(?)').get(kat.ad) as { id: number } | undefined

    if (!kategoriRow && kat.alternatifAdlar && kat.alternatifAdlar.length > 0) {
      for (const altAd of kat.alternatifAdlar) {
        kategoriRow = db.prepare('SELECT id FROM kategori WHERE LOWER(ad) = LOWER(?)').get(altAd) as { id: number } | undefined
        if (kategoriRow) break
      }
    }

    let kategoriId: number
    if (kategoriRow) {
      kategoriId = kategoriRow.id
      if (siraNoVar) {
        db.prepare(`
          UPDATE kategori
          SET ad = ?, renk = COALESCE(?, renk), ikon = COALESCE(?, ikon), sira = ?, sira_no = COALESCE(sira_no, ?), aktif = 1
          WHERE id = ?
        `).run(kat.ad, kat.renk, kat.ikon || null, kat.sira, kat.sira, kategoriId)
      } else {
        db.prepare(`
          UPDATE kategori
          SET ad = ?, renk = COALESCE(?, renk), ikon = COALESCE(?, ikon), sira = ?, aktif = 1
          WHERE id = ?
        `).run(kat.ad, kat.renk, kat.ikon || null, kat.sira, kategoriId)
      }
    } else {
      const katSonuc = siraNoVar
        ? db.prepare(`
            INSERT INTO kategori (ad, renk, ikon, sira, sira_no, aktif)
            VALUES (?, ?, ?, ?, ?, 1)
          `).run(kat.ad, kat.renk, kat.ikon || null, kat.sira, kat.sira)
        : db.prepare(`
            INSERT INTO kategori (ad, renk, ikon, sira, aktif)
            VALUES (?, ?, ?, ?, 1)
          `).run(kat.ad, kat.renk, kat.ikon || null, kat.sira)
      kategoriId = Number(katSonuc.lastInsertRowid)
      console.log(`➕ [Seed] Yeni Kategori: ${kat.ad} (ID: ${kategoriId})`)
    }

    for (const urun of kat.urunler) {
      let urunRow = db.prepare('SELECT id FROM urun WHERE LOWER(ad) = LOWER(?)').get(urun.ad) as { id: number } | undefined
      if (!urunRow && urun.alternatifAdlar && urun.alternatifAdlar.length > 0) {
        for (const altAd of urun.alternatifAdlar) {
          urunRow = db.prepare('SELECT id FROM urun WHERE LOWER(ad) = LOWER(?)').get(altAd) as { id: number } | undefined
          if (urunRow) break
        }
      }
      const satisTurleriStr = JSON.stringify(urun.satis_turleri || [{ birim: urun.birim.toLowerCase(), fiyat: urun.fiyat }])

      let urunId: number
      const porsiyonFiyat = urun.porsiyon_fiyati ?? (urun.satis_turleri?.find(t => t.birim === 'porsiyon')?.fiyat ?? null)
      const kiloFiyat = urun.kilo_fiyati ?? (urun.satis_turleri?.find(t => t.birim === 'kg' || t.birim === 'kilo')?.fiyat ?? null)

      if (urunRow) {
        urunId = urunRow.id
        if (porsiyonFiyatVar && kiloFiyatVar) {
          db.prepare(`
            UPDATE urun 
            SET kategori_id = ?, ad = ?, kisaltma = ?, aciklama = ?, fiyat = ?, kdv_orani = ?, birim = ?, resim_yolu = ?, yazici_grup = ?, sira = ?, satis_turleri = ?, porsiyon_fiyati = ?, kilo_fiyati = ?, aktif = 1
            WHERE id = ?
          `).run(
            kategoriId,
            urun.ad,
            urun.kisaltma || urun.ad,
            urun.aciklama,
            urun.fiyat,
            urun.kdv_orani || 10,
            urun.birim,
            urun.resim_yolu,
            urun.yazici_grup,
            urun.sira || 0,
            satisTurleriStr,
            porsiyonFiyat,
            kiloFiyat,
            urunId
          )
        } else {
          db.prepare(`
            UPDATE urun 
            SET kategori_id = ?, ad = ?, kisaltma = ?, aciklama = ?, fiyat = ?, kdv_orani = ?, birim = ?, resim_yolu = ?, yazici_grup = ?, sira = ?, satis_turleri = ?, aktif = 1
            WHERE id = ?
          `).run(
            kategoriId,
            urun.ad,
            urun.kisaltma || urun.ad,
            urun.aciklama,
            urun.fiyat,
            urun.kdv_orani || 10,
            urun.birim,
            urun.resim_yolu,
            urun.yazici_grup,
            urun.sira || 0,
            satisTurleriStr,
            urunId
          )
        }
      } else {
        if (porsiyonFiyatVar && kiloFiyatVar) {
          const urunSonuc = db.prepare(`
            INSERT INTO urun (kategori_id, ad, kisaltma, aciklama, fiyat, kdv_orani, birim, resim_yolu, yazici_grup, sira, satis_turleri, porsiyon_fiyati, kilo_fiyati, aktif)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `).run(
            kategoriId,
            urun.ad,
            urun.kisaltma || urun.ad,
            urun.aciklama,
            urun.fiyat,
            urun.kdv_orani || 10,
            urun.birim,
            urun.resim_yolu,
            urun.yazici_grup,
            urun.sira || 0,
            satisTurleriStr,
            porsiyonFiyat,
            kiloFiyat
          )
          urunId = Number(urunSonuc.lastInsertRowid)
        } else {
          const urunSonuc = db.prepare(`
            INSERT INTO urun (kategori_id, ad, kisaltma, aciklama, fiyat, kdv_orani, birim, resim_yolu, yazici_grup, sira, satis_turleri, aktif)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `).run(
            kategoriId,
            urun.ad,
            urun.kisaltma || urun.ad,
            urun.aciklama,
            urun.fiyat,
            urun.kdv_orani || 10,
            urun.birim,
            urun.resim_yolu,
            urun.yazici_grup,
            urun.sira || 0,
            satisTurleriStr
          )
          urunId = Number(urunSonuc.lastInsertRowid)
        }
        console.log(`  └─ ➕ [Seed] Ürün: ${urun.ad} (ID: ${urunId}, ${urun.fiyat}₺, ${urun.birim}) -> Görsel: ${urun.resim_yolu}`)
      }

      // Seçenekler & Varyantlar
      if (urun.secenekler && urun.secenekler.length > 0) {
        for (const secenek of urun.secenekler) {
          const opsiyonVar = db.prepare('SELECT id FROM urun_opsiyonu WHERE urun_id = ? AND LOWER(ad) = LOWER(?)').get(urunId, secenek.ad)
          if (!opsiyonVar) {
            db.prepare(`
              INSERT INTO urun_opsiyonu (urun_id, ad, fiyat, aktif)
              VALUES (?, ?, ?, 1)
            `).run(urunId, secenek.ad, secenek.fiyat || 0)
          }

          const varyantVar = db.prepare('SELECT id FROM urun_varyant WHERE urun_id = ? AND LOWER(ad) = LOWER(?)').get(urunId, secenek.ad)
          if (!varyantVar) {
            db.prepare(`
              INSERT INTO urun_varyant (urun_id, ad, fiyat_farki, aktif)
              VALUES (?, ?, ?, 1)
            `).run(urunId, secenek.ad, secenek.fiyat_farki || 0)
          }
        }
      }
    }
  }

  console.log('✅ [Seed] Menü verileri başarıyla senkronize edildi.')
}

