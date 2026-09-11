// =====================================================
// IPC Handler'ları — Merkezi Kayıt Modülü
// Tüm IPC handler dosyalarını toplar ve kaydeder
// =====================================================

import { IpcMain, app } from 'electron'
import { personelIPCKaydet } from './staff.ipc'
import { menuIPCKaydet } from './menu.ipc'
import { masaIPCKaydet } from './table.ipc'
import { hesapIPCKaydet } from './pos.ipc'
import { mutfakIPCKaydet } from './order.ipc'
import { stokIPCKaydet } from './inventory.ipc'
import { musteriIPCKaydet } from './customer.ipc'
import { raporIPCKaydet } from './report.ipc'
import { ayarIPCKaydet } from './settings.ipc'
import { yaziciIPCKaydet } from './printer.ipc'
import { appIPCKaydet } from './app.ipc'
import { guncellemeIPCKaydet } from './update.ipc'
import { networkIPCKaydet } from './network.ipc'
import { kasaIPCKaydet } from './kasa.ipc'
import { rezervasyonIPCKaydet } from './reservation.ipc'
import { denetimIPCKaydet } from './audit.ipc'
import { terminalIPCKaydet } from './terminal.ipc'
import { ipcHandleSar, yerelKanalMi } from './ipc-registry'
import { terminalAyarYukle } from '../services/terminal.service'
import { httpJson } from '../services/http-json'
import { varsayilanYerelIpGetir } from '../services/network.service'
import { tamamenCikisYap } from '../index'
import {
  PERSONEL_KANALLARI,
  MENU_KANALLARI,
  MASA_KANALLARI,
  HESAP_KANALLARI,
  MUTFAK_KANALLARI,
  STOK_KANALLARI,
  MUSTERI_KANALLARI,
  RAPOR_KANALLARI,
  KASA_KANALLARI,
  REZERVASYON_KANALLARI,
  DENETIM_KANALLARI,
  AYAR_KANALLARI,
  FATURA_KANALLARI,
  UYGULAMA_KANALLARI,
} from '../../common/ipc-channels'

function uzakKanalListesi(): string[] {
  return [
    ...Object.values(PERSONEL_KANALLARI),
    ...Object.values(MENU_KANALLARI),
    ...Object.values(MASA_KANALLARI),
    ...Object.values(HESAP_KANALLARI),
    ...Object.values(MUTFAK_KANALLARI),
    ...Object.values(STOK_KANALLARI),
    ...Object.values(MUSTERI_KANALLARI),
    ...Object.values(RAPOR_KANALLARI),
    ...Object.values(KASA_KANALLARI),
    ...Object.values(REZERVASYON_KANALLARI),
    ...Object.values(DENETIM_KANALLARI),
    ...Object.values(AYAR_KANALLARI),
    ...Object.values(FATURA_KANALLARI),
    UYGULAMA_KANALLARI.VERITABANI_YEDEKLE,
    UYGULAMA_KANALLARI.VERITABANI_BILGISI,
    UYGULAMA_KANALLARI.VERITABANI_OPTIMIZE,
    UYGULAMA_KANALLARI.VERITABANI_YEDEKLER,
    UYGULAMA_KANALLARI.OTOMATIK_BASLATMA_DURUM,
    UYGULAMA_KANALLARI.OTOMATIK_BASLATMA_AYARLA,
  ].filter((k) => !yerelKanalMi(k))
}

function uzakIpcKaydet(ipcMain: IpcMain): void {
  for (const kanal of uzakKanalListesi()) {
    ipcMain.handle(kanal, async (_event, ...args: unknown[]) => {
      const t = terminalAyarYukle()
      const url = String(t.anaUrl || '').replace(/\/$/, '')
      if (!url) {
        return { basarili: false, hata: 'Ana kasa adresi tanımlı değil (Ayarlar → Terminal)' }
      }
      try {
        return await httpJson(`${url}/api/ipc`, {
          kanal,
          args,
          token: t.lanToken,
          terminalId: t.terminalId,
        })
      } catch (err: any) {
        return { basarili: false, hata: 'Ana kasaya ulaşılamadı: ' + (err?.message || err) }
      }
    })
  }
  console.log('🔗 İkinci kasa — veri kanalları ana kasaya yönlendirildi')
}

/**
 * Tüm IPC handler'larını kaydeder
 * Ana kasa: yerel SQLite. İkinci kasa: LAN proxy.
 */
export function ipcHandlerlariniKaydet(ipcMain: IpcMain, mod: 'ana' | 'ikinci' = 'ana'): void {
  terminalIPCKaydet(ipcMain)
  yaziciIPCKaydet(ipcMain)
  guncellemeIPCKaydet(ipcMain)
  networkIPCKaydet(ipcMain)

  if (mod === 'ikinci') {
    uzakIpcKaydet(ipcMain)
    ipcMain.handle(UYGULAMA_KANALLARI.SURUM_BILGISI, async () => ({
      surum: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      localIP: varsayilanYerelIpGetir(),
      apiPort: 3847,
      ikinci: true,
    }))
    ipcMain.handle(UYGULAMA_KANALLARI.KAPAT, async () => {
      tamamenCikisYap()
      return { basarili: true }
    })
    ipcMain.handle(UYGULAMA_KANALLARI.YENIDEN_BASLAT, async () => {
      app.relaunch()
      tamamenCikisYap()
      return { basarili: true }
    })
    console.log('✅ İkinci kasa IPC (proxy + yerel yazıcı/pencere) kaydedildi')
    return
  }

  ipcHandleSar(ipcMain)
  personelIPCKaydet(ipcMain)
  menuIPCKaydet(ipcMain)
  masaIPCKaydet(ipcMain)
  hesapIPCKaydet(ipcMain)
  mutfakIPCKaydet(ipcMain)
  stokIPCKaydet(ipcMain)
  musteriIPCKaydet(ipcMain)
  raporIPCKaydet(ipcMain)
  ayarIPCKaydet(ipcMain)
  appIPCKaydet(ipcMain)
  kasaIPCKaydet(ipcMain)
  rezervasyonIPCKaydet(ipcMain)
  denetimIPCKaydet(ipcMain)

  console.log('✅ Tüm IPC handler\'ları kaydedildi')
}
