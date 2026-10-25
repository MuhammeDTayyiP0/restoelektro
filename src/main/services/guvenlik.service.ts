// =====================================================
// Kurulum başına gizli anahtarlar ve karşılaştırma yardımcıları
// userData/guvenlik.json — kaynak kodda sabit anahtar tutulmaz
// =====================================================

import { app } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { randomBytes, timingSafeEqual } from 'crypto'

interface GuvenlikDosyasi {
  jwtSecret: string
}

let onbellek: GuvenlikDosyasi | null = null

function dosyaYolu(): string {
  return join(app.getPath('userData'), 'guvenlik.json')
}

function yukle(): GuvenlikDosyasi {
  if (onbellek) return onbellek
  const yol = dosyaYolu()
  if (existsSync(yol)) {
    try {
      const ham = JSON.parse(readFileSync(yol, 'utf8'))
      if (typeof ham?.jwtSecret === 'string' && ham.jwtSecret.length >= 32) {
        onbellek = { jwtSecret: ham.jwtSecret }
        return onbellek
      }
    } catch (err) {
      console.warn('[Güvenlik] guvenlik.json okunamadı, yeni anahtar üretiliyor:', err)
    }
  }
  onbellek = { jwtSecret: randomBytes(48).toString('hex') }
  writeFileSync(yol, JSON.stringify(onbellek, null, 2), { encoding: 'utf8', mode: 0o600 })
  return onbellek
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
