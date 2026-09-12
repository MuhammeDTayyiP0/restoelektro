// =====================================================
// Patron (Boss) REST API
// Salt okunur: ciro, masa, rapor, kasa, stok, paket, rezervasyon, denetim
// Yazma yok. Sadece admin / müdür PIN.
// =====================================================

import jwt from 'jsonwebtoken'
import { veritabaniGetir } from '../database/connection'

const PATRON_ROLLER = new Set(['admin', 'mudur'])
const PIN_MAX_HATA = 5
const PIN_KILIT_MS = 90_000

type PinKilit = { hatali: number; kilitBitis: number }
const pinKilitleri = new Map<string, PinKilit>()

function bugunYerel(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function tarihAralik(req: any): { baslangic: string; bitis: string } {
  const bugun = bugunYerel()
  const baslangic = typeof req.query?.baslangic === 'string' && req.query.baslangic
    ? req.query.baslangic
    : bugun
  const bitis = typeof req.query?.bitis === 'string' && req.query.bitis
    ? req.query.bitis
    : bugun
  return { baslangic, bitis }
}

function istemciIp(req: any): string {
  const cf = req.headers?.['cf-connecting-ip']
  if (typeof cf === 'string' && cf.trim()) return cf.trim()
  const xff = req.headers?.['x-forwarded-for']
  if (typeof xff === 'string' && xff.trim()) return xff.split(',')[0].trim()
  return String(req.ip || req.socket?.remoteAddress || 'local')
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
    LIMIT 30
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

function finansalOzet(db: any, baslangic: string, bitis: string) {
  const hesapOzeti = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN h.durum = 'odendi' THEN h.net_tutar ELSE 0 END), 0) as toplam_ciro,
      COUNT(CASE WHEN h.durum = 'odendi' THEN 1 END) as kapanan_hesap,
      COALESCE(AVG(CASE WHEN h.durum = 'odendi' THEN h.net_tutar END), 0) as ortalama_hesap,
      COALESCE(SUM(CASE WHEN h.durum = 'iptal' THEN h.toplam_tutar ELSE 0 END), 0) as iptal_tutar,
      COALESCE(SUM(CASE WHEN h.durum = 'odendi' THEN h.indirim_tutar ELSE 0 END), 0) as indirim_tutar
    FROM hesap h
    WHERE DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
  `).get(baslangic, bitis) as any

  const maliyetOzeti = db.prepare(`
    SELECT
      COALESCE(SUM(s.cost_price), 0) as toplam_maliyet,
      COALESCE(SUM(CASE WHEN s.ikram = 1 THEN s.toplam_fiyat ELSE 0 END), 0) as ikram_tutar
    FROM siparis s
    JOIN hesap h ON h.id = s.hesap_id
    WHERE h.durum = 'odendi' AND s.durum != 'iptal'
      AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
  `).get(baslangic, bitis) as any

  const odemeOzeti = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN o.odeme_tipi = 'nakit' THEN o.tutar ELSE 0 END), 0) as nakit_toplam,
      COALESCE(SUM(CASE WHEN o.odeme_tipi = 'kredi_karti' THEN o.tutar ELSE 0 END), 0) as kart_toplam,
      COALESCE(SUM(CASE WHEN o.odeme_tipi = 'yemek_karti' THEN o.tutar ELSE 0 END), 0) as yemek_karti_toplam,
      COALESCE(SUM(CASE WHEN o.odeme_tipi IN ('acik_hesap', 'veresiye', 'cari') THEN o.tutar ELSE 0 END), 0) as acik_hesap_toplam,
      COALESCE(SUM(CASE WHEN o.odeme_tipi NOT IN ('nakit', 'kredi_karti', 'yemek_karti', 'acik_hesap', 'veresiye', 'cari') THEN o.tutar ELSE 0 END), 0) as diger_toplam
    FROM odeme o
    WHERE DATE(o.odeme_zamani, 'localtime') BETWEEN ? AND ?
  `).get(baslangic, bitis) as any

  const canli = db.prepare(`
    SELECT
      COUNT(*) as acik_hesap,
      COALESCE(SUM(h.net_tutar), 0) as acik_tutar
    FROM hesap h
    WHERE h.durum = 'acik'
  `).get() as any

  const paket = db.prepare(`
    SELECT COUNT(*) as adet
    FROM hesap
    WHERE durum = 'acik' AND hesap_tipi IN ('paket', 'gel_al')
  `).get() as any

  let rezervasyonAdet = 0
  try {
    const rezervasyon = db.prepare(`
      SELECT COUNT(*) as adet
      FROM rezervasyon
      WHERE tarih = ? AND durum NOT IN ('iptal', 'no_show')
    `).get(bugunYerel()) as any
    rezervasyonAdet = Number(rezervasyon?.adet || 0)
  } catch {
    rezervasyonAdet = 0
  }

  const toplamCiro = Number(hesapOzeti?.toplam_ciro || 0)
  const toplamMaliyet = Number(maliyetOzeti?.toplam_maliyet || 0)
  const netKar = Number((toplamCiro - toplamMaliyet).toFixed(2))
  const karMarji = toplamCiro > 0 ? Number(((netKar / toplamCiro) * 100).toFixed(1)) : 0

  return {
    tarih: `${baslangic} - ${bitis}`,
    toplam_ciro: toplamCiro,
    toplam_maliyet: toplamMaliyet,
    net_kar: netKar,
    kar_marji: karMarji,
    kapanan_hesap: Number(hesapOzeti?.kapanan_hesap || 0),
    toplam_hesap: Number(hesapOzeti?.kapanan_hesap || 0),
    ortalama_hesap: Number((hesapOzeti?.ortalama_hesap || 0).toFixed(2)),
    acik_hesap: Number(canli?.acik_hesap || 0),
    acik_tutar: Number(canli?.acik_tutar || 0),
    nakit_toplam: Number(odemeOzeti?.nakit_toplam || 0),
    kart_toplam: Number(odemeOzeti?.kart_toplam || 0),
    yemek_karti_toplam: Number(odemeOzeti?.yemek_karti_toplam || 0),
    acik_hesap_toplam: Number(odemeOzeti?.acik_hesap_toplam || 0),
    diger_toplam: Number(odemeOzeti?.diger_toplam || 0),
    iptal_tutar: Number(hesapOzeti?.iptal_tutar || 0),
    ikram_tutar: Number(maliyetOzeti?.ikram_tutar || 0),
    indirim_tutar: Number(hesapOzeti?.indirim_tutar || 0),
    paket_sayisi: Number(paket?.adet || 0),
    rezervasyon_sayisi: rezervasyonAdet,
  }
}

