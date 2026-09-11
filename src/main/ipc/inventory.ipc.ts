// =====================================================
// Stok & Reçete IPC Handler'ları
// =====================================================

import { IpcMain } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { STOK_KANALLARI } from '../../common/ipc-channels'
import { birimDonustur, urunReceteMaliyetiHesapla } from '../services/stock-recipe.service'

export function stokIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  // Hammaddeleri listele
  ipcMain.handle(STOK_KANALLARI.HAMMADDELER, async () => {
    return db.prepare(`
      SELECT 
        h.id, h.ad, h.birim,
        ROUND(h.mevcut_stok, 4) as mevcut_stok,
        ROUND(h.min_stok, 4) as min_stok,
        h.maliyet_birim, h.tedarikci, h.aktif, h.created_at, h.updated_at,
        CASE
          WHEN h.mevcut_stok <= 0 THEN 'tukendi'
          WHEN h.mevcut_stok <= h.min_stok * 0.5 THEN 'kritik'
          WHEN h.mevcut_stok <= h.min_stok THEN 'dusuk'
          ELSE 'normal'
        END as stok_durumu
      FROM hammadde h WHERE h.aktif = 1 ORDER BY h.ad
    `).all()
  })

  // Hammadde ekle
  ipcMain.handle(STOK_KANALLARI.HAMMADDE_EKLE, async (_event, veri: any) => {
    const sonuc = db.prepare(`
      INSERT INTO hammadde (ad, birim, mevcut_stok, min_stok, maliyet_birim, tedarikci)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(veri.ad, veri.birim, Number(Number(veri.mevcut_stok || 0).toFixed(4)), Number(Number(veri.min_stok || 0).toFixed(4)), veri.maliyet_birim || 0, veri.tedarikci || null)
    return { basarili: true, id: sonuc.lastInsertRowid }
  })

  // Hammadde güncelle
  ipcMain.handle(STOK_KANALLARI.HAMMADDE_GUNCELLE, async (_event, id: number, veri: any) => {
    const alanlar: string[] = []
    const degerler: any[] = []
    if (veri.ad) { alanlar.push('ad = ?'); degerler.push(veri.ad) }
    if (veri.birim) { alanlar.push('birim = ?'); degerler.push(veri.birim) }
    if (veri.min_stok !== undefined) { alanlar.push('min_stok = ?'); degerler.push(Number(Number(veri.min_stok).toFixed(4))) }
    if (veri.maliyet_birim !== undefined) { alanlar.push('maliyet_birim = ?'); degerler.push(veri.maliyet_birim) }
    if (veri.tedarikci !== undefined) { alanlar.push('tedarikci = ?'); degerler.push(veri.tedarikci) }
    alanlar.push('updated_at = CURRENT_TIMESTAMP')
    degerler.push(id)
    db.prepare(`UPDATE hammadde SET ${alanlar.join(', ')} WHERE id = ?`).run(...degerler)
    return { basarili: true }
  })

  // Stok hareketi ekle
  ipcMain.handle(STOK_KANALLARI.STOK_GIRIS, async (_event, veri: any) => {
    const islem = db.transaction(() => {
      const islemMiktar = Number(Number(veri.miktar || 0).toFixed(4))
      db.prepare(`
        INSERT INTO stok_hareket (hammadde_id, islem_tipi, miktar, birim_maliyet, aciklama, personel_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(veri.hammadde_id, veri.islem_tipi, islemMiktar, veri.birim_maliyet || 0, veri.aciklama || null, veri.personel_id || null)

      // Stok miktarını güncelle ve 4 basamağa yuvarla
      if (veri.islem_tipi === 'giris') {
        db.prepare('UPDATE hammadde SET mevcut_stok = ROUND(mevcut_stok + ?, 4), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(islemMiktar, veri.hammadde_id)
      } else if (veri.islem_tipi === 'cikis' || veri.islem_tipi === 'fire') {
        db.prepare('UPDATE hammadde SET mevcut_stok = ROUND(MAX(0, mevcut_stok - ?), 4), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(islemMiktar, veri.hammadde_id)
      } else if (veri.islem_tipi === 'sayim') {
        db.prepare('UPDATE hammadde SET mevcut_stok = ROUND(?, 4), updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(islemMiktar, veri.hammadde_id)
      }

      // Birim maliyeti güncelle (giriş ise)
      if (veri.islem_tipi === 'giris' && veri.birim_maliyet > 0) {
        db.prepare('UPDATE hammadde SET maliyet_birim = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(veri.birim_maliyet, veri.hammadde_id)
      }
    })
    islem()
    return { basarili: true }
  })

  // Stok hareketleri
  ipcMain.handle(STOK_KANALLARI.STOK_HAREKETLERI, async (_event, hammaddeId?: number) => {
    if (hammaddeId) {
      return db.prepare(`
        SELECT sh.*, h.ad as hammadde_adi, p.ad || ' ' || p.soyad as personel_adi
        FROM stok_hareket sh
        JOIN hammadde h ON h.id = sh.hammadde_id
        LEFT JOIN personel p ON p.id = sh.personel_id
        WHERE sh.hammadde_id = ?
        ORDER BY sh.created_at DESC LIMIT 100
      `).all(hammaddeId)
    }
    return db.prepare(`
      SELECT sh.*, h.ad as hammadde_adi, p.ad || ' ' || p.soyad as personel_adi
      FROM stok_hareket sh
      JOIN hammadde h ON h.id = sh.hammadde_id
      LEFT JOIN personel p ON p.id = sh.personel_id
      ORDER BY sh.created_at DESC LIMIT 200
    `).all()
  })

  // Reçeteleri getir
  ipcMain.handle(STOK_KANALLARI.RECETELER, async (_event, urunId?: number) => {
    if (urunId) {
      const kalemler = db.prepare(`
        SELECT r.*, h.ad as hammadde_adi, h.birim as hammadde_birim, h.maliyet_birim as birim_maliyet
        FROM recete r
        JOIN hammadde h ON h.id = r.hammadde_id
        WHERE r.urun_id = ?
      `).all(urunId) as any[]

      return kalemler.map(k => {
        const donusenMiktar = birimDonustur(k.miktar, k.birim, k.hammadde_birim)
        const kalemMaliyet = Number((donusenMiktar * (k.birim_maliyet || 0)).toFixed(2))
        return {
          ...k,
          kalem_maliyet: kalemMaliyet,
        }
      })
    }

    // Tüm ürünlerin reçete maliyet özeti
    const urunler = db.prepare(`
      SELECT u.id as urun_id, u.ad as urun_adi, u.fiyat as satis_fiyati, k.ad as kategori_adi
      FROM urun u
      JOIN kategori k ON k.id = u.kategori_id
      WHERE u.aktif = 1
      ORDER BY u.ad ASC
    `).all() as any[]

    return urunler.map(u => {
      const toplamMaliyet = urunReceteMaliyetiHesapla(db, u.urun_id)
      const karTutari = Number((u.satis_fiyati - toplamMaliyet).toFixed(2))
      const karMarji = u.satis_fiyati > 0 ? Number(((karTutari / u.satis_fiyati) * 100).toFixed(1)) : 0
      return {
        ...u,
        toplam_maliyet: toplamMaliyet,
        kar_tutari: karTutari,
        kar_marji: karMarji,
      }
    })
  })

  // Reçete ekle/güncelle
  ipcMain.handle(STOK_KANALLARI.RECETE_EKLE, async (_event, urunId: number, kalemler: any[]) => {
    const islem = db.transaction(() => {
      // Mevcut reçeteyi sil
      db.prepare('DELETE FROM recete WHERE urun_id = ?').run(urunId)
      // Yeni kalemleri ekle
      for (const kalem of kalemler) {
        db.prepare('INSERT INTO recete (urun_id, hammadde_id, miktar, birim) VALUES (?, ?, ?, ?)').run(
          urunId, kalem.hammadde_id, kalem.miktar, kalem.birim
        )
      }
    })
    islem()
    return { basarili: true }
  })

  // Maliyet analizi
  ipcMain.handle(STOK_KANALLARI.MALIYET_ANALIZI, async () => {
    const urunler = db.prepare(`
      SELECT u.id as urun_id, u.ad as urun_adi, k.ad as kategori_adi, u.fiyat as satis_fiyati,
             COALESCE(sat.satis_adedi, 0) as satis_adedi,
             COALESCE(sat.toplam_ciro, 0) as toplam_ciro
      FROM urun u
      JOIN kategori k ON k.id = u.kategori_id
      LEFT JOIN (
        SELECT urun_id, SUM(miktar) as satis_adedi, SUM(toplam_fiyat) as toplam_ciro
        FROM siparis WHERE durum != 'iptal'
        GROUP BY urun_id
      ) sat ON sat.urun_id = u.id
      WHERE u.aktif = 1
      ORDER BY sat.toplam_ciro DESC
    `).all() as any[]

    return urunler.map(u => {
      const hammaddeMaliyeti = urunReceteMaliyetiHesapla(db, u.urun_id)
      const karMarji = u.satis_fiyati > 0 ? Number((((u.satis_fiyati - hammaddeMaliyeti) / u.satis_fiyati) * 100).toFixed(1)) : 0
      const toplamKar = Number(((u.satis_fiyati - hammaddeMaliyeti) * u.satis_adedi).toFixed(2))

      return {
        ...u,
        hammadde_maliyeti: hammaddeMaliyeti,
        kar_marji: karMarji,
        toplam_kar: toplamKar,
      }
    })
  })

  ipcMain.handle(STOK_KANALLARI.TEDARIKCI_LISTELE, async () => {
    return db.prepare('SELECT * FROM tedarikci WHERE aktif = 1 ORDER BY ad').all()
  })

  ipcMain.handle(STOK_KANALLARI.TEDARIKCI_EKLE, async (_e, veri: any) => {
    if (!veri?.ad) return { basarili: false, hata: 'Tedarikçi adı gerekli' }
    const sonuc = db.prepare(`
      INSERT INTO tedarikci (ad, telefon, adres, vergi_no, yetkili)
      VALUES (?, ?, ?, ?, ?)
    `).run(veri.ad, veri.telefon || null, veri.adres || null, veri.vergi_no || null, veri.yetkili || null)
    return { basarili: true, id: sonuc.lastInsertRowid }
  })

  ipcMain.handle(STOK_KANALLARI.TEDARIKCI_GUNCELLE, async (_e, id: number, veri: any) => {
    const alanlar: string[] = []
    const degerler: any[] = []
    for (const k of ['ad', 'telefon', 'adres', 'vergi_no', 'yetkili', 'aktif']) {
      if (veri && veri[k] !== undefined) {
        alanlar.push(`${k} = ?`)
        degerler.push(veri[k])
      }
    }
    if (!alanlar.length) return { basarili: false, hata: 'Güncellenecek alan yok' }
    degerler.push(id)
    db.prepare(`UPDATE tedarikci SET ${alanlar.join(', ')} WHERE id = ?`).run(...degerler)
    return { basarili: true }
  })

  ipcMain.handle(STOK_KANALLARI.ALIS_LISTELE, async (_e, limit = 100) => {
    const faturalar = db.prepare(`
      SELECT a.*, t.ad as tedarikci_adi, p.ad || ' ' || p.soyad as personel_adi
      FROM stok_alis a
      LEFT JOIN tedarikci t ON t.id = a.tedarikci_id
      LEFT JOIN personel p ON p.id = a.personel_id
      ORDER BY a.id DESC
      LIMIT ?
    `).all(Number(limit) || 100) as any[]

    return faturalar.map((f) => {
      const kalemler = db.prepare(`
        SELECT k.*, h.ad as hammadde_adi, h.birim as hammadde_birim
        FROM stok_alis_kalem k
        JOIN hammadde h ON h.id = k.hammadde_id
        WHERE k.alis_id = ?
      `).all(f.id)
      return { ...f, kalemler }
    })
  })

  ipcMain.handle(STOK_KANALLARI.ALIS_KAYDET, async (_e, veri: any) => {
    const kalemler = Array.isArray(veri?.kalemler) ? veri.kalemler : []
    if (!kalemler.length) return { basarili: false, hata: 'En az bir kalem gerekli' }

    try {
      const islem = db.transaction(() => {
        let toplam = 0
        const temiz = kalemler.map((k: any) => {
          const miktar = Number(Number(k.miktar || 0).toFixed(4))
          const maliyet = Number(k.birim_maliyet || 0)
          const satir = miktar * maliyet
          toplam += satir
          return { ...k, miktar, maliyet, satir }
        }).filter((k: any) => k.hammadde_id && k.miktar > 0)

        if (!temiz.length) throw new Error('Geçerli kalem yok')

        const fatura = db.prepare(`
          INSERT INTO stok_alis (tedarikci_id, fatura_no, toplam, notlar, personel_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          veri.tedarikci_id || null,
          veri.fatura_no || null,
          Number(toplam.toFixed(2)),
          veri.notlar || null,
          veri.personel_id || null
        )
        const alisId = Number(fatura.lastInsertRowid)

        for (const k of temiz) {
          db.prepare(`
            INSERT INTO stok_alis_kalem (alis_id, hammadde_id, miktar, birim_maliyet, toplam)
            VALUES (?, ?, ?, ?, ?)
          `).run(alisId, k.hammadde_id, k.miktar, k.maliyet, k.satir)

          db.prepare(`
            INSERT INTO stok_hareket (hammadde_id, islem_tipi, miktar, birim_maliyet, aciklama, personel_id)
            VALUES (?, 'giris', ?, ?, ?, ?)
          `).run(
            k.hammadde_id,
            k.miktar,
            k.maliyet,
            `Alış faturası #${alisId}${veri.fatura_no ? ' / ' + veri.fatura_no : ''}`,
            veri.personel_id || null
          )

          db.prepare(`
            UPDATE hammadde SET
              mevcut_stok = ROUND(mevcut_stok + ?, 4),
              maliyet_birim = CASE WHEN ? > 0 THEN ? ELSE maliyet_birim END,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(k.miktar, k.maliyet, k.maliyet, k.hammadde_id)
        }

        return alisId
      })

      const id = islem()
      return { basarili: true, id }
    } catch (err: any) {
      return { basarili: false, hata: err.message }
    }
  })
}
