// =====================================================
// Kurulum başına gizli anahtarlar ve karşılaştırma yardımcıları
// userData/guvenlik.json — kaynak kodda sabit anahtar tutulmaz
// =====================================================

import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { createHmac, randomBytes, timingSafeEqual } from 'crypto'

interface GuvenlikDosyasi {
  jwtSecret: string
  /** PIN özetleri için gizli anahtar — veritabanı sızsa bile PIN'ler çözülemez */
  pinAnahtari: string
}

let onbellek: GuvenlikDosyasi | null = null

function dosyaYolu(): string {
  return join(app.getPath('userData'), 'guvenlik.json')
}

const gecerliAnahtar = (d: unknown): d is string => typeof d === 'string' && d.length >= 32

function yukle(): GuvenlikDosyasi {
  if (onbellek) return onbellek
  const yol = dosyaYolu()
  let ham: any = {}
  if (existsSync(yol)) {
    try {
      ham = JSON.parse(readFileSync(yol, 'utf8'))
    } catch (err) {
      console.warn('[Güvenlik] guvenlik.json okunamadı, yeni anahtar üretiliyor:', err)
    }
  }
  const sonuc: GuvenlikDosyasi = {
    jwtSecret: gecerliAnahtar(ham.jwtSecret) ? ham.jwtSecret : randomBytes(48).toString('hex'),
    pinAnahtari: gecerliAnahtar(ham.pinAnahtari) ? ham.pinAnahtari : randomBytes(32).toString('hex'),
  }
  if (sonuc.jwtSecret !== ham.jwtSecret || sonuc.pinAnahtari !== ham.pinAnahtari) {
    writeFileSync(yol, JSON.stringify(sonuc, null, 2), { encoding: 'utf8', mode: 0o600 })
  }
  onbellek = sonuc
  return sonuc
}

/** PIN'in kuruluma özel HMAC özeti (aranabilir, Win7'de hızlı; bcrypt PIN ile girişi yavaşlatırdı) */
export function pinOzetiHesapla(anahtar: string, pin: string): string {
  return 'h1:' + createHmac('sha256', anahtar).update(String(pin)).digest('hex')
}

export function pinOzeti(pin: string): string {
  return pinOzetiHesapla(yukle().pinAnahtari, pin)
}

/**
 * Bu kuruluma özel JWT imza anahtarı.
 * İlk çalıştırmada rastgele üretilir; eski (kaynakta yazılı) anahtarla imzalanmış token'lar geçersiz olur.
 */
export function jwtGizliAnahtar(): string {
  return yukle().jwtSecret
}

/** Zamanlama saldırısına dayanıklı metin karşılaştırması */
export function guvenliEsitMi(a: unknown, b: unknown): boolean {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}
