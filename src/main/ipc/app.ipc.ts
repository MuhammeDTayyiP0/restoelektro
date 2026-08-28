// =====================================================
// Uygulama & Veritabanı Yönetimi IPC Handler'ları
// Yedekleme, bakım, optimize etme, otomatik başlatma ve sistem kanalları
// =====================================================

import { IpcMain, app } from 'electron'
import { existsSync, statSync } from 'fs'
import { is } from '@electron-toolkit/utils'
import { veritabaniGetir, veritabaniYoluGetir } from '../database/connection'
import { otomatikYedekAl, yedekleriListele } from '../database/backup'
import { UYGULAMA_KANALLARI } from '../../common/ipc-channels'
import { tamamenCikisYap } from '../index'

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

  // 6. Windows Başlangıcında Otomatik Başlatma Durumu
  ipcMain.handle(UYGULAMA_KANALLARI.OTOMATIK_BASLATMA_DURUM, async () => {
    try {
      const settings = app.getLoginItemSettings()
      let dbKaydi: boolean | null = null
      
      try {
        const db = veritabaniGetir()
        const ayar = db.prepare('SELECT deger FROM ayar WHERE anahtar = ?').get('otomatik_baslat') as any
        if (ayar?.deger !== undefined && ayar?.deger !== null) {
          dbKaydi = ayar.deger === '1'
        }
      } catch {
        // db okunamadıysa electron sonucunu kullan
      }

      return {
        basarili: true,
        openAtLogin: dbKaydi !== null ? dbKaydi : settings.openAtLogin,
      }
    } catch (error: any) {
      console.error('❌ Otomatik başlatma durumu sorgulanamadı:', error)
      return {
        basarili: false,
        openAtLogin: false,
        hata: error?.message || 'Durum alınamadı',
      }
    }
  })

  // 7. Windows Başlangıcında Otomatik Başlatma Ayarla
  ipcMain.handle(UYGULAMA_KANALLARI.OTOMATIK_BASLATMA_AYARLA, async (_event, openAtLogin: boolean) => {
    try {
      const aktifMi = Boolean(openAtLogin)
      
      // Electron başlangıç ayarını güncelle
      app.setLoginItemSettings({
        openAtLogin: aktifMi,
        path: process.execPath,
        args: is.dev ? [] : ['--hidden'],
      })

      // SQLite ayar tablosuna kaydet
      try {
        const db = veritabaniGetir()
        db.prepare('INSERT OR REPLACE INTO ayar (anahtar, deger) VALUES (?, ?)').run(
          'otomatik_baslat',
          aktifMi ? '1' : '0'
        )
      } catch (dbErr) {
        console.warn('⚠️ Veritabanına otomatik_baslat kaydedilemedi:', dbErr)
      }

      console.log(`⚙️ Otomatik başlatma ayarlandı: ${aktifMi ? 'ETKİN' : 'DEVRE DIŞI'}`)

      return {
        basarili: true,
        openAtLogin: aktifMi,
      }
    } catch (error: any) {
      console.error('❌ Otomatik başlatma ayarlanamadı:', error)
      return {
        basarili: false,
        hata: error?.message || 'Ayar kaydedilemedi',
      }
    }
  })

  // 8. Uygulamayı Tamamen Kapat
  ipcMain.handle(UYGULAMA_KANALLARI.KAPAT, async () => {
    tamamenCikisYap()
    return { basarili: true }
  })

  // 9. Uygulamayı Yeniden Başlat
  ipcMain.handle(UYGULAMA_KANALLARI.YENIDEN_BASLAT, async () => {
    app.relaunch()
    tamamenCikisYap()
    return { basarili: true }
  })
}
