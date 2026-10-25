// =====================================================
// Ana işlemde oturum, rol yetkisi ve yönetici onayı
// Renderer'ın "ben şu personelim" demesine güvenilmez: giriş yapan kişi burada tutulur
// =====================================================

import type Database from 'better-sqlite3'
import { IslemHatasi } from './siparis.service'
import { MENU_KANALLARI, KASA_KANALLARI } from '../../common/ipc-channels'
import { YETKI_ETIKETLERI } from '../../common/yetkiler'

export interface Oturum {
  personelId: number
}

interface Onay {
  personelId: number
  yetki: string
  bitis: number
}

/** Yönetici onayı aynı işlem için bu süre boyunca geçerli (örn. birden fazla kalemi iptal etmek) */
export const ONAY_SURESI_MS = 30_000

const oturumlar = new Map<string, Oturum>()
const onaylar = new Map<string, Onay[]>()

export { YETKI_ETIKETLERI }

/**
 * Kayıt sırasında yetki kontrolüyle sarılan kanallar (ipc-registry).
 * POS kanalları koşullu kontrol gerektirdiğinden (örn. yalnızca ikramlı kalem) pos.ipc.ts içinde denetlenir.
 */
export const KANAL_YETKILERI: Record<string, string> = {
  [MENU_KANALLARI.KATEGORI_EKLE]: 'menu/yazma',
  [MENU_KANALLARI.KATEGORI_GUNCELLE]: 'menu/yazma',
  [MENU_KANALLARI.KATEGORI_SIL]: 'menu/yazma',
  [MENU_KANALLARI.URUN_EKLE]: 'menu/yazma',
  [MENU_KANALLARI.URUN_GUNCELLE]: 'menu/yazma',
  [MENU_KANALLARI.URUN_SIL]: 'menu/yazma',
  [MENU_KANALLARI.RESIM_YUKLE]: 'menu/yazma',
  [MENU_KANALLARI.RESIM_URL_GETIR]: 'menu/yazma',
  [MENU_KANALLARI.TOPLU_FIYAT_GUNCELLE]: 'menu/yazma',
  [KASA_KANALLARI.HAREKET_EKLE]: 'kasa/yazma',
  [KASA_KANALLARI.VARDIYA_AC]: 'kasa/yazma',
  [KASA_KANALLARI.VARDIYA_KAPAT]: 'kasa/yazma',
  [KASA_KANALLARI.GIDER_EKLE]: 'kasa/yazma',
}

/** Yetki yoksa fırlatılır; arayüz yönetici PIN'i isteyip işlemi tekrarlar */
export class YetkiHatasi extends IslemHatasi {
  constructor(public yetki: string, mesaj?: string) {
    super(mesaj || `Bu işlem için yönetici onayı gerekli: ${YETKI_ETIKETLERI[yetki] || yetki}`)
  }
}

/**
 * IPC olayının hangi ekrana ait olduğunu söyler.
 * Masaüstü pencereleri webContents id'si, ikinci kasa LAN köprüsünden gelen terminal kimliğiyle ayrılır.
 */
export function oturumAnahtari(event: any): string {
  if (event?.lanTerminal) return 'lan:' + String(event.lanTerminal)
  const id = event?.sender?.id
  return id !== undefined && id !== null ? 'win:' + id : 'yerel'
}

export function oturumAc(event: any, personelId: number): void {
  const anahtar = oturumAnahtari(event)
  oturumlar.set(anahtar, { personelId })
  onaylar.delete(anahtar)
}

export function oturumKapat(event: any): void {
  const anahtar = oturumAnahtari(event)
  oturumlar.delete(anahtar)
  onaylar.delete(anahtar)
}

export function oturumGetir(event: any): Oturum | null {
  return oturumlar.get(oturumAnahtari(event)) || null
}

/** Rol + modül + işlem için yetki tablosuna bakar (admin her zaman yetkili) */
export function yetkiVarMi(db: Database.Database, rol: string, modul: string, islem: string): boolean {
  if (rol === 'admin') return true
  const satir = db.prepare('SELECT izin FROM yetki WHERE rol = ? AND modul = ? AND islem = ?').get(rol, modul, islem) as any
  return satir?.izin === 1
}

function aktifPersonel(db: Database.Database, personelId: number | null | undefined): { id: number; rol: string; ad: string; soyad: string } | null {
  if (!personelId) return null
  return (db.prepare('SELECT id, rol, ad, soyad FROM personel WHERE id = ? AND aktif = 1').get(personelId) as any) || null
}

/** Yetkili bir personelin onayını bu oturuma ONAY_SURESI_MS boyunca ekler */
export function onayEkle(event: any, personelId: number, yetki: string): void {
  const anahtar = oturumAnahtari(event)
  const simdi = Date.now()
  const liste = (onaylar.get(anahtar) || []).filter((o) => o.bitis > simdi && o.yetki !== yetki)
  liste.push({ personelId, yetki, bitis: simdi + ONAY_SURESI_MS })
  onaylar.set(anahtar, liste)
}

/**
 * İşlem yetkisini doğrular.
 * Oturumdaki personel yetkiliyse onu, değilse geçerli yönetici onayını verenin kimliğini döndürür.
 * Hiçbiri yoksa YetkiHatasi fırlatır.
 */
export function yetkiIste(db: Database.Database, event: any, yetki: string): { personelId: number | null; onaylayanId: number } {
  const [modul, islem] = yetki.split('/')
  const oturum = oturumGetir(event)
  const personel = aktifPersonel(db, oturum?.personelId)

  if (personel && yetkiVarMi(db, personel.rol, modul, islem)) {
    return { personelId: personel.id, onaylayanId: personel.id }
  }

  const simdi = Date.now()
  const onay = (onaylar.get(oturumAnahtari(event)) || []).find((o) => o.yetki === yetki && o.bitis > simdi)
  if (onay) {
    const onaylayan = aktifPersonel(db, onay.personelId)
    if (onaylayan && yetkiVarMi(db, onaylayan.rol, modul, islem)) {
      return { personelId: personel?.id ?? null, onaylayanId: onaylayan.id }
    }
  }
  throw new YetkiHatasi(yetki)
}

/** Yalnızca testler için */
export function oturumlariSifirla(): void {
  oturumlar.clear()
  onaylar.clear()
}
