// =====================================================
// Menü IPC Handler'ları
// Kategori ve ürün CRUD işlemleri
// =====================================================

import { IpcMain } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { MENU_KANALLARI } from '../../common/ipc-channels'
import type { YeniKategori, YeniUrun } from '../../common/types/menu.types'

export function menuIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  // Kategorileri listele
  ipcMain.handle(MENU_KANALLARI.KATEGORILER, async () => {
    const kategoriler = db.prepare(`
      SELECT k.*, (SELECT COUNT(*) FROM urun u WHERE u.kategori_id = k.id AND u.aktif = 1) as urun_sayisi
      FROM kategori k WHERE k.aktif = 1 ORDER BY k.sira, k.ad
    `).all()
    return kategoriler
  })

  // Kategori ekle
  ipcMain.handle(MENU_KANALLARI.KATEGORI_EKLE, async (_event, veri: YeniKategori) => {
    const sonuc = db.prepare(`
      INSERT INTO kategori (ad, ust_kategori_id, renk, ikon) VALUES (?, ?, ?, ?)
    `).run(veri.ad, veri.ust_kategori_id || null, veri.renk || '#3B82F6', veri.ikon || null)
    return { basarili: true, id: sonuc.lastInsertRowid }
  })

  // Kategori güncelle
  ipcMain.handle(MENU_KANALLARI.KATEGORI_GUNCELLE, async (_event, id: number, veri: Partial<YeniKategori>) => {
    const alanlar: string[] = []
    const degerler: any[] = []
    if (veri.ad) { alanlar.push('ad = ?'); degerler.push(veri.ad) }
    if (veri.renk) { alanlar.push('renk = ?'); degerler.push(veri.renk) }
    if (veri.ikon !== undefined) { alanlar.push('ikon = ?'); degerler.push(veri.ikon) }
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

  // Ürünleri listele (opsiyonel kategori filtresi)
  ipcMain.handle(MENU_KANALLARI.URUNLER, async (_event, kategoriId?: number) => {
    if (kategoriId) {
      return db.prepare(`
        SELECT u.*, k.ad as kategori_adi
        FROM urun u
        JOIN kategori k ON k.id = u.kategori_id
        WHERE u.kategori_id = ? AND u.aktif = 1
        ORDER BY u.sira, u.ad
      `).all(kategoriId)
    }
    return db.prepare(`
      SELECT u.*, k.ad as kategori_adi
      FROM urun u
      JOIN kategori k ON k.id = u.kategori_id
      WHERE u.aktif = 1
      ORDER BY k.sira, u.sira, u.ad
    `).all()
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

    return urun
  })

  // Ürün ekle
  ipcMain.handle(MENU_KANALLARI.URUN_EKLE, async (_event, veri: YeniUrun) => {
    const sonuc = db.prepare(`
      INSERT INTO urun (kategori_id, barkod, ad, kisaltma, fiyat, kdv_orani, birim, resim_yolu, yazici_grup)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      veri.kategori_id, veri.barkod || null, veri.ad, veri.kisaltma || null,
      veri.fiyat, veri.kdv_orani || 10, veri.birim || 'adet',
      veri.resim_yolu || null, veri.yazici_grup || 'mutfak'
    )
    return { basarili: true, id: sonuc.lastInsertRowid }
  })

  // Ürün güncelle
  ipcMain.handle(MENU_KANALLARI.URUN_GUNCELLE, async (_event, id: number, veri: Partial<YeniUrun>) => {
    const alanlar: string[] = []
    const degerler: any[] = []
    if (veri.ad) { alanlar.push('ad = ?'); degerler.push(veri.ad) }
    if (veri.fiyat !== undefined) { alanlar.push('fiyat = ?'); degerler.push(veri.fiyat) }
    if (veri.kategori_id) { alanlar.push('kategori_id = ?'); degerler.push(veri.kategori_id) }
    if (veri.barkod !== undefined) { alanlar.push('barkod = ?'); degerler.push(veri.barkod) }
    if (veri.kdv_orani !== undefined) { alanlar.push('kdv_orani = ?'); degerler.push(veri.kdv_orani) }
    if (veri.yazici_grup) { alanlar.push('yazici_grup = ?'); degerler.push(veri.yazici_grup) }
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
    return db.prepare(`
      SELECT u.*, k.ad as kategori_adi
      FROM urun u
      JOIN kategori k ON k.id = u.kategori_id
      WHERE u.aktif = 1 AND (u.ad LIKE ? OR u.barkod LIKE ? OR u.kisaltma LIKE ?)
      ORDER BY u.ad
      LIMIT 20
    `).all(`%${arama}%`, `%${arama}%`, `%${arama}%`)
  })
}
