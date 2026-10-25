// =====================================================
// Hesap / Sipariş / Ödeme iş kuralları
// Masaüstü IPC, ikinci kasa köprüsü ve garson API'si aynı fonksiyonları çağırır
// =====================================================

import type Database from 'better-sqlite3'
import {
  kalemFiyatiHesapla,
  paraYuvarla,
  indirimTutariHesapla,
  odemeyiAyir,
  PARA_TOLERANS,
} from '../../common/fiyat'
import { siparisStokDusVeMaliyetHesapla, siparisStokGeriYukle } from './stock-recipe.service'

/** Kullanıcıya olduğu gibi gösterilebilecek iş kuralı hatası */
export class IslemHatasi extends Error {}

const MAX_MIKTAR = 1000
const MAX_PORSIYON = 20

function yerelGunKodu(tarih = new Date()): string {
  const y = tarih.getFullYear()
  const a = String(tarih.getMonth() + 1).padStart(2, '0')
  const g = String(tarih.getDate()).padStart(2, '0')
  return `${y}${a}${g}`
}

function pozitifSayi(deger: unknown, alan: string, ust: number): number {
  const n = Number(deger)
  if (!Number.isFinite(n) || n <= 0 || n > ust) throw new IslemHatasi(`Geçersiz ${alan}`)
  return n
}

function acikHesabiGetir(db: Database.Database, hesapId: number): any {
  const hesap = db.prepare('SELECT * FROM hesap WHERE id = ?').get(hesapId) as any
  if (!hesap) throw new IslemHatasi('Hesap bulunamadı')
  if (hesap.durum !== 'acik') throw new IslemHatasi('Bu hesap kapatılmış; işlem yapılamaz')
  return hesap
}

/** Yerel tarihli, gün içinde artan hesap numarası (HSP-YYYYMMDD-001) */
export function hesapNoOlustur(db: Database.Database): string {
  const gun = yerelGunKodu()
  const sonHesap = db.prepare(
    "SELECT hesap_no FROM hesap WHERE hesap_no LIKE ? ORDER BY id DESC LIMIT 1"
  ).get(`HSP-${gun}-%`) as any

  let sira = 1
  if (sonHesap) {
    const parsed = parseInt(String(sonHesap.hesap_no).split('-')[2], 10)
    if (!isNaN(parsed)) sira = parsed + 1
  }

  let yeniNo = `HSP-${gun}-${String(sira).padStart(3, '0')}`
  while (db.prepare('SELECT 1 FROM hesap WHERE hesap_no = ?').get(yeniNo)) {
    sira++
    yeniNo = `HSP-${gun}-${String(sira).padStart(3, '0')}`
  }
  return yeniNo
}

/**
 * Hesap toplamını, indirimi ve net tutarı yeniden hesaplar.
 * Yüzde indirim her seferinde güncel toplam üzerinden uygulanır.
 */
export function hesapToplamiGuncelle(db: Database.Database, hesapId: number): { toplam: number; indirim: number; net: number } {
  const satir = db.prepare(`
    SELECT COALESCE(SUM(toplam_fiyat), 0) as toplam
    FROM siparis
    WHERE hesap_id = ? AND durum != 'iptal' AND ikram = 0
  `).get(hesapId) as any
  const hesap = db.prepare('SELECT indirim_tutar, indirim_tipi, indirim_degeri FROM hesap WHERE id = ?').get(hesapId) as any

  const toplam = paraYuvarla(satir?.toplam || 0)
  const indirim = hesap?.indirim_tipi
    ? indirimTutariHesapla(toplam, hesap.indirim_tipi, hesap.indirim_degeri)
    : paraYuvarla(Math.min(Number(hesap?.indirim_tutar || 0), toplam))
  const net = paraYuvarla(Math.max(0, toplam - indirim))

  db.prepare('UPDATE hesap SET toplam_tutar = ?, indirim_tutar = ?, net_tutar = ? WHERE id = ?')
    .run(toplam, indirim, net, hesapId)
  return { toplam, indirim, net }
}

export interface HesapAcGirdisi {
  masaId: number | null
  personelId: number
  hesapTipi?: string
  kisiSayisi?: number
  ekstra?: any
}

