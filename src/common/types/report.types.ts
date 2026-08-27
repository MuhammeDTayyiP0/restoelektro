// =====================================================
// Raporlama Tip Tanımları
// Satış, personel, maliyet, kâr marjı ve stok raporları
// =====================================================

/** Rapor zaman aralığı */
export interface RaporZamanAraligi {
  baslangic: string // YYYY-MM-DD
  bitis: string
}

/** Genel finansal ve satış özeti */
export interface GunlukSatisOzeti {
  tarih: string
  toplam_ciro: number
  toplam_maliyet: number
  net_kar: number
  kar_marji: number // yüzde (%)
  toplam_hesap: number
  ortalama_hesap: number
  nakit_toplam: number
  kart_toplam: number
  acik_hesap_toplam: number
  diger_toplam: number
  iptal_tutar: number
  ikram_tutar: number
  indirim_tutar: number
}

/** Kategori bazlı satış ve kâr raporu */
export interface KategoriSatisRaporu {
  kategori_id: number
  kategori_adi: string
  satis_adedi: number
  toplam_tutar: number
  toplam_maliyet: number
  net_kar: number
  oran?: number // yüzde
}

/** Ürün & Reçete Performans Raporu */
export interface UrunSatisRaporu {
  urun_id: number
  urun_adi: string
  kategori_adi: string
  satis_adedi: number
  toplam_ciro: number
  toplam_maliyet: number
  net_kar: number
  kar_marji: number // yüzde (%)
  ortalama_fiyat: number
}

/** Personel performans raporu */
export interface PersonelPerformansRaporu {
  personel_id: number
  personel_adi: string
  hesap_sayisi: number
  toplam_satis: number
  ortalama_hesap: number
  iptal_sayisi: number
  ikram_tutari: number
}

/** Saat / Gün bazlı satış & maliyet akışı */
export interface SaatlikSatisDagilimi {
  zaman_etiketi: string
  hesap_sayisi: number
  toplam_tutar: number // Ciro
  toplam_maliyet: number // Reçete Maliyeti
  net_kar: number // Net Kâr
}

/** Kasa & Ödeme yöntemi dağılımı */
export interface OdemeTipiDagilimi {
  odeme_tipi: string
  islem_sayisi: number
  toplam_tutar: number
  oran: number // yüzde (%)
}

/** Kritik Hammadde & Stok Raporu */
export interface KritikStokRaporu {
  hammadde_id: number
  hammadde_adi: string
  birim: string
  mevcut_stok: number
  min_stok: number
  maliyet_birim: number
  tedarikci: string | null
  toplam_deger: number
  eksik_miktar: number
  stok_durumu: 'normal' | 'dusuk' | 'kritik' | 'tukendi'
}

/** Dışa aktarım formatı */
export type DisaAktarimFormati = 'csv' | 'xlsx'

/** Dışa aktarım seçenekleri */
export interface DisaAktarimSecenekleri {
  format: DisaAktarimFormati
  rapor_tipi: 'satis' | 'urun' | 'stok'
  zaman_araligi: RaporZamanAraligi
  dosya_yolu?: string
}
