// =====================================================
// Stok & Reçete IPC Handler'ları
// =====================================================

import { IpcMain } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { STOK_KANALLARI } from '../../common/ipc-channels'

export function stokIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  // Hammaddeleri listele
  ipcMain.handle(STOK_KANALLARI.HAMMADDELER, async () => {
    return db.prepare(`
      SELECT h.*,
        CASE
          WHEN h.mevcut_stok <= 0 THEN 'tukendi'
          WHEN h.mevcut_stok <= h.min_stok * 0.5 THEN 'kritik'
          WHEN h.mevcut_stok <= h.min_stok THEN 'dusuk'
          ELSE 'normal'
        END as stok_durumu
      FROM hammadde h WHERE h.aktif = 1 ORDER BY h.ad
    `).all()
  })

  // Hammadde ekle
  ipcMain.handle(STOK_KANALLARI.HAMMADDE_EKLE, async (_event, veri: any) => {
    const sonuc = db.prepare(`
      INSERT INTO hammadde (ad, birim, mevcut_stok, min_stok, maliyet_birim, tedarikci)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(veri.ad, veri.birim, veri.mevcut_stok || 0, veri.min_stok || 0, veri.maliyet_birim || 0, veri.tedarikci || null)
    return { basarili: true, id: sonuc.lastInsertRowid }
  })

  // Hammadde güncelle
  ipcMain.handle(STOK_KANALLARI.HAMMADDE_GUNCELLE, async (_event, id: number, veri: any) => {
    const alanlar: string[] = []
    const degerler: any[] = []
    if (veri.ad) { alanlar.push('ad = ?'); degerler.push(veri.ad) }
    if (veri.birim) { alanlar.push('birim = ?'); degerler.push(veri.birim) }
    if (veri.min_stok !== undefined) { alanlar.push('min_stok = ?'); degerler.push(veri.min_stok) }
    if (veri.maliyet_birim !== undefined) { alanlar.push('maliyet_birim = ?'); degerler.push(veri.maliyet_birim) }
    if (veri.tedarikci !== undefined) { alanlar.push('tedarikci = ?'); degerler.push(veri.tedarikci) }
    alanlar.push('updated_at = CURRENT_TIMESTAMP')
    degerler.push(id)
    db.prepare(`UPDATE hammadde SET ${alanlar.join(', ')} WHERE id = ?`).run(...degerler)
    return { basarili: true }
  })

  // Stok hareketi ekle
  ipcMain.handle(STOK_KANALLARI.STOK_GIRIS, async (_event, veri: any) => {
    const islem = db.transaction(() => {
      db.prepare(`
        INSERT INTO stok_hareket (hammadde_id, islem_tipi, miktar, birim_maliyet, aciklama, personel_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(veri.hammadde_id, veri.islem_tipi, veri.miktar, veri.birim_maliyet || 0, veri.aciklama || null, veri.personel_id || null)

      // Stok miktarını güncelle
      if (veri.islem_tipi === 'giris') {
        db.prepare('UPDATE hammadde SET mevcut_stok = mevcut_stok + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(veri.miktar, veri.hammadde_id)
      } else if (veri.islem_tipi === 'cikis' || veri.islem_tipi === 'fire') {
        db.prepare('UPDATE hammadde SET mevcut_stok = MAX(0, mevcut_stok - ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(veri.miktar, veri.hammadde_id)
      } else if (veri.islem_tipi === 'sayim') {
        db.prepare('UPDATE hammadde SET mevcut_stok = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(veri.miktar, veri.hammadde_id)
      }

      // Birim maliyeti güncelle (giriş ise)
      if (veri.islem_tipi === 'giris' && veri.birim_maliyet > 0) {
        db.prepare('UPDATE hammadde SET maliyet_birim = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(veri.birim_maliyet, veri.hammadde_id)
      }
    })
    islem()
    return { basarili: true }
  })

  // Stok hareketleri
  ipcMain.handle(STOK_KANALLARI.STOK_HAREKETLERI, async (_event, hammaddeId?: number) => {
    if (hammaddeId) {
      return db.prepare(`
        SELECT sh.*, h.ad as hammadde_adi, p.ad || ' ' || p.soyad as personel_adi
        FROM stok_hareket sh
        JOIN hammadde h ON h.id = sh.hammadde_id
        LEFT JOIN personel p ON p.id = sh.personel_id
        WHERE sh.hammadde_id = ?
        ORDER BY sh.created_at DESC LIMIT 100
      `).all(hammaddeId)
    }
    return db.prepare(`
      SELECT sh.*, h.ad as hammadde_adi, p.ad || ' ' || p.soyad as personel_adi
      FROM stok_hareket sh
      JOIN hammadde h ON h.id = sh.hammadde_id
      LEFT JOIN personel p ON p.id = sh.personel_id
      ORDER BY sh.created_at DESC LIMIT 200
    `).all()
  })

  // Reçeteleri getir
  ipcMain.handle(STOK_KANALLARI.RECETELER, async (_event, urunId?: number) => {
    if (urunId) {
      return db.prepare(`
        SELECT r.*, h.ad as hammadde_adi, h.maliyet_birim as birim_maliyet,
               (r.miktar * h.maliyet_birim) as kalem_maliyet
        FROM recete r
        JOIN hammadde h ON h.id = r.hammadde_id
        WHERE r.urun_id = ?
      `).all(urunId)
    }
    // Tüm ürünlerin maliyet özeti
    return db.prepare(`
      SELECT u.id as urun_id, u.ad as urun_adi, u.fiyat as satis_fiyati, k.ad as kategori_adi,
             COALESCE(SUM(r.miktar * h.maliyet_birim), 0) as toplam_maliyet,
             u.fiyat - COALESCE(SUM(r.miktar * h.maliyet_birim), 0) as kar_tutari,
             CASE WHEN u.fiyat > 0
               THEN ROUND((u.fiyat - COALESCE(SUM(r.miktar * h.maliyet_birim), 0)) / u.fiyat * 100, 1)
               ELSE 0
             END as kar_marji
      FROM urun u
      JOIN kategori k ON k.id = u.kategori_id
      LEFT JOIN recete r ON r.urun_id = u.id
      LEFT JOIN hammadde h ON h.id = r.hammadde_id
      WHERE u.aktif = 1
      GROUP BY u.id
      ORDER BY kar_marji ASC
    `).all()
  })

  // Reçete ekle/güncelle
  ipcMain.handle(STOK_KANALLARI.RECETE_EKLE, async (_event, urunId: number, kalemler: any[]) => {
    const islem = db.transaction(() => {
      // Mevcut reçeteyi sil
      db.prepare('DELETE FROM recete WHERE urun_id = ?').run(urunId)
      // Yeni kalemleri ekle
      for (const kalem of kalemler) {
        db.prepare('INSERT INTO recete (urun_id, hammadde_id, miktar, birim) VALUES (?, ?, ?, ?)').run(
          urunId, kalem.hammadde_id, kalem.miktar, kalem.birim
        )
      }
    })
    islem()
    return { basarili: true }
  })

  // Maliyet analizi
  ipcMain.handle(STOK_KANALLARI.MALIYET_ANALIZI, async () => {
    return db.prepare(`
      SELECT u.id as urun_id, u.ad as urun_adi, k.ad as kategori_adi, u.fiyat as satis_fiyati,
             COALESCE(SUM(r.miktar * h.maliyet_birim), 0) as hammadde_maliyeti,
             CASE WHEN u.fiyat > 0
               THEN ROUND((u.fiyat - COALESCE(SUM(r.miktar * h.maliyet_birim), 0)) / u.fiyat * 100, 1)
               ELSE 0
             END as kar_marji,
             COALESCE(sat.satis_adedi, 0) as satis_adedi,
             COALESCE(sat.toplam_ciro, 0) as toplam_ciro,
             COALESCE(sat.satis_adedi, 0) * (u.fiyat - COALESCE(SUM(r.miktar * h.maliyet_birim), 0)) as toplam_kar
      FROM urun u
      JOIN kategori k ON k.id = u.kategori_id
      LEFT JOIN recete r ON r.urun_id = u.id
      LEFT JOIN hammadde h ON h.id = r.hammadde_id
      LEFT JOIN (
        SELECT urun_id, SUM(miktar) as satis_adedi, SUM(toplam_fiyat) as toplam_ciro
        FROM siparis WHERE durum != 'iptal'
        GROUP BY urun_id
      ) sat ON sat.urun_id = u.id
      WHERE u.aktif = 1
      GROUP BY u.id
      ORDER BY kar_marji ASC
    `).all()
  })
}
