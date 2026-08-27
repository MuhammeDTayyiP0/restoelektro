// =====================================================
// Raporlama IPC Handler'ları
// Finansal Ciro, Reçete Maliyeti, Net Kâr, Stok ve Ödeme Raporları
// =====================================================

import { IpcMain, dialog } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { RAPOR_KANALLARI } from '../../common/ipc-channels'
import { writeFileSync } from 'fs'
import * as XLSX from 'xlsx'

export function raporIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  // 1. Genel Finansal Satış & Maliyet Özeti
  ipcMain.handle(RAPOR_KANALLARI.GUNLUK_OZET, async (_event, baslangic: string, bitis: string) => {
    // Ciro ve hesap özeti (Kapanan/Ödenen hesaplar)
    const hesapOzeti = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN h.durum = 'odendi' THEN h.net_tutar ELSE 0 END), 0) as toplam_ciro,
        COUNT(CASE WHEN h.durum = 'odendi' THEN 1 END) as toplam_hesap,
        COALESCE(AVG(CASE WHEN h.durum = 'odendi' THEN h.net_tutar END), 0) as ortalama_hesap,
        COALESCE(SUM(CASE WHEN h.durum = 'iptal' THEN h.toplam_tutar ELSE 0 END), 0) as iptal_tutar,
        COALESCE(SUM(CASE WHEN h.durum = 'odendi' THEN h.indirim_tutar ELSE 0 END), 0) as indirim_tutar
      FROM hesap h
      WHERE DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
    `).get(baslangic, bitis) as any

    // Toplam reçete / hammadde maliyeti (Ödenen hesaplar + ikramlar)
    const maliyetOzeti = db.prepare(`
      SELECT
        COALESCE(SUM(s.cost_price), 0) as toplam_maliyet,
        COALESCE(SUM(CASE WHEN s.ikram = 1 THEN s.toplam_fiyat ELSE 0 END), 0) as ikram_tutar
      FROM siparis s
      JOIN hesap h ON h.id = s.hesap_id
      WHERE h.durum = 'odendi' AND s.durum != 'iptal' AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
    `).get(baslangic, bitis) as any

    // Ödeme tipi toplamları (Doğrudan ödeme kayıtları üzerinden)
    const odemeOzeti = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN o.odeme_tipi = 'nakit' THEN o.tutar ELSE 0 END), 0) as nakit_toplam,
        COALESCE(SUM(CASE WHEN o.odeme_tipi = 'kredi_karti' THEN o.tutar ELSE 0 END), 0) as kart_toplam,
        COALESCE(SUM(CASE WHEN o.odeme_tipi IN ('acik_hesap', 'veresiye', 'cari') THEN o.tutar ELSE 0 END), 0) as acik_hesap_toplam,
        COALESCE(SUM(CASE WHEN o.odeme_tipi NOT IN ('nakit', 'kredi_karti', 'acik_hesap', 'veresiye', 'cari') THEN o.tutar ELSE 0 END), 0) as diger_toplam
      FROM odeme o
      WHERE DATE(o.odeme_zamani, 'localtime') BETWEEN ? AND ?
    `).get(baslangic, bitis) as any

    const toplamCiro = Number(hesapOzeti?.toplam_ciro || 0)
    const toplamMaliyet = Number(maliyetOzeti?.toplam_maliyet || 0)
    const netKar = Number((toplamCiro - toplamMaliyet).toFixed(2))
    const karMarji = toplamCiro > 0 ? Number(((netKar / toplamCiro) * 100).toFixed(1)) : 0

    return {
      tarih: `${baslangic} - ${bitis}`,
      toplam_ciro: toplamCiro,
      toplam_maliyet: toplamMaliyet,
      net_kar: netKar,
      kar_marji: karMarji,
      toplam_hesap: Number(hesapOzeti?.toplam_hesap || 0),
      ortalama_hesap: Number((hesapOzeti?.ortalama_hesap || 0).toFixed(2)),
      nakit_toplam: Number(odemeOzeti?.nakit_toplam || 0),
      kart_toplam: Number(odemeOzeti?.kart_toplam || 0),
      acik_hesap_toplam: Number(odemeOzeti?.acik_hesap_toplam || 0),
      diger_toplam: Number(odemeOzeti?.diger_toplam || 0),
      iptal_tutar: Number(hesapOzeti?.iptal_tutar || 0),
      ikram_tutar: Number(maliyetOzeti?.ikram_tutar || 0),
      indirim_tutar: Number(hesapOzeti?.indirim_tutar || 0),
    }
  })

  // 2. Kategori Bazlı Satış & Kâr Raporu
  ipcMain.handle(RAPOR_KANALLARI.KATEGORI_RAPORU, async (_event, baslangic: string, bitis: string) => {
    return db.prepare(`
      SELECT 
        k.id as kategori_id, 
        k.ad as kategori_adi,
        COALESCE(SUM(s.miktar), 0) as satis_adedi,
        COALESCE(SUM(s.toplam_fiyat), 0) as toplam_tutar,
        COALESCE(SUM(s.cost_price), 0) as toplam_maliyet,
        COALESCE(SUM(s.toplam_fiyat) - SUM(s.cost_price), 0) as net_kar
      FROM kategori k
      LEFT JOIN urun u ON u.kategori_id = k.id
      LEFT JOIN siparis s ON s.urun_id = u.id AND s.durum != 'iptal'
      LEFT JOIN hesap h ON h.id = s.hesap_id AND h.durum != 'iptal' AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
      WHERE k.aktif = 1
      GROUP BY k.id
      ORDER BY toplam_tutar DESC
    `).all(baslangic, bitis)
  })

  // 3. Ürün & Reçete Performans Tablosu (En çok satanlar, harcanan reçete maliyeti, net kâr)
  ipcMain.handle(RAPOR_KANALLARI.URUN_RAPORU, async (_event, baslangic: string, bitis: string) => {
    return db.prepare(`
      SELECT 
        u.id as urun_id,
        u.ad as urun_adi,
        k.ad as kategori_adi,
        COALESCE(SUM(s.miktar), 0) as satis_adedi,
        COALESCE(SUM(s.toplam_fiyat), 0) as toplam_ciro,
        COALESCE(SUM(s.cost_price), 0) as toplam_maliyet,
        COALESCE(SUM(s.toplam_fiyat) - SUM(s.cost_price), 0) as net_kar,
        CASE 
          WHEN SUM(s.toplam_fiyat) > 0 
          THEN ROUND(((SUM(s.toplam_fiyat) - SUM(s.cost_price)) / SUM(s.toplam_fiyat)) * 100, 1)
          ELSE 0 
        END as kar_marji,
        COALESCE(AVG(s.birim_fiyat), 0) as ortalama_fiyat
      FROM urun u
      JOIN kategori k ON k.id = u.kategori_id
      JOIN siparis s ON s.urun_id = u.id AND s.durum != 'iptal'
      JOIN hesap h ON h.id = s.hesap_id AND h.durum != 'iptal' AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
      WHERE u.aktif = 1
      GROUP BY u.id
      ORDER BY toplam_ciro DESC
    `).all(baslangic, bitis)
  })

  // 4. Personel Performans Raporu
  ipcMain.handle(RAPOR_KANALLARI.PERSONEL_RAPORU, async (_event, baslangic: string, bitis: string) => {
    return db.prepare(`
      SELECT 
        p.id as personel_id, 
        p.ad || ' ' || p.soyad as personel_adi,
        COUNT(DISTINCT h.id) as hesap_sayisi,
        COALESCE(SUM(h.net_tutar), 0) as toplam_satis,
        COALESCE(AVG(h.net_tutar), 0) as ortalama_hesap,
        COALESCE((SELECT COUNT(*) FROM siparis s WHERE s.personel_id = p.id AND s.durum = 'iptal' AND DATE(s.siparis_zamani, 'localtime') BETWEEN ? AND ?), 0) as iptal_sayisi,
        COALESCE((SELECT SUM(s.toplam_fiyat) FROM siparis s WHERE s.personel_id = p.id AND s.ikram = 1 AND DATE(s.siparis_zamani, 'localtime') BETWEEN ? AND ?), 0) as ikram_tutari
      FROM personel p
      LEFT JOIN hesap h ON h.personel_id = p.id AND h.durum = 'odendi' AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
      WHERE p.aktif = 1
      GROUP BY p.id
      ORDER BY toplam_satis DESC
    `).all(baslangic, bitis, baslangic, bitis, baslangic, bitis)
  })

  // 5. Zaman (Saatlik veya Günlük) Satış & Maliyet Dağılımı (Grafik Verisi)
  ipcMain.handle(RAPOR_KANALLARI.SAATLIK_DAGILIM, async (_event, baslangic: string, bitis: string) => {
    if (baslangic === bitis) {
      // Tek gün ise saatlik dağılım (00:00 - 23:00)
      const satirlar = db.prepare(`
        SELECT 
          CAST(strftime('%H', h.acilis_zamani, 'localtime') AS INTEGER) || ':00' as zaman_etiketi,
          COUNT(DISTINCT h.id) as hesap_sayisi,
          COALESCE(SUM(h.net_tutar), 0) as toplam_tutar,
          COALESCE((
            SELECT SUM(s.cost_price)
            FROM siparis s
            WHERE s.hesap_id = h.id AND s.durum != 'iptal'
          ), 0) as toplam_maliyet
        FROM hesap h
        WHERE h.durum = 'odendi' AND DATE(h.acilis_zamani, 'localtime') = ?
        GROUP BY CAST(strftime('%H', h.acilis_zamani, 'localtime') AS INTEGER)
        ORDER BY CAST(strftime('%H', h.acilis_zamani, 'localtime') AS INTEGER)
      `).all(baslangic) as any[]

      return satirlar.map(r => ({
        zaman_etiketi: r.zaman_etiketi,
        hesap_sayisi: r.hesap_sayisi,
        toplam_tutar: Number(r.toplam_tutar || 0),
        toplam_maliyet: Number(r.toplam_maliyet || 0),
        net_kar: Number((Number(r.toplam_tutar || 0) - Number(r.toplam_maliyet || 0)).toFixed(2)),
      }))
    } else {
      // Birden fazla gün ise günlük dağılım
      const satirlar = db.prepare(`
        SELECT 
          DATE(h.acilis_zamani, 'localtime') as zaman_etiketi,
          COUNT(DISTINCT h.id) as hesap_sayisi,
          COALESCE(SUM(h.net_tutar), 0) as toplam_tutar,
          COALESCE((
            SELECT SUM(s.cost_price)
            FROM siparis s
            JOIN hesap h2 ON h2.id = s.hesap_id
            WHERE DATE(h2.acilis_zamani, 'localtime') = DATE(h.acilis_zamani, 'localtime') AND h2.durum = 'odendi' AND s.durum != 'iptal'
          ), 0) as toplam_maliyet
        FROM hesap h
        WHERE h.durum = 'odendi' AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
        GROUP BY DATE(h.acilis_zamani, 'localtime')
        ORDER BY DATE(h.acilis_zamani, 'localtime')
      `).all(baslangic, bitis) as any[]

      return satirlar.map(r => ({
        zaman_etiketi: r.zaman_etiketi,
        hesap_sayisi: r.hesap_sayisi,
        toplam_tutar: Number(r.toplam_tutar || 0),
        toplam_maliyet: Number(r.toplam_maliyet || 0),
        net_kar: Number((Number(r.toplam_tutar || 0) - Number(r.toplam_maliyet || 0)).toFixed(2)),
      }))
    }
  })

  // 6. Kasa & Ödeme Tipi Dağılımı Raporu
  ipcMain.handle(RAPOR_KANALLARI.KASA_RAPORU, async (_event, baslangic: string, bitis: string) => {
    const sonuclar = db.prepare(`
      SELECT 
        o.odeme_tipi,
        COUNT(*) as islem_sayisi,
        COALESCE(SUM(o.tutar), 0) as toplam_tutar
      FROM odeme o
      WHERE DATE(o.odeme_zamani, 'localtime') BETWEEN ? AND ?
      GROUP BY o.odeme_tipi
      ORDER BY toplam_tutar DESC
    `).all(baslangic, bitis) as any[]

    const genelToplam = sonuclar.reduce((acc, curr) => acc + Number(curr.toplam_tutar || 0), 0)

    return sonuclar.map(item => ({
      ...item,
      oran: genelToplam > 0 ? Number(((item.toplam_tutar / genelToplam) * 100).toFixed(1)) : 0
    }))
  })

  // 7. Kritik Stok & Hammadde Uyarı Raporu
  ipcMain.handle(RAPOR_KANALLARI.STOK_RAPORU, async () => {
    return db.prepare(`
      SELECT 
        h.id as hammadde_id,
        h.ad as hammadde_adi,
        h.birim,
        ROUND(h.mevcut_stok, 4) as mevcut_stok,
        ROUND(h.min_stok, 4) as min_stok,
        h.maliyet_birim,
        h.tedarikci,
        ROUND(h.mevcut_stok * h.maliyet_birim, 2) as toplam_deger,
        ROUND(MAX(0, h.min_stok - h.mevcut_stok), 4) as eksik_miktar,
        CASE
          WHEN h.mevcut_stok <= 0 THEN 'tukendi'
          WHEN h.mevcut_stok <= h.min_stok * 0.5 THEN 'kritik'
          WHEN h.mevcut_stok <= h.min_stok THEN 'dusuk'
          ELSE 'normal'
        END as stok_durumu
      FROM hammadde h
      WHERE h.aktif = 1
      ORDER BY 
        CASE 
          WHEN h.mevcut_stok <= 0 THEN 1
          WHEN h.mevcut_stok <= h.min_stok * 0.5 THEN 2
          WHEN h.mevcut_stok <= h.min_stok THEN 3
          ELSE 4
        END,
        h.ad ASC
    `).all()
  })

  // 8. Dışa Aktarım (Excel XLSX / CSV)
  ipcMain.handle(RAPOR_KANALLARI.DISA_AKTAR, async (_event, raporTipi: string, format: string, baslangic: string, bitis: string) => {
    try {
      let veri: any[] = []
      let basliklar: string[] = []

      if (raporTipi === 'satis') {
        basliklar = ['Tarih', 'Hesap No', 'Masa', 'Personel', 'Toplam Ciro', 'İndirim', 'Net Tutar', 'Maliyet', 'Net Kâr', 'Ödeme Tipi']
        veri = db.prepare(`
          SELECT 
            DATE(h.acilis_zamani, 'localtime') as Tarih, 
            h.hesap_no as 'Hesap No', 
            COALESCE(m.numara, 'Hızlı Satış') as Masa,
            p.ad || ' ' || p.soyad as Personel, 
            h.toplam_tutar as 'Toplam Ciro',
            h.indirim_tutar as Indirim, 
            h.net_tutar as 'Net Tutar',
            COALESCE((SELECT SUM(s.cost_price) FROM siparis s WHERE s.hesap_id = h.id AND s.durum != 'iptal'), 0) as Maliyet,
            (h.net_tutar - COALESCE((SELECT SUM(s.cost_price) FROM siparis s WHERE s.hesap_id = h.id AND s.durum != 'iptal'), 0)) as 'Net Kâr',
            GROUP_CONCAT(DISTINCT o.odeme_tipi) as 'Ödeme Tipi'
          FROM hesap h
          LEFT JOIN masa m ON m.id = h.masa_id
          JOIN personel p ON p.id = h.personel_id
          LEFT JOIN odeme o ON o.hesap_id = h.id
          WHERE h.durum = 'odendi' AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
          GROUP BY h.id 
          ORDER BY h.acilis_zamani DESC
        `).all(baslangic, bitis)
      } else if (raporTipi === 'urun') {
        basliklar = ['Ürün', 'Kategori', 'Satış Adedi', 'Toplam Ciro', 'Reçete Maliyeti', 'Net Kâr', 'Kâr Marjı (%)', 'Ortalama Fiyat']
        veri = db.prepare(`
          SELECT 
            u.ad as Urun, 
            k.ad as Kategori, 
            SUM(s.miktar) as 'Satış Adedi',
            SUM(s.toplam_fiyat) as 'Toplam Ciro', 
            SUM(s.cost_price) as 'Reçete Maliyeti',
            (SUM(s.toplam_fiyat) - SUM(s.cost_price)) as 'Net Kâr',
            CASE 
              WHEN SUM(s.toplam_fiyat) > 0 THEN ROUND(((SUM(s.toplam_fiyat) - SUM(s.cost_price)) / SUM(s.toplam_fiyat)) * 100, 1)
              ELSE 0 
            END as 'Kâr Marjı (%)',
            AVG(s.birim_fiyat) as 'Ortalama Fiyat'
          FROM siparis s 
          JOIN urun u ON u.id = s.urun_id 
          JOIN kategori k ON k.id = u.kategori_id
          JOIN hesap h ON h.id = s.hesap_id
          WHERE s.durum != 'iptal' AND h.durum != 'iptal' AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
          GROUP BY u.id 
          ORDER BY SUM(s.toplam_fiyat) DESC
        `).all(baslangic, bitis)
      } else if (raporTipi === 'stok') {
        basliklar = ['Hammadde', 'Birim', 'Mevcut Stok', 'Min Stok', 'Eksik Miktar', 'Birim Maliyet', 'Toplam Değer', 'Stok Durumu', 'Tedarikçi']
        veri = db.prepare(`
          SELECT 
            h.ad as Hammadde,
            h.birim as Birim,
            ROUND(h.mevcut_stok, 4) as 'Mevcut Stok',
            ROUND(h.min_stok, 4) as 'Min Stok',
            ROUND(MAX(0, h.min_stok - h.mevcut_stok), 4) as 'Eksik Miktar',
            h.maliyet_birim as 'Birim Maliyet',
            ROUND(h.mevcut_stok * h.maliyet_birim, 2) as 'Toplam Değer',
            CASE
              WHEN h.mevcut_stok <= 0 THEN 'Tükendi'
              WHEN h.mevcut_stok <= h.min_stok * 0.5 THEN 'Kritik'
              WHEN h.mevcut_stok <= h.min_stok THEN 'Düşük'
              ELSE 'Yeterli'
            END as 'Stok Durumu',
            COALESCE(h.tedarikci, '-') as Tedarikci
          FROM hammadde h
          WHERE h.aktif = 1
          ORDER BY h.mevcut_stok ASC
        `).all()
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
