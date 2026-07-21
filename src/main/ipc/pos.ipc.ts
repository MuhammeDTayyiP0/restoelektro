// =====================================================
// POS & Hesap IPC Handler'ları
// Hesap açma/kapama, sipariş, ödeme, indirim, bölme
// =====================================================

import { IpcMain, BrowserWindow } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { HESAP_KANALLARI } from '../../common/ipc-channels'
import { v4 as uuidv4 } from 'uuid'
import type { YeniSiparis, YeniOdeme, IndirimBilgisi, HesapBolme } from '../../common/types/pos.types'

export function hesapIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  // Hesap numarası oluştur
  function hesapNoOlustur(): string {
    const tarih = new Date()
    const year = tarih.getFullYear()
    const month = String(tarih.getMonth() + 1).padStart(2, '0')
    const day = String(tarih.getDate()).padStart(2, '0')
    const gun = `${year}${month}${day}`
    
    const sonHesap = db.prepare(
      "SELECT hesap_no FROM hesap WHERE hesap_no LIKE ? ORDER BY id DESC LIMIT 1"
    ).get(`HSP-${gun}-%`) as any

    let sira = 1
    if (sonHesap) {
      const parcalar = sonHesap.hesap_no.split('-')
      if (parcalar.length >= 3) {
        const parsed = parseInt(parcalar[2], 10)
        if (!isNaN(parsed)) {
          sira = parsed + 1
        }
      }
    }
    
    let yeniNo = `HSP-${gun}-${sira.toString().padStart(3, '0')}`
    // Çakışmayı önlemek için veritabanında kontrol et ve gerekirse artır
    while (db.prepare("SELECT 1 FROM hesap WHERE hesap_no = ?").get(yeniNo)) {
      sira++
      yeniNo = `HSP-${gun}-${sira.toString().padStart(3, '0')}`
    }
    
    return yeniNo
  }

  // Hesap toplamını yeniden hesapla
  function hesapToplamiGuncelle(hesapId: number): void {
    const toplam = db.prepare(`
      SELECT COALESCE(SUM(toplam_fiyat), 0) as toplam
      FROM siparis
      WHERE hesap_id = ? AND durum != 'iptal' AND ikram = 0
    `).get(hesapId) as any

    const hesap = db.prepare('SELECT indirim_tutar FROM hesap WHERE id = ?').get(hesapId) as any
    const netTutar = Math.max(0, toplam.toplam - (hesap?.indirim_tutar || 0))

    db.prepare(`
      UPDATE hesap SET toplam_tutar = ?, net_tutar = ? WHERE id = ?
    `).run(toplam.toplam, netTutar, hesapId)
  }

  // Yeni hesap aç
  ipcMain.handle(HESAP_KANALLARI.AC, async (_event, masaId: number | null, personelId: number, hesapTipi: string = 'masa', kisiSayisi: number = 1) => {
    try {
      const hesapNo = hesapNoOlustur()

      // Masada açık hesap var mı kontrol et
      if (masaId) {
        const mevcutHesap = db.prepare(
          "SELECT id FROM hesap WHERE masa_id = ? AND durum = 'acik'"
        ).get(masaId) as any
        if (mevcutHesap) {
          return { basarili: false, hata: 'Bu masada zaten açık bir hesap var', hesap_id: mevcutHesap.id }
        }
      }

      const sonuc = db.prepare(`
        INSERT INTO hesap (masa_id, hesap_no, hesap_tipi, personel_id, kisi_sayisi)
        VALUES (?, ?, ?, ?, ?)
      `).run(masaId, hesapNo, hesapTipi, personelId, kisiSayisi)

      // Masa durumunu güncelle
      if (masaId) {
        db.prepare("UPDATE masa SET durum = 'dolu' WHERE id = ?").run(masaId)
      }

      return { basarili: true, hesap_id: sonuc.lastInsertRowid, hesap_no: hesapNo }
    } catch (hata: any) {
      return { basarili: false, hata: hata.message }
    }
  })

  // Hesap detayını getir
  ipcMain.handle(HESAP_KANALLARI.DETAY, async (_event, hesapId: number) => {
    const hesap = db.prepare(`
      SELECT h.*, p.ad || ' ' || p.soyad as personel_adi, m.numara as masa_numara,
             mu.ad || ' ' || COALESCE(mu.soyad, '') as musteri_adi
      FROM hesap h
      LEFT JOIN personel p ON p.id = h.personel_id
      LEFT JOIN masa m ON m.id = h.masa_id
      LEFT JOIN musteri mu ON mu.id = h.musteri_id
      WHERE h.id = ?
    `).get(hesapId) as any

    if (!hesap) return null

    // Siparişleri getir
    hesap.siparisler = db.prepare(`
      SELECT s.*, u.ad as urun_adi, v.ad as varyant_adi, k.ad as kategori_adi
      FROM siparis s
      JOIN urun u ON u.id = s.urun_id
      LEFT JOIN urun_varyant v ON v.id = s.varyant_id
      JOIN kategori k ON k.id = u.kategori_id
      WHERE s.hesap_id = ?
      ORDER BY s.siparis_zamani DESC
    `).all(hesapId)

    // Ödemeleri getir
    hesap.odemeler = db.prepare(`
      SELECT o.*, p.ad || ' ' || p.soyad as personel_adi
      FROM odeme o
      JOIN personel p ON p.id = o.personel_id
      WHERE o.hesap_id = ?
    `).all(hesapId)

    return hesap
  })

  // Açık hesapları listele
  ipcMain.handle(HESAP_KANALLARI.ACIK_HESAPLAR, async () => {
    return db.prepare(`
      SELECT h.*, p.ad || ' ' || p.soyad as personel_adi, m.numara as masa_numara,
             (SELECT COUNT(*) FROM siparis s WHERE s.hesap_id = h.id AND s.durum != 'iptal') as siparis_sayisi
      FROM hesap h
      LEFT JOIN personel p ON p.id = h.personel_id
      LEFT JOIN masa m ON m.id = h.masa_id
      WHERE h.durum = 'acik'
      ORDER BY h.acilis_zamani DESC
    `).all()
  })

  // Sipariş ekle
  ipcMain.handle(HESAP_KANALLARI.SIPARIS_EKLE, async (_event, hesapId: number, personelId: number, siparisler: YeniSiparis[]) => {
    try {
      const ekle = db.transaction(() => {
        const eklenenler: number[] = []

        for (const sip of siparisler) {
          // Ürün fiyatını al
          const urun = db.prepare('SELECT fiyat, yazici_grup FROM urun WHERE id = ?').get(sip.urun_id) as any
          if (!urun) continue

          // Varyant fiyat farkını hesapla
          let birimFiyat = urun.fiyat
          if (sip.varyant_id) {
            const varyant = db.prepare('SELECT fiyat_farki FROM urun_varyant WHERE id = ?').get(sip.varyant_id) as any
            if (varyant) birimFiyat += varyant.fiyat_farki
          }

          const toplamFiyat = birimFiyat * sip.miktar

          const sonuc = db.prepare(`
            INSERT INTO siparis (hesap_id, urun_id, varyant_id, miktar, birim_fiyat, toplam_fiyat, personel_id, notlar, ikram, yazici_grup)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            hesapId, sip.urun_id, sip.varyant_id || null, sip.miktar,
            birimFiyat, toplamFiyat, personelId, sip.notlar || null,
            sip.ikram ? 1 : 0, urun.yazici_grup
          )

          eklenenler.push(Number(sonuc.lastInsertRowid))

          // Opsiyonları ekle
          if (sip.opsiyon_idleri && sip.opsiyon_idleri.length > 0) {
            for (const opsiyonId of sip.opsiyon_idleri) {
              db.prepare('INSERT INTO siparis_opsiyonlari (siparis_id, opsiyon_id) VALUES (?, ?)').run(sonuc.lastInsertRowid, opsiyonId)
            }
          }
        }

        // Hesap toplamını güncelle
        hesapToplamiGuncelle(hesapId)

        return eklenenler
      })

      const ids = ekle()

      // Mutfak ekranına bildirim gönder
      const pencereler = BrowserWindow.getAllWindows()
      for (const pencere of pencereler) {
        pencere.webContents.send('mutfak:yeni-siparis', { hesap_id: hesapId })
      }

      return { basarili: true, siparis_idleri: ids }
    } catch (hata: any) {
      return { basarili: false, hata: hata.message }
    }
  })

  // Sipariş iptal
  ipcMain.handle(HESAP_KANALLARI.SIPARIS_IPTAL, async (_event, siparisId: number, iptalNedeni: string, onaylayanId: number) => {
    db.prepare(`
      UPDATE siparis SET durum = 'iptal', iptal_nedeni = ?, ikram_onaylayan_id = ? WHERE id = ?
    `).run(iptalNedeni, onaylayanId, siparisId)

    // Hesap toplamını güncelle
    const siparis = db.prepare('SELECT hesap_id FROM siparis WHERE id = ?').get(siparisId) as any
    if (siparis) hesapToplamiGuncelle(siparis.hesap_id)

    return { basarili: true }
  })

  // Sipariş İkram Toggle
  ipcMain.handle(HESAP_KANALLARI.SIPARIS_IKRAM_TOGGLE, async (_event, siparisId: number, onaylayanId: number) => {
    try {
      const siparis = db.prepare('SELECT ikram, hesap_id FROM siparis WHERE id = ?').get(siparisId) as any
      if (!siparis) throw new Error('Sipariş bulunamadı')

      const yeniIkramDurumu = siparis.ikram === 1 ? 0 : 1

      db.prepare(`
        UPDATE siparis SET ikram = ?, ikram_onaylayan_id = ? WHERE id = ?
      `).run(yeniIkramDurumu, onaylayanId, siparisId)

      // Hesap toplamını güncelle
      hesapToplamiGuncelle(siparis.hesap_id)

      return { basarili: true, yeniIkram: yeniIkramDurumu }
    } catch (hata: any) {
      return { basarili: false, hata: hata.message }
    }
  })

  // İndirim uygula
  ipcMain.handle(HESAP_KANALLARI.INDIRIM_UYGULA, async (_event, indirim: IndirimBilgisi) => {
    const hesap = db.prepare('SELECT toplam_tutar FROM hesap WHERE id = ?').get(indirim.hesap_id) as any
    if (!hesap) return { basarili: false, hata: 'Hesap bulunamadı' }

    let indirimTutar = 0
    if (indirim.indirim_tipi === 'yuzde') {
      indirimTutar = hesap.toplam_tutar * (indirim.deger / 100)
    } else {
      indirimTutar = indirim.deger
    }

    const netTutar = Math.max(0, hesap.toplam_tutar - indirimTutar)

    db.prepare(`
      UPDATE hesap SET indirim_tutar = ?, net_tutar = ?, notlar = COALESCE(notlar, '') || ? WHERE id = ?
    `).run(indirimTutar, netTutar, `\nİndirim: ${indirim.aciklama || ''}`, indirim.hesap_id)

    return { basarili: true, indirim_tutar: indirimTutar, net_tutar: netTutar }
  })

  // Ödeme al
  ipcMain.handle(HESAP_KANALLARI.ODEME_AL, async (_event, odemeler: YeniOdeme[]) => {
    try {
      const islem = db.transaction(() => {
        const hesapId = odemeler[0].hesap_id
        let toplamOdeme = 0

        for (const odeme of odemeler) {
          db.prepare(`
            INSERT INTO odeme (hesap_id, odeme_tipi, tutar, personel_id, referans_no, notlar)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(odeme.hesap_id, odeme.odeme_tipi, odeme.tutar, odeme.personel_id, odeme.referans_no || null, odeme.notlar || null)
          toplamOdeme += odeme.tutar
        }

        // Hesap net tutarını kontrol et
        const hesap = db.prepare('SELECT net_tutar, masa_id FROM hesap WHERE id = ?').get(hesapId) as any
        
        // Önceki ödemeleri de dahil ederek toplam ödenen miktarı bul (yukarıda insert ettiklerimiz dahil)
        const yapilanOdemeler = db.prepare('SELECT COALESCE(SUM(tutar), 0) as toplam FROM odeme WHERE hesap_id = ?').get(hesapId) as any

        if (yapilanOdemeler.toplam >= hesap.net_tutar) {
          // Hesabı kapat
          db.prepare(`
            UPDATE hesap SET durum = 'odendi', kapanis_zamani = CURRENT_TIMESTAMP WHERE id = ?
          `).run(hesapId)

          // Masayı boşalt
          if (hesap.masa_id) {
            db.prepare("UPDATE masa SET durum = 'bos' WHERE id = ?").run(hesap.masa_id)
          }

          // Tüm siparişleri "teslim" yap
          db.prepare(`
            UPDATE siparis SET durum = 'teslim' WHERE hesap_id = ? AND durum != 'iptal'
          `).run(hesapId)

          // Kasa hareketi ekle
          db.prepare(`
            INSERT INTO kasa_hareket (kasa_id, islem_tipi, tutar, aciklama, hesap_id)
            VALUES (1, 'satis', ?, ?, ?)
          `).run(hesap.net_tutar, `Hesap #${hesapId} kapatıldı`, hesapId)

          return { kapandi: true, para_ustu: yapilanOdemeler.toplam - hesap.net_tutar }
        }

        return { kapandi: false, kalan: hesap.net_tutar - yapilanOdemeler.toplam }
      })

      const sonuc = islem()
      return { basarili: true, ...sonuc }
    } catch (hata: any) {
      return { basarili: false, hata: hata.message }
    }
  })

  // Hesap bölme
  ipcMain.handle(HESAP_KANALLARI.HESAP_BOL, async (_event, bolme: HesapBolme) => {
    try {
      const islem = db.transaction(() => {
        // Kaynak hesaptan personel bilgisini al
        const kaynakHesap = db.prepare('SELECT personel_id, hesap_tipi FROM hesap WHERE id = ?').get(bolme.kaynak_hesap_id) as any
        if (!kaynakHesap) throw new Error('Kaynak hesap bulunamadı')

        // Yeni hesap oluştur
        const yeniHesapNo = hesapNoOlustur()
        const yeniHesap = db.prepare(`
          INSERT INTO hesap (masa_id, hesap_no, hesap_tipi, personel_id)
          VALUES (?, ?, ?, ?)
        `).run(bolme.yeni_masa_id || null, yeniHesapNo, kaynakHesap.hesap_tipi, kaynakHesap.personel_id)

        const yeniHesapId = Number(yeniHesap.lastInsertRowid)

        // Seçili siparişleri yeni hesaba taşı
        for (const siparisId of bolme.siparis_idleri) {
          db.prepare('UPDATE siparis SET hesap_id = ? WHERE id = ?').run(yeniHesapId, siparisId)
        }

        // Her iki hesabın toplamını güncelle
        hesapToplamiGuncelle(bolme.kaynak_hesap_id)
        hesapToplamiGuncelle(yeniHesapId)

        return { yeni_hesap_id: yeniHesapId, yeni_hesap_no: yeniHesapNo }
      })

      const sonuc = islem()
      return { basarili: true, ...sonuc }
    } catch (hata: any) {
      return { basarili: false, hata: hata.message }
    }
  })

  // Hesap iptal
  ipcMain.handle(HESAP_KANALLARI.IPTAL, async (_event, hesapId: number) => {
    const hesap = db.prepare('SELECT masa_id FROM hesap WHERE id = ?').get(hesapId) as any
    db.prepare("UPDATE hesap SET durum = 'iptal', kapanis_zamani = CURRENT_TIMESTAMP WHERE id = ?").run(hesapId)
    db.prepare("UPDATE siparis SET durum = 'iptal' WHERE hesap_id = ?").run(hesapId)
    if (hesap?.masa_id) {
      db.prepare("UPDATE masa SET durum = 'bos' WHERE id = ?").run(hesap.masa_id)
    }
    return { basarili: true }
  })
}
