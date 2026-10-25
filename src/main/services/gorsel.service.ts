// =====================================================
// Ürün görseli kaydetme ve uzak adresten güvenli indirme
// Node 16 (Electron 22) uyumlu — global fetch kullanılmaz
// =====================================================

import { app } from 'electron'
import http from 'http'
import https from 'https'
import dns from 'dns'
import net from 'net'
import path from 'path'
import fs from 'fs'
import { URL } from 'url'

export const GORSEL_MAX_BAYT = 10 * 1024 * 1024
const INDIRME_ZAMAN_ASIMI_MS = 8_000
const MAX_YONLENDIRME = 3

/**
 * Ürün görselleri için yükleme dizinini döndürür ve yoksa oluşturur
 */
export function uploadsDizininiGetir(): string {
  const base = app.isPackaged ? app.getPath('userData') : process.cwd()
  const productsDir = path.join(base, 'public', 'uploads', 'products')
  if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true })
  }
  return productsDir
}

/** Dosya imzasından (magic bytes) görsel türünü bulur. SVG bilerek desteklenmez (script taşıyabilir). */
export function gorselTuruBul(buf: Buffer): { uzanti: string; mime: string } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { uzanti: '.jpg', mime: 'image/jpeg' }
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { uzanti: '.png', mime: 'image/png' }
  if (buf.length >= 6 && ['GIF87a', 'GIF89a'].includes(buf.subarray(0, 6).toString('ascii'))) return { uzanti: '.gif', mime: 'image/gif' }
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return { uzanti: '.webp', mime: 'image/webp' }
  return null
}

/**
 * Base64 / data URL görseli doğrulayıp uploads/products altına kaydeder.
 */
export function gorselKaydet(base64VeyaDataUrl: string): { resim_yolu: string; dosya_adi: string; boyut: number } {
  if (typeof base64VeyaDataUrl !== 'string' || !base64VeyaDataUrl) throw new Error('Görsel verisi boş')
  const virgul = base64VeyaDataUrl.startsWith('data:') ? base64VeyaDataUrl.indexOf(',') : -1
  const ham = virgul >= 0 ? base64VeyaDataUrl.slice(virgul + 1) : base64VeyaDataUrl
  const buffer = Buffer.from(ham, 'base64')

  if (!buffer.length) throw new Error('Görsel verisi boş')
  if (buffer.length > GORSEL_MAX_BAYT) throw new Error('Görsel boyutu en fazla 10MB olabilir')
  const tur = gorselTuruBul(buffer)
  if (!tur) throw new Error('Yalnızca JPG, PNG, WEBP veya GIF görseller kabul edilir')

  const dosyaAdi = `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${tur.uzanti}`
  fs.writeFileSync(path.join(uploadsDizininiGetir(), dosyaAdi), buffer)
  return { resim_yolu: `/uploads/products/${dosyaAdi}`, dosya_adi: dosyaAdi, boyut: buffer.length }
}

/** Yerel ağ, loopback, link-local ve özel adres aralıklarını tespit eder (SSRF koruması) */
export function ozelAdresMi(ip: string): boolean {
  let adres = ip.toLowerCase()
  if (adres.startsWith('::ffff:')) adres = adres.slice(7)

  if (net.isIPv4(adres)) {
    const [a, b] = adres.split('.').map(Number)
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19))
  }
  if (net.isIPv6(adres)) {
    return adres === '::' || adres === '::1' ||
      adres.startsWith('fc') || adres.startsWith('fd') ||
      adres.startsWith('fe8') || adres.startsWith('fe9') || adres.startsWith('fea') || adres.startsWith('feb') ||
      adres.startsWith('ff')
  }
  return true
}

function adresCoz(hostname: string): Promise<{ address: string; family: number }> {
  return new Promise((resolve, reject) => {
    const ham = hostname.replace(/^\[|\]$/g, '')
    if (net.isIP(ham)) return resolve({ address: ham, family: net.isIPv6(ham) ? 6 : 4 })
    dns.lookup(ham, (err, address, family) => (err ? reject(err) : resolve({ address, family })))
  })
}

function tekIstek(url: URL, hedef: { address: string; family: number }): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http
    const req = lib.get(
      url,
      {
        // Doğrulanan IP'ye sabitle — DNS rebinding ile iç ağa yönlenemez
        lookup: (_host: string, _opts: any, cb: any) => cb(null, hedef.address, hedef.family),
        headers: { Accept: 'image/*', 'User-Agent': 'EtibolPOS' },
        timeout: INDIRME_ZAMAN_ASIMI_MS,
      } as any,
      resolve
    )
    req.on('timeout', () => req.destroy(new Error('Görsel indirme zaman aşımına uğradı')))
    req.on('error', reject)
  })
}

/**
 * Uzak HTTP(S) görselini indirip data URL olarak döndürür.
 * Yerel/özel ağ adresleri, 10MB üzeri dosyalar ve görsel olmayan içerik reddedilir.
 */
export async function uzakGorselIndir(kaynakUrl: string): Promise<{ image: string; boyut: number }> {
  let url: URL
  try {
    url = new URL(String(kaynakUrl || '').trim())
  } catch {
    throw new Error('Geçerli bir HTTP(S) görsel bağlantısı girin')
  }

  for (let yonlendirme = 0; yonlendirme <= MAX_YONLENDIRME; yonlendirme++) {
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Geçerli bir HTTP(S) görsel bağlantısı girin')
    const hedef = await adresCoz(url.hostname)
    if (ozelAdresMi(hedef.address)) throw new Error('Yerel ağ adreslerinden görsel alınamaz')

    const cevap = await tekIstek(url, hedef)
    const durum = cevap.statusCode || 0

    if (durum >= 300 && durum < 400 && cevap.headers.location) {
      cevap.resume()
      url = new URL(cevap.headers.location, url)
      continue
    }
    if (durum < 200 || durum >= 300) {
      cevap.resume()
      throw new Error(`Görsel indirilemedi (HTTP ${durum})`)
    }
    if (Number(cevap.headers['content-length'] || 0) > GORSEL_MAX_BAYT) {
      cevap.destroy()
      throw new Error('Görsel boyutu en fazla 10MB olabilir')
    }

    const parcalar: Buffer[] = []
    let toplam = 0
    await new Promise<void>((resolve, reject) => {
      cevap.on('data', (p: Buffer) => {
        toplam += p.length
        if (toplam > GORSEL_MAX_BAYT) {
          cevap.destroy()
          reject(new Error('Görsel boyutu en fazla 10MB olabilir'))
          return
        }
        parcalar.push(p)
      })
      cevap.on('end', () => resolve())
      cevap.on('error', reject)
    })

    const buffer = Buffer.concat(parcalar)
    const tur = gorselTuruBul(buffer)
    if (!tur) throw new Error('Bağlantı geçerli bir görsel dosyası döndürmüyor')
    return { image: `data:${tur.mime};base64,${buffer.toString('base64')}`, boyut: buffer.length }
  }
  throw new Error('Çok fazla yönlendirme')
}
