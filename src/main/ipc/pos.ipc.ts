// =====================================================
// POS & Hesap IPC Handler'ları
// Hesap açma/kapama, sipariş, ödeme, indirim, bölme
// İş kuralları services/siparis.service.ts içindedir
// =====================================================

import { IpcMain, BrowserWindow } from 'electron'
import { veritabaniGetir } from '../database/connection'
import { HESAP_KANALLARI } from '../../common/ipc-channels'
import type { YeniSiparis, YeniOdeme, IndirimBilgisi, HesapBolme } from '../../common/types/pos.types'
import { denetimYaz } from '../services/audit.service'
import {
  IslemHatasi,
  hesapAc,
  siparisleriEkle,
  siparisIptalEt,
  siparisIkramAyarla,
  indirimUygula,
  odemeAl,
  hesapBol,
  hesapIptalEt,
} from '../services/siparis.service'

function hataYaniti(hata: any): { basarili: false; hata: string } {
  if (!(hata instanceof IslemHatasi)) console.error('❌ POS işlemi hatası:', hata)
  return { basarili: false, hata: hata?.message || 'İşlem başarısız' }
}

export function hesapIPCKaydet(ipcMain: IpcMain): void {
  const db = veritabaniGetir()

  // Yeni hesap aç
  ipcMain.handle(HESAP_KANALLARI.AC, async (_event, masaId: number | null, personelId: number, hesapTipi: string = 'masa', kisiSayisi: number = 1, ekstra: any = null) => {
    try {
      const sonuc = hesapAc(db, { masaId, personelId, hesapTipi, kisiSayisi, ekstra })
      return { basarili: true, ...sonuc }
    } catch (hata: any) {
      return { ...hataYaniti(hata), hesap_id: hata?.hesap_id }
    }
  })

  // Hesap detayını getir
  ipcMain.handle(HESAP_KANALLARI.DETAY, async (_event, hesapId: number) => {
    const hesap = db.prepare(`
      SELECT h.*, p.ad || ' ' || p.soyad as personel_adi, m.numara as masa_numara,
             mu.ad || ' ' || COALESCE(mu.soyad, '') as musteri_adi
      FROM hesap h
      LEFT JOIN personel p ON p.id = h.personel_id
      LEFT JOIN masa m ON m.id = h.masa_id
      LEFT JOIN musteri mu ON mu.id = h.musteri_id
      WHERE h.id = ?
    `).get(hesapId) as any

    if (!hesap) return null

    // Siparişleri getir
    hesap.siparisler = db.prepare(`
      SELECT s.*, u.ad as urun_adi, u.birim as urun_birim, v.ad as varyant_adi, k.ad as kategori_adi
      FROM siparis s
      JOIN urun u ON u.id = s.urun_id
      LEFT JOIN urun_varyant v ON v.id = s.varyant_id
      JOIN kategori k ON k.id = u.kategori_id
      WHERE s.hesap_id = ?
      ORDER BY s.siparis_zamani DESC
    `).all(hesapId)

    // Ödemeleri getir
    hesap.odemeler = db.prepare(`
      SELECT o.*, p.ad || ' ' || p.soyad as personel_adi
      FROM odeme o
      JOIN personel p ON p.id = o.personel_id
      WHERE o.hesap_id = ?
    `).all(hesapId)

    return hesap
  })

  // Açık hesapları listele
  ipcMain.handle(HESAP_KANALLARI.ACIK_HESAPLAR, async () => {
    return db.prepare(`
      SELECT h.*, p.ad || ' ' || p.soyad as personel_adi, m.numara as masa_numara,
             (SELECT COUNT(*) FROM siparis s WHERE s.hesap_id = h.id AND s.durum != 'iptal') as siparis_sayisi
      FROM hesap h
      LEFT JOIN personel p ON p.id = h.personel_id
      LEFT JOIN masa m ON m.id = h.masa_id
      WHERE h.durum = 'acik'
      ORDER BY h.acilis_zamani DESC
    `).all()
  })

  // Sipariş ekle — fiyatlar istemciden alınmaz, sunucuda yeniden hesaplanır
  ipcMain.handle(HESAP_KANALLARI.SIPARIS_EKLE, async (_event, hesapId: number, personelId: number, siparisler: YeniSiparis[]) => {
    try {
      const kalemler = siparisleriEkle(db, hesapId, personelId, siparisler as any)

      // Mutfak ekranına bildirim gönder
      for (const pencere of BrowserWindow.getAllWindows()) {
        pencere.webContents.send('mutfak:yeni-siparis', { hesap_id: hesapId })
      }

      return { basarili: true, siparis_idleri: kalemler.map((k) => k.siparis_id) }
    } catch (hata: any) {
      return hataYaniti(hata)
    }
  })

  // Sipariş iptal
  ipcMain.handle(HESAP_KANALLARI.SIPARIS_IPTAL, async (_event, siparisId: number, iptalNedeni: string, onaylayanId: number) => {
    try {
      const siparis = siparisIptalEt(db, siparisId, iptalNedeni, onaylayanId)
      denetimYaz(db, {
        personel_id: onaylayanId,
        islem: 'siparis_iptal',
        modul: 'pos',
        hedef_tip: 'siparis',
        hedef_id: siparisId,
        ozet: `Sipariş iptal #${siparisId} — ${iptalNedeni || ''}`,
        detay: { iptalNedeni, hesap_id: siparis.hesap_id },
      })
      return { basarili: true }
    } catch (hata: any) {
      return hataYaniti(hata)
    }
  })

  // Sipariş İkram Toggle
  ipcMain.handle(HESAP_KANALLARI.SIPARIS_IKRAM_TOGGLE, async (_event, siparisId: number, onaylayanId: number) => {
    try {
      const sonuc = siparisIkramAyarla(db, siparisId, null, onaylayanId)
      denetimYaz(db, {
        personel_id: onaylayanId,
        islem: sonuc.ikram ? 'ikram' : 'ikram_kaldir',
        modul: 'pos',
        hedef_tip: 'siparis',
        hedef_id: siparisId,
        ozet: sonuc.ikram ? `İkram uygulandı #${siparisId}` : `İkram kaldırıldı #${siparisId}`,
      })
      return { basarili: true, yeniIkram: sonuc.ikram ? 1 : 0 }
    } catch (hata: any) {
      return hataYaniti(hata)
    }
  })

  // İndirim uygula
  ipcMain.handle(HESAP_KANALLARI.INDIRIM_UYGULA, async (_event, indirim: IndirimBilgisi) => {
    try {
      const sonuc = indirimUygula(db, indirim as any)
      denetimYaz(db, {
        islem: 'indirim',
        modul: 'pos',
        hedef_tip: 'hesap',
        hedef_id: indirim.hesap_id,
        ozet: `İndirim ${indirim.indirim_tipi} ${indirim.deger} → ${sonuc.indirim_tutar.toFixed(2)} ₺`,
        detay: indirim,
      })
      return { basarili: true, ...sonuc }
    } catch (hata: any) {
      return hataYaniti(hata)
    }
  })

  // Ödeme al
  ipcMain.handle(HESAP_KANALLARI.ODEME_AL, async (_event, odemeler: YeniOdeme[]) => {
    try {
      const sonuc = odemeAl(db, odemeler as any)
      try {
        const hesapId = odemeler[0]?.hesap_id
        denetimYaz(db, {
          personel_id: odemeler[0]?.personel_id,
          islem: sonuc.kapandi ? 'odeme_kapat' : 'odeme',
          modul: 'pos',
          hedef_tip: 'hesap',
          hedef_id: hesapId,
          ozet: sonuc.kapandi
            ? `Hesap kapatıldı #${hesapId}`
            : `Kısmi ödeme #${hesapId} — kalan ${sonuc.kalan}`,
          detay: odemeler.map((o) => ({ tip: o.odeme_tipi, alinan: o.tutar })),
        })
      } catch {
        // denetim hatası ödemeyi bozmasın
      }
      return { basarili: true, ...sonuc }
    } catch (hata: any) {
      return hataYaniti(hata)
    }
  })

  // Hesap bölme
  ipcMain.handle(HESAP_KANALLARI.HESAP_BOL, async (_event, bolme: HesapBolme) => {
    try {
      return { basarili: true, ...hesapBol(db, bolme as any) }
    } catch (hata: any) {
      return hataYaniti(hata)
    }
  })

  // Hesap iptal
  ipcMain.handle(HESAP_KANALLARI.IPTAL, async (_event, hesapId: number) => {
    try {
      hesapIptalEt(db, hesapId)
      denetimYaz(db, {
        islem: 'hesap_iptal',
        modul: 'pos',
        hedef_tip: 'hesap',
        hedef_id: hesapId,
        ozet: `Hesap iptal #${hesapId}`,
      })
      return { basarili: true }
    } catch (hata: any) {
      return hataYaniti(hata)
    }
  })

  ipcMain.handle(HESAP_KANALLARI.PAKET_LISTELE, async (_event, filtre: any = {}) => {
    const kosul: string[] = ["h.hesap_tipi IN ('paket', 'gel_al', 'bar')"]
    const deger: any[] = []
    if (filtre?.durum === 'acik' || !filtre?.durum) {
      kosul.push("h.durum = 'acik'")
    } else if (filtre.durum === 'kapali') {
      kosul.push("h.durum != 'acik'")
    } else if (filtre.durum && filtre.durum !== 'tumu') {
      kosul.push('h.durum = ?')
      deger.push(filtre.durum)
    }
    if (filtre?.hesap_tipi && filtre.hesap_tipi !== 'tumu') {
      kosul[0] = 'h.hesap_tipi = ?'
      deger.unshift(filtre.hesap_tipi)
    }
    if (filtre?.teslimat_durumu && filtre.teslimat_durumu !== 'tumu') {
      kosul.push('h.teslimat_durumu = ?')
      deger.push(filtre.teslimat_durumu)
    }
    return db.prepare(`
      SELECT h.*, p.ad || ' ' || p.soyad as personel_adi,
             (SELECT COUNT(*) FROM siparis s WHERE s.hesap_id = h.id AND s.durum != 'iptal') as siparis_sayisi
      FROM hesap h
      LEFT JOIN personel p ON p.id = h.personel_id
      WHERE ${kosul.join(' AND ')}
      ORDER BY h.acilis_zamani DESC
      LIMIT 200
    `).all(...deger)
  })

  ipcMain.handle(HESAP_KANALLARI.TESLIMAT_GUNCELLE, async (_event, hesapId: number, veri: any) => {
    const alanlar: string[] = []
    const degerler: any[] = []
    const izinli = ['teslimat_durumu', 'teslimat_telefon', 'teslimat_adres', 'teslimat_musteri', 'kurye', 'musteri_id', 'notlar', 'kisi_sayisi']
    for (const k of izinli) {
      if (veri && veri[k] !== undefined) {
        alanlar.push(`${k} = ?`)
        degerler.push(veri[k])
      }
    }
    if (!alanlar.length) return { basarili: false, hata: 'Güncellenecek alan yok' }
    degerler.push(hesapId)
    db.prepare(`UPDATE hesap SET ${alanlar.join(', ')} WHERE id = ?`).run(...degerler)
    return { basarili: true }
  })
}
