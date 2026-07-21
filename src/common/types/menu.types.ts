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

/** Ürün veri yapısı */
export interface Urun {
  id: number
  kategori_id: number
  barkod: string | null
  ad: string
  kisaltma: string | null
  fiyat: number
  kdv_orani: number
  birim: 'adet' | 'porsiyon' | 'kg' | 'lt'
  resim_yolu: string | null
  yazici_grup: 'mutfak' | 'bar' | 'tatli' | 'direkt'
  aktif: boolean
  sira: number
  created_at: string
  updated_at: string
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

/** Yeni ürün oluşturma */
export interface YeniUrun {
  kategori_id: number
  barkod?: string
  ad: string
  kisaltma?: string
  fiyat: number
  kdv_orani?: number
  birim?: string
  resim_yolu?: string
  yazici_grup?: string
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
