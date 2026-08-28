// =====================================================
// Ağ ve IP Yönetimi IPC Handler'ları
// Bilgisayardaki ağ kartlarını tarama ve yerel IP tespiti
// =====================================================

import { IpcMain } from 'electron'
import { AG_KANALLARI } from '../../common/ipc-channels'
import { agKartlariniTara, varsayilanYerelIpGetir } from '../services/network.service'

export function networkIPCKaydet(ipcMain: IpcMain): void {
  // Tüm aktif ağ kartlarını ve varsayılan IP'yi getir
  ipcMain.handle(AG_KANALLARI.KARTLARI_GETIR, async () => {
    try {
      const sonuc = agKartlariniTara()
      return {
        basarili: true,
        ...sonuc,
      }
    } catch (error: any) {
      console.error('❌ Ağ kartları taranırken hata oluştu:', error)
      return {
        basarili: false,
        kartlar: [],
        varsayilanIp: '127.0.0.1',
        port: 3847,
        hata: error?.message || 'Ağ kartları alınamadı',
      }
    }
  })

  // Sadece en uygun yerel IP'yi getir
  ipcMain.handle(AG_KANALLARI.YEREL_IP_GETIR, async () => {
    try {
      const ip = varsayilanYerelIpGetir()
      return {
        basarili: true,
        ip,
        port: 3847,
      }
    } catch (error: any) {
      console.error('❌ Yerel IP alınırken hata:', error)
      return {
        basarili: false,
        ip: '127.0.0.1',
        port: 3847,
        hata: error?.message || 'Yerel IP alınamadı',
      }
    }
  })
}