/** Yeni hesap açar; masada açık hesap varsa IslemHatasi fırlatır */
export function hesapAc(db: Database.Database, girdi: HesapAcGirdisi): { hesap_id: number; hesap_no: string } {
  return db.transaction(() => {
    const { masaId, personelId, ekstra } = girdi
    const tip = girdi.hesapTipi || 'masa'

    if (masaId) {
      if (!db.prepare('SELECT 1 FROM masa WHERE id = ?').get(masaId)) throw new IslemHatasi('Masa bulunamadı')
      const mevcut = db.prepare("SELECT id FROM hesap WHERE masa_id = ? AND durum = 'acik'").get(masaId) as any
      if (mevcut) {
        const hata = new IslemHatasi('Bu masada zaten açık bir hesap var') as IslemHatasi & { hesap_id?: number }
        hata.hesap_id = mevcut.id
        throw hata
      }
    }

    const hesapNo = hesapNoOlustur(db)
    const teslimatDurumu = (tip === 'paket' || tip === 'gel_al') ? (ekstra?.teslimat_durumu || 'bekliyor') : null
    const sonuc = db.prepare(`
      INSERT INTO hesap (masa_id, hesap_no, hesap_tipi, personel_id, kisi_sayisi, musteri_id,
        teslimat_telefon, teslimat_adres, teslimat_musteri, teslimat_durumu, kurye, notlar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      masaId || null,
      hesapNo,
      tip,
      personelId,
      girdi.kisiSayisi || 1,
      ekstra?.musteri_id || null,
      ekstra?.teslimat_telefon || null,
      ekstra?.teslimat_adres || null,
      ekstra?.teslimat_musteri || null,
      teslimatDurumu,
      ekstra?.kurye || null,
      ekstra?.notlar || null
    )

    if (masaId) db.prepare("UPDATE masa SET durum = 'dolu' WHERE id = ?").run(masaId)
    return { hesap_id: Number(sonuc.lastInsertRowid), hesap_no: hesapNo }
  })()
}

export interface SiparisGirdisi {
  urun_id: number
  varyant_id?: number | null
  opsiyon_idleri?: number[]
  miktar: number
  notlar?: string | null
  ikram?: boolean
  porsiyon?: number
  secilenSatisTuru?: string
  satisBirim?: string
  gramaj?: number
}

export interface EklenenKalem {
  siparis_id: number
  urun_adi: string
  miktar: number
  notlar: string
  ikram: boolean
  porsiyon: number
  gramaj: number | null
  isKg: boolean
}

/**
 * Siparişleri tek transaction içinde ekler.
 * Fiyat istemciden alınmaz — ürün, varyant ve opsiyon kayıtlarından yeniden hesaplanır.
 */
export function siparisleriEkle(
  db: Database.Database,
  hesapId: number,
  personelId: number,
  siparisler: SiparisGirdisi[],
  secenek: { ikramIzinli?: boolean; ikramOnaylayanId?: number } = {}
): EklenenKalem[] {
  if (!Array.isArray(siparisler) || siparisler.length === 0) throw new IslemHatasi('Eklenecek sipariş yok')

  return db.transaction(() => {
    acikHesabiGetir(db, hesapId)
    const eklenenler: EklenenKalem[] = []

    for (const sip of siparisler) {
      const urun = db.prepare(`
        SELECT id, ad, fiyat, birim, satis_turleri, porsiyon_fiyati, kilo_fiyati, yazici_grup
        FROM urun WHERE id = ?
      `).get(sip?.urun_id) as any
      if (!urun) throw new IslemHatasi(`Ürün bulunamadı (#${sip?.urun_id})`)

      const miktar = pozitifSayi(sip.miktar ?? 1, 'miktar', MAX_MIKTAR)
      const satisBirim = String(sip.satisBirim || '').toLowerCase()
      const isKg = sip.secilenSatisTuru === 'kg' || satisBirim === 'kg' || satisBirim === 'kilo' ||
        (sip.gramaj !== undefined && sip.gramaj !== null && Number(sip.gramaj) > 0)
      const gramaj = isKg && Number(sip.gramaj) > 0 ? pozitifSayi(sip.gramaj, 'gramaj', MAX_MIKTAR) : null
      const porsiyon = isKg ? 1 : pozitifSayi(sip.porsiyon ?? 1, 'porsiyon', MAX_PORSIYON)

      let ekFiyat = 0
      let varyantId: number | null = null
      if (sip.varyant_id) {
        const varyant = db.prepare('SELECT id, fiyat_farki FROM urun_varyant WHERE id = ? AND urun_id = ?').get(sip.varyant_id, urun.id) as any
        if (!varyant) throw new IslemHatasi(`${urun.ad} için seçilen varyant bulunamadı`)
        varyantId = varyant.id
        ekFiyat += Number(varyant.fiyat_farki || 0)
      }

      const opsiyonIdleri = Array.isArray(sip.opsiyon_idleri) ? [...new Set(sip.opsiyon_idleri.map(Number))] : []
      for (const opsiyonId of opsiyonIdleri) {
        const opsiyon = db.prepare('SELECT fiyat FROM urun_opsiyonu WHERE id = ? AND urun_id = ?').get(opsiyonId, urun.id) as any
        if (!opsiyon) throw new IslemHatasi(`${urun.ad} için seçilen opsiyon bulunamadı`)
        ekFiyat += Number(opsiyon.fiyat || 0)
      }

      const ikram = Boolean(sip.ikram)
      if (ikram && secenek.ikramIzinli === false) throw new IslemHatasi('İkram için yetkiniz yok')

      const { birimFiyat, toplamFiyat } = kalemFiyatiHesapla(urun, {
        isKg,
        miktar,
        porsiyon,
        gramaj: gramaj ?? undefined,
        ekFiyat,
      })

      const sonuc = db.prepare(`
        INSERT INTO siparis (hesap_id, urun_id, varyant_id, miktar, birim_fiyat, toplam_fiyat, personel_id, notlar, ikram, ikram_onaylayan_id, yazici_grup, porsiyon, satis_birim, gramaj)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        hesapId, urun.id, varyantId, miktar,
        birimFiyat, toplamFiyat, personelId, sip.notlar || null,
        ikram ? 1 : 0, ikram ? (secenek.ikramOnaylayanId ?? personelId) : null, urun.yazici_grup, porsiyon,
        isKg ? 'kg' : 'porsiyon', gramaj
      )
      const siparisId = Number(sonuc.lastInsertRowid)

      for (const opsiyonId of opsiyonIdleri) {
        db.prepare('INSERT INTO siparis_opsiyonlari (siparis_id, opsiyon_id) VALUES (?, ?)').run(siparisId, opsiyonId)
      }

      siparisStokDusVeMaliyetHesapla(db, {
        siparisId,
        urunId: urun.id,
        miktar,
        porsiyon,
        satisBirim: isKg ? 'kg' : 'porsiyon',
        gramaj: gramaj ?? undefined,
        personelId,
        hesapId,
        urunAdi: urun.ad,
      })

      eklenenler.push({
        siparis_id: siparisId,
        urun_adi: isKg && gramaj ? `${gramaj} KG ${urun.ad}` : urun.ad,
        miktar,
        notlar: sip.notlar || '',
        ikram,
        porsiyon,
        gramaj,
        isKg,
      })
    }

    hesapToplamiGuncelle(db, hesapId)
    return eklenenler
  })()
}

/** Masada açık hesap yoksa açar; hesap id'sini döndürür */
export function masaHesabiniGetirVeyaAc(db: Database.Database, masaId: number, personelId: number): number {
  const mevcut = db.prepare("SELECT id FROM hesap WHERE masa_id = ? AND durum = 'acik'").get(masaId) as any
  if (mevcut) return mevcut.id
  return hesapAc(db, { masaId, personelId, hesapTipi: 'masa' }).hesap_id
}

function iptalEdilebilirSiparis(db: Database.Database, siparisId: number): any {
  const siparis = db.prepare(`
    SELECT s.id, s.hesap_id, s.miktar, s.notlar, s.durum, s.ikram, u.ad as urun_adi,
           h.masa_id, h.durum as hesap_durum, m.numara as masa_numara
    FROM siparis s
    JOIN urun u ON u.id = s.urun_id
    JOIN hesap h ON h.id = s.hesap_id
    LEFT JOIN masa m ON m.id = h.masa_id
    WHERE s.id = ?
  `).get(siparisId) as any
  if (!siparis) throw new IslemHatasi('Sipariş bulunamadı')
  if (siparis.hesap_durum !== 'acik') throw new IslemHatasi('Kapanmış hesaptaki sipariş değiştirilemez')
  if (siparis.durum === 'iptal') throw new IslemHatasi('Sipariş zaten iptal edilmiş')
  if (siparis.durum === 'odendi') throw new IslemHatasi('Ödemesi alınmış kalem değiştirilemez')
  return siparis
}

/** Siparişi iptal eder ve hammadde stoğunu bir kez iade eder */
export function siparisIptalEt(db: Database.Database, siparisId: number, iptalNedeni: string | null, onaylayanId: number | null): any {
  return db.transaction(() => {
    const siparis = iptalEdilebilirSiparis(db, siparisId)
    siparisStokGeriYukle(db, siparisId, onaylayanId ?? undefined)
    db.prepare("UPDATE siparis SET durum = 'iptal', iptal_nedeni = ?, ikram_onaylayan_id = ? WHERE id = ?")
      .run(iptalNedeni || null, onaylayanId || null, siparisId)
    hesapToplamiGuncelle(db, siparis.hesap_id)
    return siparis
  })()
}

/** İkram durumunu ayarlar; ikram verilmezse mevcut durumu tersine çevirir */
export function siparisIkramAyarla(db: Database.Database, siparisId: number, ikram: boolean | null, onaylayanId: number | null): { hesap_id: number; masa_id: number | null; ikram: boolean } {
  return db.transaction(() => {
    const siparis = iptalEdilebilirSiparis(db, siparisId)
    const yeni = ikram === null ? siparis.ikram !== 1 : Boolean(ikram)
    db.prepare('UPDATE siparis SET ikram = ?, ikram_onaylayan_id = ? WHERE id = ?')
      .run(yeni ? 1 : 0, yeni ? onaylayanId || null : null, siparisId)
    hesapToplamiGuncelle(db, siparis.hesap_id)
    return { hesap_id: siparis.hesap_id, masa_id: siparis.masa_id, ikram: yeni }
  })()
}

export interface IndirimGirdisi {
  hesap_id: number
  indirim_tipi: 'yuzde' | 'tutar' | string
  deger: number
  aciklama?: string
}

/** İndirimi kural olarak saklar (tip + değer); tutar her toplam değişiminde yeniden hesaplanır */
export function indirimUygula(db: Database.Database, indirim: IndirimGirdisi): { indirim_tutar: number; net_tutar: number } {
  return db.transaction(() => {
    acikHesabiGetir(db, indirim.hesap_id)
    const tip = indirim.indirim_tipi === 'yuzde' ? 'yuzde' : 'tutar'
    const deger = Number(indirim.deger)
    if (!Number.isFinite(deger) || deger < 0 || (tip === 'yuzde' && deger > 100)) {
      throw new IslemHatasi('Geçersiz indirim değeri')
    }

    db.prepare(`
      UPDATE hesap SET indirim_tipi = ?, indirim_degeri = ?, notlar = COALESCE(notlar, '') || ? WHERE id = ?
    `).run(deger > 0 ? tip : null, deger > 0 ? deger : null, `\nİndirim: ${indirim.aciklama || ''}`, indirim.hesap_id)
    if (deger === 0) db.prepare('UPDATE hesap SET indirim_tutar = 0 WHERE id = ?').run(indirim.hesap_id)

    const { indirim: tutar, net } = hesapToplamiGuncelle(db, indirim.hesap_id)
    return { indirim_tutar: tutar, net_tutar: net }
  })()
}

export interface OdemeGirdisi {
  hesap_id: number
  odeme_tipi: string
  /** Müşteriden alınan tutar (nakitte para üstü dahil olabilir) */
  tutar: number
  personel_id: number
  referans_no?: string
  notlar?: string
  odenen_siparisler?: Array<{ id: number; miktar: number }>
}

export type OdemeSonucu =
  | { kapandi: true; para_ustu: number }
  | { kapandi: false; kalan: number; para_ustu: number }

function almanUsuluOde(db: Database.Database, hesapId: number, kalemler: Array<{ id: number; miktar: number }>): void {
  for (const item of kalemler) {
    const siparis = db.prepare(`
      SELECT miktar, toplam_fiyat, cost_price FROM siparis
      WHERE id = ? AND hesap_id = ? AND durum NOT IN ('iptal', 'odendi')
    `).get(item.id, hesapId) as any
    if (!siparis || !(siparis.miktar > 0)) continue
    const odenen = Number(item.miktar)
    if (!Number.isFinite(odenen) || odenen <= 0) continue

    if (odenen < siparis.miktar) {
      // Siparişi böl: kalan kısım satırda kalır, ödenen kısım yeni 'odendi' satırı olur.
      // Ödenen tutar = orijinal − kalan → toplam kuruşu kuruşuna korunur.
      const kalanMiktar = siparis.miktar - odenen
      const kalanToplam = paraYuvarla(siparis.toplam_fiyat * (kalanMiktar / siparis.miktar))
      const kalanCost = (siparis.cost_price || 0) * (kalanMiktar / siparis.miktar)
      const odenenToplam = paraYuvarla(siparis.toplam_fiyat - kalanToplam)
      const odenenCost = (siparis.cost_price || 0) - kalanCost

      db.prepare('UPDATE siparis SET miktar = ?, toplam_fiyat = ?, cost_price = ? WHERE id = ?')
        .run(kalanMiktar, kalanToplam, kalanCost, item.id)
      db.prepare(`
        INSERT INTO siparis (hesap_id, urun_id, varyant_id, miktar, birim_fiyat, toplam_fiyat, cost_price, durum, siparis_zamani, hazir_zamani, personel_id, notlar, ikram, porsiyon, yazici_grup, satis_birim, gramaj)
        SELECT hesap_id, urun_id, varyant_id, ?, birim_fiyat, ?, ?, 'odendi', siparis_zamani, hazir_zamani, personel_id, notlar, ikram, porsiyon, yazici_grup, satis_birim, gramaj
        FROM siparis WHERE id = ?
      `).run(odenen, odenenToplam, odenenCost, item.id)
    } else {
      db.prepare("UPDATE siparis SET durum = 'odendi' WHERE id = ?").run(item.id)
    }
  }
}

/**
 * Ödeme alır. Hesaba yalnızca kalan borç kadar yazılır; fazlası para üstü olarak ayrı saklanır.
 * Kapalı hesaba ikinci ödeme (çift tıklama / çift Enter) reddedilir.
 */
export function odemeAl(db: Database.Database, odemeler: OdemeGirdisi[]): OdemeSonucu {
  if (!Array.isArray(odemeler) || odemeler.length === 0) throw new IslemHatasi('Ödeme bilgisi yok')
  const hesapId = Number(odemeler[0].hesap_id)
  if (odemeler.some((o) => Number(o.hesap_id) !== hesapId)) throw new IslemHatasi('Ödemeler aynı hesaba ait olmalı')

  return db.transaction((): OdemeSonucu => {
    const hesap = acikHesabiGetir(db, hesapId)
    const { net } = hesapToplamiGuncelle(db, hesapId)
    const onceki = db.prepare('SELECT COALESCE(SUM(tutar), 0) as toplam FROM odeme WHERE hesap_id = ?').get(hesapId) as any
    let kalan = paraYuvarla(net - Number(onceki?.toplam || 0))
    let paraUstuToplam = 0

    for (const odeme of odemeler) {
      const alinan = Number(odeme.tutar)
      if (!Number.isFinite(alinan) || alinan <= 0) throw new IslemHatasi('Geçerli bir ödeme tutarı girin')
      if (kalan <= PARA_TOLERANS) throw new IslemHatasi('Bu hesapta ödenecek tutar kalmadı')

      const { tutar, paraUstu } = odemeyiAyir(alinan, kalan)
      if (paraUstu > PARA_TOLERANS && odeme.odeme_tipi !== 'nakit') {
        throw new IslemHatasi('Kart ve diğer ödemeler kalan tutarı aşamaz')
      }

      db.prepare(`
        INSERT INTO odeme (hesap_id, odeme_tipi, tutar, alinan_tutar, para_ustu, personel_id, referans_no, notlar)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(hesapId, odeme.odeme_tipi, tutar, paraYuvarla(alinan), paraUstu, odeme.personel_id, odeme.referans_no || null, odeme.notlar || null)

      kalan = paraYuvarla(kalan - tutar)
      paraUstuToplam = paraYuvarla(paraUstuToplam + paraUstu)

      if (odeme.odenen_siparisler && odeme.odenen_siparisler.length > 0) {
        almanUsuluOde(db, hesapId, odeme.odenen_siparisler)
      }
    }

    if (kalan > PARA_TOLERANS) return { kapandi: false, kalan, para_ustu: paraUstuToplam }

    db.prepare("UPDATE hesap SET durum = 'odendi', kapanis_zamani = CURRENT_TIMESTAMP WHERE id = ?").run(hesapId)
    if (hesap.masa_id) db.prepare("UPDATE masa SET durum = 'bos' WHERE id = ?").run(hesap.masa_id)
    db.prepare("UPDATE siparis SET durum = 'teslim' WHERE hesap_id = ? AND durum NOT IN ('iptal', 'odendi')").run(hesapId)
    db.prepare(`
      INSERT INTO kasa_hareket (kasa_id, islem_tipi, tutar, aciklama, hesap_id)
      VALUES (1, 'satis', ?, ?, ?)
    `).run(net, `Hesap #${hesapId} kapatıldı`, hesapId)

    return { kapandi: true, para_ustu: paraUstuToplam }
  })()
}

export interface HesapBolmeGirdisi {
  kaynak_hesap_id: number
  siparis_idleri: number[]
  yeni_masa_id?: number | null
}

/** Seçili siparişleri yeni bir hesaba taşır */
export function hesapBol(db: Database.Database, bolme: HesapBolmeGirdisi): { yeni_hesap_id: number; yeni_hesap_no: string } {
  if (!Array.isArray(bolme.siparis_idleri) || bolme.siparis_idleri.length === 0) throw new IslemHatasi('Taşınacak sipariş seçin')

  return db.transaction(() => {
    const kaynak = acikHesabiGetir(db, bolme.kaynak_hesap_id)
    for (const siparisId of bolme.siparis_idleri) {
      const s = db.prepare('SELECT hesap_id, durum FROM siparis WHERE id = ?').get(siparisId) as any
      if (!s || s.hesap_id !== kaynak.id) throw new IslemHatasi('Seçilen sipariş bu hesaba ait değil')
      if (s.durum === 'iptal' || s.durum === 'odendi') throw new IslemHatasi('İptal edilmiş veya ödenmiş kalem taşınamaz')
    }

    const { hesap_id: yeniHesapId, hesap_no: yeniHesapNo } = hesapAc(db, {
      masaId: bolme.yeni_masa_id || null,
      personelId: kaynak.personel_id,
      hesapTipi: kaynak.hesap_tipi,
    })

    const tasi = db.prepare('UPDATE siparis SET hesap_id = ? WHERE id = ?')
    for (const siparisId of bolme.siparis_idleri) tasi.run(yeniHesapId, siparisId)

    hesapToplamiGuncelle(db, kaynak.id)
    hesapToplamiGuncelle(db, yeniHesapId)
    return { yeni_hesap_id: yeniHesapId, yeni_hesap_no: yeniHesapNo }
  })()
}

/** Açık hesabı iptal eder, stokları iade eder ve masayı boşaltır */
export function hesapIptalEt(db: Database.Database, hesapId: number): { masa_id: number | null } {
  return db.transaction(() => {
    const hesap = acikHesabiGetir(db, hesapId)
    const odeme = db.prepare('SELECT COUNT(*) as adet FROM odeme WHERE hesap_id = ?').get(hesapId) as any
    if (odeme?.adet > 0) throw new IslemHatasi('Bu hesapta ödeme alınmış; iptal yerine kalan tutarı kapatın')

    const aktifler = db.prepare("SELECT id FROM siparis WHERE hesap_id = ? AND durum != 'iptal'").all(hesapId) as Array<{ id: number }>
    for (const s of aktifler) siparisStokGeriYukle(db, s.id)

    db.prepare("UPDATE hesap SET durum = 'iptal', kapanis_zamani = CURRENT_TIMESTAMP WHERE id = ?").run(hesapId)
    db.prepare("UPDATE siparis SET durum = 'iptal' WHERE hesap_id = ?").run(hesapId)
    if (hesap.masa_id) db.prepare("UPDATE masa SET durum = 'bos' WHERE id = ?").run(hesap.masa_id)
    return { masa_id: hesap.masa_id }
  })()
}
