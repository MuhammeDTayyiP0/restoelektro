// =====================================================
// Rezervasyon defteri IPC
// =====================================================

import { IpcMain, BrowserWindow } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { REZERVASYON_KANALLARI } from '../../common/ipc-channels'
import { denetimYaz } from '../services/audit.service'

function bugunYerel(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function masalariYayinla(): void {
  for (const pencere of BrowserWindow.getAllWindows()) {
    pencere.webContents.send('masalar:guncellendi')
  }
}

export function rezervasyonIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  function masaAcikHesapVar(masaId: number): boolean {
    const row = db.prepare("SELECT id FROM hesap WHERE masa_id = ? AND durum = 'acik' LIMIT 1").get(masaId) as any
    return !!row
  }

  function masaRezerveIsle(masaId: number | null | undefined, tarih: string): void {
    if (!masaId) return
    if (tarih !== bugunYerel()) return
    if (masaAcikHesapVar(masaId)) return
    db.prepare("UPDATE masa SET durum = 'rezerve' WHERE id = ? AND durum NOT IN ('dolu', 'birlesti')").run(masaId)
  }

  function masaRezerveBirak(masaId: number | null | undefined): void {
    if (!masaId) return
    if (masaAcikHesapVar(masaId)) return
    const kalan = db.prepare(`
      SELECT id FROM rezervasyon
      WHERE masa_id = ? AND durum = 'bekliyor' AND tarih = ?
      LIMIT 1
    `).get(masaId, bugunYerel()) as any
    if (!kalan) {
      db.prepare("UPDATE masa SET durum = 'bos' WHERE id = ? AND durum = 'rezerve'").run(masaId)
    }
  }

  ipcMain.handle(REZERVASYON_KANALLARI.LISTELE, async (_e, filtre: any = {}) => {
    const kosul: string[] = []
    const deger: any[] = []
    if (filtre?.tarih) {
      kosul.push('r.tarih = ?')
      deger.push(filtre.tarih)
    } else if (filtre?.baslangic && filtre?.bitis) {
      kosul.push('r.tarih >= ? AND r.tarih <= ?')
      deger.push(filtre.baslangic, filtre.bitis)
    }
    if (filtre?.durum && filtre.durum !== 'tumu') {
      kosul.push('r.durum = ?')
      deger.push(filtre.durum)
    }
    const where = kosul.length ? `WHERE ${kosul.join(' AND ')}` : ''
    return db.prepare(`
      SELECT r.*, m.numara as masa_numara, b.ad as bolum_adi,
             p.ad || ' ' || p.soyad as personel_adi
      FROM rezervasyon r
      LEFT JOIN masa m ON m.id = r.masa_id
      LEFT JOIN bolum b ON b.id = m.bolum_id
      LEFT JOIN personel p ON p.id = r.personel_id
      ${where}
      ORDER BY r.tarih ASC, r.saat ASC, r.id ASC
    `).all(...deger)
  })

  ipcMain.handle(REZERVASYON_KANALLARI.EKLE, async (_e, veri: any) => {
    if (!veri?.musteri_ad || !veri?.tarih || !veri?.saat) {
      return { basarili: false, hata: 'Ad, tarih ve saat zorunlu' }
    }
    const masaId = veri.masa_id || null
    const sonuc = db.prepare(`
      INSERT INTO rezervasyon (masa_id, musteri_id, musteri_ad, telefon, kisi_sayisi, tarih, saat, durum, notlar, personel_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'bekliyor', ?, ?)
    `).run(
      masaId,
      veri.musteri_id || null,
      String(veri.musteri_ad).trim(),
      veri.telefon || null,
      Number(veri.kisi_sayisi || 2),
      veri.tarih,
      veri.saat,
      veri.notlar || null,
      veri.personel_id || null
    )
    masaRezerveIsle(masaId, veri.tarih)
    denetimYaz(db, {
      personel_id: veri.personel_id,
      islem: 'rezervasyon_ekle',
      modul: 'rezervasyon',
      hedef_tip: 'rezervasyon',
      hedef_id: Number(sonuc.lastInsertRowid),
      ozet: `${veri.musteri_ad} — ${veri.tarih} ${veri.saat}`,
    })
    masalariYayinla()
    return { basarili: true, id: sonuc.lastInsertRowid }
  })

  ipcMain.handle(REZERVASYON_KANALLARI.GUNCELLE, async (_e, id: number, veri: any) => {
    const eski = db.prepare('SELECT masa_id, tarih FROM rezervasyon WHERE id = ?').get(id) as any
    if (!eski) return { basarili: false, hata: 'Rezervasyon bulunamadı' }
    const alanlar: string[] = []
    const degerler: any[] = []
    const izinli = ['masa_id', 'musteri_id', 'musteri_ad', 'telefon', 'kisi_sayisi', 'tarih', 'saat', 'durum', 'notlar']
    for (const k of izinli) {
      if (veri && veri[k] !== undefined) {
        alanlar.push(`${k} = ?`)
        degerler.push(veri[k])
      }
    }
    if (!alanlar.length) return { basarili: false, hata: 'Güncellenecek alan yok' }
    degerler.push(id)
    db.prepare(`UPDATE rezervasyon SET ${alanlar.join(', ')} WHERE id = ?`).run(...degerler)

    const yeniMasa = veri.masa_id !== undefined ? veri.masa_id : eski.masa_id
    const yeniTarih = veri.tarih !== undefined ? veri.tarih : eski.tarih
    if (eski.masa_id && Number(eski.masa_id) !== Number(yeniMasa || 0)) {
      masaRezerveBirak(eski.masa_id)
    }
    const guncel = db.prepare('SELECT durum FROM rezervasyon WHERE id = ?').get(id) as any
    if (guncel?.durum === 'bekliyor') {
      masaRezerveIsle(yeniMasa, yeniTarih)
    } else {
      masaRezerveBirak(yeniMasa)
    }
    masalariYayinla()
    return { basarili: true }
  })

  ipcMain.handle(REZERVASYON_KANALLARI.DURUM, async (_e, id: number, durum: string, personelId?: number) => {
    const izin = ['bekliyor', 'geldi', 'iptal', 'no_show']
    if (!izin.includes(durum)) return { basarili: false, hata: 'Geçersiz durum' }
    const kayit = db.prepare('SELECT masa_id, tarih FROM rezervasyon WHERE id = ?').get(id) as any
    db.prepare('UPDATE rezervasyon SET durum = ? WHERE id = ?').run(durum, id)
    if (durum === 'bekliyor' && kayit) {
      masaRezerveIsle(kayit.masa_id, kayit.tarih)
    } else if (kayit?.masa_id) {
      masaRezerveBirak(kayit.masa_id)
    }
    denetimYaz(db, {
      personel_id: personelId,
      islem: 'rezervasyon_durum',
      modul: 'rezervasyon',
      hedef_tip: 'rezervasyon',
      hedef_id: id,
      ozet: `Durum: ${durum}`,
    })
    masalariYayinla()
    return { basarili: true }
  })

  ipcMain.handle(REZERVASYON_KANALLARI.SIL, async (_e, id: number, personelId?: number) => {
    const kayit = db.prepare('SELECT masa_id FROM rezervasyon WHERE id = ?').get(id) as any
    db.prepare('DELETE FROM rezervasyon WHERE id = ?').run(id)
    if (kayit?.masa_id) masaRezerveBirak(kayit.masa_id)
    denetimYaz(db, {
      personel_id: personelId,
      islem: 'rezervasyon_sil',
      modul: 'rezervasyon',
      hedef_tip: 'rezervasyon',
      hedef_id: id,
      ozet: `Rezervasyon silindi #${id}`,
    })
    masalariYayinla()
    return { basarili: true }
  })
}
