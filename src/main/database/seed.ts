// =====================================================
// ETİBOL POS — Varsayılan Menü & Tohumlama (Seed) Servisi
// Izgaralar, İçecekler, Unsplash CDN Görselleri & Varyantlar
// Tamamen İdempotent & Sıfır Veri Kaybı Garantisi
// =====================================================

import type Database from 'better-sqlite3'
import { sutunYoksaEkle } from './migration-runner'

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
  resim_yolu: string
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
 * Varsayılan Izgara & İçecekler menü yapısı
 */
export const VARSAYILAN_MENU_VERILERI: TohumKategori[] = [
  {
    ad: 'Izgaralar',
    alternatifAdlar: ['Izgara'],
    renk: '#EF4444',
    ikon: 'flame',
    sira: 1,
    urunler: [
      {
        ad: 'Adana Kebap',
        aciklama: 'Özel zırh kıyması, közlenmiş biber ve domates ile',
        kisaltma: 'Özel zırh kıyması, közlenmiş biber ve domates ile',
        fiyat: 320,
        kdv_orani: 10,
        birim: 'Porsiyon',
        resim_yolu: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'mutfak',
        sira: 1
      },
      {
        ad: 'Kuşbaşı',
        aciklama: 'Terbiyeli kuzu kuşbaşı, lavaş ve közlenmiş sebzeler ile',
        kisaltma: 'Terbiyeli kuzu kuşbaşı, lavaş ve közlenmiş sebzeler ile',
        fiyat: 340,
        kdv_orani: 10,
        birim: 'Porsiyon',
        resim_yolu: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'mutfak',
        sira: 2
      },
      {
        ad: 'Tavuk Şiş',
        aciklama: 'Özel marinede dinlendirilmiş tavuk göğsü',
        kisaltma: 'Özel marinede dinlendirilmiş tavuk göğsü',
        fiyat: 240,
        kdv_orani: 10,
        birim: 'Porsiyon',
        resim_yolu: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'mutfak',
        sira: 3
      },
      {
        ad: 'Kanat',
        aciklama: 'Alevde pişirilmiş çıtır tavuk kanatları',
        kisaltma: 'Alevde pişirilmiş çıtır tavuk kanatları',
        fiyat: 250,
        kdv_orani: 10,
        birim: 'Porsiyon',
        resim_yolu: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'mutfak',
        sira: 4
      },
      {
        ad: 'Pirzola',
        aciklama: 'Kuzu pirzola, özel baharat çeşnisi ile',
        kisaltma: 'Kuzu pirzola, özel baharat çeşnisi ile',
        fiyat: 450,
        kdv_orani: 10,
        birim: 'Kilo / Gramaj',
        resim_yolu: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'mutfak',
        sira: 5
      }
    ]
  },
  {
    ad: 'İçecekler',
    alternatifAdlar: ['Soğuk İçecekler', 'İçecek'],
    renk: '#06B6D4',
    ikon: 'glass-water',
    sira: 2,
    urunler: [
      {
        ad: 'Şalgam',
        aciklama: 'Geleneksel Adana şalgam suyu',
        kisaltma: 'Acılı / Acısız Şalgam',
        fiyat: 40,
        kdv_orani: 10,
        birim: 'Adet',
        resim_yolu: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'bar',
        sira: 1,
        secenekler: [
          { ad: 'Acılı', fiyat: 0, fiyat_farki: 0 },
          { ad: 'Acısız', fiyat: 0, fiyat_farki: 0 }
        ]
      },
      {
        ad: 'Ayran',
        aciklama: 'Geleneksel yayık ayranı',
        kisaltma: 'Geleneksel yayık ayranı',
        fiyat: 35,
        kdv_orani: 10,
        birim: 'Adet',
        resim_yolu: 'https://images.unsplash.com/photo-1556881286-fc6915169721?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'bar',
        sira: 2
      },
      {
        ad: 'Kola Çeşitleri',
        aciklama: 'Soğuk ve ferahlatıcı kutu kola',
        kisaltma: 'Orijinal / Zero / Light',
        fiyat: 50,
        kdv_orani: 10,
        birim: 'Adet',
        resim_yolu: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=800&q=80',
        yazici_grup: 'bar',
        sira: 3,
        secenekler: [
          { ad: 'Orijinal', fiyat: 0, fiyat_farki: 0 },
          { ad: 'Zero', fiyat: 0, fiyat_farki: 0 },
          { ad: 'Light', fiyat: 0, fiyat_farki: 0 }
        ]
      }
    ]
  }
]

/**
 * Veritabanında varsayılan Izgara ve İçecekler kategorilerini ve ürünlerini kontrol eder,
 * eksik olanları ekler ve mevcut kayıtları bozmadan tamamlar.
 */
