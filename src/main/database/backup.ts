// =====================================================
// SQLite Otomatik Yerel Yedekleme (Auto-Backup) Yöneticisi
// better-sqlite3 native backup API'si ile WAL güvenli anlık yedekleme
// =====================================================

import type Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, statSync, unlinkSync } from 'fs'

/** Her durumda saklanan en yeni yedek sayısı */
const SON_YEDEK_ADEDI = 20
/** Son N gün için günde bir yedek saklanır */
const GUNLUK_SAKLAMA_GUN = 30
/** Son N ay için ayda bir yedek saklanır */
const AYLIK_SAKLAMA_AY = 12

/**
 * Yedekleme klasör yolunu getirir (userData/backups)
 */
export function yedekKlasoruGetir(): string {
  const userData = app.getPath('userData')
  const backupDir = join(userData, 'backups')
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true })
  }
  return backupDir
}

/**
 * Tarih ve saat damgalı yedek dosya adı üretir
 * Örn: backup-2026-08-28-143022.sqlite
 */
export function yedekDosyaAdiUret(prefix = 'backup'): string {
  const simdi = new Date()
  const yil = simdi.getFullYear()
  const ay = String(simdi.getMonth() + 1).padStart(2, '0')
  const gun = String(simdi.getDate()).padStart(2, '0')
  const saat = String(simdi.getHours()).padStart(2, '0')
  const dakika = String(simdi.getMinutes()).padStart(2, '0')
  const saniye = String(simdi.getSeconds()).padStart(2, '0')

  return `${prefix}-${yil}-${ay}-${gun}-${saat}${dakika}${saniye}.sqlite`
}

export interface YedekBilgisi {
  dosyaAdi: string
  tamYol: string
  boyutBytes: number
  boyutFormatted: string
  olusturmaTarihi: Date
}

/**
 * Bir klasördeki yedekleri tarihe göre yeniden eskiye listeler
 */
export function yedekleriListele(klasor: string = yedekKlasoruGetir()): YedekBilgisi[] {
  if (!existsSync(klasor)) return []

  try {
    const dosyalar = readdirSync(klasor)
      .filter(f => f.startsWith('backup') && (f.endsWith('.sqlite') || f.endsWith('.db')))
      .map(dosyaAdi => {
        const tamYol = join(klasor, dosyaAdi)
        const stats = statSync(tamYol)
        const boyutMB = (stats.size / (1024 * 1024)).toFixed(2)
        const boyutKB = (stats.size / 1024).toFixed(1)
        const boyutFormatted = stats.size > 1024 * 1024 ? `${boyutMB} MB` : `${boyutKB} KB`

        return {
          dosyaAdi,
          tamYol,
          boyutBytes: stats.size,
          boyutFormatted,
          olusturmaTarihi: stats.mtime,
        }
      })
      .sort((a, b) => b.olusturmaTarihi.getTime() - a.olusturmaTarihi.getTime())

    return dosyalar
  } catch (error) {
    console.error('❌ Yedekler listelenirken hata:', error)
    return []
  }
}

/**
 * Saklanacak yedekleri seçer:
 * en yeni 20 yedek + son 30 günün her gününden bir + son 12 ayın her ayından bir.
 * Böylece sık açılıp kapanan bir kasada bile aylarca geriye dönülebilir.
 */
export function saklanacakYedekler(yedekler: Array<{ dosyaAdi: string; olusturmaTarihi: Date }>, simdi = new Date()): Set<string> {
  const sirali = [...yedekler].sort((a, b) => b.olusturmaTarihi.getTime() - a.olusturmaTarihi.getTime())
  const sakla = new Set(sirali.slice(0, SON_YEDEK_ADEDI).map(y => y.dosyaAdi))
  const gunler = new Set<string>()
  const aylar = new Set<string>()
  const gunMs = 24 * 60 * 60 * 1000

  for (const y of sirali) {
    const t = y.olusturmaTarihi
    const yasGun = (simdi.getTime() - t.getTime()) / gunMs
    const gunAnahtar = `${t.getFullYear()}-${t.getMonth()}-${t.getDate()}`
    const ayAnahtar = `${t.getFullYear()}-${t.getMonth()}`

    if (yasGun <= GUNLUK_SAKLAMA_GUN && !gunler.has(gunAnahtar)) {
      gunler.add(gunAnahtar)
      sakla.add(y.dosyaAdi)
    }
    if (yasGun <= AYLIK_SAKLAMA_AY * 31 && !aylar.has(ayAnahtar)) {
      aylar.add(ayAnahtar)
      sakla.add(y.dosyaAdi)
    }
  }
  return sakla
}

