// =====================================================
// POS Tip Tanımları
// Hesap, ödeme ve kasa ile ilgili tüm tipler
// =====================================================

/** Hesap tipi — masada, pakette, barda veya gel-al */
export type HesapTipi = 'masa' | 'paket' | 'bar' | 'gel_al'

/** Hesap durumu */
export type HesapDurumu = 'acik' | 'odendi' | 'iptal'

/** Ödeme yöntemi */
export type OdemeTipi = 'nakit' | 'kredi_karti' | 'yemek_karti' | 'havale' | 'sadakat' | 'acik_hesap'

/** Ana hesap veri yapısı */
export interface Hesap {
  id: number
  masa_id: number | null
  hesap_no: string
  hesap_tipi: HesapTipi
  personel_id: number
  durum: HesapDurumu
  acilis_zamani: string
  kapanis_zamani: string | null
  musteri_id: number | null
  kisi_sayisi: number
  notlar: string | null
  toplam_tutar: number
  indirim_tutar: number
  net_tutar: number
  // İlişkili veriler (join)
  personel_adi?: string
  masa_numara?: string
  musteri_adi?: string
  siparisler?: Siparis[]
  odemeler?: Odeme[]
}

/** Sipariş durumu */
export type SiparisDurumu = 'bekliyor' | 'hazirlaniyor' | 'hazir' | 'teslim' | 'iptal'

/** Sipariş veri yapısı */
export interface Siparis {
  id: number
  hesap_id: number
  urun_id: number
  varyant_id: number | null
  miktar: number
  birim_fiyat: number
  toplam_fiyat: number
  durum: SiparisDurumu
  siparis_zamani: string
  hazir_zamani: string | null
  personel_id: number
  iptal_nedeni: string | null
  notlar: string | null
  ikram: boolean
  ikram_onaylayan_id: number | null
  yazici_grup: string
  // İlişkili veriler
  urun_adi?: string
  varyant_adi?: string
  kategori_adi?: string
  opsiyonlar?: SiparisOpsiyonu[]
}

/** Sipariş opsiyonu */
export interface SiparisOpsiyonu {
  id: number
  siparis_id: number
  opsiyon_id: number
  opsiyon_adi?: string
  fiyat?: number
}

/** Ödeme kaydı */
export interface Odeme {
  id: number
  hesap_id: number
  odeme_tipi: OdemeTipi
  tutar: number
  odeme_zamani: string
  personel_id: number
  referans_no: string | null
  notlar: string | null
}

/** Yeni sipariş eklerken kullanılan veri yapısı */
export interface YeniSiparis {
  urun_id: number
  varyant_id?: number
  miktar: number
  notlar?: string
  ikram?: boolean
  opsiyon_idleri?: number[]
}

/** Ödeme alma veri yapısı */
export interface YeniOdeme {
  hesap_id: number
  odeme_tipi: OdemeTipi
  tutar: number
  referans_no?: string
  notlar?: string
}

/** İndirim uygulama */
export interface IndirimBilgisi {
  hesap_id: number
  indirim_tipi: 'yuzde' | 'tutar'
  deger: number
  aciklama?: string
}

/** Hesap bölme verisi */
export interface HesapBolme {
  kaynak_hesap_id: number
  siparis_idleri: number[]
  yeni_masa_id?: number
}

/** Kasa hareketi */
export interface KasaHareket {
  id: number
  kasa_id: number
  islem_tipi: 'satis' | 'gider' | 'devir' | 'sayim'
  tutar: number
  aciklama: string | null
  personel_id: number | null
  hesap_id: number | null
  created_at: string
}
