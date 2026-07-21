// =====================================================
// Raporlama Tip Tanımları
// Satış, personel, stok raporları ve dışa aktarım
// =====================================================

/** Rapor zaman aralığı */
export interface RaporZamanAraligi {
  baslangic: string // ISO tarih
  bitis: string
}

/** Günlük satış özeti */
export interface GunlukSatisOzeti {
  tarih: string
  toplam_ciro: number
  toplam_hesap: number
  ortalama_hesap: number
  nakit_toplam: number
  kart_toplam: number
  diger_toplam: number
  iptal_tutar: number
  ikram_tutar: number
  indirim_tutar: number
  net_ciro: number
}

/** Kategori bazlı satış raporu */
export interface KategoriSatisRaporu {
  kategori_id: number
  kategori_adi: string
  satis_adedi: number
  toplam_tutar: number
  oran: number // yüzde
}

/** Ürün bazlı satış raporu */
export interface UrunSatisRaporu {
  urun_id: number
  urun_adi: string
  kategori_adi: string
  satis_adedi: number
  toplam_tutar: number
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

/** Saat bazlı satış dağılımı */
export interface SaatlikSatisDagilimi {
  saat: number // 0–23
  hesap_sayisi: number
  toplam_tutar: number
}

/** Stok raporu */
export interface StokRaporu {
  hammadde_id: number
  hammadde_adi: string
  birim: string
  mevcut_stok: number
  min_stok: number
  deger: number // mevcut_stok × birim_maliyet
  durum: 'normal' | 'dusuk' | 'kritik' | 'tukendi'
}

/** Kasa raporu */
export interface KasaRaporu {
  kasa_adi: string
  acilis_bakiye: number
  satis_toplam: number
  gider_toplam: number
  kapanis_bakiye: number
  nakit_sayim: number
  fark: number
}

/** Dışa aktarım formatı */
export type DisaAktarimFormati = 'csv' | 'xlsx'

/** Dışa aktarım seçenekleri */
export interface DisaAktarimSecenekleri {
  format: DisaAktarimFormati
  rapor_tipi: string
  zaman_araligi: RaporZamanAraligi
  dosya_yolu?: string
}
