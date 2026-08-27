// =====================================================
// Uygulama & Veritabanı Yönetimi IPC Handler'ları
// Yedekleme, bakım, optimize etme ve sistem teşhis kanalları
// =====================================================

import { IpcMain, app } from 'electron'
import { existsSync, statSync } from 'fs'
import { veritabaniGetir, veritabaniYoluGetir } from '../database/connection'
import { otomatikYedekAl, yedekleriListele } from '../database/backup'
import { UYGULAMA_KANALLARI } from '../../common/ipc-channels'

export function appIPCKaydet(ipcMain: IpcMain): void {
  // 1. Manuel Veritabanı Yedeği Al
  ipcMain.handle(UYGULAMA_KANALLARI.VERITABANI_YEDEKLE, async () => {
    try {
      const db = veritabaniGetir()
      const sonuc = await otomatikYedekAl(db, 'manuel')
      return sonuc
    } catch (error: any) {
      console.error('❌ IPC Veritabanı yedekleme hatası:', error)
      return { basarili: false, hata: error?.message || 'Yedekleme başarısız' }
    }
  })

  // 2. Veritabanı ve Sistem Bilgilerini Getir
  ipcMain.handle(UYGULAMA_KANALLARI.VERITABANI_BILGISI, async () => {
    try {
      const db = veritabaniGetir()
      const dbYolu = veritabaniYoluGetir()
      let dbBoyutFormatted = '0 KB'
      let dbBoyutBytes = 0

      if (existsSync(dbYolu)) {
        const stats = statSync(dbYolu)
        dbBoyutBytes = stats.size
        dbBoyutFormatted =
          stats.size > 1024 * 1024
            ? `${(stats.size / (1024 * 1024)).toFixed(2)} MB`
            : `${(stats.size / 1024).toFixed(1)} KB`
      }

      // Şema sürümü ve kayıt istatistikleri
      const userVersion = (db.pragma('user_version', { simple: true }) as number) || 1
      const urunSayisi = (db.prepare('SELECT COUNT(*) as sayi FROM urun').get() as any)?.sayi || 0
      const hesapSayisi = (db.prepare('SELECT COUNT(*) as sayi FROM hesap').get() as any)?.sayi || 0
      const personelSayisi = (db.prepare('SELECT COUNT(*) as sayi FROM personel').get() as any)?.sayi || 0
      const musteriSayisi = (db.prepare('SELECT COUNT(*) as sayi FROM musteri').get() as any)?.sayi || 0

      const yedekler = yedekleriListele()
      const sonYedek = yedekler.length > 0 ? yedekler[0].olusturmaTarihi : null

      return {
        basarili: true,
        dbYolu,
        dbBoyutFormatted,
        dbBoyutBytes,
        userVersion,
        istatistikler: {
          urunSayisi,
          hesapSayisi,
          personelSayisi,
          musteriSayisi,
        },
        toplamYedekSayisi: yedekler.length,
        sonYedekTarihi: sonYedek,
        uygulamaSurumu: app.getVersion(),
        userDataPath: app.getPath('userData'),
      }
    } catch (error: any) {
      console.error('❌ Veritabanı bilgisi alınamadı:', error)
      return {
        basarili: false,
        hata: error?.message || 'Bilgi alınamadı',
      }
    }
  })

  // 3. Veritabanı Optimize Et (VACUUM, WAL Checkpoint, PRAGMA optimize)
  ipcMain.handle(UYGULAMA_KANALLARI.VERITABANI_OPTIMIZE, async () => {
    try {
      const db = veritabaniGetir()
      const baslangic = Date.now()

      // WAL checkpoint
      db.pragma('wal_checkpoint(TRUNCATE)')
      // İndeks optimizasyonu
      db.pragma('optimize')
      // Alan sıkıştırma
      db.exec('VACUUM;')

      const sure = Date.now() - baslangic
      console.log(`🧹 Veritabanı başarıyla optimize edildi (${sure}ms)`)

      return {
        basarili: true,
        sureMs: sure,
        mesaj: 'Veritabanı indeksleri ve disk alanı optimize edildi.',
      }
    } catch (error: any) {
      console.error('❌ Veritabanı optimizasyonu hatası:', error)
      return {
        basarili: false,
        hata: error?.message || 'Optimizasyon başarısız',
      }
    }
  })

  // 4. Yedek Dosyalarını Listele
  ipcMain.handle(UYGULAMA_KANALLARI.VERITABANI_YEDEKLER, async () => {
    try {
      const yedekler = yedekleriListele()
      return {
        basarili: true,
        yedekler,
      }
    } catch (error: any) {
      return {
        basarili: false,
        yedekler: [],
        hata: error?.message,
      }
    }
  })

  // 5. Sürüm Bilgisi
  ipcMain.handle(UYGULAMA_KANALLARI.SURUM_BILGISI, async () => {
    const os = require('os')
    let localIP = 'localhost'
    try {
      const interfaces = os.networkInterfaces()
      for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
          if (iface.family === 'IPv4' && !iface.internal) {
            localIP = iface.address
            break
          }
        }
      }
    } catch (e) {
      console.error(e)
    }

    return {
      surum: app.getVersion(),
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      localIP,
      apiPort: 3847,
    }
  })
}