/**
 * Saklama politikası dışında kalan eski yedekleri siler
 */
export function eskiYedekleriTemizle(klasor: string = yedekKlasoruGetir()): void {
  try {
    const yedekler = yedekleriListele(klasor)
    const sakla = saklanacakYedekler(yedekler)
    for (const yedek of yedekler) {
      if (!sakla.has(yedek.dosyaAdi) && existsSync(yedek.tamYol)) {
        unlinkSync(yedek.tamYol)
        console.log(`🗑️ Eski yedek temizlendi: ${yedek.dosyaAdi}`)
      }
    }
  } catch (error) {
    console.error('❌ Eski yedekler temizlenirken hata:', error)
  }
}

/** Ayarlarda tanımlı harici yedek klasörü (USB, bulut senkron klasörü) */
export function hariciYedekKlasoruGetir(db: Database.Database): string | null {
  try {
    const satir = db.prepare("SELECT deger FROM ayar WHERE anahtar = 'harici_yedek_klasoru'").get() as any
    const klasor = typeof satir?.deger === 'string' ? satir.deger.trim() : ''
    return klasor || null
  } catch {
    return null
  }
}

function hariciKlasoreKopyala(db: Database.Database, kaynak: string, dosyaAdi: string): string | undefined {
  const klasor = hariciYedekKlasoruGetir(db)
  if (!klasor) return undefined
  try {
    if (!existsSync(klasor)) return `Harici yedek klasörü bulunamadı: ${klasor}`
    copyFileSync(kaynak, join(klasor, dosyaAdi))
    eskiYedekleriTemizle(klasor)
    return undefined
  } catch (err: any) {
    console.error('❌ Harici klasöre yedek kopyalanamadı:', err)
    return err?.message || 'Harici klasöre kopyalanamadı'
  }
}

let devamEdenYedek: Promise<{ basarili: boolean; dosyaYolu?: string; hata?: string; hariciHata?: string }> | null = null

/**
 * better-sqlite3 native backup API'si ile tam tutarlı anlık yedek alır.
 * Önce .tmp dosyasına yazılır ve yalnızca başarılıysa .sqlite adını alır — yarım yedek listede görünmez.
 * Aynı anda tek yedek çalışır; eşzamanlı çağrılar devam eden işlemi bekler.
 */
export function otomatikYedekAl(
  db: Database.Database,
  sebep: 'acilis' | 'kapanis' | 'manuel' | 'migration' = 'manuel'
): Promise<{ basarili: boolean; dosyaYolu?: string; hata?: string; hariciHata?: string }> {
  if (devamEdenYedek) return devamEdenYedek

  const islem = (async () => {
    const backupDir = yedekKlasoruGetir()
    const dosyaAdi = yedekDosyaAdiUret(`backup-${sebep}`)
    const hedefYol = join(backupDir, dosyaAdi)
    const geciciYol = `${hedefYol}.tmp`

    try {
      console.log(`💾 Veritabanı yedeği alınıyor (${sebep}): ${dosyaAdi}...`)

      // better-sqlite3 Online Backup API — WAL modunda kilitleme yapmadan güvenli kopyalar
      await db.backup(geciciYol)
      renameSync(geciciYol, hedefYol)

      console.log(`✅ Yedekleme başarıyla tamamlandı: ${hedefYol}`)

      const hariciHata = hariciKlasoreKopyala(db, hedefYol, dosyaAdi)
      eskiYedekleriTemizle(backupDir)

      return { basarili: true, dosyaYolu: hedefYol, hariciHata }
    } catch (error: any) {
      console.error(`❌ Yedekleme sırasında hata (${sebep}):`, error)
      try { if (existsSync(geciciYol)) unlinkSync(geciciYol) } catch { /* yok say */ }
      return {
        basarili: false,
        hata: error?.message || 'Bilinmeyen yedekleme hatası',
      }
    }
  })()

  devamEdenYedek = islem
  void islem.then(() => { if (devamEdenYedek === islem) devamEdenYedek = null })
  return islem
}
