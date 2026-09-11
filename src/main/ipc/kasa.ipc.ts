// =====================================================
// Kasa vardiya, Z raporu, gider ve kasa hareketleri
// =====================================================

import { IpcMain } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { KASA_KANALLARI } from '../../common/ipc-channels'
import { denetimYaz } from '../services/audit.service'

function zNoOlustur(db: any): string {
  const tarih = new Date()
  const gun = `${tarih.getFullYear()}${String(tarih.getMonth() + 1).padStart(2, '0')}${String(tarih.getDate()).padStart(2, '0')}`
  const son = db.prepare(
    "SELECT z_no FROM kasa_vardiya WHERE z_no LIKE ? ORDER BY id DESC LIMIT 1"
  ).get(`Z-${gun}-%`) as any
  let sira = 1
  if (son?.z_no) {
    const parca = son.z_no.split('-')
    const n = parseInt(parca[parca.length - 1], 10)
    if (!isNaN(n)) sira = n + 1
  }
  return `Z-${gun}-${String(sira).padStart(2, '0')}`
}

function vardiyaOzet(db: any, vardiya: any) {
  const bas = vardiya.acilis_zamani
  const bit = vardiya.kapanis_zamani || new Date().toISOString().replace('T', ' ').slice(0, 19)

  const odemeler = db.prepare(`
    SELECT odeme_tipi, COALESCE(SUM(tutar), 0) as toplam, COUNT(*) as adet
    FROM odeme
    WHERE odeme_zamani >= ? AND odeme_zamani <= ?
    GROUP BY odeme_tipi
  `).all(bas, bit) as any[]

  const nakit = odemeler.find((o) => o.odeme_tipi === 'nakit')?.toplam || 0
  const kart = odemeler.find((o) => o.odeme_tipi === 'kredi_karti')?.toplam || 0
  const yemek = odemeler.find((o) => o.odeme_tipi === 'yemek_karti')?.toplam || 0
  const diger = odemeler
    .filter((o) => !['nakit', 'kredi_karti', 'yemek_karti'].includes(o.odeme_tipi))
    .reduce((a, o) => a + Number(o.toplam || 0), 0)

  const giderRow = db.prepare(`
    SELECT COALESCE(SUM(tutar), 0) as toplam
    FROM kasa_hareket
    WHERE islem_tipi = 'gider' AND created_at >= ? AND created_at <= ?
  `).get(bas, bit) as any
  const gider = Number(giderRow?.toplam || 0)

  const iptal = db.prepare(`
    SELECT COALESCE(SUM(toplam_fiyat), 0) as toplam
    FROM siparis
    WHERE durum = 'iptal' AND siparis_zamani >= ? AND siparis_zamani <= ?
  `).get(bas, bit) as any

  const ikram = db.prepare(`
    SELECT COALESCE(SUM(toplam_fiyat), 0) as toplam
    FROM siparis
    WHERE ikram = 1 AND durum != 'iptal' AND siparis_zamani >= ? AND siparis_zamani <= ?
  `).get(bas, bit) as any

  const indirim = db.prepare(`
    SELECT COALESCE(SUM(indirim_tutar), 0) as toplam
    FROM hesap
    WHERE kapanis_zamani >= ? AND kapanis_zamani <= ? AND durum = 'odendi'
  `).get(bas, bit) as any

  const hesaplar = db.prepare(`
    SELECT COUNT(*) as adet
    FROM hesap
    WHERE kapanis_zamani >= ? AND kapanis_zamani <= ? AND durum = 'odendi'
  `).get(bas, bit) as any

  const giderler = db.prepare(`
    SELECT kh.*, p.ad || ' ' || p.soyad as personel_adi
    FROM kasa_hareket kh
    LEFT JOIN personel p ON p.id = kh.personel_id
    WHERE kh.islem_tipi = 'gider' AND kh.created_at >= ? AND kh.created_at <= ?
    ORDER BY kh.created_at DESC
  `).all(bas, bit)

  const acilisNakit = Number(vardiya.acilis_nakit || 0)
  const beklenen = acilisNakit + Number(nakit) - gider
  const toplamCiro = Number(nakit) + Number(kart) + Number(yemek) + Number(diger)

  return {
    ...vardiya,
    nakit_satis: Number(nakit),
    kart_satis: Number(kart),
    yemek_karti_satis: Number(yemek),
    diger_satis: Number(diger),
    gider,
    iptal_tutar: Number(iptal?.toplam || 0),
    ikram_tutar: Number(ikram?.toplam || 0),
    indirim_tutar: Number(indirim?.toplam || 0),
    hesap_sayisi: Number(hesaplar?.adet || 0),
    beklenen_nakit: beklenen,
    toplam_ciro: toplamCiro,
    odeme_dagilim: odemeler,
    giderler,
  }
}

