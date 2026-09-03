import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { networkInterfaces } from 'os'
import { veritabaniGetir } from '../database/connection'
import { BrowserWindow, app as electronApp } from 'electron'
import { garsonMobilHTML } from './garson-mobile'
import { qrMenuHTML } from './qrmenu-mobile'
import { bossMobilHTML } from './boss-mobile'
import path from 'path'
import fs from 'fs'
import multer from 'multer'
import { siparisStokDusVeMaliyetHesapla, siparisStokGeriYukle } from '../services/stock-recipe.service'
import { varsayilanYerelIpGetir } from '../services/network.service'


const JWT_SECRET = 'restoelektro-gizli-anahtar-2024'

let sunucu: any = null
let io: Server | null = null

const yuklemeHataYaniti = (res: any, status: number, message: string) =>
  res.status(status).json({ success: false, message, basarili: false, hata: message })

/**
 * Ürün görselleri için yükleme dizinini döndürür ve yoksa oluşturur
 */
export function uploadsDizininiGetir(): string {
  const isDev = !electronApp.isPackaged
  const base = isDev ? process.cwd() : electronApp.getPath('userData')
  const productsDir = path.join(base, 'public', 'uploads', 'products')
  if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true })
  }
  return productsDir
}

/**
 * Geliştirme (dev), derleme (build/out/dist) ve paketli (production/resources) ortamlardaki
 * tüm olası uploads dizinlerini tespit edip var olanları döndürür.
 */
export function statikUploadsDizinleriniGetir(): string[] {
  const adaylar: string[] = []

  // 1. Kullanıcı Veri Dizini (userData) — Hem yüklenenler hem senkronize edilen görseller
  try {
    const userData = electronApp.getPath('userData')
    adaylar.push(path.join(userData, 'public', 'uploads'))
    adaylar.push(path.join(userData, 'uploads'))
  } catch {}

  // 2. Paketlenmiş Electron Uygulama Kaynakları (process.resourcesPath / extraResources)
  if (process.resourcesPath) {
    adaylar.push(path.join(process.resourcesPath, 'uploads'))
    adaylar.push(path.join(process.resourcesPath, 'public', 'uploads'))
    adaylar.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'public', 'uploads'))
    adaylar.push(path.join(process.resourcesPath, 'app.asar.unpacked', 'uploads'))
  }

  // 3. Modül Derleme Dizini (__dirname tabanlı / out/main & out/renderer)
  adaylar.push(path.join(__dirname, '..', 'renderer', 'uploads'))
  adaylar.push(path.join(__dirname, '..', 'renderer', 'public', 'uploads'))
  adaylar.push(path.join(__dirname, 'uploads'))
  adaylar.push(path.join(__dirname, '..', '..', 'public', 'uploads'))
  adaylar.push(path.join(__dirname, '..', '..', 'uploads'))

  // 4. Çalışma Dizini (process.cwd() — dev, dist veya portable)
  const cwd = process.cwd()
  adaylar.push(path.join(cwd, 'public', 'uploads'))
  adaylar.push(path.join(cwd, 'uploads'))
  adaylar.push(path.join(cwd, 'dist', 'uploads'))
  adaylar.push(path.join(cwd, 'out', 'uploads'))
  adaylar.push(path.join(cwd, 'out', 'renderer', 'uploads'))

  // 5. Electron getAppPath
  try {
    const appPath = electronApp.getAppPath()
    adaylar.push(path.join(appPath, 'public', 'uploads'))
    adaylar.push(path.join(appPath, 'uploads'))
    adaylar.push(path.join(appPath, 'out', 'renderer', 'uploads'))
  } catch {}

  // Sadece fiziksel olarak mevcut olan benzersiz dizinleri döndür
  const mevcutDizinler: string[] = []
  for (const d of adaylar) {
    try {
      if (fs.existsSync(d) && !mevcutDizinler.includes(d)) {
        mevcutDizinler.push(d)
      }
    } catch {}
  }

  return mevcutDizinler
}

