// =====================================================
// Personel & Kimlik Doğrulama IPC Handler'ları
// Giriş, çıkış, personel CRUD işlemleri
// =====================================================

import { IpcMain } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { PERSONEL_KANALLARI } from '../../common/ipc-channels'
import { compareSync, hashSync } from 'bcryptjs'
import { sign } from 'jsonwebtoken'
import type { Personel, GirisBilgileri, GirisYaniti, YeniPersonel } from '../../common/types/staff.types'

// JWT gizli anahtar (üretimde çevresel değişkenden alınmalı)
const JWT_SECRET = 'restoelektro-gizli-anahtar-2024'

/**
 * Personel IPC handler'larını kaydeder
 */
export function personelIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  // Giriş yap (kullanıcı adı + şifre)
  ipcMain.handle(PERSONEL_KANALLARI.GIRIS_YAP, async (_event, bilgiler: GirisBilgileri): Promise<GirisYaniti> => {
    try {
      const personel = db.prepare(
        'SELECT * FROM personel WHERE kullanici_adi = ? AND aktif = 1'
      ).get(bilgiler.kullanici_adi) as any

      if (!personel) {
        return { basarili: false, hata: 'Kullanıcı bulunamadı' }
      }

      const sifreDogruMu = compareSync(bilgiler.sifre || '', personel.sifre_hash)
      if (!sifreDogruMu) {
        return { basarili: false, hata: 'Hatalı şifre' }
      }

      // Yetkileri getir
      const yetkiler = db.prepare('SELECT * FROM yetki WHERE rol = ?').all(personel.rol)

      // JWT token oluştur
      const token = sign(
        { id: personel.id, rol: personel.rol, kullanici_adi: personel.kullanici_adi },
        JWT_SECRET,
        { expiresIn: '12h' }
      )

      // Hassas verileri çıkar
      const { sifre_hash, ...guvenliPersonel } = personel

      return {
        basarili: true,
        personel: { ...guvenliPersonel, tam_adi: `${personel.ad} ${personel.soyad}` },
        token,
      }
    } catch (hata: any) {
      return { basarili: false, hata: hata.message }
    }
  })

  // PIN ile hızlı giriş
  ipcMain.handle(PERSONEL_KANALLARI.PIN_GIRIS, async (_event, pin: string): Promise<GirisYaniti> => {
    try {
      const personel = db.prepare(
        'SELECT * FROM personel WHERE pin_kodu = ? AND aktif = 1'
      ).get(pin) as any

      if (!personel) {
        return { basarili: false, hata: 'Geçersiz PIN kodu' }
      }

      const yetkiler = db.prepare('SELECT * FROM yetki WHERE rol = ?').all(personel.rol)

      const token = sign(
        { id: personel.id, rol: personel.rol },
        JWT_SECRET,
        { expiresIn: '12h' }
      )

      const { sifre_hash, ...guvenliPersonel } = personel

      return {
        basarili: true,
        personel: { ...guvenliPersonel, tam_adi: `${personel.ad} ${personel.soyad}` },
        token,
      }
    } catch (hata: any) {
      return { basarili: false, hata: hata.message }
    }
  })

  // Personel listele
  ipcMain.handle(PERSONEL_KANALLARI.LISTELE, async () => {
    return db.prepare(
      'SELECT id, ad, soyad, kullanici_adi, rol, pin_kodu, aktif, telefon, created_at FROM personel ORDER BY ad'
    ).all()
  })

  // Personel ekle
  ipcMain.handle(PERSONEL_KANALLARI.EKLE, async (_event, yeniPersonel: YeniPersonel) => {
    const sifreHash = hashSync(yeniPersonel.sifre, 10)
    const sonuc = db.prepare(`
      INSERT INTO personel (ad, soyad, kullanici_adi, sifre_hash, rol, pin_kodu, telefon)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      yeniPersonel.ad,
      yeniPersonel.soyad,
      yeniPersonel.kullanici_adi,
      sifreHash,
      yeniPersonel.rol,
      yeniPersonel.pin_kodu || null,
      yeniPersonel.telefon || null
    )
    return { basarili: true, id: sonuc.lastInsertRowid }
  })

  // Personel güncelle
  ipcMain.handle(PERSONEL_KANALLARI.GUNCELLE, async (_event, id: number, veriler: Partial<YeniPersonel>) => {
    const alanlar: string[] = []
    const degerler: any[] = []

    if (veriler.ad) { alanlar.push('ad = ?'); degerler.push(veriler.ad) }
    if (veriler.soyad) { alanlar.push('soyad = ?'); degerler.push(veriler.soyad) }
    if (veriler.rol) { alanlar.push('rol = ?'); degerler.push(veriler.rol) }
    if (veriler.pin_kodu !== undefined) { alanlar.push('pin_kodu = ?'); degerler.push(veriler.pin_kodu) }
    if (veriler.telefon !== undefined) { alanlar.push('telefon = ?'); degerler.push(veriler.telefon) }
    if (veriler.sifre) {
      alanlar.push('sifre_hash = ?')
      degerler.push(hashSync(veriler.sifre, 10))
    }

    alanlar.push('updated_at = CURRENT_TIMESTAMP')
    degerler.push(id)

    db.prepare(`UPDATE personel SET ${alanlar.join(', ')} WHERE id = ?`).run(...degerler)
    return { basarili: true }
  })

  // Personel sil (soft delete)
  ipcMain.handle(PERSONEL_KANALLARI.SIL, async (_event, id: number) => {
    db.prepare('UPDATE personel SET aktif = 0 WHERE id = ?').run(id)
    return { basarili: true }
  })

  // Yetkileri getir
  ipcMain.handle(PERSONEL_KANALLARI.YETKILERI_GETIR, async (_event, rol: string) => {
    return db.prepare('SELECT * FROM yetki WHERE rol = ?').all(rol)
  })

  // Yetki güncelle
  ipcMain.handle(PERSONEL_KANALLARI.YETKI_GUNCELLE, async (_event, id: number, izin: boolean) => {
    db.prepare('UPDATE yetki SET izin = ? WHERE id = ?').run(izin ? 1 : 0, id)
    return { basarili: true }
  })
}
