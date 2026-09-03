// =====================================================
// ETİBOL POS — Varsayılan Menü & Tohumlama (Seed) Servisi
// Izgaralar, İçecekler, Unsplash CDN Görselleri & Varyantlar
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
  resim_yolu: string
  dosya_adi: string
  resim_url: string
  yazici_grup: 'mutfak' | 'bar' | 'firin' | 'kasa'
  sira?: number
  secenekler?: TohumUrunOpsiyon[]
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
 * SADECE talep edilen Izgara ve Soğuk İçecekler menü yapısı
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
        ad: 'Adana Kebap',
        aciklama: 'Zırh kıyması Adana Kebap, közlenmiş biber ve domates ile lavaş üstünde',
        kisaltma: 'Adana Kebap',
        fiyat: 350,
        kdv_orani: 10,
        birim: 'Porsiyon',
        satis_turleri: [
          { birim: 'porsiyon', fiyat: 350 },
          { birim: 'kg', fiyat: 1400 }
        ],
        dosya_adi: 'adana-kebap.jpg',
        resim_yolu: '/uploads/products/adana-kebap.jpg',
        resim_url: 'https://images.unsplash.com/photo-1644364935906-792b2245a2c0?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'mutfak',
        sira: 1
      },
      {
        ad: 'Kuşbaşı',
        aciklama: 'Şişte pişmiş kuzu kuşbaşı kebap, közlenmiş garnitürler',
        kisaltma: 'Kuşbaşı',
        fiyat: 380,
        kdv_orani: 10,
        birim: 'Porsiyon',
        satis_turleri: [
          { birim: 'porsiyon', fiyat: 380 },
          { birim: 'kg', fiyat: 1500 }
        ],
        dosya_adi: 'kusbasi.jpg',
        resim_yolu: '/uploads/products/kusbasi.jpg',
        resim_url: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'mutfak',
        sira: 2
      },
      {
        ad: 'Tavuk Şiş',
        aciklama: 'Izgara tavuk göğsünden ızgara şiş kebap',
        kisaltma: 'Tavuk Şiş',
        fiyat: 260,
        kdv_orani: 10,
        birim: 'Porsiyon',
        satis_turleri: [
          { birim: 'porsiyon', fiyat: 260 },
          { birim: 'kg', fiyat: 950 }
        ],
        dosya_adi: 'tavuk-sis.jpg',
        resim_yolu: '/uploads/products/tavuk-sis.jpg',
        resim_url: 'https://images.unsplash.com/photo-1779358964755-75464e144187?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'mutfak',
        sira: 3
      },
      {
        ad: 'Tavuk Kanat',
        aciklama: 'Izgarada kızarmış tavuk kanatları',
        kisaltma: 'Tavuk Kanat',
        fiyat: 270,
        kdv_orani: 10,
        birim: 'Porsiyon',
        satis_turleri: [
          { birim: 'porsiyon', fiyat: 270 },
          { birim: 'kg', fiyat: 1000 }
        ],
        dosya_adi: 'tavuk-kanat.jpg',
        resim_yolu: '/uploads/products/tavuk-kanat.jpg',
        resim_url: 'https://images.unsplash.com/photo-1722490967033-c23909ed5f09?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'mutfak',
        sira: 4
      },
      {
        ad: 'Pirzola',
        aciklama: 'Izgara kuzu pirzola',
        kisaltma: 'Pirzola',
        fiyat: 450,
        kdv_orani: 10,
        birim: 'Porsiyon',
        satis_turleri: [
          { birim: 'porsiyon', fiyat: 450 },
          { birim: 'kg', fiyat: 1800 }
        ],
        dosya_adi: 'pirzola.jpg',
        resim_yolu: '/uploads/products/pirzola.jpg',
        resim_url: 'https://images.unsplash.com/photo-1766589152485-9aafd9812a19?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'mutfak',
        sira: 5
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
        ad: 'Coca-Cola Kutu',
        aciklama: 'Kırmızı Coca-Cola kutu içecek',
        kisaltma: 'Coca-Cola Kutu',
        fiyat: 50,
        kdv_orani: 10,
        birim: 'Adet',
        dosya_adi: 'coca-cola-kutu.jpg',
        resim_yolu: '/uploads/products/coca-cola-kutu.jpg',
        resim_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'bar',
        sira: 1
      },
      {
        ad: 'Fanta Kutu',
        aciklama: 'Turuncu Fanta kutu içecek',
        kisaltma: 'Fanta Kutu',
        fiyat: 50,
        kdv_orani: 10,
        birim: 'Adet',
        dosya_adi: 'fanta-kutu.jpg',
        resim_yolu: '/uploads/products/fanta-kutu.jpg',
        resim_url: 'https://images.unsplash.com/photo-1624517452488-04869289c4ca?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'bar',
        sira: 2
      },
      {
        ad: 'Pepsi Kutu',
        aciklama: 'Mavi Pepsi kutu içecek',
        kisaltma: 'Pepsi Kutu',
        fiyat: 50,
        kdv_orani: 10,
        birim: 'Adet',
        dosya_adi: 'pepsi-kutu.jpg',
        resim_yolu: '/uploads/products/pepsi-kutu.jpg',
        resim_url: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'bar',
        sira: 3
      },
      {
        ad: 'Şalgam',
        aciklama: 'Cam bardakta kırmızı şalgam suyu',
        kisaltma: 'Acılı / Acısız Şalgam',
        fiyat: 40,
        kdv_orani: 10,
        birim: 'Adet',
        dosya_adi: 'salgam.jpg',
        resim_yolu: '/uploads/products/salgam.jpg',
        resim_url: 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'bar',
        sira: 4,
        secenekler: [
          { ad: 'Acılı', fiyat: 0, fiyat_farki: 0 },
          { ad: 'Acısız', fiyat: 0, fiyat_farki: 0 }
        ]
      },
      {
        ad: 'Açık Ayran',
        aciklama: 'Bakır Maşrapada köpüklü açık ayran',
        kisaltma: 'Açık Ayran',
        fiyat: 35,
        kdv_orani: 10,
        birim: 'Adet',
        dosya_adi: 'acik-ayran.jpg',
        resim_yolu: '/uploads/products/acik-ayran.jpg',
        resim_url: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'bar',
        sira: 5
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

  console.log('🌱 [Seed] Veritabanı boş, varsayılan menü kategorileri ve ürünleri yükleniyor (İlk Kurulum)...')

  // 2. Görsellerin yerel klasörlerde mevcut olduğundan emin ol (arka planda kontrol / indirme)
  for (const kat of VARSAYILAN_MENU_VERILERI) {
    for (const urun of kat.urunler) {
      gorseliIndirVeKaydet(urun.resim_url, urun.dosya_adi).catch(() => {})
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
      db.prepare(`
        UPDATE kategori 
        SET ad = ?, renk = COALESCE(?, renk), ikon = COALESCE(?, ikon), sira = ?, aktif = 1 
        WHERE id = ?
      `).run(kat.ad, kat.renk, kat.ikon || null, kat.sira, kategoriId)
    } else {
      const katSonuc = db.prepare(`
        INSERT INTO kategori (ad, renk, ikon, sira, aktif)
        VALUES (?, ?, ?, ?, 1)
      `).run(kat.ad, kat.renk, kat.ikon || null, kat.sira)
      kategoriId = Number(katSonuc.lastInsertRowid)
      console.log(`➕ [Seed] Yeni Kategori: ${kat.ad} (ID: ${kategoriId})`)
    }

    for (const urun of kat.urunler) {
      let urunRow = db.prepare('SELECT id FROM urun WHERE LOWER(ad) = LOWER(?)').get(urun.ad) as { id: number } | undefined
      const satisTurleriStr = JSON.stringify(urun.satis_turleri || [{ birim: urun.birim.toLowerCase(), fiyat: urun.fiyat }])

      let urunId: number
      if (urunRow) {
        urunId = urunRow.id
        db.prepare(`
          UPDATE urun 
          SET kategori_id = ?, kisaltma = ?, aciklama = ?, fiyat = ?, kdv_orani = ?, birim = ?, resim_yolu = ?, yazici_grup = ?, sira = ?, satis_turleri = ?, aktif = 1
          WHERE id = ?
        `).run(
          kategoriId,
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

