// =====================================================
// Yazıcı Servisi (ESC/POS)
// Adisyon ve Mutfak fişi yazdırma işlemleri
// =====================================================

// Node ortamında çalıştığımız için modülleri dinamik yüklemek gerekebilir veya main'de kullanabiliriz.
// Eğer 'escpos' ve 'escpos-usb' kurulu değilse hata fırlatmamak için try-catch bloğu ekliyoruz.
let escpos: any = null
let USB: any = null

try {
  // Not: escpos paketleri genellikle derleme isteyebilir. Hata almamak için şimdilik isteğe bağlı bırakıyoruz.
  // escpos = require('escpos')
  // escpos.USB = require('escpos-usb')
} catch (e) {
  console.log('ESC/POS kütüphanesi yüklenemedi. Sanal yazıcı modu aktif.')
}

interface YaziciAyar {
  id: string
  ad: string
  baglanti_tipi: 'usb' | 'network' | 'serial'
  ip?: string
  port?: number
  kagit_genisligi: 58 | 80
}

/**
 * Yazıcı cihazını bağlar
 */
function yaziciBaglan(ayar: YaziciAyar): any {
  if (!escpos) return null // Sanal mod

  try {
    let cihaz
    if (ayar.baglanti_tipi === 'usb') {
      cihaz = new escpos.USB()
    } else if (ayar.baglanti_tipi === 'network') {
      cihaz = new escpos.Network(ayar.ip, ayar.port || 9100)
    } else {
      cihaz = new escpos.Serial(ayar.port)
    }
    
    return new escpos.Printer(cihaz)
  } catch (err) {
    console.error('Yazıcı bağlantı hatası:', err)
    return null
  }
}

/**
 * Mutfak fişi yazdırır
 */
export async function mutfakFisiYazdir(siparisler: any[], yaziciAyar: YaziciAyar) {
  return new Promise((resolve) => {
    const yazici = yaziciBaglan(yaziciAyar)
    
    if (!yazici) {
      console.log('--- SANAL MUTFAK FİŞİ ---')
      console.log(`Masa: ${siparisler[0]?.masa_numara}`)
      console.log('Kalemler:')
      siparisler.forEach(s => console.log(`- ${s.miktar}x ${s.urun_adi} [${s.notlar || ''}]`))
      console.log('-------------------------')
      return resolve(true)
    }

    const cihaz = yazici.device
    cihaz.open((hata: any) => {
      if (hata) {
        console.error('Cihaz açılamadı:', hata)
        return resolve(false)
      }

      const font = yaziciAyar.kagit_genisligi === 80 ? 'a' : 'b'
      
      yazici
        .font(font)
        .align('ct')
        .style('B')
        .size(2, 2)
        .text('MUTFAK SIPARISI')
        .text(`MASA: ${siparisler[0]?.masa_numara || 'PAKET'}`)
        .size(1, 1)
        .text(`Tarih: ${new Date().toLocaleTimeString('tr-TR')}`)
        .text(`Garson: ${siparisler[0]?.garson_adi}`)
        .drawLine()
        .align('lt')
        
      siparisler.forEach(siparis => {
        yazici.size(1, 2)
        yazici.text(`${siparis.miktar}x ${siparis.urun_adi}`)
        
        yazici.size(1, 1)
        if (siparis.varyant_adi) {
          yazici.text(`   [${siparis.varyant_adi}]`)
        }
        if (siparis.notlar) {
          yazici.style('I').text(`   Not: ${siparis.notlar}`).style('NORMAL')
        }
      })
      
      yazici
        .drawLine()
        .feed(3)
        .cut()
        .close()
        
      resolve(true)
    })
  })
}

/**
 * Müşteri adisyonu yazdırır
 */
export async function adisyonYazdir(hesap: any, sepet: any[], yaziciAyar: YaziciAyar) {
  return new Promise((resolve) => {
    const yazici = yaziciBaglan(yaziciAyar)
    
    if (!yazici) {
      console.log('--- SANAL ADİSYON ---')
      console.log(`Hesap: ${hesap.hesap_no}`)
      console.log(`Toplam: ${hesap.toplam_tutar} TL`)
      console.log('---------------------')
      return resolve(true)
    }

    const cihaz = yazici.device
    cihaz.open((hata: any) => {
      if (hata) {
        return resolve(false)
      }

      yazici
        .align('ct')
        .style('B')
        .size(2, 2)
        .text('RESTOELEKTRO')
        .size(1, 1)
        .text('Lezzetin Doğru Adresi')
        .feed(1)
        .text(`MASA: ${hesap.masa_numara || 'PAKET'}`)
        .text(`Tarih: ${new Date().toLocaleString('tr-TR')}`)
        .text(`Hesap No: ${hesap.hesap_no}`)
        .drawLine()
        .align('lt')
        
      sepet.forEach(kalem => {
        const ad = kalem.urun.ad.padEnd(20, ' ').substring(0, 20)
        const fiyat = ((kalem.urun.fiyat + (kalem.varyant?.ek_fiyat || 0)) * kalem.miktar).toFixed(2).padStart(8, ' ')
        yazici.text(`${kalem.miktar}x ${ad} ${fiyat}`)
      })
      
      yazici
        .drawLine()
        .align('rt')
        .size(1, 2)
        .text(`TOPLAM: ${hesap.toplam_tutar.toFixed(2)} TL`)
        .size(1, 1)
        .feed(1)
        .align('ct')
        .text('Mali degeri yoktur.')
        .text('Tesekkur Ederiz')
        .feed(4)
        .cut()
        .close()
        
      resolve(true)
    })
  })
}
