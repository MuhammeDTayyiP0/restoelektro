// =====================================================
// Mutfak & Sipariş Yönlendirme IPC Handler'ları
// =====================================================

import { IpcMain, BrowserWindow } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { MUTFAK_KANALLARI } from '../../common/ipc-channels'

export function mutfakIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  // Bekleyen siparişleri getir (mutfak ekranı)
  ipcMain.handle(MUTFAK_KANALLARI.BEKLEYEN_SIPARISLER, async (_event, yaziciGrup?: string) => {
    const filtre = yaziciGrup ? "AND s.yazici_grup = ?" : ""
    const params = yaziciGrup ? [yaziciGrup] : []

    const siparisler = db.prepare(`
      SELECT s.*, u.ad as urun_adi, h.hesap_no, h.hesap_tipi,
             m.numara as masa_numara, p.ad || ' ' || p.soyad as garson_adi,
             v.ad as varyant_adi
      FROM siparis s
      JOIN hesap h ON h.id = s.hesap_id
      JOIN urun u ON u.id = s.urun_id
      LEFT JOIN masa m ON m.id = h.masa_id
      JOIN personel p ON p.id = s.personel_id
      LEFT JOIN urun_varyant v ON v.id = s.varyant_id
      WHERE s.durum IN ('bekliyor', 'hazirlaniyor') ${filtre}
      ORDER BY s.siparis_zamani ASC
    `).all(...params)

    return siparisler
  })

  // Sipariş durumu güncelle
  ipcMain.handle(MUTFAK_KANALLARI.DURUM_GUNCELLE, async (_event, siparisId: number, yeniDurum: string) => {
    const guncellemeler: Record<string, string> = {
      'hazirlaniyor': "UPDATE siparis SET durum = 'hazirlaniyor' WHERE id = ?",
      'hazir': "UPDATE siparis SET durum = 'hazir', hazir_zamani = CURRENT_TIMESTAMP WHERE id = ?",
      'teslim': "UPDATE siparis SET durum = 'teslim' WHERE id = ?",
    }

    const sorgu = guncellemeler[yeniDurum]
    if (sorgu) {
      db.prepare(sorgu).run(siparisId)

      // Tüm pencerelere bildirim gönder
      const pencereler = BrowserWindow.getAllWindows()
      for (const pencere of pencereler) {
        pencere.webContents.send('mutfak:yeni-siparis', { siparis_id: siparisId, durum: yeniDurum })
      }

      return { basarili: true }
    }
    return { basarili: false, hata: 'Geçersiz durum' }
  })
}
