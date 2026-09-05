// =====================================================
// Menü IPC Handler'ları
// Kategori ve ürün CRUD işlemleri
// =====================================================

import { IpcMain, app as electronApp } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { MENU_KANALLARI } from '../../common/ipc-channels'
import type { YeniKategori, YeniUrun, TopluFiyatGuncellemeIstegi } from '../../common/types/menu.types'
import { sutunYoksaEkle } from '../database/migration-runner'
import path from 'path'
import fs from 'fs'

export function menuIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  // Sütunların varlığını garanti altına al
  sutunYoksaEkle(db, 'urun', 'porsiyon_fiyati', 'REAL DEFAULT NULL')
  sutunYoksaEkle(db, 'urun', 'kilo_fiyati', 'REAL DEFAULT NULL')
  sutunYoksaEkle(db, 'kategori', 'sira_no', 'INTEGER DEFAULT 999')

  // Kategorileri listele
  ipcMain.handle(MENU_KANALLARI.KATEGORILER, async () => {
    const kategoriler = db.prepare(`
      SELECT k.*, (SELECT COUNT(*) FROM urun u WHERE u.kategori_id = k.id AND u.aktif = 1) as urun_sayisi
      FROM kategori k WHERE k.aktif = 1 ORDER BY k.sira_no ASC, k.ad ASC
    `).all()
    return kategoriler
  })

  // Kategori ekle
  ipcMain.handle(MENU_KANALLARI.KATEGORI_EKLE, async (_event, veri: YeniKategori) => {
    const sonuc = db.prepare(`
      INSERT INTO kategori (ad, ust_kategori_id, renk, ikon, sira_no) VALUES (?, ?, ?, ?, ?)
    `).run(veri.ad, veri.ust_kategori_id || null, veri.renk || '#3B82F6', veri.ikon || null, veri.sira_no ?? 999)
    return { basarili: true, id: sonuc.lastInsertRowid }
  })

  // Kategori güncelle
  ipcMain.handle(MENU_KANALLARI.KATEGORI_GUNCELLE, async (_event, id: number, veri: Partial<YeniKategori>) => {
    const alanlar: string[] = []
    const degerler: any[] = []
    if (veri.ad) { alanlar.push('ad = ?'); degerler.push(veri.ad) }
    if (veri.renk) { alanlar.push('renk = ?'); degerler.push(veri.renk) }
    if (veri.ikon !== undefined) { alanlar.push('ikon = ?'); degerler.push(veri.ikon) }
    if (veri.sira_no !== undefined) { alanlar.push('sira_no = ?'); degerler.push(veri.sira_no) }
    degerler.push(id)
    if (alanlar.length > 0) {
      db.prepare(`UPDATE kategori SET ${alanlar.join(', ')} WHERE id = ?`).run(...degerler)
    }
    return { basarili: true }
  })

  // Kategori sil (soft delete)
  ipcMain.handle(MENU_KANALLARI.KATEGORI_SIL, async (_event, id: number) => {
    db.prepare('UPDATE kategori SET aktif = 0 WHERE id = ?').run(id)
    return { basarili: true }
  })

  // Ürün fiyatlarını ve satış türlerini normalize et
  const urunFiyatlariniAyrintilandir = (urun: any) => {
    if (!urun) return urun
    let turler: any[] = []
    if (typeof urun.satis_turleri === 'string') {
      try {
        turler = JSON.parse(urun.satis_turleri)
      } catch {
        turler = []
      }
    } else if (Array.isArray(urun.satis_turleri)) {
      turler = urun.satis_turleri
    }

    const porsiyon = turler.find((t: any) => (t.birim || '').toLowerCase() === 'porsiyon')
    const kilo = turler.find((t: any) => ['kilo', 'kg'].includes((t.birim || '').toLowerCase()))

    urun.porsiyon_fiyati = porsiyon ? porsiyon.fiyat : ((urun.birim || '').toLowerCase() === 'porsiyon' ? urun.fiyat : null)
    urun.kilo_fiyati = kilo ? kilo.fiyat : (['kg', 'kilo'].includes((urun.birim || '').toLowerCase()) ? urun.fiyat : null)
    return urun
  }

  // Ürünleri listele (opsiyonel kategori filtresi)
  ipcMain.handle(MENU_KANALLARI.URUNLER, async (_event, kategoriId?: number) => {
    let urunler: any[] = []
    if (kategoriId) {
      urunler = db.prepare(`
        SELECT u.*, k.ad as kategori_adi
        FROM urun u
        JOIN kategori k ON k.id = u.kategori_id
        WHERE u.kategori_id = ? AND u.aktif = 1
        ORDER BY u.sira, u.ad
      `).all(kategoriId)
    } else {
      urunler = db.prepare(`
        SELECT u.*, k.ad as kategori_adi
        FROM urun u
        JOIN kategori k ON k.id = u.kategori_id
        WHERE u.aktif = 1
        ORDER BY k.sira_no ASC, k.ad ASC, u.sira, u.ad
      `).all()
    }
    return urunler.map(urunFiyatlariniAyrintilandir)
  })

  // Ürün detay (varyantlar ve opsiyonlar dahil)
  ipcMain.handle(MENU_KANALLARI.URUN_DETAY, async (_event, id: number) => {
    const urun = db.prepare(`
      SELECT u.*, k.ad as kategori_adi
      FROM urun u
      JOIN kategori k ON k.id = u.kategori_id
      WHERE u.id = ?
    `).get(id) as any

    if (!urun) return null

    urun.varyantlar = db.prepare(
      'SELECT * FROM urun_varyant WHERE urun_id = ? AND aktif = 1'
    ).all(id)

    urun.opsiyonlar = db.prepare(
      'SELECT * FROM urun_opsiyonu WHERE urun_id = ? AND aktif = 1'
    ).all(id)

    return urunFiyatlariniAyrintilandir(urun)
  })

  // Ürün ekle
  ipcMain.handle(MENU_KANALLARI.URUN_EKLE, async (_event, veri: YeniUrun) => {
    const satisTurleriStr = typeof veri.satis_turleri === 'string'
      ? veri.satis_turleri
      : (veri.satis_turleri ? JSON.stringify(veri.satis_turleri) : null)

    const sonuc = db.prepare(`
      INSERT INTO urun (kategori_id, barkod, ad, kisaltma, aciklama, fiyat, kdv_orani, birim, resim_yolu, yazici_grup, satis_turleri, porsiyon_fiyati, kilo_fiyati)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      veri.kategori_id, veri.barkod || null, veri.ad, veri.kisaltma || null,
      veri.aciklama || veri.kisaltma || null,
      veri.fiyat, veri.kdv_orani || 10, veri.birim || 'Adet',
      veri.resim_yolu || null, veri.yazici_grup || 'mutfak',
      satisTurleriStr,
      veri.porsiyon_fiyati ?? null,
      veri.kilo_fiyati ?? null
    )
    return { basarili: true, id: sonuc.lastInsertRowid }
  })

  // Ürün güncelle
  ipcMain.handle(MENU_KANALLARI.URUN_GUNCELLE, async (_event, id: number, veri: Partial<YeniUrun>) => {
    const alanlar: string[] = []
    const degerler: any[] = []
    if (veri.ad !== undefined) { alanlar.push('ad = ?'); degerler.push(veri.ad) }
    if (veri.kisaltma !== undefined) { alanlar.push('kisaltma = ?'); degerler.push(veri.kisaltma) }
    if (veri.aciklama !== undefined) { alanlar.push('aciklama = ?'); degerler.push(veri.aciklama) }
    if (veri.fiyat !== undefined) { alanlar.push('fiyat = ?'); degerler.push(veri.fiyat) }
    if (veri.kategori_id !== undefined) { alanlar.push('kategori_id = ?'); degerler.push(veri.kategori_id) }
    if (veri.barkod !== undefined) { alanlar.push('barkod = ?'); degerler.push(veri.barkod) }
    if (veri.kdv_orani !== undefined) { alanlar.push('kdv_orani = ?'); degerler.push(veri.kdv_orani) }
    if (veri.birim !== undefined) { alanlar.push('birim = ?'); degerler.push(veri.birim) }
    if (veri.resim_yolu !== undefined) { alanlar.push('resim_yolu = ?'); degerler.push(veri.resim_yolu) }
    if (veri.yazici_grup !== undefined) { alanlar.push('yazici_grup = ?'); degerler.push(veri.yazici_grup) }
    if (veri.porsiyon_fiyati !== undefined) { alanlar.push('porsiyon_fiyati = ?'); degerler.push(veri.porsiyon_fiyati) }
    if (veri.kilo_fiyati !== undefined) { alanlar.push('kilo_fiyati = ?'); degerler.push(veri.kilo_fiyati) }
    if (veri.satis_turleri !== undefined) {
      alanlar.push('satis_turleri = ?')
      degerler.push(
        typeof veri.satis_turleri === 'string'
          ? veri.satis_turleri
          : (veri.satis_turleri ? JSON.stringify(veri.satis_turleri) : null)
      )
    }
    alanlar.push('updated_at = CURRENT_TIMESTAMP')
    degerler.push(id)
    if (alanlar.length > 1) {
      db.prepare(`UPDATE urun SET ${alanlar.join(', ')} WHERE id = ?`).run(...degerler)
    }
    return { basarili: true }
  })

  // Ürün sil (soft delete)
  ipcMain.handle(MENU_KANALLARI.URUN_SIL, async (_event, id: number) => {
    db.prepare('UPDATE urun SET aktif = 0 WHERE id = ?').run(id)
    return { basarili: true }
  })

  // Ürün ara
  ipcMain.handle(MENU_KANALLARI.URUN_ARA, async (_event, arama: string) => {
    const urunler = db.prepare(`
      SELECT u.*, k.ad as kategori_adi
      FROM urun u
      JOIN kategori k ON k.id = u.kategori_id
      WHERE u.aktif = 1 AND (u.ad LIKE ? OR u.barkod LIKE ? OR u.kisaltma LIKE ?)
      ORDER BY u.ad
      LIMIT 20
    `).all(`%${arama}%`, `%${arama}%`, `%${arama}%`)
    return urunler.map(urunFiyatlariniAyrintilandir)
  })

  // Ürün görseli yükle (IPC üzerinden base64/buffer)
  ipcMain.handle(MENU_KANALLARI.RESIM_YUKLE, async (_event, veri: { base64: string; dosyaAdi?: string; uzanti?: string }) => {
    try {
      const isDev = !electronApp.isPackaged
      const baseDir = isDev ? process.cwd() : electronApp.getPath('userData')
      const uploadsDir = path.join(baseDir, 'public', 'uploads', 'products')
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      let rawBase64 = veri.base64
      let ext = veri.uzanti || '.jpg'

      if (rawBase64.startsWith('data:image/')) {
        const match = rawBase64.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/)
        if (match) {
          ext = '.' + (match[1] === 'jpeg' ? 'jpg' : match[1])
          rawBase64 = match[2]
        }
      }

      const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'].includes(ext.toLowerCase()) ? ext.toLowerCase() : '.jpg'
      const filename = `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`
      const hedefYol = path.join(uploadsDir, filename)
      const buffer = Buffer.from(rawBase64, 'base64')
      
      fs.writeFileSync(hedefYol, buffer)

      const resimYolu = `/uploads/products/${filename}`
      return {
        basarili: true,
        resim_yolu: resimYolu,
        url: resimYolu,
        dosya_adi: filename,
        boyut: buffer.length
      }
    } catch (err: any) {
      console.error('IPC Resim yükleme hatası:', err)
      return { basarili: false, hata: err.message || 'Görsel kaydedilemedi' }
    }
  })

  // Toplu Fiyat Güncelle (Tek Transaction ile satis_turleri, porsiyon_fiyati, kilo_fiyati ve fiyat güncelleme)
  ipcMain.handle(MENU_KANALLARI.TOPLU_FIYAT_GUNCELLE, async (_event, veri: TopluFiyatGuncellemeIstegi) => {
    try {
      const { urunIds, hedefBirim = 'hepsi', islemTuru = 'yuzde', deger = 0, yuvarlama, manuelFiyatlar } = veri

      if (!urunIds || !Array.isArray(urunIds) || urunIds.length === 0) {
        return { basarili: false, hata: 'Güncellenecek ürün seçilmedi' }
      }

      // Dinamik birim eşleştirme fonksiyonu (büyük/küçük harf ve eş anlamlı duyarlı)
      const birimEslesir = (birimA: string, hedef: string): boolean => {
        if (!hedef || hedef === 'hepsi') return true
        const a = (birimA || '').trim().toLowerCase()
        const b = (hedef || '').trim().toLowerCase()
        if (a === b) return true
        if (b === 'kg' || b === 'kilo') return ['kg', 'kilo', 'kilogram'].includes(a)
        if (b === 'porsiyon') return ['porsiyon', 'pors'].includes(a)
        if (b === 'adet') return ['adet', 'tane'].includes(a)
        if (b === 'gram' || b === 'gr') return ['gram', 'gr', 'g'].includes(a)
        if (b === 'litre' || b === 'lt') return ['litre', 'lt', 'l'].includes(a)
        return false
      }

      // Fiyat hesaplama fonksiyonu
      const hesaplaYeniFiyat = (eski: number): number => {
        let yeni = Number(eski) || 0
        if (islemTuru === 'yuzde') {
          yeni = eski * (1 + Number(deger) / 100)
        } else {
          yeni = eski + Number(deger)
        }

        if (yuvarlama === 5) {
          yeni = Math.max(5, Math.round(yeni / 5) * 5)
        } else if (yuvarlama === 10) {
          yeni = Math.max(10, Math.round(yeni / 10) * 10)
        } else {
          yeni = Math.max(0, Math.round(yeni * 100) / 100)
        }
        return yeni
      }

      const guncelleTransaction = db.transaction((idListesi: number[]) => {
        const selectStmt = db.prepare('SELECT id, ad, fiyat, birim, satis_turleri, porsiyon_fiyati, kilo_fiyati FROM urun WHERE id = ?')
        const updateStmt = db.prepare(`
          UPDATE urun 
          SET satis_turleri = ?, 
              fiyat = ?, 
              porsiyon_fiyati = ?, 
              kilo_fiyati = ?, 
              updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `)

        for (const id of idListesi) {
          const urun = selectStmt.get(id) as any
          if (!urun) continue

          // Eğer UI'daki simülasyon tablosundan manuel olarak fiyat girilmişse direkt onu uygula
          const manuel = manuelFiyatlar?.[id]
          if (manuel) {
            updateStmt.run(
              JSON.stringify(manuel.satis_turleri || []),
              manuel.fiyat ?? urun.fiyat,
              manuel.porsiyon_fiyati ?? null,
              manuel.kilo_fiyati ?? null,
              id
            )
            continue
          }

          // Satış türlerini ayrıştır
          let turler: Array<{ birim: string; fiyat: number }> = []
          if (typeof urun.satis_turleri === 'string') {
            try {
              turler = JSON.parse(urun.satis_turleri)
            } catch {
              turler = []
            }
          } else if (Array.isArray(urun.satis_turleri)) {
            turler = [...urun.satis_turleri]
          }

          // Eğer boşsa, geriye dönük sütunlardan tohumla
          if (turler.length === 0) {
            if (urun.porsiyon_fiyati) turler.push({ birim: 'porsiyon', fiyat: Number(urun.porsiyon_fiyati) })
            if (urun.kilo_fiyati) turler.push({ birim: 'kg', fiyat: Number(urun.kilo_fiyati) })
          }
          if (turler.length === 0) {
            const b = urun.birim || 'Porsiyon'
            turler.push({ birim: b, fiyat: Number(urun.fiyat) || 0 })
          }

          // Hedef birime göre güncelle (diğer türlerin fiyat ve yapısını koru)
          let herhangiBirTurGuncellendi = false
          const guncelTurler = turler.map(t => {
            if (birimEslesir(t.birim, hedefBirim)) {
              herhangiBirTurGuncellendi = true
              return { ...t, fiyat: hesaplaYeniFiyat(Number(t.fiyat) || 0) }
            }
            return t // Diğer türleri bozma
          })

          // Porsiyon ve KG fiyatlarını senkronize et
          const porsiyonTur = guncelTurler.find(t => birimEslesir(t.birim, 'porsiyon'))
          const kgTur = guncelTurler.find(t => birimEslesir(t.birim, 'kg'))

          let yeniPorsiyon = porsiyonTur ? porsiyonTur.fiyat : (urun.porsiyon_fiyati ? (birimEslesir('porsiyon', hedefBirim) ? hesaplaYeniFiyat(urun.porsiyon_fiyati) : urun.porsiyon_fiyati) : null)
          let yeniKg = kgTur ? kgTur.fiyat : (urun.kilo_fiyati ? (birimEslesir('kg', hedefBirim) ? hesaplaYeniFiyat(urun.kilo_fiyati) : urun.kilo_fiyati) : null)

          // Ana fiyat sütunu (fiyat) belirleme: Ürünün birimine denk gelen satış türünü al veya hedef birimle eşleşiyorsa güncelle
          const eslesenAnaTur = guncelTurler.find(t => birimEslesir(t.birim, urun.birim || '')) || guncelTurler[0]
          let yeniAnaFiyat = urun.fiyat
          if (eslesenAnaTur && birimEslesir(eslesenAnaTur.birim, hedefBirim)) {
            yeniAnaFiyat = eslesenAnaTur.fiyat
          } else if (birimEslesir(urun.birim || '', hedefBirim)) {
            yeniAnaFiyat = hesaplaYeniFiyat(urun.fiyat)
          } else if (herhangiBirTurGuncellendi && eslesenAnaTur) {
            yeniAnaFiyat = eslesenAnaTur.fiyat
          }

          updateStmt.run(
            JSON.stringify(guncelTurler),
            yeniAnaFiyat,
            yeniPorsiyon,
            yeniKg,
            id
          )
        }
      })

      guncelleTransaction(urunIds)

      return { basarili: true, guncellenenSayisi: urunIds.length }
    } catch (err: any) {
      console.error('TOPLU_FIYAT_GUNCELLE Hatası:', err)
      return { basarili: false, hata: err.message || 'Toplu fiyat güncellenemedi' }
    }
  })
}

