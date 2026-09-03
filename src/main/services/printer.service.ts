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
 * ESC/POS ve Termal Fiş çıktısı için miktar ve birimi biçimlendirir.
 * - KG veya gramajlı satış: '0.750 KG' veya '2x 0.750 KG'
 * - Porsiyon satışı: '1 Por', '1.5 Por', '2 Por' veya '2x 1.5 Por'
 */
export function formatMiktarBirim(item: any): string {
  const satisBirim = (
    item.secilenSatisTuru ||
    item.satisBirim ||
    item.satis_birim ||
    (item.urun?.birim?.toLowerCase() === 'kg' ? 'kg' : '') ||
    (item.urun_birim?.toLowerCase() === 'kg' ? 'kg' : '') ||
    'porsiyon'
  ).toLowerCase()

  const gramaj = item.gramaj !== undefined && Number(item.gramaj) > 0 ? Number(item.gramaj) : 0
  const isKg = satisBirim === 'kg' || satisBirim === 'kilo' || gramaj > 0
  const miktar = Number(item.miktar || 1)
  const porsiyon = Number(item.porsiyon || 1)

  if (isKg) {
    const netKg = gramaj > 0 ? gramaj : miktar
    const netKgStr = `${netKg.toFixed(3)} KG`
    if (miktar > 1 && gramaj > 0) {
      return `${miktar}x ${netKgStr}`
    }
    return netKgStr
  } else {
    if (porsiyon !== 1) {
      const porStr = porsiyon === 0.5 ? '0.5 Por' : porsiyon === 2 ? '2 Por' : `${porsiyon} Por`
      if (miktar > 1) {
        return `${miktar}x ${porStr}`
      }
      return porStr
    }
    return `${miktar} Por`
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
      console.log(`Masa: ${siparisler[0]?.masa_numara || 'PAKET'}`)
      console.log('Kalemler:')
      siparisler.forEach(s => {
        const mb = formatMiktarBirim(s).padEnd(10, ' ')
        const urunAdi = s.urun?.ad || s.urun_adi || 'Ürün'
        console.log(`- ${mb} ${urunAdi} [${s.notlar || ''}]`)
      })
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
        .text(`Garson: ${siparisler[0]?.garson_adi || 'Sistem'}`)
        .drawLine()
        .align('lt')
        
      siparisler.forEach(siparis => {
        const mb = formatMiktarBirim(siparis).padEnd(10, ' ')
        const urunAdi = (siparis.urun?.ad || siparis.urun_adi || '').substring(0, 24)
        
        yazici.size(1, 2)
        yazici.text(`${mb} ${urunAdi}`)
        
        yazici.size(1, 1)
        if (siparis.varyant_adi || siparis.varyant?.ad) {
          yazici.text(`   [${siparis.varyant_adi || siparis.varyant?.ad}]`)
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
      console.log(`Hesap: ${hesap.hesap_no || 'HSP-001'}`)
      sepet.forEach(kalem => {
        const mb = formatMiktarBirim(kalem).padEnd(10, ' ')
        const urunAdi = (kalem.urun?.ad || kalem.urun_adi || '').substring(0, 18).padEnd(18, ' ')
        const toplam = kalem.toplam_fiyat !== undefined
          ? Number(kalem.toplam_fiyat)
          : ((kalem.urun?.fiyat || 0) + (kalem.varyant?.ek_fiyat || kalem.varyant?.fiyat_farki || 0)) * (kalem.miktar || 1)
        console.log(`${mb} ${urunAdi} ${toplam.toFixed(2).padStart(8, ' ')} TL`)
      })
      console.log(`Toplam: ${(hesap.net_tutar ?? hesap.toplam_tutar ?? 0).toFixed(2)} TL`)
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
        .text('ETİBOL RESTORAN')
        .size(1, 1)
        .text('Lezzetin Doğru Adresi')
        .feed(1)
        .text(`MASA: ${hesap.masa_numara || 'PAKET'}`)
        .text(`Tarih: ${new Date().toLocaleString('tr-TR')}`)
        .text(`Hesap No: ${hesap.hesap_no || ''}`)
        .drawLine()
        .align('lt')
        
      sepet.forEach(kalem => {
        const mb = formatMiktarBirim(kalem).padEnd(10, ' ')
        const urunAdi = (kalem.urun?.ad || kalem.urun_adi || '').substring(0, 18).padEnd(18, ' ')
        const toplamFiyat = kalem.toplam_fiyat !== undefined
          ? Number(kalem.toplam_fiyat)
          : ((kalem.urun?.fiyat || 0) + (kalem.varyant?.ek_fiyat || kalem.varyant?.fiyat_farki || 0)) * (kalem.miktar || 1)
        const fiyatStr = toplamFiyat.toFixed(2).padStart(8, ' ')
        yazici.text(`${mb} ${urunAdi} ${fiyatStr}`)
        if (kalem.varyant?.ad || kalem.varyant_adi) {
          yazici.text(`   [${kalem.varyant?.ad || kalem.varyant_adi}]`)
        }
      })
      
      yazici
        .drawLine()
        .align('rt')
        .size(1, 2)
        .text(`TOPLAM: ${(hesap.net_tutar ?? hesap.toplam_tutar ?? 0).toFixed(2)} TL`)
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
