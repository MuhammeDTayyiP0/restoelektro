// =====================================================
// Müşteri & Sadakat IPC Handler'ları
// =====================================================

import { IpcMain } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { MUSTERI_KANALLARI } from '../../common/ipc-channels'

export function musteriIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  ipcMain.handle(MUSTERI_KANALLARI.LISTELE, async () => {
    return db.prepare('SELECT * FROM musteri ORDER BY ad LIMIT 500').all()
  })

  ipcMain.handle(MUSTERI_KANALLARI.EKLE, async (_event, veri: any) => {
    const sonuc = db.prepare(`
      INSERT INTO musteri (ad, soyad, telefon, email, adres, vergi_no, vergi_dairesi, unvan, notlar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(veri.ad, veri.soyad || null, veri.telefon || null, veri.email || null, veri.adres || null,
      veri.vergi_no || null, veri.vergi_dairesi || null, veri.unvan || null, veri.notlar || null)
    return { basarili: true, id: sonuc.lastInsertRowid }
  })

  ipcMain.handle(MUSTERI_KANALLARI.GUNCELLE, async (_event, id: number, veri: any) => {
    const alanlar: string[] = []
    const degerler: any[] = []
    for (const [anahtar, deger] of Object.entries(veri)) {
      if (deger !== undefined && anahtar !== 'id') {
        alanlar.push(`${anahtar} = ?`); degerler.push(deger)
      }
    }
    degerler.push(id)
    if (alanlar.length > 0) {
      db.prepare(`UPDATE musteri SET ${alanlar.join(', ')} WHERE id = ?`).run(...degerler)
    }
    return { basarili: true }
  })

  ipcMain.handle(MUSTERI_KANALLARI.ARA, async (_event, arama: string) => {
    return db.prepare(`
      SELECT * FROM musteri WHERE ad LIKE ? OR soyad LIKE ? OR telefon LIKE ? OR unvan LIKE ?
      ORDER BY ad LIMIT 20
    `).all(`%${arama}%`, `%${arama}%`, `%${arama}%`, `%${arama}%`)
  })

  ipcMain.handle(MUSTERI_KANALLARI.DETAY, async (_event, id: number) => {
    const musteri = db.prepare('SELECT * FROM musteri WHERE id = ?').get(id) as any
    if (!musteri) return null
    musteri.adresler = db.prepare('SELECT * FROM musteri_adres WHERE musteri_id = ?').all(id)
    musteri.sadakat_karti = db.prepare('SELECT * FROM sadakat_kart WHERE musteri_id = ? AND aktif = 1').get(id)
    return musteri
  })

  // Sadakat kartı oluştur
  ipcMain.handle(MUSTERI_KANALLARI.SADAKAT_KART, async (_event, musteriId: number, kartTipi: string = 'puan') => {
    const kartNo = `SDK-${Date.now().toString(36).toUpperCase()}`
    const sonuc = db.prepare(`
      INSERT INTO sadakat_kart (musteri_id, kart_no, kart_tipi) VALUES (?, ?, ?)
    `).run(musteriId, kartNo, kartTipi)
    return { basarili: true, kart_no: kartNo, id: sonuc.lastInsertRowid }
  })

  // Bakiye yükle
  ipcMain.handle(MUSTERI_KANALLARI.SADAKAT_YUKLE, async (_event, kartId: number, tutar: number) => {
    const islem = db.transaction(() => {
      db.prepare('UPDATE sadakat_kart SET bakiye = bakiye + ? WHERE id = ?').run(tutar, kartId)
      db.prepare(`
        INSERT INTO sadakat_hareket (kart_id, islem_tipi, tutar, aciklama) VALUES (?, 'yukleme', ?, 'Bakiye yükleme')
      `).run(kartId, tutar)
    })
    islem()
    return { basarili: true }
  })

  // Sadakat harcama
  ipcMain.handle(MUSTERI_KANALLARI.SADAKAT_HARCAMA, async (_event, kartId: number, tutar: number, hesapId: number) => {
    const kart = db.prepare('SELECT bakiye FROM sadakat_kart WHERE id = ?').get(kartId) as any
    if (!kart || kart.bakiye < tutar) {
      return { basarili: false, hata: 'Yetersiz bakiye' }
    }
    const islem = db.transaction(() => {
      db.prepare('UPDATE sadakat_kart SET bakiye = bakiye - ? WHERE id = ?').run(tutar, kartId)
      db.prepare(`
        INSERT INTO sadakat_hareket (kart_id, islem_tipi, tutar, hesap_id, aciklama) VALUES (?, 'harcama', ?, ?, 'Sadakat kartı ile ödeme')
      `).run(kartId, tutar, hesapId)
    })
    islem()
    return { basarili: true }
  })

  // Caller ID — telefon numarasıyla müşteri eşleştir
  ipcMain.handle(MUSTERI_KANALLARI.CALLER_ID, async (_event, telefon: string) => {
    const musteri = db.prepare('SELECT * FROM musteri WHERE telefon = ?').get(telefon) as any
    db.prepare(`
      INSERT INTO arayan_kayit (telefon, musteri_id) VALUES (?, ?)
    `).run(telefon, musteri?.id || null)

    if (musteri) {
      // Son siparişleri de getir
      const sonSiparisler = db.prepare(`
        SELECT h.hesap_no, h.toplam_tutar, h.acilis_zamani
        FROM hesap h WHERE h.musteri_id = ? ORDER BY h.acilis_zamani DESC LIMIT 5
      `).all(musteri.id)
      return { musteri, son_siparisler: sonSiparisler }
    }
    return { musteri: null, telefon }
  })
}
