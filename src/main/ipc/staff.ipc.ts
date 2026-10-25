// =====================================================
// Personel & Kimlik Doğrulama IPC Handler'ları
// Giriş, çıkış, oturum, PIN, yönetici onayı, personel ve yetki yönetimi
// =====================================================

import { IpcMain } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { PERSONEL_KANALLARI } from '../../common/ipc-channels'
import { compareSync, hashSync } from 'bcryptjs'
import { sign, verify } from 'jsonwebtoken'
import type { GirisBilgileri, GirisYaniti, YeniPersonel } from '../../common/types/staff.types'
import { denetimYaz } from '../services/audit.service'
import { jwtGizliAnahtar, pinOzeti } from '../services/guvenlik.service'
import { pinGirisLimiti } from '../api/giris-limiti'
import {
  pinBicimiGecerliMi,
  pinHatasi,
  pinIlePersonelBul,
  personelPiniDogruMu,
  personelGuvenli,
} from '../services/pin.service'
import {
  oturumAc,
  oturumKapat,
  oturumGetir,
  oturumAnahtari,
  onayEkle,
  yetkiIste,
  yetkiVarMi,
  YetkiHatasi,
  YETKI_ETIKETLERI,
} from '../services/yetki.service'

function yetkiYaniti(hata: any) {
  if (hata instanceof YetkiHatasi) return { basarili: false, hata: hata.message, yetkiGerekli: hata.yetki }
  return { basarili: false, hata: hata?.message || 'İşlem başarısız' }
}

/**
 * Personel IPC handler'larını kaydeder
 */