export function varsayilanIzgaraVeIcecekleriEkle(db: Database.Database): void {
  console.log('🌱 [Seed] Varsayılan Izgara ve İçecekler kontrol ediliyor...')

  // 1. urun tablosunda aciklama sütunu yoksa güvenle ekle
  sutunYoksaEkle(db, 'urun', 'aciklama', 'TEXT')

  for (const kat of VARSAYILAN_MENU_VERILERI) {
    // Kategori kontrolü (Ana ad veya alternatif adlarla ara)
    let kategori = db.prepare('SELECT * FROM kategori WHERE LOWER(TRIM(ad)) = LOWER(TRIM(?)) AND aktif = 1').get(kat.ad) as any

    if (!kategori && kat.alternatifAdlar && kat.alternatifAdlar.length > 0) {
      for (const altAd of kat.alternatifAdlar) {
        kategori = db.prepare('SELECT * FROM kategori WHERE LOWER(TRIM(ad)) = LOWER(TRIM(?)) AND aktif = 1').get(altAd) as any
        if (kategori) break
      }
    }

    let kategoriId: number

    if (!kategori) {
      const katSonuc = db.prepare(`
        INSERT INTO kategori (ad, renk, ikon, sira, aktif)
        VALUES (?, ?, ?, ?, 1)
      `).run(kat.ad, kat.renk, kat.ikon || null, kat.sira)

      kategoriId = Number(katSonuc.lastInsertRowid)
      console.log(`➕ [Seed] Yeni Kategori eklendi: ${kat.ad} (ID: ${kategoriId})`)
    } else {
      kategoriId = kategori.id
    }

    // Ürünleri kontrol et ve ekle / tamamla
    for (const urun of kat.urunler) {
      // Ürünü adına göre ara
      let mevcutUrun = db.prepare('SELECT * FROM urun WHERE LOWER(TRIM(ad)) = LOWER(TRIM(?)) AND aktif = 1').get(urun.ad) as any

      // 'Kola Çeşitleri' için geriye dönük 'Kola' kontrolü
      if (!mevcutUrun && urun.ad === 'Kola Çeşitleri') {
        mevcutUrun = db.prepare('SELECT * FROM urun WHERE LOWER(TRIM(ad)) = ? AND aktif = 1').get('kola') as any
      }

      let urunId: number

      if (!mevcutUrun) {
        // Yeni ürün oluştur
        const urunSonuc = db.prepare(`
          INSERT INTO urun (kategori_id, ad, kisaltma, aciklama, fiyat, kdv_orani, birim, resim_yolu, yazici_grup, sira, aktif)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).run(
          kategoriId,
          urun.ad,
          urun.kisaltma || urun.aciklama,
          urun.aciklama,
          urun.fiyat,
          urun.kdv_orani || 10,
          urun.birim,
          urun.resim_yolu,
          urun.yazici_grup,
          urun.sira || 0
        )

        urunId = Number(urunSonuc.lastInsertRowid)
        console.log(`➕ [Seed] Yeni Ürün eklendi: ${urun.ad} (ID: ${urunId}, Fiyat: ${urun.fiyat}₺, Birim: ${urun.birim})`)
      } else {
        urunId = mevcutUrun.id

        // Var olan ürünün eksik alanlarını tamamla (mevcut özel fiyat veya verileri ezmeden)
        const guncellemeler: string[] = []
        const params: any[] = []

        // Eğer resim_yolu boş veya null ise Unsplash CDN URL'sini ekle
        if ((!mevcutUrun.resim_yolu || mevcutUrun.resim_yolu.trim() === '') && urun.resim_yolu) {
          guncellemeler.push('resim_yolu = ?')
          params.push(urun.resim_yolu)
        }

        // Eğer aciklama boş veya null ise ekle
        if ((!mevcutUrun.aciklama || mevcutUrun.aciklama.trim() === '') && urun.aciklama) {
          guncellemeler.push('aciklama = ?')
          params.push(urun.aciklama)
        }

        // Eğer kisaltma boş veya null ise ekle
        if ((!mevcutUrun.kisaltma || mevcutUrun.kisaltma.trim() === '') && (urun.kisaltma || urun.aciklama)) {
          guncellemeler.push('kisaltma = ?')
          params.push(urun.kisaltma || urun.aciklama)
        }

        // Kategori ID'si eşleşmiyorsa kategoriye bağla (eğer boş veya genel ise)
        if (!mevcutUrun.kategori_id) {
          guncellemeler.push('kategori_id = ?')
          params.push(kategoriId)
        }

        if (guncellemeler.length > 0) {
          params.push(urunId)
          db.prepare(`UPDATE urun SET ${guncellemeler.join(', ')} WHERE id = ?`).run(...params)
          console.log(`🔄 [Seed] Mevcut ürün detayları tamamlandı: ${mevcutUrun.ad} (ID: ${urunId})`)
        }
      }

      // Seçenekler & Varyantlar (Opsiyonel / Özelleştirmeler)
      if (urun.secenekler && urun.secenekler.length > 0) {
        for (const secenek of urun.secenekler) {
          // urun_opsiyonu kontrolü
          const mevcutOpsiyon = db.prepare(
            'SELECT id FROM urun_opsiyonu WHERE urun_id = ? AND LOWER(TRIM(ad)) = LOWER(TRIM(?))'
          ).get(urunId, secenek.ad) as any

          if (!mevcutOpsiyon) {
            db.prepare(`
              INSERT INTO urun_opsiyonu (urun_id, ad, fiyat, aktif)
              VALUES (?, ?, ?, 1)
            `).run(urunId, secenek.ad, secenek.fiyat || 0)
            console.log(`  └─ ➕ [Seed] Opsiyon eklendi: ${secenek.ad} (${urun.ad})`)
          }

          // urun_varyant kontrolü
          const mevcutVaryant = db.prepare(
            'SELECT id FROM urun_varyant WHERE urun_id = ? AND LOWER(TRIM(ad)) = LOWER(TRIM(?))'
          ).get(urunId, secenek.ad) as any

          if (!mevcutVaryant) {
            db.prepare(`
              INSERT INTO urun_varyant (urun_id, ad, fiyat_farki, aktif)
              VALUES (?, ?, ?, 1)
            `).run(urunId, secenek.ad, secenek.fiyat_farki || 0)
            console.log(`  └─ ➕ [Seed] Varyant eklendi: ${secenek.ad} (${urun.ad})`)
          }
        }
      }
    }
  }

  console.log('✅ [Seed] Varsayılan Izgara ve İçecekler seed işlemi başarıyla tamamlandı.')
}
