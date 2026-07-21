// =====================================================
// IPC Handler'ları — Merkezi Kayıt Modülü
// Tüm IPC handler dosyalarını toplar ve kaydeder
// =====================================================

import { IpcMain } from 'electron'
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

/**
 * Tüm IPC handler'larını kaydeder
 * Her modül kendi handler'larını bağımsız yönetir
 */
export function ipcHandlerlariniKaydet(ipcMain: IpcMain): void {
  personelIPCKaydet(ipcMain)
  menuIPCKaydet(ipcMain)
  masaIPCKaydet(ipcMain)
  hesapIPCKaydet(ipcMain)
  mutfakIPCKaydet(ipcMain)
  stokIPCKaydet(ipcMain)
  musteriIPCKaydet(ipcMain)
  raporIPCKaydet(ipcMain)
  ayarIPCKaydet(ipcMain)
  yaziciIPCKaydet(ipcMain)

  console.log('✅ Tüm IPC handler\'ları kaydedildi')
}
