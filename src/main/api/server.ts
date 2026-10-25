import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { veritabaniGetir } from '../database/connection'
import { BrowserWindow, app as electronApp } from 'electron'
import { bossRotalariniKaydet } from './boss-api'
import { istemciAdresi, pinGirisLimiti, lanJetonLimiti } from './giris-limiti'
import path from 'path'
import fs from 'fs'
import { varsayilanYerelIpGetir } from '../services/network.service'
import { terminalAyarYukle } from '../services/terminal.service'
import { jwtGizliAnahtar, guvenliEsitMi, pinOzeti } from '../services/guvenlik.service'
import { uploadsDizininiGetir } from '../services/gorsel.service'
import {
  IslemHatasi,
  masaHesabiniGetirVeyaAc,
  siparisleriEkle,
  siparisIptalEt,
  siparisIkramAyarla,
} from '../services/siparis.service'
import { yetkiVarMi, YetkiHatasi } from '../services/yetki.service'
import { pinIlePersonelBul, personelGuvenli } from '../services/pin.service'
import { ipcHandlerCalistir } from '../ipc/ipc-registry'
import { uzakKanalIzinliMi } from '../ipc/uzak-kanallar'
import { denetimYaz } from '../services/audit.service'

let sunucu: any = null
let io: Server | null = null

/** 003 migration'ının tohumladığı herkesçe bilinen şifrenin (admin123) özeti */
const VARSAYILAN_SIFRE_HASH = '$2a$10$8K1p/a0dL1LXMIgoEDFrwOfMQkf9xP6h.k2HEQKAOI8k3x5HYlIjW'

/** Bu makinedeki tarayıcı / Electron renderer (file:// → 'null') kaynakları */
function yerelKaynakMi(origin: string | undefined): boolean {
  if (!origin || origin === 'null') return true
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin)
}

