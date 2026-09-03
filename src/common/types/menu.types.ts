// =====================================================
// Menü Tip Tanımları
// Kategori, ürün, varyant ve opsiyonlar
// =====================================================

/** Kategori veri yapısı */
export interface Kategori {
  id: number
  ad: string
  ust_kategori_id: number | null
  sira: number
  renk: string
  ikon: string | null
  aktif: boolean
  // Alt kategoriler (iç içe yapı)
  alt_kategoriler?: Kategori[]
  urun_sayisi?: number
}

/** Satış Türü (Birim & Fiyat) */
export interface SatisTuru {
  birim: 'porsiyon' | 'kilo' | 'kg' | 'adet' | 'gram' | string
  fiyat: number
}

/** Ürün veri yapısı */
export interface Urun {
  id: number
  kategori_id: number
  barkod: string | null
  ad: string
  kisaltma: string | null
  aciklama?: string | null
  fiyat: number
  kdv_orani: number
  birim: 'Adet' | 'Porsiyon' | 'Tane' | 'KG' | 'Gram' | 'Litre' | 'Dilim' | 'Şişe' | 'Kutu' | 'Kilo / Gramaj' | string
  resim_yolu: string | null
  yazici_grup: 'mutfak' | 'bar' | 'tatli' | 'direkt' | 'firin' | 'kasa' | string
  aktif: boolean
  sira: number
  created_at: string
  updated_at: string
  // Esnek satış türleri & geriye dönük uyumluluk
  satis_turleri?: SatisTuru[] | string | null
  porsiyon_fiyati?: number | null
  kilo_fiyati?: number | null
  // İlişkili veriler
  kategori_adi?: string
  varyantlar?: UrunVaryant[]
  opsiyonlar?: UrunOpsiyonu[]
}

/** Ürün varyantı (boyut seçenekleri) */
export interface UrunVaryant {
  id: number
  urun_id: number
  ad: string
  fiyat_farki: number
  aktif: boolean
}

/** Ürün opsiyonu (ekstra malzeme, özelleştirme) */
export interface UrunOpsiyonu {
  id: number
  urun_id: number
  ad: string
  fiyat: number
  aktif: boolean
}

/** Sepet Kalemi veri yapısı */
export interface SepetKalemi {
  id: string
  urun: Urun
  varyant?: UrunVaryant
  opsiyonlar: UrunOpsiyonu[]
  miktar: number
  notlar: string
  ikram: boolean
  porsiyon: number
  secilenSatisTuru?: 'porsiyon' | 'kg' | string
  gramaj?: number
  satisBirim?: 'porsiyon' | 'kilo' | string
}

/** Yeni ürün oluşturma */
export interface YeniUrun {
  kategori_id: number
  barkod?: string
  ad: string
  kisaltma?: string
  aciklama?: string
  fiyat: number
  kdv_orani?: number
  birim?: string
  resim_yolu?: string
  yazici_grup?: string
  satis_turleri?: SatisTuru[] | string | null
  porsiyon_fiyati?: number | null
  kilo_fiyati?: number | null
}

/** Yeni kategori oluşturma */
export interface YeniKategori {
  ad: string
  ust_kategori_id?: number
  renk?: string
  ikon?: string
}

/** Yazıcı grubu tanımı */
export type YaziciGrubu = 'mutfak' | 'bar' | 'tatli' | 'direkt'
