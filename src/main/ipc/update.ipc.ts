// =====================================================
// Otomatik Güncelleme IPC Handler'ları (electron-updater)
// GitHub Releases tabanlı güncelleme kontrolü, indirme ve kurulum
// =====================================================

import { IpcMain, app, BrowserWindow } from 'electron'
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater'
import { is } from '@electron-toolkit/utils'
import { join } from 'path'
import { existsSync } from 'fs'
import { GUNCELLEME_KANALLARI } from '../../common/ipc-channels'

export interface GuncellemeIlerleme {
  percent: number
  bytesPerSecond: number
  transferred: number
  total: number
}

export type GuncellemeDurum = 
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export interface GuncellemeDurumBilgisi {
  status: GuncellemeDurum
  currentVersion: string
  newVersion?: string
  releaseDate?: string
  releaseNotes?: string
  progress?: GuncellemeIlerleme
  error?: string
  lastChecked?: string
}

// Merkezi bellek durumu
const guncellemeDurumu: GuncellemeDurumBilgisi = {
  status: 'idle',
  currentVersion: app.getVersion(),
}

/**
 * Tüm açık pencerelere IPC bildirimi gönderir
 */
function tumPencerelereGonder(kanal: string, veri: any): void {
  const pencereler = BrowserWindow.getAllWindows()
  for (const pencere of pencereler) {
    if (!pencere.isDestroyed() && pencere.webContents) {
      pencere.webContents.send(kanal, veri)
    }
  }
}

/**
 * Güncel durumu renderer tarafına yayınlar
 */
function durumGuncelleVeYayinla(yeniVeri?: Partial<GuncellemeDurumBilgisi>): void {
  if (yeniVeri) {
    Object.assign(guncellemeDurumu, yeniVeri)
  }
  guncellemeDurumu.currentVersion = app.getVersion()
  tumPencerelereGonder(GUNCELLEME_KANALLARI.DURUM_BILDIRIMI, { ...guncellemeDurumu })
}

let dinleyicilerKuruldu = false

/**
 * autoUpdater event dinleyicilerini yapılandırır
 */
function updaterDinleyicileriniKur(): void {
  if (dinleyicilerKuruldu) return
  dinleyicilerKuruldu = true

  // Geliştirme ortamında (npm run dev / paketlenmemiş) GitHub Releases kontrolü için
  if (is.dev || !app.isPackaged) {
    autoUpdater.forceDevUpdateConfig = true
    const devPath = join(process.cwd(), 'dev-app-update.yml')
    if (existsSync(devPath)) {
      (autoUpdater as any).updateConfigPath = devPath
    }
  }

  // GitHub feed URL'sini açıkça yapılandır
  try {
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'MuhammeDTayyiP0',
      repo: 'restoelektro',
    })
  } catch (err) {
    console.warn('⚠️ [AutoUpdater] Feed URL uyarısı:', err)
  }

  // Kullanıcı kontrollü indirme
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowPrerelease = false
  autoUpdater.allowDowngrade = false

  // 1. Güncelleme kontrol ediliyor
  autoUpdater.on('checking-for-update', () => {
    console.log('🔍 [AutoUpdater] Güncellemeler kontrol ediliyor...')
    durumGuncelleVeYayinla({
      status: 'checking',
      error: undefined,
    })
  })

  // 2. Yeni güncelleme bulundu
  autoUpdater.on('update-available', (info: UpdateInfo) => {
    console.log(`✨ [AutoUpdater] Yeni sürüm mevcut: v${info.version}`)
    let notlar: string | undefined
    if (typeof info.releaseNotes === 'string') {
      notlar = info.releaseNotes
    } else if (Array.isArray(info.releaseNotes)) {
      notlar = info.releaseNotes.map((n: any) => n?.note || '').join('\n')
    }

    durumGuncelleVeYayinla({
      status: 'available',
      newVersion: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: notlar,
      lastChecked: new Date().toISOString(),
      error: undefined,
    })
  })

  // 3. Güncelleme yok (uygulama en güncel sürümde)
  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    console.log('✅ [AutoUpdater] Uygulama en güncel sürümde.')
    durumGuncelleVeYayinla({
      status: 'not-available',
      newVersion: undefined,
      lastChecked: new Date().toISOString(),
      error: undefined,
    })
  })

  // 4. İndirme ilerlemesi (Canlı % ve Hız)
  autoUpdater.on('download-progress', (progressObj: ProgressInfo) => {
    const ilerleme: GuncellemeIlerleme = {
      percent: Math.round(progressObj.percent * 10) / 10,
      bytesPerSecond: progressObj.bytesPerSecond || 0,
      transferred: progressObj.transferred || 0,
      total: progressObj.total || 0,
    }

    guncellemeDurumu.status = 'downloading'
    guncellemeDurumu.progress = ilerleme
    
    tumPencerelereGonder(GUNCELLEME_KANALLARI.ILERLEME_BILDIRIMI, ilerleme)
    tumPencerelereGonder(GUNCELLEME_KANALLARI.DURUM_BILDIRIMI, { ...guncellemeDurumu })
  })

  // 5. Güncelleme indirildi ve kuruluma hazır
  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    console.log(`📦 [AutoUpdater] Sürüm v${info.version} indirildi, kuruluma hazır!`)
    durumGuncelleVeYayinla({
      status: 'downloaded',
      newVersion: info.version,
      progress: {
        percent: 100,
        bytesPerSecond: 0,
        transferred: guncellemeDurumu.progress?.total || 0,
        total: guncellemeDurumu.progress?.total || 0,
      },
      error: undefined,
    })
  })

  // 6. Hata oluştu
  autoUpdater.on('error', (err: Error) => {
    console.error('❌ [AutoUpdater] Hata:', err)
    durumGuncelleVeYayinla({
      status: 'error',
      error: err?.message || 'Güncelleme işlemi sırasında bir hata oluştu.',
    })
  })
}

