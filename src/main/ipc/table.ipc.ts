// =====================================================
// Masa IPC Handler'ları
// Bölüm ve masa CRUD, birleştirme, taşıma
// =====================================================

import { IpcMain } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { MASA_KANALLARI } from '../../common/ipc-channels'
import { terminalAyarYukle } from '../services/terminal.service'

export function masaIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  function bugunYerel(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  function rezervasyonlariEkle(masalar: any[]): any[] {
    if (!Array.isArray(masalar) || masalar.length === 0) return masalar
    let rezervasyonlar: any[] = []
    try {
      rezervasyonlar = db.prepare(`
        SELECT r.id, r.masa_id, r.musteri_ad, r.saat, r.telefon, r.kisi_sayisi, r.notlar
        FROM rezervasyon r
        WHERE r.durum = 'bekliyor' AND r.tarih = ?
        ORDER BY r.saat ASC, r.id ASC
      `).all(bugunYerel()) as any[]
    } catch {
      rezervasyonlar = []
    }

    const rezByMasa = new Map<number, any>()
    for (const rz of rezervasyonlar) {
      const masaId = Number(rz?.masa_id)
      if (!masaId || rezByMasa.has(masaId)) continue
      rezByMasa.set(masaId, rz)
    }

    return masalar.map((m) => {
      const rz = rezByMasa.get(Number(m.id))
      const doluMu = m.durum === 'dolu' || !!m.aktif_hesap_id
      if (rz && !doluMu && m.durum !== 'birlesti') {
        if (m.durum !== 'rezerve') {
          try {
            db.prepare("UPDATE masa SET durum = 'rezerve' WHERE id = ? AND durum NOT IN ('dolu', 'birlesti')").run(m.id)
          } catch { /* sessiz */ }
          m.durum = 'rezerve'
        }
        return {
          ...m,
          durum: 'rezerve',
          rezervasyon_id: rz.id,
          rezervasyon_ad: rz.musteri_ad,
          rezervasyon_saat: rz.saat,
          rezervasyon_telefon: rz.telefon,
          rezervasyon_kisi: rz.kisi_sayisi,
          rezervasyon_not: rz.notlar,
        }
      }
      return {
        ...m,
        rezervasyon_id: m.rezervasyon_id || null,
        rezervasyon_ad: m.rezervasyon_ad || null,
        rezervasyon_saat: m.rezervasyon_saat || null,
        rezervasyon_telefon: m.rezervasyon_telefon || null,
        rezervasyon_kisi: m.rezervasyon_kisi || null,
        rezervasyon_not: m.rezervasyon_not || null,
      }
    })
  }

  // Bölümleri listele
  ipcMain.handle(MASA_KANALLARI.BOLUMLER, async () => {
    return db.prepare(`
      SELECT b.*, (SELECT COUNT(*) FROM masa m WHERE m.bolum_id = b.id AND m.aktif = 1) as masa_sayisi
      FROM bolum b WHERE b.aktif = 1 ORDER BY b.sira ASC, b.ad ASC
    `).all()
  })

  // Bölüm ekle
  ipcMain.handle(MASA_KANALLARI.BOLUM_EKLE, async (_event, veri: any) => {
    let ad = veri
    let sira = 0
    if (typeof veri === 'object') {
      ad = veri.ad
      sira = veri.sira || 0
    }
    const sonuc = db.prepare('INSERT INTO bolum (ad, sira) VALUES (?, ?)').run(ad, sira)
    return { basarili: true, id: sonuc.lastInsertRowid }
  })
  
  // Bölüm güncelle
  ipcMain.handle(MASA_KANALLARI.BOLUM_GUNCELLE, async (_event, id: number, veri: any) => {
    const alanlar: string[] = []
    const degerler: any[] = []
    if (veri.ad !== undefined) { alanlar.push('ad = ?'); degerler.push(veri.ad) }
    if (veri.sira !== undefined) { alanlar.push('sira = ?'); degerler.push(veri.sira) }
    if (veri.aktif !== undefined) { alanlar.push('aktif = ?'); degerler.push(veri.aktif) }
    degerler.push(id)
    if (alanlar.length > 0) {
      db.prepare(`UPDATE bolum SET ${alanlar.join(', ')} WHERE id = ?`).run(...degerler)
    }
    return { basarili: true }
  })

  // Masaları listele (bölüm bazlı veya tümü)
  ipcMain.handle(MASA_KANALLARI.MASALAR, async (_event, bolumId?: number) => {
    const sureSql = `CAST(MAX(0, ROUND((julianday('now') - julianday(h.acilis_zamani)) * 24 * 60)) AS INTEGER) as acik_sure`
    const sorgu = bolumId
      ? `SELECT m.*, b.ad as bolum_adi,
           h.id as aktif_hesap_id, h.toplam_tutar as aktif_hesap_tutari,
           p.ad || ' ' || p.soyad as garson_adi,
           h.acilis_zamani,
           ${sureSql},
           (SELECT COALESCE(SUM(s.miktar), 0) FROM siparis s WHERE s.hesap_id = h.id AND s.durum != 'iptal') as urun_sayisi,
           mk.terminal_id as kilit_terminal, mk.personel_adi as kilit_personel, mk.kilit_zamani,
           h.kisi_sayisi as hesap_kisi, h.notlar as hesap_notlar, h.hesap_no as aktif_hesap_no
         FROM masa m
         JOIN bolum b ON b.id = m.bolum_id
         LEFT JOIN hesap h ON h.masa_id = m.id AND h.durum = 'acik'
         LEFT JOIN personel p ON p.id = h.personel_id
         LEFT JOIN masa_kilit mk ON mk.masa_id = m.id
         WHERE m.bolum_id = ? AND m.aktif = 1
         ORDER BY m.sira ASC, m.numara ASC`
      : `SELECT m.*, b.ad as bolum_adi,
           h.id as aktif_hesap_id, h.toplam_tutar as aktif_hesap_tutari,
           p.ad || ' ' || p.soyad as garson_adi,
           h.acilis_zamani,
           ${sureSql},
           (SELECT COALESCE(SUM(s.miktar), 0) FROM siparis s WHERE s.hesap_id = h.id AND s.durum != 'iptal') as urun_sayisi,
           mk.terminal_id as kilit_terminal, mk.personel_adi as kilit_personel, mk.kilit_zamani,
           h.kisi_sayisi as hesap_kisi, h.notlar as hesap_notlar, h.hesap_no as aktif_hesap_no
         FROM masa m
         JOIN bolum b ON b.id = m.bolum_id
         LEFT JOIN hesap h ON h.masa_id = m.id AND h.durum = 'acik'
         LEFT JOIN personel p ON p.id = h.personel_id
         LEFT JOIN masa_kilit mk ON mk.masa_id = m.id
         WHERE m.aktif = 1
         ORDER BY b.sira ASC, b.ad ASC, m.sira ASC, m.numara ASC`

    let masalar: any[] = []
    try {
      masalar = bolumId ? db.prepare(sorgu).all(bolumId) as any[] : db.prepare(sorgu).all() as any[]
    } catch {
      const eski = bolumId
        ? `SELECT m.*, b.ad as bolum_adi,
             h.id as aktif_hesap_id, h.toplam_tutar as aktif_hesap_tutari,
             p.ad || ' ' || p.soyad as garson_adi,
             h.acilis_zamani,
             (SELECT COALESCE(SUM(s.miktar), 0) FROM siparis s WHERE s.hesap_id = h.id AND s.durum != 'iptal') as urun_sayisi,
             mk.terminal_id as kilit_terminal, mk.personel_adi as kilit_personel, mk.kilit_zamani
           FROM masa m
           JOIN bolum b ON b.id = m.bolum_id
           LEFT JOIN hesap h ON h.masa_id = m.id AND h.durum = 'acik'
           LEFT JOIN personel p ON p.id = h.personel_id
           LEFT JOIN masa_kilit mk ON mk.masa_id = m.id
           WHERE m.bolum_id = ? AND m.aktif = 1
           ORDER BY m.sira ASC, m.numara ASC`
        : `SELECT m.*, b.ad as bolum_adi,
             h.id as aktif_hesap_id, h.toplam_tutar as aktif_hesap_tutari,
             p.ad || ' ' || p.soyad as garson_adi,
             h.acilis_zamani,
             (SELECT COALESCE(SUM(s.miktar), 0) FROM siparis s WHERE s.hesap_id = h.id AND s.durum != 'iptal') as urun_sayisi,
             mk.terminal_id as kilit_terminal, mk.personel_adi as kilit_personel, mk.kilit_zamani
           FROM masa m
           JOIN bolum b ON b.id = m.bolum_id
           LEFT JOIN hesap h ON h.masa_id = m.id AND h.durum = 'acik'
           LEFT JOIN personel p ON p.id = h.personel_id
           LEFT JOIN masa_kilit mk ON mk.masa_id = m.id
           WHERE m.aktif = 1
           ORDER BY b.sira ASC, b.ad ASC, m.sira ASC, m.numara ASC`
      masalar = bolumId ? db.prepare(eski).all(bolumId) as any[] : db.prepare(eski).all() as any[]
    }

    return rezervasyonlariEkle(masalar)
  })

  // Masa ekle
  ipcMain.handle(MASA_KANALLARI.MASA_EKLE, async (_event, veri: any) => {
    const sonuc = db.prepare(`
      INSERT INTO masa (bolum_id, numara, kapasite, konum_x, konum_y, sira)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(veri.bolum_id, veri.numara, veri.kapasite || 4, veri.konum_x || 0, veri.konum_y || 0, veri.sira || 0)
    return { basarili: true, id: sonuc.lastInsertRowid }
  })

  // Toplu Masa Ekle
  ipcMain.handle(MASA_KANALLARI.MASA_TOPLU_EKLE, async (_event, bolumId: number, onek: string, adet: number) => {
    try {
      const islem = db.transaction(() => {
        const result = [];
        for (let i = 1; i <= adet; i++) {
          const numara = `${onek} ${i}`;
          const x = ((i - 1) % 5) * 120 + 50;
          const y = Math.floor((i - 1) / 5) * 120 + 50;
          const sira = i;
          
          const ins = db.prepare(`
            INSERT INTO masa (bolum_id, numara, kapasite, konum_x, konum_y, sira)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(bolumId, numara, 4, x, y, sira);
          
          result.push(ins.lastInsertRowid);
        }
        return result;
      });
      const ids = islem();
      return { basarili: true, ids };
    } catch (hata: any) {
      return { basarili: false, hata: hata.message };
    }
  })

  // Masa güncelle
  ipcMain.handle(MASA_KANALLARI.MASA_GUNCELLE, async (_event, id: number, veri: any) => {
    const alanlar: string[] = []
    const degerler: any[] = []
    if (veri.numara !== undefined) { alanlar.push('numara = ?'); degerler.push(veri.numara) }
    if (veri.kapasite !== undefined) { alanlar.push('kapasite = ?'); degerler.push(veri.kapasite) }
    if (veri.durum !== undefined) { alanlar.push('durum = ?'); degerler.push(veri.durum) }
    if (veri.konum_x !== undefined) { alanlar.push('konum_x = ?'); degerler.push(veri.konum_x) }
    if (veri.konum_y !== undefined) { alanlar.push('konum_y = ?'); degerler.push(veri.konum_y) }
    if (veri.aktif !== undefined) { alanlar.push('aktif = ?'); degerler.push(veri.aktif) }
    if (veri.sira !== undefined) { alanlar.push('sira = ?'); degerler.push(veri.sira) }
    degerler.push(id)
    if (alanlar.length > 0) {
      db.prepare(`UPDATE masa SET ${alanlar.join(', ')} WHERE id = ?`).run(...degerler)
    }
    return { basarili: true }
  })

  // Masa birleştir
  ipcMain.handle(MASA_KANALLARI.MASA_BIRLESTIR, async (_event, anaMasaId: number, birlesenMasaIdleri: number[]) => {
    try {
      const islem = db.transaction(() => {
        for (const masaId of birlesenMasaIdleri) {
          // Birleşen masanın hesabını ana masaya taşı
          db.prepare(`
            UPDATE hesap SET masa_id = ? WHERE masa_id = ? AND durum = 'acik'
          `).run(anaMasaId, masaId)

          // Birleşen masayı "birleşti" olarak işaretle
          db.prepare("UPDATE masa SET durum = 'birlesti' WHERE id = ?").run(masaId)
        }
        // Ana masayı dolu yap
        db.prepare("UPDATE masa SET durum = 'dolu' WHERE id = ?").run(anaMasaId)
      })
      islem()
      return { basarili: true }
    } catch (hata: any) {
      return { basarili: false, hata: hata.message }
    }
  })

  // Masa taşı (hesap taşıma)
  ipcMain.handle(MASA_KANALLARI.MASA_TASI, async (_event, kaynakMasaId: number, hedefMasaId: number) => {
    try {
      const islem = db.transaction(() => {
        db.prepare(`
          UPDATE hesap SET masa_id = ? WHERE masa_id = ? AND durum = 'acik'
        `).run(hedefMasaId, kaynakMasaId)

        db.prepare("UPDATE masa SET durum = 'bos' WHERE id = ?").run(kaynakMasaId)
        db.prepare("UPDATE masa SET durum = 'dolu' WHERE id = ?").run(hedefMasaId)
      })
      islem()
      return { basarili: true }
    } catch (hata: any) {
      return { basarili: false, hata: hata.message }
    }
  })

  ipcMain.handle(MASA_KANALLARI.KILITLER, async () => {
    db.prepare("DELETE FROM masa_kilit WHERE datetime(kilit_zamani) < datetime('now', '-20 minutes')").run()
    return db.prepare('SELECT * FROM masa_kilit').all()
  })

  ipcMain.handle(MASA_KANALLARI.KILIT, async (_e, masaId: number, personelId?: number, personelAdi?: string, terminalId?: string) => {
    if (!masaId) return { basarili: false, hata: 'Masa gerekli' }
    db.prepare("DELETE FROM masa_kilit WHERE datetime(kilit_zamani) < datetime('now', '-20 minutes')").run()
    const tid = terminalId || terminalAyarYukle().terminalId
    const mevcut = db.prepare('SELECT * FROM masa_kilit WHERE masa_id = ?').get(masaId) as any
    if (mevcut && mevcut.terminal_id !== tid) {
      return {
        basarili: false,
        kilitli: true,
        hata: `Masa başka terminalde açık (${mevcut.personel_adi || mevcut.terminal_id})`,
        kilit: mevcut,
      }
    }
    db.prepare(`
      INSERT INTO masa_kilit (masa_id, terminal_id, personel_id, personel_adi, kilit_zamani)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(masa_id) DO UPDATE SET
        terminal_id = excluded.terminal_id,
        personel_id = excluded.personel_id,
        personel_adi = excluded.personel_adi,
        kilit_zamani = CURRENT_TIMESTAMP
    `).run(masaId, tid, personelId || null, personelAdi || null)
    return { basarili: true }
  })

  ipcMain.handle(MASA_KANALLARI.KILIT_AC, async (_e, masaId: number, terminalId?: string) => {
    const tid = terminalId || terminalAyarYukle().terminalId
    if (masaId) {
      db.prepare('DELETE FROM masa_kilit WHERE masa_id = ? AND terminal_id = ?').run(masaId, tid)
    } else {
      db.prepare('DELETE FROM masa_kilit WHERE terminal_id = ?').run(tid)
    }
    return { basarili: true }
  })
}
