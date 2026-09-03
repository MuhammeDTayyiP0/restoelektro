// =====================================================
// Stok & Reçete Entegrasyon Servisi
// Birim Dönüşümü, Reçete Maliyet Hesabı ve Otomatik Stok Düşümü
// =====================================================

import type Database from 'better-sqlite3'

// Ağırlık birimleri çarpanı (Gram bazında)
const AGIRLIK_BIRIMLERI: Record<string, number> = {
  gr: 1,
  g: 1,
  gram: 1,
  gramm: 1,
  kg: 1000,
  kilogram: 1000,
  kilo: 1000,
  mg: 0.001,
  miligram: 0.001,
}

// Hacim birimleri çarpanı (Mililitre bazında)
const HACIM_BIRIMLERI: Record<string, number> = {
  ml: 1,
  mililitre: 1,
  milliliter: 1,
  cl: 10,
  santilitre: 10,
  dl: 100,
  desilitre: 100,
  lt: 1000,
  l: 1000,
  litre: 1000,
  liter: 1000,
}

/**
 * İki birim arasındaki miktarı oransal olarak dönüştürür.
 * Örnek 1: birimDonustur(150, 'gr', 'kg') => 0.15 (150gr = 0.15kg)
 * Örnek 2: birimDonustur(250, 'ml', 'lt') => 0.25 (250ml = 0.25lt)
 * Örnek 3: birimDonustur(1, 'adet', 'adet') => 1
 */
export function birimDonustur(miktar: number, kaynakBirim: string, hedefBirim: string): number {
  if (!miktar || isNaN(miktar)) return 0
  const k = (kaynakBirim || '').toLowerCase().trim()
  const h = (hedefBirim || '').toLowerCase().trim()

  if (k === h) return miktar

  // Ağırlık dönüşümü
  if (AGIRLIK_BIRIMLERI[k] !== undefined && AGIRLIK_BIRIMLERI[h] !== undefined) {
    const gramMiktar = miktar * AGIRLIK_BIRIMLERI[k]
    return gramMiktar / AGIRLIK_BIRIMLERI[h]
  }

  // Hacim dönüşümü
  if (HACIM_BIRIMLERI[k] !== undefined && HACIM_BIRIMLERI[h] !== undefined) {
    const mlMiktar = miktar * HACIM_BIRIMLERI[k]
    return mlMiktar / HACIM_BIRIMLERI[h]
  }

  // Dönüştürülemiyorsa veya adet/porsiyon ise doğrudan miktarı dön
  return miktar
}

/**
 * Tek bir ürünün 1 porsiyonluk reçete maliyetini hesaplar
 */
export function urunReceteMaliyetiHesapla(db: Database.Database, urunId: number): number {
  const receteKalemleri = db.prepare(`
    SELECT r.miktar, r.birim as recete_birim, h.birim as hammadde_birim, h.maliyet_birim
    FROM recete r
    JOIN hammadde h ON h.id = r.hammadde_id
    WHERE r.urun_id = ? AND h.aktif = 1
  `).all(urunId) as Array<{
    miktar: number
    recete_birim: string
    hammadde_birim: string
    maliyet_birim: number
  }>

  let toplamMaliyet = 0
  for (const kalem of receteKalemleri) {
    const donusenMiktar = birimDonustur(kalem.miktar, kalem.recete_birim, kalem.hammadde_birim)
    toplamMaliyet += donusenMiktar * (kalem.maliyet_birim || 0)
  }

  return Number(toplamMaliyet.toFixed(2))
}

export interface SiparisStokDusumParam {
  siparisId: number
  urunId: number
  miktar: number
  porsiyon?: number
  satisBirim?: string
  gramaj?: number
  personelId?: number
  hesapId?: number
  urunAdi?: string
}

/**
 * Sipariş onaylandığında ürünün reçetesindeki hammaddeleri otomatik stoktan düşer,
 * stok_hareket kaydı oluşturur ve siparişin cost_price maliyetini hesaplayıp günceller.
 * 
 * Mantık:
 * - satisBirim === 'kg' veya gramaj > 0 ise girilen gramaj miktarınca orantılı stok düşülür (örn: 0.750).
 * - Porsiyon satışı ise porsiyon çarpanı (1, 1.5 vb.) * miktar üzerinden stok düşülür.
 */
