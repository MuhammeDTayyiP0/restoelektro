// =====================================================
// Denetim izi sorgulama IPC
// =====================================================

import { IpcMain } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { DENETIM_KANALLARI } from '../../common/ipc-channels'

export function denetimIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  ipcMain.handle(DENETIM_KANALLARI.LISTELE, async (_e, filtre: any = {}) => {
    const kosul: string[] = []
    const deger: any[] = []
    if (filtre?.baslangic) {
      kosul.push('zaman >= ?')
      deger.push(filtre.baslangic)
    }
    if (filtre?.bitis) {
      kosul.push('zaman <= ?')
      deger.push(filtre.bitis)
    }
    if (filtre?.islem && filtre.islem !== 'tumu') {
      kosul.push('islem = ?')
      deger.push(filtre.islem)
    }
    if (filtre?.personel_id) {
      kosul.push('personel_id = ?')
      deger.push(Number(filtre.personel_id))
    }
    if (filtre?.arama) {
      kosul.push('(ozet LIKE ? OR personel_adi LIKE ? OR islem LIKE ?)')
      const q = `%${filtre.arama}%`
      deger.push(q, q, q)
    }
    const where = kosul.length ? `WHERE ${kosul.join(' AND ')}` : ''
    const limit = Math.min(500, Number(filtre?.limit || 200))
    return db.prepare(`
      SELECT * FROM denetim_log
      ${where}
      ORDER BY id DESC
      LIMIT ?
    `).all(...deger, limit)
  })
}
