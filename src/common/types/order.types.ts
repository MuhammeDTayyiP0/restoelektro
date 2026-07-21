// =====================================================
// Sipariş Tip Tanımları
// Sipariş akışı ve mutfak ekranı için
// =====================================================

import { SiparisDurumu, Siparis } from './pos.types'

/** Mutfak ekranı sipariş kartı */
export interface MutfakSiparisi {
  hesap_id: number
  hesap_no: string
  masa_numara: string | null
  hesap_tipi: string
  garson_adi: string
  siparisler: MutfakSiparisKalemi[]
  siparis_zamani: string
  bekleme_suresi: number // dakika cinsinden
}

/** Mutfak sipariş kalemi */
export interface MutfakSiparisKalemi {
  siparis_id: number
  urun_adi: string
  miktar: number
  notlar: string | null
  durum: SiparisDurumu
  opsiyonlar: string[]
}

/** Sipariş durum güncelleme */
export interface SiparisDurumGuncelle {
  siparis_id: number
  yeni_durum: SiparisDurumu
}

/** Sipariş iptal */
export interface SiparisIptal {
  siparis_id: number
  iptal_nedeni: string
  onaylayan_id: number
}

/** Sipariş filtreleme */
export interface SiparisFiltre {
  durum?: SiparisDurumu
  yazici_grup?: string
  tarih_baslangic?: string
  tarih_bitis?: string
  personel_id?: number
}