/**
 * Güncelleme IPC Handler'larını kaydeder
 */
export function guncellemeIPCKaydet(ipcMain: IpcMain): void {
  updaterDinleyicileriniKur()

  // 1. Güncellemeleri Kontrol Et
  ipcMain.handle(GUNCELLEME_KANALLARI.KONTROL_ET, async () => {
    try {
      console.log('🔄 [IPC] Güncellemeleri kontrol et isteği alındı')
      durumGuncelleVeYayinla({
        status: 'checking',
        error: undefined,
      })

      if (is.dev || !app.isPackaged) {
        autoUpdater.forceDevUpdateConfig = true
        const devPath = join(process.cwd(), 'dev-app-update.yml')
        if (existsSync(devPath)) {
          (autoUpdater as any).updateConfigPath = devPath
        }
      }

      const sonuc = await autoUpdater.checkForUpdates()
      return {
        basarili: true,
        updateInfo: sonuc?.updateInfo,
      }
    } catch (error: any) {
      console.error('❌ Güncelleme kontrolü başarısız:', error)
      const hataMesaji = error?.message?.includes('Cannot check for updates because app is not packed')
        ? 'Geliştirme modunda paketli olmadan güncelleme kontrol edilemez.'
        : (error?.message || 'Güncellemeler kontrol edilemedi.')

      durumGuncelleVeYayinla({
        status: 'error',
        error: hataMesaji,
      })

      return {
        basarili: false,
        hata: hataMesaji,
      }
    }
  })

  // 2. Güncellemeyi İndir
  ipcMain.handle(GUNCELLEME_KANALLARI.INDIR, async () => {
    try {
      console.log('⬇️ [IPC] Güncelleme indirme isteği alındı')
      durumGuncelleVeYayinla({
        status: 'downloading',
        progress: { percent: 0, bytesPerSecond: 0, transferred: 0, total: 0 },
        error: undefined,
      })

      await autoUpdater.downloadUpdate()
      return { basarili: true }
    } catch (error: any) {
      console.error('❌ Güncelleme indirme başarısız:', error)
      const hataMesaji = error?.message || 'Güncelleme paketi indirilemedi.'
      durumGuncelleVeYayinla({
        status: 'error',
        error: hataMesaji,
      })
      return { basarili: false, hata: hataMesaji }
    }
  })

  // 3. Yeniden Başlat ve Yükle
  ipcMain.handle(GUNCELLEME_KANALLARI.YUKLE_VE_BASLAT, () => {
    try {
      console.log('🚀 [IPC] Uygulama yeniden başlatılıyor ve güncelleme kuruluyor...')
      // Kısa bir gecikme vererek IPC cevabının renderera iletilmesini sağla
      setImmediate(() => {
        autoUpdater.quitAndInstall(false, true)
      })
      return { basarili: true }
    } catch (error: any) {
      console.error('❌ Yeniden başlatma başarısız:', error)
      return { basarili: false, hata: error?.message }
    }
  })

  // 4. Mevcut Güncelleme Durumunu Getir
  ipcMain.handle(GUNCELLEME_KANALLARI.DURUM_GETIR, () => {
    guncellemeDurumu.currentVersion = app.getVersion()
    return { ...guncellemeDurumu }
  })
}
