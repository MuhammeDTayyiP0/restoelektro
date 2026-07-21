// =====================================================
// Raporlama IPC Handler'ları
// Satış, personel, stok raporları ve dışa aktarım
// =====================================================

import { IpcMain, dialog } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { RAPOR_KANALLARI } from '../../common/ipc-channels'
import { writeFileSync } from 'fs'
import * as XLSX from 'xlsx'

export function raporIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  // Günlük/Genel satış özeti
  ipcMain.handle(RAPOR_KANALLARI.GUNLUK_OZET, async (_event, baslangic: string, bitis: string) => {
    return db.prepare(`
      SELECT
        ? as tarih,
        COALESCE(SUM(CASE WHEN h.durum = 'odendi' THEN h.net_tutar ELSE 0 END), 0) as toplam_ciro,
        COUNT(CASE WHEN h.durum = 'odendi' THEN 1 END) as toplam_hesap,
        COALESCE(AVG(CASE WHEN h.durum = 'odendi' THEN h.net_tutar END), 0) as ortalama_hesap,
        COALESCE(SUM(CASE WHEN o.odeme_tipi = 'nakit' THEN o.tutar ELSE 0 END), 0) as nakit_toplam,
        COALESCE(SUM(CASE WHEN o.odeme_tipi = 'kredi_karti' THEN o.tutar ELSE 0 END), 0) as kart_toplam,
        COALESCE(SUM(CASE WHEN o.odeme_tipi NOT IN ('nakit', 'kredi_karti') THEN o.tutar ELSE 0 END), 0) as diger_toplam,
        COALESCE(SUM(CASE WHEN h.durum = 'iptal' THEN h.toplam_tutar ELSE 0 END), 0) as iptal_tutar,
        COALESCE((SELECT SUM(s.toplam_fiyat) FROM siparis s JOIN hesap h2 ON h2.id = s.hesap_id WHERE s.ikram = 1 AND DATE(h2.acilis_zamani) BETWEEN ? AND ?), 0) as ikram_tutar,
        COALESCE(SUM(h.indirim_tutar), 0) as indirim_tutar
      FROM hesap h
      LEFT JOIN odeme o ON o.hesap_id = h.id
      WHERE DATE(h.acilis_zamani) BETWEEN ? AND ?
    `).get(`${baslangic} - ${bitis}`, baslangic, bitis, baslangic, bitis)
  })

  // Kategori bazlı satış raporu
  ipcMain.handle(RAPOR_KANALLARI.KATEGORI_RAPORU, async (_event, baslangic: string, bitis: string) => {
    return db.prepare(`
      SELECT k.id as kategori_id, k.ad as kategori_adi,
             COALESCE(SUM(s.miktar), 0) as satis_adedi,
             COALESCE(SUM(s.toplam_fiyat), 0) as toplam_tutar
      FROM kategori k
      LEFT JOIN urun u ON u.kategori_id = k.id
      LEFT JOIN siparis s ON s.urun_id = u.id AND s.durum != 'iptal'
      LEFT JOIN hesap h ON h.id = s.hesap_id AND DATE(h.acilis_zamani) BETWEEN ? AND ?
      WHERE k.aktif = 1
      GROUP BY k.id
      ORDER BY toplam_tutar DESC
    `).all(baslangic, bitis)
  })

  // Ürün bazlı satış raporu
  ipcMain.handle(RAPOR_KANALLARI.URUN_RAPORU, async (_event, baslangic: string, bitis: string) => {
    return db.prepare(`
      SELECT u.id as urun_id, u.ad as urun_adi, k.ad as kategori_adi,
             COALESCE(SUM(s.miktar), 0) as satis_adedi,
             COALESCE(SUM(s.toplam_fiyat), 0) as toplam_tutar,
             COALESCE(AVG(s.birim_fiyat), 0) as ortalama_fiyat
      FROM urun u
      JOIN kategori k ON k.id = u.kategori_id
      LEFT JOIN siparis s ON s.urun_id = u.id AND s.durum != 'iptal'
      LEFT JOIN hesap h ON h.id = s.hesap_id AND DATE(h.acilis_zamani) BETWEEN ? AND ?
      WHERE u.aktif = 1
      GROUP BY u.id
      ORDER BY toplam_tutar DESC
    `).all(baslangic, bitis)
  })

  // Personel performans raporu
  ipcMain.handle(RAPOR_KANALLARI.PERSONEL_RAPORU, async (_event, baslangic: string, bitis: string) => {
    return db.prepare(`
      SELECT p.id as personel_id, p.ad || ' ' || p.soyad as personel_adi,
             COUNT(DISTINCT h.id) as hesap_sayisi,
             COALESCE(SUM(h.net_tutar), 0) as toplam_satis,
             COALESCE(AVG(h.net_tutar), 0) as ortalama_hesap,
             COALESCE((SELECT COUNT(*) FROM siparis s WHERE s.personel_id = p.id AND s.durum = 'iptal' AND DATE(s.siparis_zamani) BETWEEN ? AND ?), 0) as iptal_sayisi,
             COALESCE((SELECT SUM(s.toplam_fiyat) FROM siparis s WHERE s.personel_id = p.id AND s.ikram = 1 AND DATE(s.siparis_zamani) BETWEEN ? AND ?), 0) as ikram_tutari
      FROM personel p
      LEFT JOIN hesap h ON h.personel_id = p.id AND h.durum = 'odendi' AND DATE(h.acilis_zamani) BETWEEN ? AND ?
      WHERE p.aktif = 1
      GROUP BY p.id
      ORDER BY toplam_satis DESC
    `).all(baslangic, bitis, baslangic, bitis, baslangic, bitis)
  })

  // Zaman (Saatlik veya Günlük) satış dağılımı
  ipcMain.handle(RAPOR_KANALLARI.SAATLIK_DAGILIM, async (_event, baslangic: string, bitis: string) => {
    if (baslangic === bitis) {
      // Tek gün ise saatlik dağılım
      return db.prepare(`
        SELECT CAST(strftime('%H', acilis_zamani) AS INTEGER) || ':00' as zaman_etiketi,
               COUNT(*) as hesap_sayisi,
               COALESCE(SUM(net_tutar), 0) as toplam_tutar
        FROM hesap
        WHERE durum = 'odendi' AND DATE(acilis_zamani) = ?
        GROUP BY CAST(strftime('%H', acilis_zamani) AS INTEGER)
        ORDER BY CAST(strftime('%H', acilis_zamani) AS INTEGER)
      `).all(baslangic)
    } else {
      // Birden fazla gün ise günlük dağılım
      return db.prepare(`
        SELECT DATE(acilis_zamani) as zaman_etiketi,
               COUNT(*) as hesap_sayisi,
               COALESCE(SUM(net_tutar), 0) as toplam_tutar
        FROM hesap
        WHERE durum = 'odendi' AND DATE(acilis_zamani) BETWEEN ? AND ?
        GROUP BY DATE(acilis_zamani)
        ORDER BY DATE(acilis_zamani)
      `).all(baslangic, bitis)
    }
  })

  // Dışa aktarım (CSV/XLSX)
  ipcMain.handle(RAPOR_KANALLARI.DISA_AKTAR, async (_event, raporTipi: string, format: string, baslangic: string, bitis: string) => {
    try {
      let veri: any[] = []
      let basliklar: string[] = []

      if (raporTipi === 'satis') {
        basliklar = ['Tarih', 'Hesap No', 'Masa', 'Personel', 'Toplam', 'İndirim', 'Net Tutar', 'Ödeme Tipi']
        veri = db.prepare(`
          SELECT DATE(h.acilis_zamani) as Tarih, h.hesap_no as 'Hesap No', m.numara as Masa,
                 p.ad || ' ' || p.soyad as Personel, h.toplam_tutar as Toplam,
                 h.indirim_tutar as Indirim, h.net_tutar as 'Net Tutar',
                 GROUP_CONCAT(DISTINCT o.odeme_tipi) as 'Ödeme Tipi'
          FROM hesap h
          LEFT JOIN masa m ON m.id = h.masa_id
          JOIN personel p ON p.id = h.personel_id
          LEFT JOIN odeme o ON o.hesap_id = h.id
          WHERE h.durum = 'odendi' AND DATE(h.acilis_zamani) BETWEEN ? AND ?
          GROUP BY h.id ORDER BY h.acilis_zamani
        `).all(baslangic, bitis)
      } else if (raporTipi === 'urun') {
        basliklar = ['Ürün', 'Kategori', 'Satış Adedi', 'Toplam Tutar', 'Ortalama Fiyat']
        veri = db.prepare(`
          SELECT u.ad as Urun, k.ad as Kategori, SUM(s.miktar) as 'Satış Adedi',
                 SUM(s.toplam_fiyat) as 'Toplam Tutar', AVG(s.birim_fiyat) as 'Ortalama Fiyat'
          FROM siparis s JOIN urun u ON u.id = s.urun_id JOIN kategori k ON k.id = u.kategori_id
          JOIN hesap h ON h.id = s.hesap_id
          WHERE s.durum != 'iptal' AND DATE(h.acilis_zamani) BETWEEN ? AND ?
          GROUP BY u.id ORDER BY SUM(s.toplam_fiyat) DESC
        `).all(baslangic, bitis)
      }

      // Dosya kaydetme diyaloğu
      const sonuc = await dialog.showSaveDialog({
        title: 'Raporu Dışa Aktar',
        defaultPath: `rapor_${raporTipi}_${baslangic}_${bitis}.${format}`,
        filters: format === 'xlsx'
          ? [{ name: 'Excel Dosyası', extensions: ['xlsx'] }]
          : [{ name: 'CSV Dosyası', extensions: ['csv'] }],
      })

      if (sonuc.canceled || !sonuc.filePath) return { basarili: false, hata: 'İptal edildi' }

      if (format === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(veri)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Rapor')
        XLSX.writeFile(wb, sonuc.filePath)
      } else {
        // CSV
        const csvSatirlar = [basliklar.join(';')]
        for (const satir of veri) {
          csvSatirlar.push(Object.values(satir).join(';'))
        }
        writeFileSync(sonuc.filePath, '\ufeff' + csvSatirlar.join('\n'), 'utf-8') // BOM ekle (Excel uyumluluğu)
      }

      return { basarili: true, dosya_yolu: sonuc.filePath }
    } catch (hata: any) {
      return { basarili: false, hata: hata.message }
    }
  })
}