/**
 * Paket içi / build / resources klasörlerinde yer alan varsayılan ürün görsellerini
 * userData içindeki hedef upload dizinine kopyalayarak senkronize eder.
 */
export function varsayilanGorselleriSenkronizeEt(): void {
  try {
    const hedefProducts = uploadsDizininiGetir()
    const tumUploads = statikUploadsDizinleriniGetir()
    const kaynakDizinler = tumUploads
      .map(d => path.join(d, 'products'))
      .filter(d => d !== hedefProducts && fs.existsSync(d))

    for (const kaynak of kaynakDizinler) {
      try {
        const dosyalar = fs.readdirSync(kaynak)
        for (const dosya of dosyalar) {
          const kaynakDosya = path.join(kaynak, dosya)
          const hedefDosya = path.join(hedefProducts, dosya)
          if (!fs.existsSync(hedefDosya) && fs.existsSync(kaynakDosya)) {
            try {
              fs.copyFileSync(kaynakDosya, hedefDosya)
            } catch {}
          }
        }
      } catch {}
    }
  } catch (err) {
    console.warn('[Server] Varsayılan görsel senkronizasyon uyarısı:', err)
  }
}

// Multer Disk Depolama Yapılandırması
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      cb(null, uploadsDizininiGetir())
    } catch (err) {
      cb(err instanceof Error ? err : new Error('Yükleme dizini oluşturulamadı'), '')
    }
  },
  filename: (_req, file, cb) => {
    try {
      const ext = (path.extname(file.originalname) || '.jpg').toLowerCase()
      const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'].includes(ext) ? ext : '.jpg'
      const uniqueSuffix = `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`
      cb(null, uniqueSuffix)
    } catch (err) {
      cb(err instanceof Error ? err : new Error('Dosya adı oluşturulamadı'), '')
    }
  }
})

const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },

  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'image/jpg']
    if (allowedMimes.includes(file.mimetype.toLowerCase()) || file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Yalnızca geçerli bir görsel dosyası (JPG, PNG, WEBP, GIF, SVG) yükleyebilirsiniz.'))
    }
  }
})

/**
 * API sunucusunu başlatır
 */
