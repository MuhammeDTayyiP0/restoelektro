// =====================================================
// Masa IPC Handler'ları
// Bölüm ve masa CRUD, birleştirme, taşıma
// =====================================================

import { IpcMain } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { MASA_KANALLARI } from '../../common/ipc-channels'

export function masaIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  // Bölümleri listele
  ipcMain.handle(MASA_KANALLARI.BOLUMLER, async () => {
    return db.prepare(`
      SELECT b.*, (SELECT COUNT(*) FROM masa m WHERE m.bolum_id = b.id AND m.aktif = 1) as masa_sayisi
      FROM bolum b WHERE b.aktif = 1 ORDER BY b.sira ASC, b.ad ASC
    `).all()
  })

  // Bölüm ekle
  ipcMain.handle(MASA_KANALLARI.BOLUM_EKLE, async (_event, veri: any) => {
    let ad = veri
    let sira = 0
    if (typeof veri === 'object') {
      ad = veri.ad
      sira = veri.sira || 0
    }
    const sonuc = db.prepare('INSERT INTO bolum (ad, sira) VALUES (?, ?)').run(ad, sira)
    return { basarili: true, id: sonuc.lastInsertRowid }
  })
  
  // Bölüm güncelle
  ipcMain.handle(MASA_KANALLARI.BOLUM_GUNCELLE, async (_event, id: number, veri: any) => {
    const alanlar: string[] = []
    const degerler: any[] = []
    if (veri.ad !== undefined) { alanlar.push('ad = ?'); degerler.push(veri.ad) }
    if (veri.sira !== undefined) { alanlar.push('sira = ?'); degerler.push(veri.sira) }
    if (veri.aktif !== undefined) { alanlar.push('aktif = ?'); degerler.push(veri.aktif) }
    degerler.push(id)
    if (alanlar.length > 0) {
      db.prepare(`UPDATE bolum SET ${alanlar.join(', ')} WHERE id = ?`).run(...degerler)
    }
    return { basarili: true }
  })

  // Masaları listele (bölüm bazlı veya tümü)
  ipcMain.handle(MASA_KANALLARI.MASALAR, async (_event, bolumId?: number) => {
    const sorgu = bolumId
      ? `SELECT m.*, b.ad as bolum_adi,
           h.id as aktif_hesap_id, h.toplam_tutar as aktif_hesap_tutari,
           p.ad || ' ' || p.soyad as garson_adi,
           h.acilis_zamani
         FROM masa m
         JOIN bolum b ON b.id = m.bolum_id
         LEFT JOIN hesap h ON h.masa_id = m.id AND h.durum = 'acik'
         LEFT JOIN personel p ON p.id = h.personel_id
         WHERE m.bolum_id = ? AND m.aktif = 1
         ORDER BY m.sira ASC, m.numara ASC`
      : `SELECT m.*, b.ad as bolum_adi,
           h.id as aktif_hesap_id, h.toplam_tutar as aktif_hesap_tutari,
           p.ad || ' ' || p.soyad as garson_adi,
           h.acilis_zamani
         FROM masa m
         JOIN bolum b ON b.id = m.bolum_id
         LEFT JOIN hesap h ON h.masa_id = m.id AND h.durum = 'acik'
         LEFT JOIN personel p ON p.id = h.personel_id
         WHERE m.aktif = 1
         ORDER BY b.sira ASC, b.ad ASC, m.sira ASC, m.numara ASC`

    return bolumId ? db.prepare(sorgu).all(bolumId) : db.prepare(sorgu).all()
  })

  // Masa ekle
  ipcMain.handle(MASA_KANALLARI.MASA_EKLE, async (_event, veri: any) => {
    const sonuc = db.prepare(`
      INSERT INTO masa (bolum_id, numara, kapasite, konum_x, konum_y, sira)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(veri.bolum_id, veri.numara, veri.kapasite || 4, veri.konum_x || 0, veri.konum_y || 0, veri.sira || 0)
    return { basarili: true, id: sonuc.lastInsertRowid }
  })

  // Masa güncelle
  ipcMain.handle(MASA_KANALLARI.MASA_GUNCELLE, async (_event, id: number, veri: any) => {
    const alanlar: string[] = []
    const degerler: any[] = []
    if (veri.numara !== undefined) { alanlar.push('numara = ?'); degerler.push(veri.numara) }
    if (veri.kapasite !== undefined) { alanlar.push('kapasite = ?'); degerler.push(veri.kapasite) }
    if (veri.durum !== undefined) { alanlar.push('durum = ?'); degerler.push(veri.durum) }
    if (veri.konum_x !== undefined) { alanlar.push('konum_x = ?'); degerler.push(veri.konum_x) }
    if (veri.konum_y !== undefined) { alanlar.push('konum_y = ?'); degerler.push(veri.konum_y) }
    if (veri.aktif !== undefined) { alanlar.push('aktif = ?'); degerler.push(veri.aktif) }
    if (veri.sira !== undefined) { alanlar.push('sira = ?'); degerler.push(veri.sira) }
    degerler.push(id)
    if (alanlar.length > 0) {
      db.prepare(`UPDATE masa SET ${alanlar.join(', ')} WHERE id = ?`).run(...degerler)
    }
    return { basarili: true }
  })

  // Masa birleştir
  ipcMain.handle(MASA_KANALLARI.MASA_BIRLESTIR, async (_event, anaMasaId: number, birlesenMasaIdleri: number[]) => {
    try {
      const islem = db.transaction(() => {
        for (const masaId of birlesenMasaIdleri) {
          // Birleşen masanın hesabını ana masaya taşı
          db.prepare(`
            UPDATE hesap SET masa_id = ? WHERE masa_id = ? AND durum = 'acik'
          `).run(anaMasaId, masaId)

          // Birleşen masayı "birleşti" olarak işaretle
          db.prepare("UPDATE masa SET durum = 'birlesti' WHERE id = ?").run(masaId)
        }
        // Ana masayı dolu yap
        db.prepare("UPDATE masa SET durum = 'dolu' WHERE id = ?").run(anaMasaId)
      })
      islem()
      return { basarili: true }
    } catch (hata: any) {
      return { basarili: false, hata: hata.message }
    }
  })

  // Masa taşı (hesap taşıma)
  ipcMain.handle(MASA_KANALLARI.MASA_TASI, async (_event, kaynakMasaId: number, hedefMasaId: number) => {
    try {
      const islem = db.transaction(() => {
        db.prepare(`
          UPDATE hesap SET masa_id = ? WHERE masa_id = ? AND durum = 'acik'
        `).run(hedefMasaId, kaynakMasaId)

        db.prepare("UPDATE masa SET durum = 'bos' WHERE id = ?").run(kaynakMasaId)
        db.prepare("UPDATE masa SET durum = 'dolu' WHERE id = ?").run(hedefMasaId)
      })
      islem()
      return { basarili: true }
    } catch (hata: any) {
      return { basarili: false, hata: hata.message }
    }
  })
}
