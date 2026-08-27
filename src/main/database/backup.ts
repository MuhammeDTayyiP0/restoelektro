// =====================================================
// SQLite Otomatik Yerel Yedekleme (Auto-Backup) Yöneticisi
// better-sqlite3 native backup API'si ile WAL güvenli anlık yedekleme
// =====================================================

import type Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'

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
 * Mevcut yedekleri tarihe göre yeniden eskiye listeler
 */
export function yedekleriListele(): YedekBilgisi[] {
  const backupDir = yedekKlasoruGetir()
  if (!existsSync(backupDir)) return []

  try {
    const dosyalar = readdirSync(backupDir)
      .filter(f => f.endsWith('.sqlite') || f.endsWith('.db'))
      .map(dosyaAdi => {
        const tamYol = join(backupDir, dosyaAdi)
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
 * Belirtilen adetten eski yedekleri silerek disk alanını korur
 */
export function eskiYedekleriTemizle(maksimumAdet = 30): void {
  try {
    const yedekler = yedekleriListele()
    if (yedekler.length > maksimumAdet) {
      const silinecekler = yedekler.slice(maksimumAdet)
      for (const yedek of silinecekler) {
        if (existsSync(yedek.tamYol)) {
          unlinkSync(yedek.tamYol)
          console.log(`🗑️ Eski yedek temizlendi: ${yedek.dosyaAdi}`)
        }
      }
    }
  } catch (error) {
    console.error('❌ Eski yedekler temizlenirken hata:', error)
  }
}

/**
 * better-sqlite3 native backup API'si ile tam tutarlı anlık yedek alır
 */
export async function otomatikYedekAl(
  db: Database.Database,
  sebep: 'acilis' | 'kapanis' | 'manuel' | 'migration' = 'manuel'
): Promise<{ basarili: boolean; dosyaYolu?: string; hata?: string }> {
  try {
    const backupDir = yedekKlasoruGetir()
    const dosyaAdi = yedekDosyaAdiUret(`backup-${sebep}`)
    const hedefYol = join(backupDir, dosyaAdi)

    console.log(`💾 Veritabanı yedeği alınıyor (${sebep}): ${dosyaAdi}...`)

    // better-sqlite3 Online Backup API — WAL modunda kilitleme yapmadan güvenli kopyalar
    await db.backup(hedefYol)

    console.log(`✅ Yedekleme başarıyla tamamlandı: ${hedefYol}`)

    // Disk yönetimi için eski yedekleri sınırla (varsayılan 30 adet)
    eskiYedekleriTemizle(30)

    return {
      basarili: true,
      dosyaYolu: hedefYol,
    }
  } catch (error: any) {
    console.error(`❌ Yedekleme sırasında hata (${sebep}):`, error)
    return {
      basarili: false,
      hata: error?.message || 'Bilinmeyen yedekleme hatası',
    }
  }
}