export function personelIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()
  const JWT_SECRET = jwtGizliAnahtar()

  function girisYaniti(event: any, personel: any): GirisYaniti {
    oturumAc(event, personel.id)
    const token = sign({ id: personel.id, rol: personel.rol }, JWT_SECRET, { expiresIn: '12h' })
    return {
      basarili: true,
      personel: { ...personelGuvenli(personel), tam_adi: `${personel.ad} ${personel.soyad}` },
      token,
      pinDegistirmeli: personel.pin_degismeli === 1,
    }
  }

  // Giriş yap (kullanıcı adı + şifre)
  ipcMain.handle(PERSONEL_KANALLARI.GIRIS_YAP, async (event, bilgiler: GirisBilgileri): Promise<GirisYaniti> => {
    try {
      const anahtar = 'ipc:' + oturumAnahtari(event)
      const izin = pinGirisLimiti.izinVarMi(anahtar)
      if (!izin.izinli) return { basarili: false, hata: `Çok fazla deneme. ${izin.beklemeSn} sn sonra tekrar deneyin` }

      const personel = db.prepare(
        'SELECT * FROM personel WHERE kullanici_adi = ? AND aktif = 1'
      ).get(bilgiler.kullanici_adi) as any

      if (!personel || !compareSync(bilgiler.sifre || '', personel.sifre_hash)) {
        pinGirisLimiti.hatali(anahtar)
        return { basarili: false, hata: 'Kullanıcı adı veya şifre hatalı' }
      }
      pinGirisLimiti.basarili(anahtar)

      denetimYaz(db, {
        personel_id: personel.id,
        personel_adi: `${personel.ad} ${personel.soyad}`,
        islem: 'giris',
        modul: 'personel',
        hedef_tip: 'personel',
        hedef_id: personel.id,
        ozet: `${personel.kullanici_adi} giriş yaptı`,
      })

      return girisYaniti(event, personel)
    } catch (hata: any) {
      return { basarili: false, hata: hata.message }
    }
  })

  // PIN ile hızlı giriş
  ipcMain.handle(PERSONEL_KANALLARI.PIN_GIRIS, async (event, pinVeyaVeri: string | { pin?: string; personel_id?: number }): Promise<GirisYaniti> => {
    try {
      const pin = typeof pinVeyaVeri === 'string'
        ? pinVeyaVeri
        : String(pinVeyaVeri?.pin || '')
      const personelId = typeof pinVeyaVeri === 'object'
        ? Number(pinVeyaVeri?.personel_id || 0)
        : 0

      if (!pinBicimiGecerliMi(pin)) {
        return { basarili: false, hata: '4 haneli PIN gerekli' }
      }

      const anahtar = 'ipc:' + oturumAnahtari(event)
      const izin = pinGirisLimiti.izinVarMi(anahtar)
      if (!izin.izinli) return { basarili: false, hata: `Çok fazla hatalı deneme. ${izin.beklemeSn} sn bekleyin` }

      let personel: any
      if (personelId) {
        personel = db.prepare('SELECT * FROM personel WHERE id = ? AND aktif = 1').get(personelId) as any
        if (!personel) {
          return { basarili: false, hata: 'Personel bulunamadı' }
        }
        if (!personelPiniDogruMu(personel, pin, pinOzeti)) {
          pinGirisLimiti.hatali(anahtar)
          return { basarili: false, hata: `Geçersiz PIN — ${personel.ad} ${personel.soyad} için doğru değil` }
        }
      } else {
        personel = pinIlePersonelBul(db, pin, pinOzeti)
        if (!personel) {
          pinGirisLimiti.hatali(anahtar)
          return { basarili: false, hata: 'Geçersiz PIN kodu' }
        }
      }
      pinGirisLimiti.basarili(anahtar)

      denetimYaz(db, {
        personel_id: personel.id,
        personel_adi: `${personel.ad} ${personel.soyad}`,
        islem: 'pin_giris',
        modul: 'personel',
        hedef_tip: 'personel',
        hedef_id: personel.id,
        ozet: `${personel.kullanici_adi} PIN ile giriş yaptı`,
      })

      return girisYaniti(event, personel)
    } catch (hata: any) {
      return { basarili: false, hata: hata.message }
    }
  })

  // Uygulama yeniden açıldığında kayıtlı token ile oturumu ana işlemde yeniden kurar
  ipcMain.handle(PERSONEL_KANALLARI.OTURUM_DOGRULA, async (event, token: string) => {
    try {
      const veri = verify(String(token || ''), JWT_SECRET) as any
      const personel = db.prepare('SELECT * FROM personel WHERE id = ? AND aktif = 1').get(veri?.id) as any
      if (!personel) return { basarili: false, hata: 'Oturum geçersiz' }
      oturumAc(event, personel.id)
      return {
        basarili: true,
        personel: { ...personelGuvenli(personel), tam_adi: `${personel.ad} ${personel.soyad}` },
        pinDegistirmeli: personel.pin_degismeli === 1,
      }
    } catch {
      return { basarili: false, hata: 'Oturum süresi doldu' }
    }
  })

  ipcMain.handle(PERSONEL_KANALLARI.CIKIS_YAP, async (event) => {
    oturumKapat(event)
    return { basarili: true }
  })

  // Oturumdaki personel kendi PIN'ini değiştirir (varsayılan PIN ile ilk girişte zorunlu)
  ipcMain.handle(PERSONEL_KANALLARI.PIN_DEGISTIR, async (event, yeniPin: string) => {
    const oturum = oturumGetir(event)
    if (!oturum) return { basarili: false, hata: 'Önce giriş yapın' }
    if (!yeniPin) return { basarili: false, hata: 'Yeni PIN gerekli' }
    const hata = pinHatasi(db, yeniPin, pinOzeti, oturum.personelId)
    if (hata) return { basarili: false, hata }
    db.prepare('UPDATE personel SET pin_hash = ?, pin_kodu = NULL, pin_degismeli = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(pinOzeti(yeniPin), oturum.personelId)
    denetimYaz(db, { personel_id: oturum.personelId, islem: 'pin_degistir', modul: 'personel', hedef_tip: 'personel', hedef_id: oturum.personelId, ozet: 'PIN değiştirildi' })
    return { basarili: true }
  })

  // Yönetici onayı: yetkili bir personelin PIN'i bu ekrana kısa süreli onay verir
  ipcMain.handle(PERSONEL_KANALLARI.YONETICI_ONAYI, async (event, pin: string, yetki: string) => {
    if (!YETKI_ETIKETLERI[yetki]) return { basarili: false, hata: 'Bilinmeyen yetki' }
    const anahtar = 'onay:' + oturumAnahtari(event)
    const izin = pinGirisLimiti.izinVarMi(anahtar)
    if (!izin.izinli) return { basarili: false, hata: `Çok fazla hatalı deneme. ${izin.beklemeSn} sn bekleyin` }

    const [modul, islem] = yetki.split('/')
    const onaylayan = pinIlePersonelBul(db, String(pin || ''), pinOzeti)
    if (!onaylayan || !yetkiVarMi(db, onaylayan.rol, modul, islem)) {
      pinGirisLimiti.hatali(anahtar)
      return { basarili: false, hata: onaylayan ? `${onaylayan.ad} bu işlemi onaylayamaz` : 'Geçersiz PIN' }
    }
    pinGirisLimiti.basarili(anahtar)
    onayEkle(event, onaylayan.id, yetki)
    denetimYaz(db, {
      personel_id: onaylayan.id,
      personel_adi: `${onaylayan.ad} ${onaylayan.soyad}`,
      islem: 'yonetici_onayi',
      modul,
      ozet: `${YETKI_ETIKETLERI[yetki]} onaylandı`,
      detay: { yetki, isteyen: oturumGetir(event)?.personelId ?? null },
    })
    return { basarili: true, onaylayan: `${onaylayan.ad} ${onaylayan.soyad}` }
  })

  // Personel listele — giriş ekranı da kullanır; PIN / şifre bilgisi asla dönmez
  ipcMain.handle(PERSONEL_KANALLARI.LISTELE, async () => {
    return db.prepare(`
      SELECT id, ad, soyad, kullanici_adi, rol, aktif, telefon, created_at,
             CASE WHEN pin_hash IS NOT NULL THEN 1 ELSE 0 END as pin_tanimli
      FROM personel ORDER BY ad
    `).all()
  })

  // Personel ekle
  ipcMain.handle(PERSONEL_KANALLARI.EKLE, async (event, yeniPersonel: YeniPersonel) => {
    try {
      yetkiIste(db, event, 'personel/yazma')
      if (!yeniPersonel?.sifre) return { basarili: false, hata: 'Şifre gerekli' }
      const pinHata = pinHatasi(db, yeniPersonel.pin_kodu, pinOzeti)
      if (pinHata) return { basarili: false, hata: pinHata }
      const sonuc = db.prepare(`
        INSERT INTO personel (ad, soyad, kullanici_adi, sifre_hash, rol, pin_hash, telefon)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        yeniPersonel.ad,
        yeniPersonel.soyad,
        yeniPersonel.kullanici_adi,
        hashSync(yeniPersonel.sifre, 10),
        yeniPersonel.rol,
        yeniPersonel.pin_kodu ? pinOzeti(yeniPersonel.pin_kodu) : null,
        yeniPersonel.telefon || null
      )
      return { basarili: true, id: sonuc.lastInsertRowid }
    } catch (hata: any) {
      return yetkiYaniti(hata)
    }
  })

  // Personel güncelle — pin_kodu: undefined = değişmez, '' = PIN kaldırılır
  ipcMain.handle(PERSONEL_KANALLARI.GUNCELLE, async (event, id: number, veriler: Partial<YeniPersonel>) => {
    try {
      yetkiIste(db, event, 'personel/yazma')
      if (veriler.pin_kodu !== undefined) {
        const pinHata = pinHatasi(db, veriler.pin_kodu, pinOzeti, id)
        if (pinHata) return { basarili: false, hata: pinHata }
      }
      const alanlar: string[] = []
      const degerler: any[] = []

      if (veriler.ad) { alanlar.push('ad = ?'); degerler.push(veriler.ad) }
      if (veriler.soyad) { alanlar.push('soyad = ?'); degerler.push(veriler.soyad) }
      if (veriler.rol) { alanlar.push('rol = ?'); degerler.push(veriler.rol) }
      if (veriler.pin_kodu !== undefined) {
        alanlar.push('pin_hash = ?', 'pin_kodu = NULL', 'pin_degismeli = 0')
        degerler.push(veriler.pin_kodu ? pinOzeti(veriler.pin_kodu) : null)
      }
      if (veriler.telefon !== undefined) { alanlar.push('telefon = ?'); degerler.push(veriler.telefon) }
      if (veriler.sifre) {
        alanlar.push('sifre_hash = ?')
        degerler.push(hashSync(veriler.sifre, 10))
      }

      alanlar.push('updated_at = CURRENT_TIMESTAMP')
      degerler.push(id)

      db.prepare(`UPDATE personel SET ${alanlar.join(', ')} WHERE id = ?`).run(...degerler)
      return { basarili: true }
    } catch (hata: any) {
      return yetkiYaniti(hata)
    }
  })

  // Personel sil (soft delete)
  ipcMain.handle(PERSONEL_KANALLARI.SIL, async (event, id: number) => {
    try {
      yetkiIste(db, event, 'personel/yazma')
      db.prepare('UPDATE personel SET aktif = 0 WHERE id = ?').run(id)
      return { basarili: true }
    } catch (hata: any) {
      return yetkiYaniti(hata)
    }
  })

  // Yetkileri getir
  ipcMain.handle(PERSONEL_KANALLARI.YETKILERI_GETIR, async (_event, rol: string) => {
    return db.prepare('SELECT * FROM yetki WHERE rol = ?').all(rol)
  })

  // Yetki güncelle — admin rolünün yetkileri sabittir
  ipcMain.handle(PERSONEL_KANALLARI.YETKI_GUNCELLE, async (event, id: number, izin: boolean) => {
    try {
      yetkiIste(db, event, 'personel/yazma')
      const satir = db.prepare('SELECT rol FROM yetki WHERE id = ?').get(id) as any
      if (!satir) return { basarili: false, hata: 'Yetki bulunamadı' }
      if (satir.rol === 'admin') return { basarili: false, hata: 'Yönetici yetkileri değiştirilemez' }
      db.prepare('UPDATE yetki SET izin = ? WHERE id = ?').run(izin ? 1 : 0, id)
      return { basarili: true }
    } catch (hata: any) {
      return yetkiYaniti(hata)
    }
  })
}