export async function apiSunucusunuBaslat(port: number = 3847): Promise<void> {
  const app = express()
  const httpServer = createServer(app)
  io = new Server(httpServer, { cors: { origin: '*' } })

  app.use(cors())
  app.use(express.json({ limit: '20mb' }))
  app.use(express.urlencoded({ extended: true, limit: '20mb' }))

  // ===== STATİK DOSYA SUNUCUSU & GÖRSEL RESOLVER =====
  // 1. Varsayılan görselleri userData dizinine senkronize et
  varsayilanGorselleriSenkronizeEt()

  const uploadsProductDir = uploadsDizininiGetir()
  const uploadRoot = path.dirname(uploadsProductDir) // .../public/uploads veya .../uploads
  const tumUploadsDizinleri = statikUploadsDizinleriniGetir()

  // 2. express.static ile tüm tespit edilen aday dizinleri sırayla sun
  app.use('/uploads', express.static(uploadRoot))
  app.use('/public/uploads', express.static(uploadRoot))

  for (const d of tumUploadsDizinleri) {
    app.use('/uploads', express.static(d))
    app.use('/public/uploads', express.static(d))
    // Eğer dizin public klasörüyse kökten de sun
    if (path.basename(d) === 'uploads') {
      const publicUstDizin = path.dirname(d)
      app.use(express.static(publicUstDizin))
    }
  }

  // 3. Fallback Resolver (404 önleyici): express.static bulamazsa tüm dizinlerde derin arama yap
  app.get(['/uploads/*', '/public/uploads/*'], (req, res, next) => {
    const safUrl = decodeURIComponent(req.path.replace(/^\/(public\/)?uploads\//, ''))
    if (!safUrl) return next()

    const dosyaAdi = path.basename(safUrl)

    // A) Aktif products dizininde kontrol et
    const hedefAktif = path.join(uploadsProductDir, dosyaAdi)
    if (fs.existsSync(hedefAktif)) {
      return res.sendFile(hedefAktif)
    }

    // B) Bilinen tüm uploads dizinlerinde ara
    for (const d of tumUploadsDizinleri) {
      const tamYol = path.join(d, safUrl)
      if (fs.existsSync(tamYol)) {
        return res.sendFile(tamYol)
      }
      const productsYolu = path.join(d, 'products', dosyaAdi)
      if (fs.existsSync(productsYolu)) {
        return res.sendFile(productsYolu)
      }
    }

    next()
  })


  // ===== DOSYA YÜKLEME ENDPOINT'İ =====
  app.post('/api/upload', (req, res) => {
    uploadMiddleware.single('image')(req, res, async (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return yuklemeHataYaniti(res, 400, 'Görsel boyutu en fazla 10MB olabilir')
          }
          return yuklemeHataYaniti(res, 400, `Yükleme hatası: ${err.message}`)
        }
        return yuklemeHataYaniti(res, 400, err.message || 'Dosya yüklenemedi')
      }

      // Multipart dosya yüklendiyse
      if (req.file) {
        const resimYolu = `/uploads/products/${req.file.filename}`
        return res.json({
          basarili: true,
          resim_yolu: resimYolu,
          url: resimYolu,
          dosya_adi: req.file.filename,
          boyut: req.file.size
        })
      }

      // Base64 JSON formatında gönderildiyse
      if (req.body && req.body.image && typeof req.body.image === 'string') {
        try {
          const raw = req.body.image
          let ext = '.jpg'
          let base64Data = raw

          if (raw.startsWith('data:image/')) {
            const match = raw.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/)
            if (match) {
              ext = '.' + (match[1] === 'jpeg' ? 'jpg' : match[1])
              base64Data = match[2]
            }
          }

          const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'].includes(ext.toLowerCase()) ? ext.toLowerCase() : '.jpg'
          const filename = `product-${Date.now()}-${Math.round(Math.random() * 1e6)}${safeExt}`
          const uploadPath = path.join(uploadsProductDir, filename)
          const buffer = Buffer.from(base64Data, 'base64')

          if (!buffer.length) throw new Error('Görsel verisi boş')
          await fs.promises.writeFile(uploadPath, buffer)

          const resimYolu = `/uploads/products/${filename}`
          return res.json({
            basarili: true,
            resim_yolu: resimYolu,
            url: resimYolu,
            dosya_adi: filename,
            boyut: buffer.length
          })
        } catch (base64Err: any) {
          return yuklemeHataYaniti(res, 500, `Base64 kaydetme hatası: ${base64Err.message}`)
        }
      }

      return yuklemeHataYaniti(res, 400, 'Yüklenecek görsel dosyası bulunamadı')
    })
  })

  // URL'den görsel alma: dış bağlantı kalıcı olarak kullanılmaz; kırpma sonrası
  // istemcinin gönderdiği JPEG, yukarıdaki /api/upload ile yerel uploads dizinine kaydedilir.
  app.post('/api/upload/from-url', async (req, res) => {
    const kaynakUrl = typeof req.body?.url === 'string' ? req.body.url.trim() : ''
    let url: URL
    try {
      url = new URL(kaynakUrl)
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Geçersiz protokol')
      if (['localhost', '127.0.0.1', '::1'].includes(url.hostname.toLowerCase())) throw new Error('Yerel adreslere izin verilmiyor')
    } catch {
      return res.status(400).json({ basarili: false, hata: 'Geçerli bir HTTP(S) görsel bağlantısı girin' })
    }

    const controller = new AbortController()
    const zamanAsimi = setTimeout(() => controller.abort(), 5_000)
    try {
      const cevap = await fetch(url.toString(), { signal: controller.signal, redirect: 'follow' })
      if (!cevap.ok) return res.status(400).json({ basarili: false, hata: `Görsel indirilemedi (HTTP ${cevap.status})` })

      const contentType = (cevap.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
      const izinliTurler = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
      if (!izinliTurler.includes(contentType)) {
        return res.status(400).json({ basarili: false, hata: 'Bağlantı geçerli bir görsel dosyası döndürmüyor' })
      }

      const contentLength = Number(cevap.headers.get('content-length') || 0)
      if (contentLength > 10 * 1024 * 1024) {
        return res.status(400).json({ basarili: false, hata: 'Görsel boyutu en fazla 10MB olabilir' })
      }

      const buffer = Buffer.from(await cevap.arrayBuffer())
      if (!buffer.length || buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ basarili: false, hata: 'Görsel boyutu en fazla 10MB olabilir' })
      }

      return res.json({
        basarili: true,
        image: `data:${contentType};base64,${buffer.toString('base64')}`,
        boyut: buffer.length
      })
    } catch (err: any) {
      const hata = err?.name === 'AbortError' ? 'Görsel indirme zaman aşımına uğradı' : 'Görsel bağlantısından indirilemedi'
      return res.status(400).json({ basarili: false, hata })
    } finally {
      clearTimeout(zamanAsimi)
    }
  })

  // JWT doğrulama middleware
  const jwtDogrula = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ hata: 'Yetkilendirme gerekli' })
    try {
      req.kullanici = jwt.verify(token, JWT_SECRET)
      next()
    } catch {
      res.status(401).json({ hata: 'Geçersiz token' })
    }
  }

  // Favicon (Resources klasöründeki icon.ico)
  app.get('/favicon.ico', (_req, res) => {
    const isDev = !electronApp.isPackaged
    const rsPath = isDev ? path.join(process.cwd(), 'resources') : process.resourcesPath
    res.sendFile(path.join(rsPath, 'icon.ico'))
  })

  // ===== MOBİL GARSON ARAYÜZÜ =====
  // Telefondan http://<bilgisayar-ip>:3847/garson adresine gidince açılır
  app.get('/garson', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(garsonMobilHTML())
  })

  // ===== PATRON (BOSS) MOBİL ARAYÜZÜ =====
  // Telefondan http://<bilgisayar-ip>:3847/boss veya /patron adresine gidince açılır
  app.get(['/boss', '/patron'], (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(bossMobilHTML())
  })

  // ===== QR MENÜ ARAYÜZÜ =====
  // Müşteriler http://<bilgisayar-ip>:3847/qrmenu veya /menu adresine gidince açılır
  app.get(['/qrmenu', '/menu'], (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(qrMenuHTML())
  })

  // PIN ile giriş (mobil garsonlar için)
  app.post('/api/garson/pin-giris', (req, res) => {
    const db = veritabaniGetir()
    const { pin_kodu } = req.body
    const personel = db.prepare('SELECT * FROM personel WHERE pin_kodu = ? AND aktif = 1').get(pin_kodu) as any
    if (!personel) return res.status(401).json({ hata: 'Geçersiz PIN kodu' })

    const token = jwt.sign({ id: personel.id, rol: personel.rol }, JWT_SECRET, { expiresIn: '12h' })
    const { sifre_hash, ...guvenli } = personel
    res.json({ personel: guvenli, token })
  })

  // Giriş endpoint'i (mobil uygulamalar için)
  app.post('/api/giris', (req, res) => {
    const db = veritabaniGetir()
    const { kullanici_adi, sifre } = req.body
    const personel = db.prepare('SELECT * FROM personel WHERE kullanici_adi = ? AND aktif = 1').get(kullanici_adi) as any
    if (!personel) return res.status(401).json({ hata: 'Kullanıcı bulunamadı' })

    // Basit şifre kontrolü (üretimde bcrypt kullanılmalı)
    const bcryptjs = require('bcryptjs')
    if (!bcryptjs.compareSync(sifre, personel.sifre_hash)) {
      return res.status(401).json({ hata: 'Hatalı şifre' })
    }

    const token = jwt.sign({ id: personel.id, rol: personel.rol }, JWT_SECRET, { expiresIn: '12h' })
    const { sifre_hash, ...guvenli } = personel
    res.json({ personel: guvenli, token })
  })

  // ===== BOSS MODÜLÜ =====

  // Anlık satış özeti
  app.get('/api/boss/ozet', jwtDogrula, (req, res) => {
    const db = veritabaniGetir()
    const bugun = new Date().toISOString().slice(0, 10)

    const ozet = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN durum = 'odendi' THEN net_tutar ELSE 0 END), 0) as toplam_ciro,
        COUNT(CASE WHEN durum = 'odendi' THEN 1 END) as kapanan_hesap,
        COUNT(CASE WHEN durum = 'acik' THEN 1 END) as acik_hesap,
        COALESCE(AVG(CASE WHEN durum = 'odendi' THEN net_tutar END), 0) as ortalama_hesap
      FROM hesap WHERE DATE(acilis_zamani) = ?
    `).get(bugun) as any

    const saatlik = db.prepare(`
      SELECT CAST(strftime('%H', acilis_zamani) AS INTEGER) as saat,
             COALESCE(SUM(net_tutar), 0) as tutar
      FROM hesap WHERE durum = 'odendi' AND DATE(acilis_zamani) = ?
      GROUP BY saat ORDER BY saat
    `).all(bugun)

    res.json({ ozet, saatlik, tarih: bugun })
  })

  // Canlı masalar
  app.get('/api/boss/masalar', jwtDogrula, (req, res) => {
    const db = veritabaniGetir()
    const masalar = db.prepare(`
      SELECT m.*, b.ad as bolum_adi, h.toplam_tutar, h.acilis_zamani,
             p.ad || ' ' || p.soyad as garson_adi
      FROM masa m
      JOIN bolum b ON b.id = m.bolum_id
      LEFT JOIN hesap h ON h.masa_id = m.id AND h.durum = 'acik'
      LEFT JOIN personel p ON p.id = h.personel_id
      WHERE m.aktif = 1
    `).all()
    res.json(masalar)
  })

  // Kategori satış raporu
  app.get('/api/boss/kategori-rapor', jwtDogrula, (req, res) => {
    const db = veritabaniGetir()
    const bugun = new Date().toISOString().slice(0, 10)
    const rapor = db.prepare(`
      SELECT k.ad as kategori, SUM(s.toplam_fiyat) as tutar, SUM(s.miktar) as adet
      FROM siparis s
      JOIN urun u ON u.id = s.urun_id
      JOIN kategori k ON k.id = u.kategori_id
      JOIN hesap h ON h.id = s.hesap_id
      WHERE s.durum != 'iptal' AND DATE(h.acilis_zamani) = ?
      GROUP BY k.id ORDER BY tutar DESC
    `).all(bugun)
    res.json(rapor)
  })

  // ===== GARSON MODÜLÜ =====

  // Masaları getir
  app.get('/api/garson/masalar', jwtDogrula, (req, res) => {
    const db = veritabaniGetir()
    const masalar = db.prepare(`
      SELECT m.id, m.numara, m.durum, b.ad as bolum_adi,
             h.id as hesap_id, h.toplam_tutar
      FROM masa m
      JOIN bolum b ON b.id = m.bolum_id
      LEFT JOIN hesap h ON h.masa_id = m.id AND h.durum = 'acik'
      WHERE m.aktif = 1
      ORDER BY b.sira ASC, b.ad ASC, m.sira ASC, m.numara ASC
    `).all()
    res.json(masalar)
  })

  // Masa aktif hesap ve sipariş detaylarını getir
  app.get('/api/garson/masa/:id', jwtDogrula, (req, res) => {
    const db = veritabaniGetir()
    const masaId = req.params.id

    const hesap = db.prepare("SELECT * FROM hesap WHERE masa_id = ? AND durum = 'acik'").get(masaId) as any
    if (!hesap) {
      return res.json({ hesap: null, siparisler: [] })
    }

    const siparisler = db.prepare(`
      SELECT s.id, s.urun_id, s.miktar, s.birim_fiyat, s.toplam_fiyat, s.notlar, s.durum, s.ikram, s.porsiyon,
             u.ad as urun_adi
      FROM siparis s
      JOIN urun u ON u.id = s.urun_id
      WHERE s.hesap_id = ? AND s.durum != 'iptal'
      ORDER BY s.siparis_zamani ASC
    `).all(hesap.id)

    res.json({ hesap, siparisler })
  })

  // Menüyü getir
  app.get('/api/garson/menu', jwtDogrula, (req, res) => {
    const db = veritabaniGetir()
    const kategoriler = db.prepare('SELECT * FROM kategori WHERE aktif = 1 ORDER BY sira').all()
    const urunler = db.prepare('SELECT * FROM urun WHERE aktif = 1 ORDER BY sira').all()
    const opsiyonlar = db.prepare('SELECT * FROM urun_opsiyonu WHERE aktif = 1').all()
    const varyantlar = db.prepare('SELECT * FROM urun_varyant WHERE aktif = 1').all()
    res.json({ kategoriler, urunler, opsiyonlar, varyantlar })
  })

  // Realtime yayın aracı
  function broadcastToWindows(channel: string, ...args: any[]) {
    // Bilgisayardaki Electron pencerelerine yayın
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send(channel, ...args)
    })

    // Telefondaki Garson uygulamalarına yayın (WebSocket)
    if (io) {
      io.emit(channel, ...args)
    }
  }

  // Sipariş gönder
  app.post('/api/garson/siparis', jwtDogrula, (req: any, res) => {
    const db = veritabaniGetir()
    const { masa_id, siparisler } = req.body
    const personelId = req.kullanici.id

    try {
      // Masada açık hesap var mı kontrol et
      let hesap = db.prepare("SELECT id FROM hesap WHERE masa_id = ? AND durum = 'acik'").get(masa_id) as any
      const masa = db.prepare("SELECT numara FROM masa WHERE id = ?").get(masa_id) as any
      const masaNo = masa ? masa.numara : '?'

      if (!hesap) {
        // Yeni hesap aç
        const tarih = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const hesapNo = `HSP-${tarih}-${Date.now().toString(36)}`
        const sonuc = db.prepare(`
          INSERT INTO hesap (masa_id, hesap_no, hesap_tipi, personel_id) VALUES (?, ?, 'masa', ?)
        `).run(masa_id, hesapNo, personelId)
        hesap = { id: Number(sonuc.lastInsertRowid) }
        db.prepare("UPDATE masa SET durum = 'dolu' WHERE id = ?").run(masa_id)
      }

      const yazdirSiparisler: any[] = []

      // Siparişleri ekle
      for (const sip of siparisler) {
        const urun = db.prepare('SELECT ad, fiyat, yazici_grup FROM urun WHERE id = ?').get(sip.urun_id) as any
        if (!urun) continue

        const isKg = sip.secilenSatisTuru === 'kg'
        const birimFiyat = sip.birim_fiyat !== undefined ? Number(sip.birim_fiyat) : urun.fiyat
        const porsiyon = isKg ? 1 : (sip.porsiyon || 1)
        const toplamFiyat = sip.toplam_fiyat !== undefined ? Number(sip.toplam_fiyat) : (birimFiyat * (sip.miktar || 1) * porsiyon)
        const urunGosterimAdi = isKg && sip.gramaj ? `${sip.gramaj} KG ${urun.ad}` : urun.ad

        yazdirSiparisler.push({
          urun_adi: urunGosterimAdi,
          miktar: sip.miktar || 1,
          notlar: sip.notlar || '',
          ikram: sip.ikram || false,
          porsiyon: porsiyon
        })

        const sonuc = db.prepare(`
          INSERT INTO siparis (hesap_id, urun_id, miktar, birim_fiyat, toplam_fiyat, personel_id, notlar, yazici_grup, ikram, ikram_onaylayan_id, porsiyon)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          hesap.id,
          sip.urun_id,
          sip.miktar || 1,
          birimFiyat,
          toplamFiyat,
          personelId,
          sip.notlar || null,
          urun.yazici_grup,
          sip.ikram ? 1 : 0,
          sip.ikram ? personelId : null,
          porsiyon
        )

        const yeniSiparisId = Number(sonuc.lastInsertRowid)

        // Otomatik stok düşümü ve reçete maliyet hesabı
        siparisStokDusVeMaliyetHesapla(db, {
          siparisId: yeniSiparisId,
          urunId: sip.urun_id,
          miktar: sip.miktar || 1,
          porsiyon: porsiyon,
          personelId: personelId,
          hesapId: hesap.id,
          urunAdi: urun.ad,
        })
      }

      // Hesap toplamını güncelle
      const toplam = db.prepare("SELECT COALESCE(SUM(toplam_fiyat), 0) as t FROM siparis WHERE hesap_id = ? AND durum != 'iptal' AND ikram = 0").get(hesap.id) as any
      db.prepare('UPDATE hesap SET toplam_tutar = ?, net_tutar = ? WHERE id = ?').run(toplam.t, toplam.t, hesap.id)

      // Tüm ekranlara (Masa listesi, POS vb.) anlık yenileme sinyali gönder
      broadcastToWindows('masalar:guncellendi')
      broadcastToWindows('siparis:guncellendi', hesap.id, masa_id)
      broadcastToWindows('mutfak:yeni-siparis') // Kitchen screen

      // Mutfak yazıcısı için özel istek (Eğer eklenen kalem varsa)
      if (yazdirSiparisler.length > 0) {
        broadcastToWindows('mutfak:yazdir-istek', yazdirSiparisler, masaNo, [])
      }

      res.json({ basarili: true, hesap_id: hesap.id })
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  })

  // Sipariş iptal et
  app.post('/api/garson/siparis-iptal', jwtDogrula, (req: any, res) => {
    const db = veritabaniGetir()
    const { siparis_id, iptal_nedeni } = req.body

    try {
      const siparis = db.prepare(`
        SELECT s.hesap_id, s.miktar, s.notlar, u.ad as urun_adi, h.masa_id, m.numara as masa_numara 
        FROM siparis s
        JOIN urun u ON u.id = s.urun_id
        JOIN hesap h ON h.id = s.hesap_id
        JOIN masa m ON m.id = h.masa_id
        WHERE s.id = ?
      `).get(siparis_id) as any

      if (!siparis) {
        return res.status(404).json({ hata: 'Sipariş bulunamadı' })
      }

      // Stoğa iade et
      siparisStokGeriYukle(db, siparis_id)

      db.prepare("UPDATE siparis SET durum = 'iptal', iptal_nedeni = ? WHERE id = ?").run(iptal_nedeni || 'Garson tarafından iptal', siparis_id)

      // Hesap toplamını güncelle
      const toplam = db.prepare("SELECT COALESCE(SUM(toplam_fiyat), 0) as t FROM siparis WHERE hesap_id = ? AND durum != 'iptal' AND ikram = 0").get(siparis.hesap_id) as any
      db.prepare('UPDATE hesap SET toplam_tutar = ?, net_tutar = ? WHERE id = ?').run(toplam.t, toplam.t, siparis.hesap_id)

      // Anlık arayüz güncellemeleri
      broadcastToWindows('masalar:guncellendi')
      broadcastToWindows('siparis:guncellendi', siparis.hesap_id, siparis.masa_id)
      broadcastToWindows('mutfak:yeni-siparis')

      // İptal fişini mutfağa yazdır
      const yazdirIptal = [{
        urun_adi: siparis.urun_adi,
        miktar: siparis.miktar,
        notlar: iptal_nedeni ? `İPTAL NEDENİ: ${iptal_nedeni}` : 'Garson İptali'
      }]
      broadcastToWindows('mutfak:yazdir-istek', [], siparis.masa_numara, yazdirIptal)

      res.json({ basarili: true })
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  })

  // Sipariş ikram durumunu değiştir
  app.post('/api/garson/siparis-ikram', jwtDogrula, (req: any, res) => {
    const db = veritabaniGetir()
    const { siparis_id, ikram } = req.body
    const personelId = req.kullanici.id

    try {
      const siparis = db.prepare(`
        SELECT s.hesap_id, h.masa_id 
        FROM siparis s
        JOIN hesap h ON h.id = s.hesap_id
        WHERE s.id = ?
      `).get(siparis_id) as any
      if (!siparis) {
        return res.status(404).json({ hata: 'Sipariş bulunamadı' })
      }

      db.prepare('UPDATE siparis SET ikram = ?, ikram_onaylayan_id = ? WHERE id = ?').run(ikram ? 1 : 0, ikram ? personelId : null, siparis_id)

      // Hesap toplamını güncelle
      const toplam = db.prepare("SELECT COALESCE(SUM(toplam_fiyat), 0) as t FROM siparis WHERE hesap_id = ? AND durum != 'iptal' AND ikram = 0").get(siparis.hesap_id) as any
      db.prepare('UPDATE hesap SET toplam_tutar = ?, net_tutar = ? WHERE id = ?').run(toplam.t, toplam.t, siparis.hesap_id)

      // Anlık arayüz güncellemeleri
      broadcastToWindows('masalar:guncellendi')
      broadcastToWindows('siparis:guncellendi', siparis.hesap_id, siparis.masa_id)
      broadcastToWindows('mutfak:yeni-siparis')

      res.json({ basarili: true })
    } catch (hata: any) {
      res.status(500).json({ hata: hata.message })
    }
  })

  // ===== QR MENÜ =====

  // Herkese açık menü (token gerekmez)
  app.get(['/api/qrmenu', '/api/menu'], (req, res) => {
    const db = veritabaniGetir()
    const kategoriler = db.prepare('SELECT id, ad, renk, ikon FROM kategori WHERE aktif = 1 ORDER BY sira').all()
    const urunler = db.prepare(`
      SELECT id, kategori_id, ad, kisaltma, fiyat, birim, resim_yolu, satis_turleri
      FROM urun WHERE aktif = 1 ORDER BY sira
    `).all()
    const ayarlar = db.prepare("SELECT deger FROM ayar WHERE anahtar = 'isletme_adi'").get() as any

    res.json({
      isletme_adi: ayarlar?.deger || 'Restoran',
      kategoriler,
      urunler,
    })
  })

  // Sunucuyu başlat (httpServer kullanmalıyız ki Socket.io çalışsın)
  sunucu = httpServer.listen(port, '0.0.0.0', () => {
    const localIP = varsayilanYerelIpGetir()

    console.log(`🌐 REST API sunucusu http://0.0.0.0:${port} adresinde çalışıyor`)
    console.log(`   Boss Modülü:       http://localhost:${port}/api/boss/ozet`)
    console.log(`   Garson Modülü:     http://localhost:${port}/api/garson/masalar`)
    console.log(`   QR Menü:           http://localhost:${port}/api/qrmenu`)
    console.log(``)
    console.log(`   📱 GARSON TERMİNALİ: http://${localIP}:${port}/garson`)
    console.log(`   ☝️  Bu adresi garsonların telefonlarına verin!`)
  })
}

/**
 * API sunucusunu durdurur
 */
export function apiSunucusunuDurdur(): void {
  if (sunucu) {
    sunucu.close()
    sunucu = null
    console.log('🛑 API sunucusu durduruldu')
  }
}
