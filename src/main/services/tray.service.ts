// =====================================================
// System Tray (Sistem Tepsisi) Yönetim Servisi
// Windows bildirim alanı ikonu, menüsü ve arka plan yönetimi
// =====================================================

import { app, BrowserWindow, Menu, nativeImage, NativeImage, Tray } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

let tray: Tray | null = null
let ilkKucultmeMi = true

/**
 * Tray ikon dosyasını güvenli şekilde yükler
 */
function trayIkonuGetir(): NativeImage {
  const icoYolu = is.dev
    ? join(__dirname, '../../resources/icon.ico')
    : join(process.resourcesPath, 'resources/icon.ico')

  const pngYolu = is.dev
    ? join(__dirname, '../../resources/icon.png')
    : join(process.resourcesPath, 'resources/icon.png')

  let image = nativeImage.createFromPath(icoYolu)
  if (image.isEmpty()) {
    image = nativeImage.createFromPath(pngYolu)
  }
  return image
}

/**
 * Ana pencereyi öne getirir veya gizler
 */
export function pencereyiGosterGizle(pencere?: BrowserWindow | null): void {
  if (!pencere || pencere.isDestroyed()) return

  if (pencere.isVisible()) {
    if (pencere.isMinimized()) {
      pencere.restore()
      pencere.focus()
    } else if (pencere.isFocused()) {
      pencere.hide()
    } else {
      pencere.focus()
    }
  } else {
    pencere.show()
    pencere.focus()
  }
}

/**
 * Pencereyi doğrudan ekrana getirir ve odaklar
 */
export function pencereyiGoster(pencere?: BrowserWindow | null): void {
  if (!pencere || pencere.isDestroyed()) return
  if (pencere.isMinimized()) {
    pencere.restore()
  }
  pencere.show()
  pencere.focus()
}

/**
 * Sistem Tepsisi (Tray) başlatır ve bağlam menüsünü ayarlar
 */
export function trayBaslat(
  pencere: BrowserWindow,
  tamamenCikisFonksiyonu: () => void
): Tray {
  if (tray) {
    return tray
  }

  const ikon = trayIkonuGetir()
  tray = new Tray(ikon)
  tray.setToolTip('ETİBOL POS — Profesyonel Restoran Yönetimi')

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `ETİBOL POS v${app.getVersion()}`,
      enabled: false,
    },
    {
      type: 'separator',
    },
    {
      label: 'Göster / Gizle',
      click: () => {
        pencereyiGosterGizle(pencere)
      },
    },
    {
      label: 'Yeniden Başlat',
      click: () => {
        app.relaunch()
        tamamenCikisFonksiyonu()
      },
    },
    {
      type: 'separator',
    },
    {
      label: 'Sistemden Tamamen Çık',
      click: () => {
        tamamenCikisFonksiyonu()
      },
    },
  ])

  tray.setContextMenu(contextMenu)

  // Tray ikonuna sol tıklandığında pencereyi aç/kapat
  tray.on('click', () => {
    pencereyiGosterGizle(pencere)
  })

  // Çift tıklandığında pencereyi öne getir
  tray.on('double-click', () => {
    pencereyiGoster(pencere)
  })

  return tray
}

/**
 * Uygulama tepsiye küçültüldüğünde Windows balon bildirimi gösterir
 */
export function trayKucultmeBildirimiGoster(): void {
  if (tray && ilkKucultmeMi && process.platform === 'win32') {
    try {
      tray.displayBalloon({
        title: 'ETİBOL POS Arka Planda Çalışıyor',
        content: 'Uygulama sistem tepsisine küçültüldü. Garson ve mutfak ağ servisleri aktif kalmaya devam ediyor.',
      })
      ilkKucultmeMi = false
    } catch {
      // Balloon desteklenmiyorsa sessizce geç
    }
  }
}

/**
 * Tray nesnesini temizler
 */
export function trayYokEt(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
