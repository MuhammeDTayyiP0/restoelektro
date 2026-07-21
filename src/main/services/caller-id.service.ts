// =====================================================
// Caller ID Servisi
// Seri port üzerinden gelen arama verilerini okur
// =====================================================

import { BrowserWindow } from 'electron'
// SerialPort kütüphanesi için
// import { SerialPort } from 'serialport'
// import { ReadlineParser } from '@serialport/parser-readline'

export interface CallerIdConfig {
  portPath: string // Örn: COM3
  baudRate: number // Örn: 9600
  aktif: boolean
}

let portBaglantisi: any = null

/**
 * Caller ID cihazına bağlanır ve gelen aramaları dinler
 */
export function baslatCallerId(ayar: CallerIdConfig) {
  if (!ayar.aktif) return

  try {
    /* GERÇEK DONANIM İÇİN (Yorum satırında bırakıyoruz, C++ build sorunu yaşamamak için mock kullanacağız)
    
    portBaglantisi = new SerialPort({ path: ayar.portPath, baudRate: ayar.baudRate })
    const parser = portBaglantisi.pipe(new ReadlineParser({ delimiter: '\r\n' }))

    parser.on('data', (data: string) => {
      // Örnek data formatı Cihazdan cihaza değişir. 
      // Örn CID cihazları genelde "NMBR=05551234567" gönderir.
      const telMatch = data.match(/NMBR=(\d+)/)
      
      if (telMatch && telMatch[1]) {
        const telefon = telMatch[1]
        
        // Ana pencereye bildir
        const windows = BrowserWindow.getAllWindows()
        windows.forEach(win => {
          win.webContents.send('caller-id:arama', telefon)
        })
      }
    })

    portBaglantisi.on('error', (err: any) => {
      console.error('Caller ID Seri Port Hatası:', err)
    })
    
    */
    
    console.log(`📞 Caller ID Sanal Servisi Başlatıldı (Port: ${ayar.portPath})`)

  } catch (hata) {
    console.error('Caller ID başlatılamadı:', hata)
  }
}

export function durdurCallerId() {
  if (portBaglantisi && portBaglantisi.isOpen) {
    portBaglantisi.close()
  }
  console.log('📞 Caller ID durduruldu')
}

// Geliştirme amaçlı, sahte bir arama tetiklemek için
export function sahteAramaTetikle(telefon: string) {
  const windows = BrowserWindow.getAllWindows()
  windows.forEach(win => {
    win.webContents.send('caller-id:arama', telefon)
  })
}
