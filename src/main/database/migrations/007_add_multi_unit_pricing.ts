// =====================================================
// Migration 007: Esnek Satış Türleri (Porsiyon, KG vb.) Fiyatlandırma
// Ürün tablosuna satis_turleri sütununu ekler ve varsayılanları tohumlar
// =====================================================

import type Database from 'better-sqlite3'
import type { Migration } from './index'
import { sutunYoksaEkle } from '../migration-runner'

export const migration007: Migration = {
  version: 7,
  name: 'add_multi_unit_pricing',
  up: (db: Database.Database) => {
    // 1. urun tablosuna satis_turleri sütununu ekle
    sutunYoksaEkle(db, 'urun', 'satis_turleri', 'TEXT')

    // 2. Izgara ürünlerinin varsayılan Porsiyon ve KG fiyatlandırmalarını tanımla
    const izgaraFiyatlari: Record<string, { porsiyon: number; kg: number }> = {
      'adana kebap': { porsiyon: 350, kg: 1400 },
      'adana': { porsiyon: 350, kg: 1400 },
      'kuşbaşı': { porsiyon: 380, kg: 1500 },
      'kusbasi': { porsiyon: 380, kg: 1500 },
      'tavuk şiş': { porsiyon: 260, kg: 950 },
      'tavuk sis': { porsiyon: 260, kg: 950 },
      'tavuk kanat': { porsiyon: 270, kg: 1000 },
      'pirzola': { porsiyon: 450, kg: 1800 }
    }

    try {
      const urunler = db.prepare('SELECT id, ad, fiyat, birim, satis_turleri FROM urun').all() as any[]
      const updateStmt = db.prepare('UPDATE urun SET satis_turleri = ? WHERE id = ?')

      for (const urun of urunler) {
        const adLower = (urun.ad || '').trim().toLowerCase()
        let guncelSatisTurleri = urun.satis_turleri

        if (izgaraFiyatlari[adLower]) {
          const cfg = izgaraFiyatlari[adLower]
          guncelSatisTurleri = JSON.stringify([
            { birim: 'porsiyon', fiyat: cfg.porsiyon },
            { birim: 'kg', fiyat: cfg.kg }
          ])
          updateStmt.run(guncelSatisTurleri, urun.id)
        } else if (!guncelSatisTurleri) {
          const varsayilanBirim = (urun.birim || 'porsiyon').toLowerCase()
          guncelSatisTurleri = JSON.stringify([
            { birim: varsayilanBirim === 'kg' ? 'kg' : varsayilanBirim, fiyat: urun.fiyat || 0 }
          ])
          updateStmt.run(guncelSatisTurleri, urun.id)
        }
      }
    } catch (err) {
      console.warn('⚠️ [Migration 007] satis_turleri tohumlama uyarısı:', err)
    }
  },
}