function saatlikGetir(db: any, baslangic: string, bitis: string) {
  if (baslangic === bitis) {
    return db.prepare(`
      SELECT CAST(strftime('%H', h.acilis_zamani, 'localtime') AS INTEGER) as saat,
             COALESCE(SUM(h.net_tutar), 0) as tutar,
             COUNT(*) as adet
      FROM hesap h
      WHERE h.durum = 'odendi' AND DATE(h.acilis_zamani, 'localtime') = ?
      GROUP BY saat ORDER BY saat
    `).all(baslangic)
  }
  return db.prepare(`
    SELECT DATE(h.acilis_zamani, 'localtime') as saat,
           COALESCE(SUM(h.net_tutar), 0) as tutar,
           COUNT(*) as adet
    FROM hesap h
    WHERE h.durum = 'odendi' AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
    GROUP BY DATE(h.acilis_zamani, 'localtime')
    ORDER BY saat
  `).all(baslangic, bitis)
}

function masalariGetir(db: any) {
  return db.prepare(`
    SELECT m.id, m.numara, m.durum, m.kapasite, m.bolum_id,
           b.ad as bolum_adi, b.sira as bolum_sira,
           h.id as hesap_id, h.hesap_no, h.toplam_tutar, h.net_tutar,
           h.indirim_tutar, h.acilis_zamani, h.kisi_sayisi, h.hesap_tipi,
           p.ad || ' ' || p.soyad as garson_adi,
           (SELECT COUNT(*) FROM siparis s WHERE s.hesap_id = h.id AND s.durum != 'iptal') as kalem_sayisi
    FROM masa m
    JOIN bolum b ON b.id = m.bolum_id
    LEFT JOIN hesap h ON h.masa_id = m.id AND h.durum = 'acik'
    LEFT JOIN personel p ON p.id = h.personel_id
    WHERE m.aktif = 1
    ORDER BY b.sira ASC, b.ad ASC, m.sira ASC, m.numara ASC
  `).all()
}