export function kasaIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  ipcMain.handle(KASA_KANALLARI.LISTELE, async () => {
    return db.prepare('SELECT * FROM kasa WHERE aktif = 1 ORDER BY id').all()
  })

  ipcMain.handle(KASA_KANALLARI.HAREKETLER, async (_e, kasaId?: number) => {
    if (kasaId) {
      return db.prepare(`
        SELECT kh.*, p.ad || ' ' || p.soyad as personel_adi
        FROM kasa_hareket kh
        LEFT JOIN personel p ON p.id = kh.personel_id
        WHERE kh.kasa_id = ?
        ORDER BY kh.created_at DESC LIMIT 200
      `).all(kasaId)
    }
    return db.prepare(`
      SELECT kh.*, p.ad || ' ' || p.soyad as personel_adi
      FROM kasa_hareket kh
      LEFT JOIN personel p ON p.id = kh.personel_id
      ORDER BY kh.created_at DESC LIMIT 200
    `).all()
  })

  ipcMain.handle(KASA_KANALLARI.HAREKET_EKLE, async (_e, veri: any) => {
    const sonuc = db.prepare(`
      INSERT INTO kasa_hareket (kasa_id, islem_tipi, tutar, aciklama, personel_id, hesap_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      veri.kasa_id || 1,
      veri.islem_tipi || 'gider',
      Number(veri.tutar || 0),
      veri.aciklama || null,
      veri.personel_id || null,
      veri.hesap_id || null
    )
    return { basarili: true, id: sonuc.lastInsertRowid }
  })

  ipcMain.handle(KASA_KANALLARI.VARDIYA_ACIK, async () => {
    const v = db.prepare("SELECT * FROM kasa_vardiya WHERE durum = 'acik' ORDER BY id DESC LIMIT 1").get() as any
    if (!v) return null
    return vardiyaOzet(db, v)
  })

  ipcMain.handle(KASA_KANALLARI.VARDIYA_AC, async (_e, veri: any) => {
    const mevcut = db.prepare("SELECT id FROM kasa_vardiya WHERE durum = 'acik' LIMIT 1").get()
    if (mevcut) return { basarili: false, hata: 'Zaten açık bir vardiya var' }

    const zNo = zNoOlustur(db)
    const sonuc = db.prepare(`
      INSERT INTO kasa_vardiya (kasa_id, z_no, acan_personel_id, acilis_nakit, durum)
      VALUES (?, ?, ?, ?, 'acik')
    `).run(veri?.kasa_id || 1, zNo, veri?.personel_id || null, Number(veri?.acilis_nakit || 0))

    denetimYaz(db, {
      personel_id: veri?.personel_id,
      islem: 'kasa_ac',
      modul: 'kasa',
      hedef_tip: 'kasa_vardiya',
      hedef_id: Number(sonuc.lastInsertRowid),
      ozet: `Vardiya açıldı ${zNo} — açılış nakit ${Number(veri?.acilis_nakit || 0)}`,
    })

    const v = db.prepare('SELECT * FROM kasa_vardiya WHERE id = ?').get(sonuc.lastInsertRowid)
    return { basarili: true, vardiya: vardiyaOzet(db, v) }
  })

  ipcMain.handle(KASA_KANALLARI.VARDIYA_OZET, async (_e, vardiyaId?: number) => {
    let v: any
    if (vardiyaId) {
      v = db.prepare('SELECT * FROM kasa_vardiya WHERE id = ?').get(vardiyaId)
    } else {
      v = db.prepare("SELECT * FROM kasa_vardiya WHERE durum = 'acik' ORDER BY id DESC LIMIT 1").get()
    }
    if (!v) return null
    return vardiyaOzet(db, v)
  })

  ipcMain.handle(KASA_KANALLARI.GIDER_EKLE, async (_e, veri: any) => {
    const acik = db.prepare("SELECT id FROM kasa_vardiya WHERE durum = 'acik' LIMIT 1").get()
    if (!acik) return { basarili: false, hata: 'Açık vardiya yok' }

    const tutar = Number(veri?.tutar || 0)
    if (!(tutar > 0)) return { basarili: false, hata: 'Gider tutarı gerekli' }

    db.prepare(`
      INSERT INTO kasa_hareket (kasa_id, islem_tipi, tutar, aciklama, personel_id)
      VALUES (?, 'gider', ?, ?, ?)
    `).run(veri?.kasa_id || 1, tutar, veri?.aciklama || 'Gider', veri?.personel_id || null)

    denetimYaz(db, {
      personel_id: veri?.personel_id,
      islem: 'kasa_gider',
      modul: 'kasa',
      ozet: `Gider ${tutar} ₺ — ${veri?.aciklama || ''}`,
      detay: veri,
    })

    return { basarili: true }
  })

  ipcMain.handle(KASA_KANALLARI.VARDIYA_KAPAT, async (_e, veri: any) => {
    const v = db.prepare("SELECT * FROM kasa_vardiya WHERE durum = 'acik' ORDER BY id DESC LIMIT 1").get() as any
    if (!v) return { basarili: false, hata: 'Açık vardiya yok' }

    const ozet = vardiyaOzet(db, v)
    const sayim = Number(veri?.kapanis_nakit_sayim ?? ozet.beklenen_nakit)
    const fark = sayim - Number(ozet.beklenen_nakit)

    db.prepare(`
      UPDATE kasa_vardiya SET
        kapanis_zamani = CURRENT_TIMESTAMP,
        kapatan_personel_id = ?,
        kapanis_nakit_sayim = ?,
        beklenen_nakit = ?,
        nakit_fark = ?,
        nakit_satis = ?,
        kart_satis = ?,
        yemek_karti_satis = ?,
        diger_satis = ?,
        gider = ?,
        iptal_tutar = ?,
        ikram_tutar = ?,
        indirim_tutar = ?,
        hesap_sayisi = ?,
        durum = 'kapali',
        notlar = ?
      WHERE id = ?
    `).run(
      veri?.personel_id || null,
      sayim,
      ozet.beklenen_nakit,
      fark,
      ozet.nakit_satis,
      ozet.kart_satis,
      ozet.yemek_karti_satis,
      ozet.diger_satis,
      ozet.gider,
      ozet.iptal_tutar,
      ozet.ikram_tutar,
      ozet.indirim_tutar,
      ozet.hesap_sayisi,
      veri?.notlar || null,
      v.id
    )

    denetimYaz(db, {
      personel_id: veri?.personel_id,
      islem: 'kasa_kapat',
      modul: 'kasa',
      hedef_tip: 'kasa_vardiya',
      hedef_id: v.id,
      ozet: `Z kapanış ${v.z_no} — ciro ${ozet.toplam_ciro} ₺, nakit fark ${fark} ₺`,
      detay: { sayim, beklenen: ozet.beklenen_nakit, fark },
    })

    const kapali = db.prepare('SELECT * FROM kasa_vardiya WHERE id = ?').get(v.id)
    return { basarili: true, vardiya: vardiyaOzet(db, kapali) }
  })

  ipcMain.handle(KASA_KANALLARI.VARDIYA_GECMIS, async (_e, limit = 30) => {
    return db.prepare(`
      SELECT v.*,
        pa.ad || ' ' || pa.soyad as acan_adi,
        pk.ad || ' ' || pk.soyad as kapatan_adi
      FROM kasa_vardiya v
      LEFT JOIN personel pa ON pa.id = v.acan_personel_id
      LEFT JOIN personel pk ON pk.id = v.kapatan_personel_id
      ORDER BY v.id DESC
      LIMIT ?
    `).all(Number(limit) || 30)
  })
}
