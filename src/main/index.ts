// =====================================================
// Electron Ana İşlem (Main Process) — Giriş Noktası
// Uygulama penceresi, IPC yönetimi ve servis başlatma
// =====================================================

import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { veritabaniBaslat, veritabaniKapat } from './database/connection'
import { ipcHandlerlariniKaydet } from './ipc/index'
import { apiSunucusunuBaslat } from './api/server'

// Ana pencere referansı
let anaPencere: BrowserWindow | null = null

/**
 * Ana uygulama penceresini oluşturur
 * Dokunmatik ekran POS monitörü için optimize edilmiştir
 */
function pencereOlustur(): void {
  // Ekran boyutunu al
  const birincilEkran = screen.getPrimaryDisplay()
  const { width: ekranGenislik, height: ekranYukseklik } = birincilEkran.workAreaSize

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
    },
    // Uygulama ikonu
    icon: join(__dirname, '../../resources/icon.png'),
    backgroundColor: '#0f172a', // Koyu arka plan — yükleme sırasında beyaz flash önler
  })

  // Pencere hazır olduğunda göster (beyaz ekran gösterme)
  anaPencere.on('ready-to-show', () => {
    anaPencere?.show()
    // Geliştirme modunda DevTools aç
    if (is.dev) {
      anaPencere?.webContents.openDevTools({ mode: 'detach' })
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
    console.log('🚀 ETİBOL RESTO başlatılıyor...')

    // 1. Veritabanını başlat ve migration'ları çalıştır
    console.log('📦 Veritabanı bağlantısı kuruluyor...')
    await veritabaniBaslat()
    console.log('✅ Veritabanı hazır')

    // 2. IPC handler'larını kaydet
    console.log('🔌 IPC handler\'ları kaydediliyor...')
    ipcHandlerlariniKaydet(ipcMain)
    console.log('✅ IPC handler\'ları kayıtlı')

    // 3. REST API sunucusunu başlat (Boss & Garson modülleri için)
    console.log('🌐 API sunucusu başlatılıyor...')
    await apiSunucusunuBaslat()
    console.log('✅ API sunucusu aktif')

    // 4. Ana pencereyi oluştur
    pencereOlustur()
    console.log('✅ ETİBOL RESTO hazır!')

  } catch (hata) {
    console.error('❌ Uygulama başlatma hatası:', hata)
    app.quit()
  }
}

// Electron hazır olduğunda uygulamayı başlat
app.whenReady().then(uygulamaBaslat)

// Tüm pencereler kapandığında (macOS hariç)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    veritabaniKapat()
    app.quit()
  }
})

// macOS: dock ikonuna tıklandığında pencere yoksa yeniden oluştur
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    pencereOlustur()
  }
})

// Uygulama kapanırken veritabanını kapat
app.on('before-quit', () => {
  veritabaniKapat()
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
ipcMain.handle('pencere:kapat', () => anaPencere?.close())
