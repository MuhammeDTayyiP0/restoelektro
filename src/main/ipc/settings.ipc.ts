// =====================================================
// Ayar IPC Handler'ları
// =====================================================

import { IpcMain } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { AYAR_KANALLARI } from '../../common/ipc-channels'

export function ayarIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  // Tek ayar getir
  ipcMain.handle(AYAR_KANALLARI.GETIR, async (_event, anahtar: string) => {
    const ayar = db.prepare('SELECT deger FROM ayar WHERE anahtar = ?').get(anahtar) as any
    return ayar?.deger || null
  })

  // Ayar kaydet
  ipcMain.handle(AYAR_KANALLARI.KAYDET, async (_event, anahtar: string, deger: string) => {
    db.prepare('INSERT OR REPLACE INTO ayar (anahtar, deger) VALUES (?, ?)').run(anahtar, deger)
    return { basarili: true }
  })

  // Tüm ayarlar
  ipcMain.handle(AYAR_KANALLARI.TUMU, async () => {
    const ayarlar = db.prepare('SELECT * FROM ayar').all() as any[]
    const sonuc: Record<string, string> = {}
    for (const ayar of ayarlar) {
      sonuc[ayar.anahtar] = ayar.deger
    }
    return sonuc
  })
}
