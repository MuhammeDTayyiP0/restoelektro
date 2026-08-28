// =====================================================
// System Tray (Sistem Tepsisi) Yönetim Servisi
// Windows bildirim alanı ikonu, menüsü ve arka plan yönetimi
// =====================================================

import { app, BrowserWindow, Menu, nativeImage, NativeImage, Tray } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { existsSync } from 'fs'

let tray: Tray | null = null
let ilkKucultmeMi = true

/**
 * Tray ikon dosyasını güvenli şekilde yükler
 * Dev modda: resources/ klasöründen, prod modda: extraResources ile paketlenen yoldan
 */
function trayIkonuGetir(): NativeImage {
  // Olası ikon yolları — öncelik sırasıyla denenir
  const ikonYollari: string[] = is.dev
    ? [
        join(__dirname, '../../resources/icon.ico'),
        join(__dirname, '../../resources/icon.png'),
      ]
    : [
        join(process.resourcesPath, 'icon.ico'),
        join(process.resourcesPath, 'icon.png'),
        join(process.resourcesPath, 'resources/icon.ico'),
        join(process.resourcesPath, 'resources/icon.png'),
      ]

  for (const yol of ikonYollari) {
    if (existsSync(yol)) {
      const image = nativeImage.createFromPath(yol)
      if (!image.isEmpty()) {
        console.log(`✅ [Tray] İkon yüklendi: ${yol}`)
        return image
      }
    }
  }

  // Hiçbir ikon bulunamazsa boş ikon oluştur (crash önleme)
  console.warn('⚠️ [Tray] İkon dosyası bulunamadı, boş ikon kullanılıyor. Denenen yollar:', ikonYollari)
  return nativeImage.createEmpty()
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
  tray.setToolTip(`ETİBOL POS v${app.getVersion()}`)

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
