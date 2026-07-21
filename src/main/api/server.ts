// =====================================================
// Express.js REST API Sunucusu
// Boss Modülü ve Garson Mobil Uygulama için
// =====================================================

import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { networkInterfaces } from 'os'
import { veritabaniGetir } from '../database/connection'
import { BrowserWindow, app } from 'electron'
import { garsonMobilHTML } from './garson-mobile'
import path from 'path'

const JWT_SECRET = 'restoelektro-gizli-anahtar-2024'

let sunucu: any = null
let io: Server | null = null

/**
 * API sunucusunu başlatır
 */
export async function apiSunucusunuBaslat(port: number = 3847): Promise<void> {
  const app = express()
  const httpServer = createServer(app)
  io = new Server(httpServer, { cors: { origin: '*' } })

  app.use(cors())
  app.use(express.json())

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
    const isDev = !app.isPackaged
    const rsPath = isDev ? path.join(process.cwd(), 'resources') : process.resourcesPath
    res.sendFile(path.join(rsPath, 'icon.ico'))
  })

  // ===== MOBİL GARSON ARAYÜZÜ =====
  // Telefondan http://<bilgisayar-ip>:3847/garson adresine gidince açılır
  app.get('/garson', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(garsonMobilHTML())
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
      ORDER BY b.ad, m.numara
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
      SELECT s.id, s.urun_id, s.miktar, s.birim_fiyat, s.toplam_fiyat, s.notlar, s.durum, s.ikram,
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
    res.json({ kategoriler, urunler })
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

        yazdirSiparisler.push({
          urun_adi: urun.ad,
          miktar: sip.miktar || 1,
          notlar: sip.notlar || '',
          ikram: sip.ikram || false
        })

        db.prepare(`
          INSERT INTO siparis (hesap_id, urun_id, miktar, birim_fiyat, toplam_fiyat, personel_id, notlar, yazici_grup, ikram, ikram_onaylayan_id)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(hesap.id, sip.urun_id, sip.miktar || 1, urun.fiyat, urun.fiyat * (sip.miktar || 1), personelId, sip.notlar || null, urun.yazici_grup, sip.ikram ? 1 : 0, sip.ikram ? personelId : null)
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
  app.get('/api/qrmenu', (req, res) => {
    const db = veritabaniGetir()
    const kategoriler = db.prepare('SELECT id, ad, renk, ikon FROM kategori WHERE aktif = 1 ORDER BY sira').all()
    const urunler = db.prepare(`
      SELECT id, kategori_id, ad, fiyat, birim, resim_yolu
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
    // Yerel ağ IP adresini bul
    const os = require('os')
    const interfaces = os.networkInterfaces()
    let localIP = 'localhost'
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          localIP = iface.address
          break
        }
      }
    }
    
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