/** Cloudflare Tunnel veya başka bir ters vekil üzerinden gelen istek mi? */
function vekilIstegiMi(req: any): boolean {
  const h = req.headers || {}
  return Boolean(h['cf-ray'] || h['cf-connecting-ip'] || h['x-forwarded-for'])
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

const GORSEL_UZANTI = /\.(jpe?g|png|webp|gif|svg)$/i

/**
 * API sunucusunu başlatır
 */
export async function apiSunucusunuBaslat(port: number = 3847): Promise<void> {
  const JWT_SECRET = jwtGizliAnahtar()
  const app = express()
  const httpServer = createServer(app)
  io = new Server(httpServer, {
    cors: { origin: (origin, cb) => cb(null, yerelKaynakMi(origin)) },
  })

  app.disable('x-powered-by')
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Referrer-Policy', 'no-referrer')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    next()
  })

  // Herkese açık menü ve görseller her kaynaktan okunabilir; diğer API'ler yalnızca bu makineden
  const acikCors = cors()
  const yerelCors = cors({ origin: (origin, cb) => cb(null, yerelKaynakMi(origin)) })
  app.use((req, res, next) => {
    const acik = /^\/(public\/)?uploads\//.test(req.path) || /^\/api\/(qrmenu|menu)$/.test(req.path)
    return (acik ? acikCors : yerelCors)(req, res, next)
  })

  app.use(express.json({ limit: '20mb' }))
  app.use(express.urlencoded({ extended: true, limit: '1mb' }))

  // ===== STATİK GÖRSEL SUNUCUSU =====
  // 1. Varsayılan görselleri userData dizinine senkronize et
  varsayilanGorselleriSenkronizeEt()

  const uploadsProductDir = uploadsDizininiGetir()
  const uploadRoot = path.dirname(uploadsProductDir) // .../public/uploads
  const tumUploadsDizinleri = statikUploadsDizinleriniGetir()

  // Yüklenen dosyalar asla script çalıştıramaz (eski SVG yüklemeleri dahil)
  const gorselBasliklari = (res: any) => {
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox")
  }
  const statikSecenek = { dotfiles: 'deny' as const, index: false as const, setHeaders: gorselBasliklari }

  // 2. Yalnızca uploads dizinleri sunulur — üst klasörler (userData, resources) asla kökten açılmaz
  for (const d of [uploadRoot, ...tumUploadsDizinleri.filter(d => d !== uploadRoot)]) {
    app.use('/uploads', express.static(d, statikSecenek))
    app.use('/public/uploads', express.static(d, statikSecenek))
  }

  // 3. Fallback: yalnızca dosya ADINA göre bilinen products dizinlerinde arar (yol gezintisi yok)
  app.get(['/uploads/*', '/public/uploads/*'], (req, res, next) => {
    let dosyaAdi: string
    try {
      dosyaAdi = path.basename(decodeURIComponent(req.path))
    } catch {
      return next()
    }
    if (!dosyaAdi || dosyaAdi.startsWith('.') || !GORSEL_UZANTI.test(dosyaAdi)) return next()

    const adaylar = [
      path.join(uploadsProductDir, dosyaAdi),
      ...tumUploadsDizinleri.map(d => path.join(d, 'products', dosyaAdi)),
    ]
    const bulunan = adaylar.find(a => fs.existsSync(a))
    if (!bulunan) return next()
    gorselBasliklari(res)
    return res.sendFile(bulunan)
  })

  // JWT doğrulama middleware — devre dışı bırakılan personelin token'ı da reddedilir
  const jwtDogrula = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ hata: 'Yetkilendirme gerekli' })
    try {
      const kullanici = jwt.verify(token, JWT_SECRET) as any
      const aktif = veritabaniGetir().prepare('SELECT rol FROM personel WHERE id = ? AND aktif = 1').get(kullanici?.id) as any
      if (!aktif) return res.status(401).json({ hata: 'Oturum geçersiz' })
      req.kullanici = { ...kullanici, rol: aktif.rol }
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

  // ===== TELEFON ARAYÜZLERİ (src/mobile → out/mobile, npm run build:mobile) =====
  // Garson: /garson · Patron: /boss, /patron · QR menü: /qrmenu, /menu
  // Varlıklar içerik özetli dosya adlarıyla /m/ altından uzun önbellekle sunulur.
  const mobilDizin = [
    path.join(electronApp.getAppPath(), 'out', 'mobile'),
    path.join(__dirname, '..', 'mobile'),
  ].find((d) => fs.existsSync(d)) || path.join(electronApp.getAppPath(), 'out', 'mobile')

  app.use('/m', express.static(mobilDizin, { index: false, dotfiles: 'deny', maxAge: '30d', immutable: true }))

  const MOBIL_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws: wss:; font-src 'self'; base-uri 'none'; form-action 'self'"
  const MENU_CSP = MOBIL_CSP
    .replace("style-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com")
    .replace("font-src 'self'", "font-src 'self' https://fonts.gstatic.com")

  const mobilSayfa = (ad: 'garson' | 'boss' | 'menu') => (_req: any, res: any) => {
    const dosya = path.join(mobilDizin, `${ad}.html`)
    if (!fs.existsSync(dosya)) {
      return res.status(503).type('text/plain').send('Telefon arayüzü derlenmemiş — "npm run build:mobile" çalıştırın.')
    }
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Content-Security-Policy', ad === 'menu' ? MENU_CSP : MOBIL_CSP)
    res.sendFile(dosya)
  }
  app.get('/garson', mobilSayfa('garson'))
  app.get(['/boss', '/patron'], mobilSayfa('boss'))
  app.get(['/qrmenu', '/menu'], mobilSayfa('menu'))

  // PIN ile giriş (mobil garsonlar için) — istemci başına artan kilit
  app.post('/api/garson/pin-giris', (req, res) => {
    const anahtar = 'garson:' + istemciAdresi(req)
    const izin = pinGirisLimiti.izinVarMi(anahtar)
    if (!izin.izinli) return res.status(429).json({ hata: `Çok fazla deneme. ${izin.beklemeSn} sn sonra tekrar deneyin` })

    const db = veritabaniGetir()
    const personel = pinIlePersonelBul(db, String(req.body?.pin_kodu || '').trim(), pinOzeti)
    if (!personel) {
      const kilitSn = pinGirisLimiti.hatali(anahtar)
      if (kilitSn) return res.status(429).json({ hata: `Çok fazla hatalı deneme. ${kilitSn} sn kilitlendi` })
      return res.status(401).json({ hata: 'Geçersiz PIN kodu' })
    }
    pinGirisLimiti.basarili(anahtar)
    if (personel.pin_degismeli === 1) {
      return res.status(403).json({ hata: 'Varsayılan PIN ile telefondan giriş yapılamaz — önce kasadan PIN\'inizi değiştirin' })
    }

    const token = jwt.sign({ id: personel.id, rol: personel.rol }, JWT_SECRET, { expiresIn: '12h' })
    res.json({ personel: personelGuvenli(personel), token })
  })

  // Giriş endpoint'i (mobil uygulamalar için)
  app.post('/api/giris', (req, res) => {
    const anahtar = 'giris:' + istemciAdresi(req)
    const izin = pinGirisLimiti.izinVarMi(anahtar)
    if (!izin.izinli) return res.status(429).json({ hata: `Çok fazla deneme. ${izin.beklemeSn} sn sonra tekrar deneyin` })

    const db = veritabaniGetir()
    const { kullanici_adi, sifre } = req.body || {}
    const personel = db.prepare('SELECT * FROM personel WHERE kullanici_adi = ? AND aktif = 1').get(String(kullanici_adi || '')) as any
    const bcryptjs = require('bcryptjs')
    if (!personel || typeof sifre !== 'string' || !bcryptjs.compareSync(sifre, personel.sifre_hash)) {
      pinGirisLimiti.hatali(anahtar)
      return res.status(401).json({ hata: 'Kullanıcı adı veya şifre hatalı' })
    }

    pinGirisLimiti.basarili(anahtar)
    if (personel.sifre_hash === VARSAYILAN_SIFRE_HASH) {
      return res.status(403).json({ hata: 'Varsayılan şifre ile uzaktan giriş yapılamaz — önce kasadan şifrenizi değiştirin' })
    }
    const token = jwt.sign({ id: personel.id, rol: personel.rol }, JWT_SECRET, { expiresIn: '12h' })
    res.json({ personel: personelGuvenli(personel), token })
  })

  // ===== BOSS MODÜLÜ (salt okunur patron paneli) =====
  bossRotalariniKaydet(app, JWT_SECRET)

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
    const kategoriler = db.prepare('SELECT * FROM kategori WHERE aktif = 1 ORDER BY sira_no ASC, ad ASC').all()
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

  function garsonHataYaniti(res: any, hata: any) {
    if (hata instanceof YetkiHatasi) return res.status(403).json({ hata: hata.message, yetkiGerekli: hata.yetki })
    if (hata instanceof IslemHatasi) return res.status(400).json({ hata: hata.message })
    console.error('❌ Garson API hatası:', hata)
    return res.status(500).json({ hata: 'İşlem sırasında beklenmeyen bir hata oluştu' })
  }

  /**
   * Garsonun işlem yetkisi; yoksa aynı istekte gönderilen yönetici PIN'i ile onay.
   * Onaylayanın personel id'sini döndürür; ikisi de yoksa YetkiHatasi (telefon PIN ister).
   */
  function garsonYetkisi(req: any, yetki: string): number {
    const db = veritabaniGetir()
    const [modul, islem] = yetki.split('/')
    if (yetkiVarMi(db, req.kullanici.rol, modul, islem)) return req.kullanici.id

    const pin = String(req.body?.yonetici_pin || '')
    if (!pin) throw new YetkiHatasi(yetki)

    const anahtar = 'onay:' + istemciAdresi(req)
    const izin = pinGirisLimiti.izinVarMi(anahtar)
    if (!izin.izinli) throw new IslemHatasi(`Çok fazla hatalı deneme. ${izin.beklemeSn} sn bekleyin`)
    const onaylayan = pinIlePersonelBul(db, pin, pinOzeti)
    if (!onaylayan || !yetkiVarMi(db, onaylayan.rol, modul, islem)) {
      pinGirisLimiti.hatali(anahtar)
      throw new YetkiHatasi(yetki, onaylayan ? `${onaylayan.ad} bu işlemi onaylayamaz` : 'Yönetici PIN\'i geçersiz')
    }
    pinGirisLimiti.basarili(anahtar)
    return onaylayan.id
  }

  // Sipariş gönder — fiyatlar sunucuda ürün/varyant/opsiyon kayıtlarından hesaplanır
  app.post('/api/garson/siparis', jwtDogrula, (req: any, res) => {
    const db = veritabaniGetir()
    const masaId = Number(req.body?.masa_id)
    const siparisler = req.body?.siparisler
    const personelId = req.kullanici.id

    try {
      const masa = db.prepare('SELECT numara FROM masa WHERE id = ? AND aktif = 1').get(masaId) as any
      if (!masa) throw new IslemHatasi('Masa bulunamadı')

      const ikramVar = Array.isArray(siparisler) && siparisler.some((s: any) => s?.ikram)
      const ikramOnaylayanId = ikramVar ? garsonYetkisi(req, 'pos/ikram') : undefined
      const { hesapId, kalemler } = db.transaction(() => {
        const hesapId = masaHesabiniGetirVeyaAc(db, masaId, personelId)
        return { hesapId, kalemler: siparisleriEkle(db, hesapId, personelId, siparisler, { ikramOnaylayanId }) }
      })()

      // Tüm ekranlara (Masa listesi, POS vb.) anlık yenileme sinyali gönder
      broadcastToWindows('masalar:guncellendi')
      broadcastToWindows('siparis:guncellendi', hesapId, masaId)
      broadcastToWindows('mutfak:yeni-siparis') // Kitchen screen

      // Mutfak yazıcısı için özel istek
      broadcastToWindows('mutfak:yazdir-istek', kalemler.map(k => ({
        urun_adi: k.urun_adi,
        miktar: k.miktar,
        notlar: k.notlar,
        ikram: k.ikram,
        porsiyon: k.porsiyon,
      })), masa.numara, [])

      res.json({ basarili: true, hesap_id: hesapId })
    } catch (hata: any) {
      garsonHataYaniti(res, hata)
    }
  })

  // Sipariş iptal et — pos/iptal yetkisi ya da yönetici PIN'i gerekir
  app.post('/api/garson/siparis-iptal', jwtDogrula, (req: any, res) => {
    const db = veritabaniGetir()
    const siparisId = Number(req.body?.siparis_id)
    const iptalNedeni = req.body?.iptal_nedeni

    try {
      const onaylayanId = garsonYetkisi(req, 'pos/iptal')
      const siparis = siparisIptalEt(db, siparisId, iptalNedeni || 'Garson tarafından iptal', onaylayanId)
      denetimYaz(db, {
        personel_id: req.kullanici.id,
        islem: 'siparis_iptal',
        modul: 'pos',
        hedef_tip: 'siparis',
        hedef_id: siparisId,
        ozet: `Garson iptali #${siparisId} — ${iptalNedeni || ''}`,
        detay: { hesap_id: siparis.hesap_id, onaylayan_id: onaylayanId },
      })

      // Anlık arayüz güncellemeleri
      broadcastToWindows('masalar:guncellendi')
      broadcastToWindows('siparis:guncellendi', siparis.hesap_id, siparis.masa_id)
      broadcastToWindows('mutfak:yeni-siparis')

      // İptal fişini mutfağa yazdır
      broadcastToWindows('mutfak:yazdir-istek', [], siparis.masa_numara, [{
        urun_adi: siparis.urun_adi,
        miktar: siparis.miktar,
        notlar: iptalNedeni ? `İPTAL NEDENİ: ${iptalNedeni}` : 'Garson İptali'
      }])

      res.json({ basarili: true })
    } catch (hata: any) {
      garsonHataYaniti(res, hata)
    }
  })

  // Sipariş ikram durumunu değiştir — pos/ikram yetkisi ya da yönetici PIN'i gerekir
  app.post('/api/garson/siparis-ikram', jwtDogrula, (req: any, res) => {
    const db = veritabaniGetir()
    const siparisId = Number(req.body?.siparis_id)

    try {
      const onaylayanId = garsonYetkisi(req, 'pos/ikram')
      const sonuc = siparisIkramAyarla(db, siparisId, Boolean(req.body?.ikram), onaylayanId)
      denetimYaz(db, {
        personel_id: req.kullanici.id,
        islem: sonuc.ikram ? 'ikram' : 'ikram_kaldir',
        modul: 'pos',
        hedef_tip: 'siparis',
        hedef_id: siparisId,
        ozet: `Garson ${sonuc.ikram ? 'ikramı' : 'ikram kaldırma'} #${siparisId}`,
        detay: { onaylayan_id: onaylayanId },
      })

      // Anlık arayüz güncellemeleri
      broadcastToWindows('masalar:guncellendi')
      broadcastToWindows('siparis:guncellendi', sonuc.hesap_id, sonuc.masa_id)
      broadcastToWindows('mutfak:yeni-siparis')

      res.json({ basarili: true })
    } catch (hata: any) {
      garsonHataYaniti(res, hata)
    }
  })

  // ===== QR MENÜ =====

  // Herkese açık menü (token gerekmez)
  app.get(['/api/qrmenu', '/api/menu'], (req, res) => {
    const db = veritabaniGetir()
    const kategoriler = db.prepare('SELECT id, ad, renk, ikon, sira_no FROM kategori WHERE aktif = 1 ORDER BY sira_no ASC, ad ASC').all()
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

  // ===== İKİNCİ KASA / LAN IPC KÖPRÜSÜ =====
  // Yalnızca yerel ağdan doğrudan erişilir; Cloudflare tüneli vb. vekiller üzerinden kapalıdır.
  app.use(['/api/ipc', '/api/kasa'], (req, res, next) => {
    if (vekilIstegiMi(req)) return res.status(403).json({ basarili: false, hata: 'Bu servis yalnızca yerel ağdan kullanılabilir' })
    next()
  })

  app.get('/api/kasa/ping', (_req, res) => {
    const t = terminalAyarYukle()
    let isletme = 'ETİBOL POS'
    try {
      const db = veritabaniGetir()
      const ayar = db.prepare("SELECT deger FROM ayar WHERE anahtar = 'isletme_adi'").get() as any
      if (ayar?.deger) isletme = ayar.deger
    } catch {
      // db yoksa varsayılan
    }
    res.json({
      basarili: true,
      rol: 'ana',
      egitim: Boolean(t.egitim),
      terminalId: t.terminalId,
      isletme,
    })
  })

  app.post('/api/ipc', async (req, res) => {
    const t = terminalAyarYukle()
    if (t.egitim) {
      return res.status(503).json({ basarili: false, hata: 'Ana kasa eğitim modunda. İkinci kasa bağlanamaz.' })
    }
    const anahtar = 'lan:' + istemciAdresi(req)
    const izin = lanJetonLimiti.izinVarMi(anahtar)
    if (!izin.izinli) return res.status(429).json({ basarili: false, hata: `Çok fazla hatalı jeton. ${izin.beklemeSn} sn bekleyin` })

    const { kanal, args, token } = req.body || {}
    if (!guvenliEsitMi(token, t.lanToken)) {
      lanJetonLimiti.hatali(anahtar)
      return res.status(401).json({ basarili: false, hata: 'LAN jetonu hatalı' })
    }
    if (!kanal || typeof kanal !== 'string') {
      return res.status(400).json({ basarili: false, hata: 'Kanal gerekli' })
    }
    if (!uzakKanalIzinliMi(kanal)) {
      return res.status(403).json({ basarili: false, hata: 'Bu kanal uzaktan çağrılamaz' })
    }
    try {
      const sonuc = await ipcHandlerCalistir(kanal, Array.isArray(args) ? args : [], req.body?.terminalId)
      res.json(sonuc)
    } catch (hata: any) {
      res.status(500).json({ basarili: false, hata: hata?.message || 'IPC hatası' })
    }
  })

  // ===== SOCKET.IO KİMLİK DOĞRULAMA =====
  // Canlı sipariş olaylarını yalnızca giriş yapmış garson / patron telefonları alır
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    try {
      const kullanici = jwt.verify(String(token || ''), JWT_SECRET) as any
      const aktif = veritabaniGetir().prepare('SELECT 1 FROM personel WHERE id = ? AND aktif = 1').get(kullanici?.id)
      if (!aktif) return next(new Error('yetkisiz'))
      next()
    } catch {
      next(new Error('yetkisiz'))
    }
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
    console.log(`   👑 PATRON PANELİ:    http://${localIP}:${port}/boss`)
    console.log(`   ☝️  Bu adresleri telefonlara veya Cloudflare tüneline verin!`)
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
