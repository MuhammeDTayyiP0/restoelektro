// =====================================================
// Electron Ana İşlem (Main Process) — Giriş Noktası
// Uygulama penceresi, IPC yönetimi ve servis başlatma
// =====================================================

import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { veritabaniBaslat, veritabaniKapat, veritabaniGetir } from './database/connection'
import { otomatikYedekAl } from './database/backup'
import { ipcHandlerlariniKaydet } from './ipc/index'
import { apiSunucusunuBaslat } from './api/server'
import {
  trayBaslat,
  trayYokEt,
  pencereyiGoster,
  trayKucultmeBildirimiGoster,
} from './services/tray.service'
import { terminalAyarYukle, terminalAyarKaydet, ikinciKasaMi, gpuKapaliMi } from './services/terminal.service'

// Uygulama adı — userData yolunun tutarlılığı için
app.name = 'ETİBOL POS'

// Ana pencere referansı
let anaPencere: BrowserWindow | null = null

// Uygulamanın tamamen kapatılıp kapatılmadığını kontrol eden bayrak
let isAppQuitting = false

// Kapanış yedeği bir kez alınır; ardından gerçek çıkış yapılır
let kapanisHazir = false

// Windows açılışında "--hidden" ile başlatıldıysa pencere tepside bekler
const gizliBaslat = process.argv.includes('--hidden')

// Windows 7/8 veya kullanıcı tercihi: GPU kapalıysa animasyonlar da azaltılır
const gpuKapali = gpuKapaliMi()

/**
 * Ana pencere referansını dışa aktarır
 */
export function anaPencereGetir(): BrowserWindow | null {
  return anaPencere
}

/**
 * Uygulamayı arka plandan çıkarıp tamamen sonlandırır
 */
export function tamamenCikisYap(): void {
  isAppQuitting = true
  trayYokEt()
  app.quit()
}

/**
 * Tekil çalışma kilidi (Single Instance Lock)
 * Uygulamanın birden fazla kopyasının açılmasını engeller
 */
const tekilUygulamaKilidi = app.requestSingleInstanceLock()

if (!tekilUygulamaKilidi) {
  // Başka bir örnek zaten çalışıyorsa bu kopyayı kapat
  app.quit()
} else {
  app.on('second-instance', () => {
    // İkinci bir kopya başlatılmaya çalışıldığında mevcut pencereyi öne getir
    if (anaPencere) {
      pencereyiGoster(anaPencere)
    }
  })
}

/**
 * Ana uygulama penceresini oluşturur
 * Dokunmatik ekran POS monitörü için optimize edilmiştir
 */
function pencereOlustur(): void {
  // Ekran boyutunu al
  const birincilEkran = screen.getPrimaryDisplay()
  const { width: ekranGenislik, height: ekranYukseklik } = birincilEkran.workAreaSize

  const icoYolu = is.dev
    ? join(__dirname, '../../resources/icon.ico')
    : join(process.resourcesPath, 'resources/icon.ico')

  anaPencere = new BrowserWindow({
    width: ekranGenislik,
    height: ekranYukseklik,
    minWidth: 1024,
    minHeight: 600,
    show: false, // Hazır olunca göster
    autoHideMenuBar: true,
    frame: false, // Özel başlık çubuğu kullanılacak
    titleBarStyle: 'hidden',
    // Dokunmatik ekran ayarları
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      // Dokunmatik ekran desteği
      zoomFactor: 1.0,
      additionalArguments: gpuKapali ? ['--etibol-az-hareket'] : [],
    },
    // Uygulama ikonu
    icon: icoYolu,
    backgroundColor: '#090A0F', // Koyu POS arka plan — yükleme sırasında beyaz flash önler
  })

  // Pencere hazır olduğunda göster (beyaz ekran gösterme)
  anaPencere.on('ready-to-show', () => {
    if (!gizliBaslat) anaPencere?.show()
    // Geliştirme modunda DevTools aç
    if (is.dev) {
      anaPencere?.webContents.openDevTools({ mode: 'detach' })
    }
  })

  // Sağ üstteki [X] butonuna veya kapatma eylemine basıldığında uygulamayı kapatmak yerine gizle
  anaPencere.on('close', (event) => {
    if (!isAppQuitting) {
      event.preventDefault()
      anaPencere?.hide()
      trayKucultmeBildirimiGoster()
    }
  })

  // Pencere kapandığında referansı temizle
  anaPencere.on('closed', () => {
    anaPencere = null
  })

  // Renderer sayfasını yükle
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    anaPencere.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    anaPencere.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

/**
 * Uygulama başlatma süreci
 */
