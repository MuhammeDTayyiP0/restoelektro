// =====================================================
// Müşteri & Sadakat Tip Tanımları
// CRM, sadakat kartları, Caller ID
// =====================================================

/** Müşteri veri yapısı */
export interface Musteri {
  id: number
  ad: string
  soyad: string | null
  telefon: string | null
  email: string | null
  adres: string | null
  vergi_no: string | null
  vergi_dairesi: string | null
  unvan: string | null
  notlar: string | null
  toplam_harcama: number
  ziyaret_sayisi: number
  son_ziyaret: string | null
  created_at: string
  // İlişkili
  adresler?: MusteriAdres[]
  sadakat_karti?: SadakatKart
}

/** Müşteri adresi */
export interface MusteriAdres {
  id: number
  musteri_id: number
  adres_baslik: string
  adres: string
  ilce: string | null
  il: string | null
  varsayilan: boolean
}

/** Sadakat kartı tipi */
export type SadakatKartTipi = 'puan' | 'bakiye' | 'stamp'

/** Sadakat kartı */
export interface SadakatKart {
  id: number
  musteri_id: number
  kart_no: string
  kart_tipi: SadakatKartTipi
  bakiye: number
  puan: number
  stamp_sayisi: number
  aktif: boolean
  created_at: string
}

/** Sadakat hareketi */
export interface SadakatHareket {
  id: number
  kart_id: number
  islem_tipi: 'yukleme' | 'harcama' | 'puan_kazanim' | 'puan_kullanim'
  tutar: number
  puan: number
  aciklama: string | null
  hesap_id: number | null
  created_at: string
}

/** Caller ID kaydı */
export interface ArayanKayit {
  id: number
  telefon: string
  musteri_id: number | null
  arama_zamani: string
  durum: 'cevapsiz' | 'cevaplandi' | 'siparis_alindi'
  // İlişkili
  musteri?: Musteri
}

/** Yeni müşteri */
export interface YeniMusteri {
  ad: string
  soyad?: string
  telefon?: string
  email?: string
  adres?: string
  vergi_no?: string
  vergi_dairesi?: string
  unvan?: string
}
