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
  personelId?: number
  hesapId?: number
  urunAdi?: string
}

/**
 * Sipariş onaylandığında ürünün reçetesindeki hammaddeleri otomatik stoktan düşer,
 * stok_hareket kaydı oluşturur ve siparişin cost_price maliyetini hesaplayıp günceller.
 */
export function siparisStokDusVeMaliyetHesapla(
  db: Database.Database,
  param: SiparisStokDusumParam
): { birimMaliyet: number; toplamMaliyet: number } {
  const miktar = Number(param.miktar || 1)
  const porsiyon = Number(param.porsiyon || 1)
  const toplamCarpani = miktar * porsiyon

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

  for (const kalem of receteKalemleri) {
    // 1 porsiyonda reçeteden hammadde birimine dönüştürülmüş miktar
    const porsiyonDonusenMiktar = birimDonustur(kalem.miktar, kalem.recete_birim, kalem.hammadde_birim)
    const kalemBirimMaliyet = porsiyonDonusenMiktar * (kalem.maliyet_birim || 0)
    birimMaliyet += kalemBirimMaliyet

    // Toplam sipariş için düşülecek hammadde miktarı
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
      const aciklama = `Otomatik Reçete Düşümü: Sipariş #${param.siparisId} (${param.urunAdi || 'Ürün'} x${miktar}${porsiyon !== 1 ? ` x${porsiyon}p` : ''})`
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
    SELECT s.id, s.urun_id, s.miktar, s.porsiyon, u.ad as urun_adi
    FROM siparis s
    JOIN urun u ON u.id = s.urun_id
    WHERE s.id = ?
  `).get(siparisId) as any

  if (!siparis) return

  const miktar = Number(siparis.miktar || 1)
  const porsiyon = Number(siparis.porsiyon || 1)
  const toplamCarpani = miktar * porsiyon

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
      const aciklama = `Sipariş İptal İadesi: Sipariş #${siparis.id} (${siparis.urun_adi} x${miktar})`
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
}