async function uygulamaBaslat(): Promise<void> {
  try {
    console.log('🚀 ETİBOL POS başlatılıyor...')
    const terminal = terminalAyarYukle()

    if (terminal.rol === 'ikinci') {
      console.log(`🔗 İkinci kasa terminali (${terminal.terminalId}) → ${terminal.anaUrl || '(adres yok)'}`)
      ipcHandlerlariniKaydet(ipcMain, 'ikinci')
    } else {
      console.log('📦 Veritabanı bağlantısı kuruluyor...')
      await veritabaniBaslat()
      console.log('✅ Veritabanı hazır')

      console.log('🔌 IPC handler\'ları kaydediliyor...')
      ipcHandlerlariniKaydet(ipcMain, 'ana')
      console.log('✅ IPC handler\'ları kayıtlı')

      console.log('🌐 API sunucusu başlatılıyor...')
      await apiSunucusunuBaslat()
      console.log('✅ API sunucusu aktif')
    }

    pencereOlustur()

    if (anaPencere) {
      trayBaslat(anaPencere, tamamenCikisYap)
      console.log('🟢 System Tray servisi aktif')
    }

    console.log('✅ ETİBOL POS hazır!')
  } catch (hata) {
    console.error('❌ Uygulama başlatma hatası:', hata)
    app.quit()
  }
}

// Windows 7/8 ve sorunlu sürücülerde GPU kaynaklı beyaz ekranı engeller.
// Windows 10+ cihazlarda hızlandırma açık kalır; GPU süreci çökerse kalıcı olarak kapatılıp yeniden başlatılır.
if (gpuKapali) {
  app.disableHardwareAcceleration()
}

app.on('child-process-gone', (_event, detay) => {
  if (detay.type === 'GPU' && detay.reason !== 'clean-exit' && !gpuKapali) {
    console.warn(`⚠️ GPU süreci sonlandı (${detay.reason}) — donanım hızlandırma kapatılıp yeniden başlatılıyor`)
    terminalAyarKaydet({ gpu: 'kapali' })
    app.relaunch()
    tamamenCikisYap()
  }
})

// Electron hazır olduğunda uygulamayı başlat
app.whenReady().then(uygulamaBaslat)

// Tüm pencereler kapandığında (yedek ve DB kapanışı before-quit içinde yapılır)
app.on('window-all-closed', () => {
  if (isAppQuitting) app.quit()
})

// macOS: dock ikonuna tıklandığında pencere yoksa yeniden oluştur
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    pencereOlustur()
  } else if (anaPencere) {
    pencereyiGoster(anaPencere)
  }
})

// Uygulama kapanırken: çıkışı ertele → kapanış yedeğini bekle → DB'yi kapat → gerçekten çık.
// Electron async dinleyicileri beklemediği için preventDefault ile sıralı hale getirilir.
app.on('before-quit', (event) => {
  isAppQuitting = true
  if (kapanisHazir) return
  event.preventDefault()
  kapanisHazir = true

  void (async () => {
    try {
      if (!ikinciKasaMi()) {
        await otomatikYedekAl(veritabaniGetir(), 'kapanis')
      }
    } catch {
      // yedek alınamasa da çıkış engellenmez
    }
    try { veritabaniKapat() } catch { /* ikinci kasada db yok */ }
    trayYokEt()
    app.quit()
  })()
})

// Tam ekran IPC — dokunmatik POS için
ipcMain.handle('uygulama:tam-ekran', () => {
  if (anaPencere) {
    const tamEkranMi = anaPencere.isFullScreen()
    anaPencere.setFullScreen(!tamEkranMi)
    return !tamEkranMi
  }
  return false
})

// Pencere kontrol IPC'leri (özel başlık çubuğu için)
ipcMain.handle('pencere:kucult', () => anaPencere?.minimize())
ipcMain.handle('pencere:buyut', () => {
  if (anaPencere?.isMaximized()) {
    anaPencere.unmaximize()
  } else {
    anaPencere?.maximize()
  }
})
// Kapat butonuna basıldığında pencereyi gizle (System Tray'de arka planda çalışmaya devam eder)
ipcMain.handle('pencere:kapat', () => {
  if (anaPencere) {
    anaPencere.hide()
    trayKucultmeBildirimiGoster()
  }
})

// Pencere görünürlük IPC'leri
ipcMain.handle('uygulama:gizle', () => {
  if (anaPencere) {
    anaPencere.hide()
    trayKucultmeBildirimiGoster()
  }
  return true
})
ipcMain.handle('uygulama:goster', () => {
  if (anaPencere) {
    pencereyiGoster(anaPencere)
  }
  return true
})