export function siparisStokDusVeMaliyetHesapla(
  db: Database.Database,
  param: SiparisStokDusumParam
): { birimMaliyet: number; toplamMaliyet: number } {
  const miktar = Number(param.miktar || 1)
  const porsiyon = Number(param.porsiyon || 1)
  const satisBirim = (param.satisBirim || '').toLowerCase().trim()
  const gramaj = param.gramaj !== undefined && Number(param.gramaj) > 0 ? Number(param.gramaj) : 0
  const isKg = satisBirim === 'kg' || satisBirim === 'kilo' || gramaj > 0

  // Çarpan belirleme:
  // Eğer satisBirim === 'kg' veya gramaj bilgisi varsa (gramaj > 0),
  // doğrudan girilen gramaj miktarınca (örn: 0.750 ile çarpılarak) orantılı stok düş.
  // Porsiyon satışı ise mevcut porsiyon çarpanı (1, 1.5 vb.) * miktar üzerinden stok düş.
  const toplamCarpani = isKg
    ? (gramaj > 0 ? Number((gramaj * miktar).toFixed(4)) : miktar)
    : Number((miktar * porsiyon).toFixed(4))

  // Reçetedeki hammaddeleri çek
  const receteKalemleri = db.prepare(`
    SELECT r.hammadde_id, r.miktar, r.birim as recete_birim,
           h.ad as hammadde_adi, h.birim as hammadde_birim, h.maliyet_birim, h.mevcut_stok
    FROM recete r
    JOIN hammadde h ON h.id = r.hammadde_id
    WHERE r.urun_id = ? AND h.aktif = 1
  `).all(param.urunId) as Array<{
    hammadde_id: number
    miktar: number
    recete_birim: string
    hammadde_adi: string
    hammadde_birim: string
    maliyet_birim: number
    mevcut_stok: number
  }>

  let birimMaliyet = 0
  const birimEtiket = isKg ? `${gramaj > 0 ? `${gramaj} KG` : 'KG'}` : `${porsiyon !== 1 ? `${porsiyon}p` : '1p'}`

  for (const kalem of receteKalemleri) {
    // 1 porsiyonda reçeteden hammadde birimine dönüştürülmüş miktar
    const porsiyonDonusenMiktar = birimDonustur(kalem.miktar, kalem.recete_birim, kalem.hammadde_birim)
    const kalemBirimMaliyet = porsiyonDonusenMiktar * (kalem.maliyet_birim || 0)
    birimMaliyet += kalemBirimMaliyet

    // Toplam sipariş için düşülecek hammadde miktarı (gramaj orantılı veya porsiyon bazlı)
    const toplamDusulecekMiktar = Number((porsiyonDonusenMiktar * toplamCarpani).toFixed(4))

    if (toplamDusulecekMiktar > 0) {
      // 1. Hammadde stoğunu düş (mevcut_stok - miktar) ve 4 basamağa yuvarla
      db.prepare(`
        UPDATE hammadde
        SET mevcut_stok = ROUND(MAX(0, mevcut_stok - ?), 4),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(toplamDusulecekMiktar, kalem.hammadde_id)

      // 2. Stok hareket kaydı ekle
      const aciklama = `Otomatik Reçete Düşümü: Sipariş #${param.siparisId} (${param.urunAdi || 'Ürün'} [${birimEtiket}] x${miktar})`
      db.prepare(`
        INSERT INTO stok_hareket (hammadde_id, islem_tipi, miktar, birim_maliyet, aciklama, personel_id)
        VALUES (?, 'satis', ?, ?, ?, ?)
      `).run(
        kalem.hammadde_id,
        toplamDusulecekMiktar,
        kalem.maliyet_birim || 0,
        aciklama,
        param.personelId || null
      )
    }
  }

  // Reçete kaydı bulunamadıysa doğrudan ürün adıyla eşleşen hammaddeyi kontrol et
  if (receteKalemleri.length === 0 && param.urunAdi) {
    const directHammadde = db.prepare(`
      SELECT id, ad, birim, maliyet_birim, mevcut_stok
      FROM hammadde
      WHERE aktif = 1 AND (LOWER(ad) = LOWER(?) OR LOWER(ad) LIKE LOWER(?))
      LIMIT 1
    `).get(param.urunAdi, `%${param.urunAdi}%`) as any

    if (directHammadde) {
      const bazBirim = isKg ? 'kg' : 'adet'
      const donusenMiktar = birimDonustur(toplamCarpani, bazBirim, directHammadde.birim)
      const dusulecek = Number(donusenMiktar.toFixed(4))

      if (dusulecek > 0) {
        db.prepare(`
          UPDATE hammadde
          SET mevcut_stok = ROUND(MAX(0, mevcut_stok - ?), 4),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(dusulecek, directHammadde.id)

        const aciklama = `Otomatik Stok Düşümü: Sipariş #${param.siparisId} (${param.urunAdi} [${birimEtiket}] x${miktar})`
        db.prepare(`
          INSERT INTO stok_hareket (hammadde_id, islem_tipi, miktar, birim_maliyet, aciklama, personel_id)
          VALUES (?, 'satis', ?, ?, ?, ?)
        `).run(
          directHammadde.id,
          dusulecek,
          directHammadde.maliyet_birim || 0,
          aciklama,
          param.personelId || null
        )

        birimMaliyet = directHammadde.maliyet_birim || 0
      }
    }
  }

  const toplamMaliyet = Number((birimMaliyet * toplamCarpani).toFixed(2))

  // Sipariş satırının cost_price maliyetini güncelle
  db.prepare(`
    UPDATE siparis SET cost_price = ? WHERE id = ?
  `).run(toplamMaliyet, param.siparisId)

  return {
    birimMaliyet: Number(birimMaliyet.toFixed(2)),
    toplamMaliyet,
  }
}

/**
 * Sipariş iptal edildiğinde düşülen hammaddeleri stoğa iade eder
 */
export function siparisStokGeriYukle(
  db: Database.Database,
  siparisId: number,
  personelId?: number
): void {
  const siparis = db.prepare(`
    SELECT s.id, s.urun_id, s.miktar, s.porsiyon, s.satis_birim, s.gramaj, u.ad as urun_adi
    FROM siparis s
    JOIN urun u ON u.id = s.urun_id
    WHERE s.id = ?
  `).get(siparisId) as any

  if (!siparis) return

  const miktar = Number(siparis.miktar || 1)
  const porsiyon = Number(siparis.porsiyon || 1)
  const satisBirim = (siparis.satis_birim || '').toLowerCase().trim()
  const gramaj = siparis.gramaj !== undefined && Number(siparis.gramaj) > 0 ? Number(siparis.gramaj) : 0
  const isKg = satisBirim === 'kg' || satisBirim === 'kilo' || gramaj > 0

  const toplamCarpani = isKg
    ? (gramaj > 0 ? Number((gramaj * miktar).toFixed(4)) : miktar)
    : Number((miktar * porsiyon).toFixed(4))

  const birimEtiket = isKg ? `${gramaj > 0 ? `${gramaj} KG` : 'KG'}` : `${porsiyon !== 1 ? `${porsiyon}p` : '1p'}`

  const receteKalemleri = db.prepare(`
    SELECT r.hammadde_id, r.miktar, r.birim as recete_birim,
           h.ad as hammadde_adi, h.birim as hammadde_birim, h.maliyet_birim
    FROM recete r
    JOIN hammadde h ON h.id = r.hammadde_id
    WHERE r.urun_id = ? AND h.aktif = 1
  `).all(siparis.urun_id) as Array<{
    hammadde_id: number
    miktar: number
    recete_birim: string
    hammadde_adi: string
    hammadde_birim: string
    maliyet_birim: number
  }>

  for (const kalem of receteKalemleri) {
    const porsiyonDonusenMiktar = birimDonustur(kalem.miktar, kalem.recete_birim, kalem.hammadde_birim)
    const iadeMiktari = Number((porsiyonDonusenMiktar * toplamCarpani).toFixed(4))

    if (iadeMiktari > 0) {
      // Stoğa geri ekle ve 4 basamağa yuvarla
      db.prepare(`
        UPDATE hammadde
        SET mevcut_stok = ROUND(mevcut_stok + ?, 4),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(iadeMiktari, kalem.hammadde_id)

      // Stok hareket kaydı (iade)
      const aciklama = `Sipariş İptal İadesi: Sipariş #${siparis.id} (${siparis.urun_adi} [${birimEtiket}] x${miktar})`
      db.prepare(`
        INSERT INTO stok_hareket (hammadde_id, islem_tipi, miktar, birim_maliyet, aciklama, personel_id)
        VALUES (?, 'giris', ?, ?, ?, ?)
      `).run(
        kalem.hammadde_id,
        iadeMiktari,
        kalem.maliyet_birim || 0,
        aciklama,
        personelId || null
      )
    }
  }

  // Reçete yoksa doğrudan ürün adıyla eşleşen hammaddeyi geri yükle
  if (receteKalemleri.length === 0 && siparis.urun_adi) {
    const directHammadde = db.prepare(`
      SELECT id, ad, birim, maliyet_birim
      FROM hammadde
      WHERE aktif = 1 AND (LOWER(ad) = LOWER(?) OR LOWER(ad) LIKE LOWER(?))
      LIMIT 1
    `).get(siparis.urun_adi, `%${siparis.urun_adi}%`) as any

    if (directHammadde) {
      const bazBirim = isKg ? 'kg' : 'adet'
      const donusenMiktar = birimDonustur(toplamCarpani, bazBirim, directHammadde.birim)
      const iadeMiktari = Number(donusenMiktar.toFixed(4))

      if (iadeMiktari > 0) {
        db.prepare(`
          UPDATE hammadde
          SET mevcut_stok = ROUND(mevcut_stok + ?, 4),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(iadeMiktari, directHammadde.id)

        const aciklama = `Sipariş İptal İadesi: Sipariş #${siparis.id} (${siparis.urun_adi} [${birimEtiket}] x${miktar})`
        db.prepare(`
          INSERT INTO stok_hareket (hammadde_id, islem_tipi, miktar, birim_maliyet, aciklama, personel_id)
          VALUES (?, 'giris', ?, ?, ?, ?)
        `).run(
          directHammadde.id,
          iadeMiktari,
          directHammadde.maliyet_birim || 0,
          aciklama,
          personelId || null
        )
      }
    }
  }
}