function guvenli(fn: () => any, yedek: any) {
  try { return fn() } catch { return yedek }
}

export function bossRotalariniKaydet(app: any, jwtSecret: string): void {
  const jwtBossDogrula = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ hata: 'Yetkilendirme gerekli' })
    try {
      const kullanici = jwt.verify(token, jwtSecret) as any
      if (!PATRON_ROLLER.has(String(kullanici?.rol || ''))) {
        return res.status(403).json({ hata: 'Bu panel yalnızca yönetici ve müdür içindir' })
      }
      req.kullanici = kullanici
      next()
    } catch {
      res.status(401).json({ hata: 'Geçersiz token' })
    }
  }

  app.post('/api/boss/pin-giris', (req: any, res: any) => {
    const ip = istemciIp(req)
    const kilit = pinKilitleri.get(ip)
    const simdi = Date.now()
    if (kilit && kilit.kilitBitis > simdi) {
      const sn = Math.ceil((kilit.kilitBitis - simdi) / 1000)
      return res.status(429).json({ hata: `Çok fazla deneme. ${sn} sn sonra tekrar deneyin` })
    }

    const pin_kodu = String(req.body?.pin_kodu || '').trim()
    if (!pin_kodu) return res.status(400).json({ hata: 'PIN gerekli' })

    try {
      const db = veritabaniGetir()
      const personel = db.prepare(
        'SELECT * FROM personel WHERE pin_kodu = ? AND aktif = 1'
      ).get(pin_kodu) as any

      if (!personel || !PATRON_ROLLER.has(String(personel.rol))) {
        const onceki = pinKilitleri.get(ip) || { hatali: 0, kilitBitis: 0 }
        const hatali = (onceki.kilitBitis && onceki.kilitBitis < simdi) ? 1 : onceki.hatali + 1
        const kayit: PinKilit = {
          hatali,
          kilitBitis: hatali >= PIN_MAX_HATA ? simdi + PIN_KILIT_MS : 0,
        }
        pinKilitleri.set(ip, kayit)
        if (kayit.kilitBitis) {
          return res.status(429).json({ hata: 'Çok fazla hatalı deneme. 90 saniye kilitlendi' })
        }
        return res.status(401).json({ hata: 'Geçersiz yönetici PIN kodu' })
      }

      pinKilitleri.delete(ip)
      const token = jwt.sign(
        { id: personel.id, rol: personel.rol, ad: personel.ad, soyad: personel.soyad },
        jwtSecret,
        { expiresIn: '12h' }
      )
      const { sifre_hash, ...guvenli } = personel
      res.json({ personel: guvenli, token })
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message || 'Giriş yapılamadı' })
    }
  })

  app.get('/api/boss/ben', jwtBossDogrula, (req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const ayar = db.prepare("SELECT deger FROM ayar WHERE anahtar = 'isletme_adi'").get() as any
      res.json({
        personel: req.kullanici,
        isletme_adi: ayar?.deger || 'ETİBOL POS',
        sunucu_saati: new Date().toISOString(),
        tarih: bugunYerel(),
      })
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  })

  app.get('/api/boss/ozet', jwtBossDogrula, (req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const { baslangic, bitis } = tarihAralik(req)
      const ozet = finansalOzet(db, baslangic, bitis)
      const saatlik = saatlikGetir(db, baslangic, bitis)
      res.json({ ozet, saatlik, tarih: ozet.tarih, baslangic, bitis })
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  })

  app.get('/api/boss/masalar', jwtBossDogrula, (_req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const masalar = masalariGetir(db)
      res.json(masalar)
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  })

  app.get('/api/boss/masa/:id', jwtBossDogrula, (req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const masaId = req.params.id
      const masa = db.prepare(`
        SELECT m.*, b.ad as bolum_adi
        FROM masa m
        JOIN bolum b ON b.id = m.bolum_id
        WHERE m.id = ?
      `).get(masaId) as any

      const hesap = db.prepare(
        "SELECT * FROM hesap WHERE masa_id = ? AND durum = 'acik'"
      ).get(masaId) as any

      if (!hesap) {
        return res.json({ masa, hesap: null, siparisler: [], odemeler: [] })
      }

      const siparisler = db.prepare(`
        SELECT s.id, s.urun_id, s.miktar, s.birim_fiyat, s.toplam_fiyat, s.notlar,
               s.durum, s.ikram, s.porsiyon, s.siparis_zamani,
               u.ad as urun_adi,
               p.ad || ' ' || p.soyad as personel_adi
        FROM siparis s
        JOIN urun u ON u.id = s.urun_id
        LEFT JOIN personel p ON p.id = s.personel_id
        WHERE s.hesap_id = ? AND s.durum != 'iptal'
        ORDER BY s.siparis_zamani ASC
      `).all(hesap.id)

      const odemeler = db.prepare(`
        SELECT odeme_tipi, tutar, odeme_zamani
        FROM odeme WHERE hesap_id = ?
        ORDER BY odeme_zamani ASC
      `).all(hesap.id)

      res.json({ masa, hesap, siparisler, odemeler })
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  })

  const kategoriRapor = (req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const { baslangic, bitis } = tarihAralik(req)
      const rapor = db.prepare(`
        SELECT k.id as kategori_id, k.ad as kategori,
               k.ad as kategori_adi,
               COALESCE(SUM(s.toplam_fiyat), 0) as tutar,
               COALESCE(SUM(s.miktar), 0) as adet,
               COALESCE(SUM(s.cost_price), 0) as toplam_maliyet,
               COALESCE(SUM(s.toplam_fiyat) - SUM(s.cost_price), 0) as net_kar
        FROM kategori k
        LEFT JOIN urun u ON u.kategori_id = k.id
        LEFT JOIN siparis s ON s.urun_id = u.id AND s.durum != 'iptal'
        LEFT JOIN hesap h ON h.id = s.hesap_id AND h.durum != 'iptal'
          AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
        WHERE k.aktif = 1
        GROUP BY k.id
        ORDER BY tutar DESC
      `).all(baslangic, bitis)
      res.json(rapor)
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  }

  app.get('/api/boss/kategori-rapor', jwtBossDogrula, kategoriRapor)
  app.get('/api/boss/rapor/kategori', jwtBossDogrula, kategoriRapor)

  app.get('/api/boss/rapor/urun', jwtBossDogrula, (req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const { baslangic, bitis } = tarihAralik(req)
      const rapor = db.prepare(`
        SELECT
          u.id as urun_id,
          u.ad as urun_adi,
          k.ad as kategori_adi,
          COALESCE(SUM(s.miktar), 0) as satis_adedi,
          COALESCE(SUM(s.toplam_fiyat), 0) as toplam_ciro,
          COALESCE(SUM(s.cost_price), 0) as toplam_maliyet,
          COALESCE(SUM(s.toplam_fiyat) - SUM(s.cost_price), 0) as net_kar,
          CASE
            WHEN SUM(s.toplam_fiyat) > 0
            THEN ROUND(((SUM(s.toplam_fiyat) - SUM(s.cost_price)) / SUM(s.toplam_fiyat)) * 100, 1)
            ELSE 0
          END as kar_marji,
          COALESCE(AVG(s.birim_fiyat), 0) as ortalama_fiyat
        FROM urun u
        JOIN kategori k ON k.id = u.kategori_id
        JOIN siparis s ON s.urun_id = u.id AND s.durum != 'iptal'
        JOIN hesap h ON h.id = s.hesap_id AND h.durum != 'iptal'
          AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
        WHERE u.aktif = 1
        GROUP BY u.id
        ORDER BY toplam_ciro DESC
      `).all(baslangic, bitis)
      res.json(rapor)
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  })

  app.get('/api/boss/rapor/personel', jwtBossDogrula, (req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const { baslangic, bitis } = tarihAralik(req)
      const rapor = db.prepare(`
        SELECT
          p.id as personel_id,
          p.ad || ' ' || p.soyad as personel_adi,
          p.rol,
          COUNT(DISTINCT h.id) as hesap_sayisi,
          COALESCE(SUM(h.net_tutar), 0) as toplam_satis,
          COALESCE(AVG(h.net_tutar), 0) as ortalama_hesap,
          COALESCE((
            SELECT COUNT(*) FROM siparis s
            WHERE s.personel_id = p.id AND s.durum = 'iptal'
              AND DATE(s.siparis_zamani, 'localtime') BETWEEN ? AND ?
          ), 0) as iptal_sayisi,
          COALESCE((
            SELECT SUM(s.toplam_fiyat) FROM siparis s
            WHERE s.personel_id = p.id AND s.ikram = 1
              AND DATE(s.siparis_zamani, 'localtime') BETWEEN ? AND ?
          ), 0) as ikram_tutari
        FROM personel p
        LEFT JOIN hesap h ON h.personel_id = p.id AND h.durum = 'odendi'
          AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
        WHERE p.aktif = 1
        GROUP BY p.id
        ORDER BY toplam_satis DESC
      `).all(baslangic, bitis, baslangic, bitis, baslangic, bitis)
      res.json(rapor)
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  })

  app.get('/api/boss/rapor/odeme', jwtBossDogrula, (req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const { baslangic, bitis } = tarihAralik(req)
      const sonuclar = db.prepare(`
        SELECT
          o.odeme_tipi,
          COUNT(*) as islem_sayisi,
          COALESCE(SUM(o.tutar), 0) as toplam_tutar
        FROM odeme o
        WHERE DATE(o.odeme_zamani, 'localtime') BETWEEN ? AND ?
        GROUP BY o.odeme_tipi
        ORDER BY toplam_tutar DESC
      `).all(baslangic, bitis) as any[]

      const genelToplam = sonuclar.reduce((acc, curr) => acc + Number(curr.toplam_tutar || 0), 0)
      res.json(sonuclar.map((item) => ({
        ...item,
        oran: genelToplam > 0 ? Number(((item.toplam_tutar / genelToplam) * 100).toFixed(1)) : 0,
      })))
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  })

  app.get('/api/boss/rapor/saatlik', jwtBossDogrula, (req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const { baslangic, bitis } = tarihAralik(req)
      if (baslangic === bitis) {
        const satirlar = db.prepare(`
          SELECT
            CAST(strftime('%H', h.acilis_zamani, 'localtime') AS INTEGER) || ':00' as zaman_etiketi,
            COUNT(DISTINCT h.id) as hesap_sayisi,
            COALESCE(SUM(h.net_tutar), 0) as toplam_tutar
          FROM hesap h
          WHERE h.durum = 'odendi' AND DATE(h.acilis_zamani, 'localtime') = ?
          GROUP BY CAST(strftime('%H', h.acilis_zamani, 'localtime') AS INTEGER)
          ORDER BY CAST(strftime('%H', h.acilis_zamani, 'localtime') AS INTEGER)
        `).all(baslangic)
        return res.json(satirlar)
      }
      const satirlar = db.prepare(`
        SELECT
          DATE(h.acilis_zamani, 'localtime') as zaman_etiketi,
          COUNT(DISTINCT h.id) as hesap_sayisi,
          COALESCE(SUM(h.net_tutar), 0) as toplam_tutar
        FROM hesap h
        WHERE h.durum = 'odendi' AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
        GROUP BY DATE(h.acilis_zamani, 'localtime')
        ORDER BY DATE(h.acilis_zamani, 'localtime')
      `).all(baslangic, bitis)
      res.json(satirlar)
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  })

  app.get('/api/boss/kasa', jwtBossDogrula, (_req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const v = db.prepare(
        "SELECT * FROM kasa_vardiya WHERE durum = 'acik' ORDER BY id DESC LIMIT 1"
      ).get() as any
      if (!v) return res.json({ acik: false, vardiya: null })
      res.json({ acik: true, vardiya: vardiyaOzet(db, v) })
    } catch (hata: any) {
      if (String(hata.message || '').includes('no such table')) {
        return res.json({ acik: false, vardiya: null })
      }
      res.status(500).json({ hata: hata.message })
    }
  })

  app.get('/api/boss/kasa/gecmis', jwtBossDogrula, (req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const limit = Math.min(30, Math.max(1, Number(req.query?.limit || 10)))
      const liste = db.prepare(`
        SELECT v.*,
          pa.ad || ' ' || pa.soyad as acan_adi,
          pk.ad || ' ' || pk.soyad as kapatan_adi
        FROM kasa_vardiya v
        LEFT JOIN personel pa ON pa.id = v.acan_personel_id
        LEFT JOIN personel pk ON pk.id = v.kapatan_personel_id
        ORDER BY v.id DESC
        LIMIT ?
      `).all(limit)
      res.json(liste)
    } catch (hata: any) {
      if (String(hata.message || '').includes('no such table')) return res.json([])
      res.status(500).json({ hata: hata.message })
    }
  })

  app.get('/api/boss/stok', jwtBossDogrula, (_req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const liste = db.prepare(`
        SELECT
          h.id as hammadde_id,
          h.ad as hammadde_adi,
          h.birim,
          ROUND(h.mevcut_stok, 4) as mevcut_stok,
          ROUND(h.min_stok, 4) as min_stok,
          h.maliyet_birim,
          h.tedarikci,
          ROUND(h.mevcut_stok * h.maliyet_birim, 2) as toplam_deger,
          ROUND(MAX(0, h.min_stok - h.mevcut_stok), 4) as eksik_miktar,
          CASE
            WHEN h.mevcut_stok <= 0 THEN 'tukendi'
            WHEN h.mevcut_stok <= h.min_stok * 0.5 THEN 'kritik'
            WHEN h.mevcut_stok <= h.min_stok THEN 'dusuk'
            ELSE 'normal'
          END as stok_durumu
        FROM hammadde h
        WHERE h.aktif = 1
        ORDER BY
          CASE
            WHEN h.mevcut_stok <= 0 THEN 1
            WHEN h.mevcut_stok <= h.min_stok * 0.5 THEN 2
            WHEN h.mevcut_stok <= h.min_stok THEN 3
            ELSE 4
          END,
          h.ad ASC
      `).all()
      res.json(liste)
    } catch (hata: any) {
      if (String(hata.message || '').includes('no such table')) return res.json([])
      res.status(500).json({ hata: hata.message })
    }
  })

  app.get('/api/boss/paket', jwtBossDogrula, (req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const durum = String(req.query?.durum || 'acik')
      const kosul: string[] = ["h.hesap_tipi IN ('paket', 'gel_al', 'bar')"]
      const deger: any[] = []
      if (durum === 'acik' || !durum) {
        kosul.push("h.durum = 'acik'")
      } else if (durum === 'kapali') {
        kosul.push("h.durum != 'acik'")
      }
      const liste = db.prepare(`
        SELECT h.id, h.hesap_no, h.hesap_tipi, h.durum, h.net_tutar, h.toplam_tutar,
               h.acilis_zamani, h.teslimat_durumu, h.teslimat_telefon, h.teslimat_adres,
               h.teslimat_musteri, h.kurye, h.notlar,
               p.ad || ' ' || p.soyad as personel_adi,
               (SELECT COUNT(*) FROM siparis s WHERE s.hesap_id = h.id AND s.durum != 'iptal') as siparis_sayisi
        FROM hesap h
        LEFT JOIN personel p ON p.id = h.personel_id
        WHERE ${kosul.join(' AND ')}
        ORDER BY h.acilis_zamani DESC
        LIMIT 100
      `).all(...deger)
      res.json(liste)
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  })

  app.get('/api/boss/rezervasyonlar', jwtBossDogrula, (req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const tarih = typeof req.query?.tarih === 'string' && req.query.tarih
        ? req.query.tarih
        : bugunYerel()
      const liste = db.prepare(`
        SELECT r.*, m.numara as masa_numara, b.ad as bolum_adi,
               p.ad || ' ' || p.soyad as personel_adi
        FROM rezervasyon r
        LEFT JOIN masa m ON m.id = r.masa_id
        LEFT JOIN bolum b ON b.id = m.bolum_id
        LEFT JOIN personel p ON p.id = r.personel_id
        WHERE r.tarih = ?
        ORDER BY r.saat ASC, r.id ASC
      `).all(tarih)
      res.json({ tarih, liste })
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  })

  app.get('/api/boss/denetim', jwtBossDogrula, (req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const kosul: string[] = []
      const deger: any[] = []
      if (req.query?.islem && req.query.islem !== 'tumu') {
        kosul.push('islem = ?')
        deger.push(String(req.query.islem))
      }
      if (req.query?.arama) {
        kosul.push('(ozet LIKE ? OR personel_adi LIKE ? OR islem LIKE ?)')
        const q = `%${String(req.query.arama)}%`
        deger.push(q, q, q)
      }
      const where = kosul.length ? `WHERE ${kosul.join(' AND ')}` : ''
      const limit = Math.min(200, Number(req.query?.limit || 80))
      const liste = db.prepare(`
        SELECT * FROM denetim_log
        ${where}
        ORDER BY id DESC
        LIMIT ?
      `).all(...deger, limit)
      res.json(liste)
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  })

  app.get('/api/boss/panel', jwtBossDogrula, (req: any, res: any) => {
    try {
      const db = veritabaniGetir()
      const { baslangic, bitis } = tarihAralik(req)
      const ozet = finansalOzet(db, baslangic, bitis)
      const saatlik = guvenli(() => saatlikGetir(db, baslangic, bitis), [])
      const masalar = guvenli(() => masalariGetir(db), [])

      const kategoriler = guvenli(() => db.prepare(`
        SELECT k.id as kategori_id, k.ad as kategori_adi,
               COALESCE(SUM(s.toplam_fiyat), 0) as tutar,
               COALESCE(SUM(s.miktar), 0) as adet,
               COALESCE(SUM(s.toplam_fiyat) - SUM(s.cost_price), 0) as net_kar
        FROM kategori k
        LEFT JOIN urun u ON u.kategori_id = k.id
        LEFT JOIN siparis s ON s.urun_id = u.id AND s.durum != 'iptal'
        LEFT JOIN hesap h ON h.id = s.hesap_id AND h.durum != 'iptal'
          AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
        WHERE k.aktif = 1
        GROUP BY k.id
        HAVING tutar > 0
        ORDER BY tutar DESC
      `).all(baslangic, bitis), [])

      const urunler = guvenli(() => db.prepare(`
        SELECT u.ad as urun_adi, k.ad as kategori_adi,
               COALESCE(SUM(s.miktar), 0) as satis_adedi,
               COALESCE(SUM(s.toplam_fiyat), 0) as toplam_ciro,
               COALESCE(SUM(s.toplam_fiyat) - SUM(s.cost_price), 0) as net_kar
        FROM urun u
        JOIN kategori k ON k.id = u.kategori_id
        JOIN siparis s ON s.urun_id = u.id AND s.durum != 'iptal'
        JOIN hesap h ON h.id = s.hesap_id AND h.durum != 'iptal'
          AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
        WHERE u.aktif = 1
        GROUP BY u.id
        ORDER BY toplam_ciro DESC
        LIMIT 12
      `).all(baslangic, bitis), [])

      const personel = guvenli(() => db.prepare(`
        SELECT p.ad || ' ' || p.soyad as personel_adi, p.rol,
               COUNT(DISTINCT h.id) as hesap_sayisi,
               COALESCE(SUM(h.net_tutar), 0) as toplam_satis
        FROM personel p
        LEFT JOIN hesap h ON h.personel_id = p.id AND h.durum = 'odendi'
          AND DATE(h.acilis_zamani, 'localtime') BETWEEN ? AND ?
        WHERE p.aktif = 1
        GROUP BY p.id
        ORDER BY toplam_satis DESC
      `).all(baslangic, bitis), [])

      const odeme = guvenli(() => {
        const sonuclar = db.prepare(`
          SELECT o.odeme_tipi, COUNT(*) as islem_sayisi, COALESCE(SUM(o.tutar), 0) as toplam_tutar
          FROM odeme o
          WHERE DATE(o.odeme_zamani, 'localtime') BETWEEN ? AND ?
          GROUP BY o.odeme_tipi
          ORDER BY toplam_tutar DESC
        `).all(baslangic, bitis) as any[]
        const genel = sonuclar.reduce((a, c) => a + Number(c.toplam_tutar || 0), 0)
        return sonuclar.map((item) => ({
          ...item,
          oran: genel > 0 ? Number(((item.toplam_tutar / genel) * 100).toFixed(1)) : 0,
        }))
      }, [])

      const kasa = guvenli(() => {
        const v = db.prepare("SELECT * FROM kasa_vardiya WHERE durum = 'acik' ORDER BY id DESC LIMIT 1").get() as any
        if (!v) return { acik: false, vardiya: null }
        return { acik: true, vardiya: vardiyaOzet(db, v) }
      }, { acik: false, vardiya: null })

      const stokUyari = guvenli(() => db.prepare(`
        SELECT h.ad as hammadde_adi, h.birim, ROUND(h.mevcut_stok, 4) as mevcut_stok,
               ROUND(h.min_stok, 4) as min_stok,
               CASE
                 WHEN h.mevcut_stok <= 0 THEN 'tukendi'
                 WHEN h.mevcut_stok <= h.min_stok * 0.5 THEN 'kritik'
                 WHEN h.mevcut_stok <= h.min_stok THEN 'dusuk'
                 ELSE 'normal'
               END as stok_durumu
        FROM hammadde h
        WHERE h.aktif = 1
        ORDER BY
          CASE
            WHEN h.mevcut_stok <= 0 THEN 1
            WHEN h.mevcut_stok <= h.min_stok * 0.5 THEN 2
            WHEN h.mevcut_stok <= h.min_stok THEN 3
            ELSE 4
          END, h.ad
      `).all().filter((s: any) => s.stok_durumu !== 'normal').slice(0, 8), [])

      const paket = guvenli(() => db.prepare(`
        SELECT h.id, h.hesap_no, h.hesap_tipi, h.net_tutar, h.acilis_zamani,
               h.teslimat_durumu, h.teslimat_musteri, h.teslimat_telefon
        FROM hesap h
        WHERE h.durum = 'acik' AND h.hesap_tipi IN ('paket', 'gel_al', 'bar')
        ORDER BY h.acilis_zamani DESC
        LIMIT 12
      `).all(), [])

      const rezervasyon = guvenli(() => db.prepare(`
        SELECT r.musteri_ad, r.saat, r.kisi_sayisi, r.durum, r.telefon,
               m.numara as masa_numara
        FROM rezervasyon r
        LEFT JOIN masa m ON m.id = r.masa_id
        WHERE r.tarih = ?
        ORDER BY r.saat ASC
        LIMIT 12
      `).all(bugunYerel()), [])

      const denetim = guvenli(() => db.prepare(`
        SELECT islem, ozet, personel_adi, zaman
        FROM denetim_log
        ORDER BY id DESC
        LIMIT 10
      `).all(), [])

      res.json({
        ozet, saatlik, masalar, kategoriler, urunler, personel, odeme,
        kasa, stokUyari, paket, rezervasyon, denetim,
        baslangic, bitis, cekildi: new Date().toISOString(),
      })
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  })
}
