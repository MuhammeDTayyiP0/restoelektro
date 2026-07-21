// =====================================================
// Masa Tip Tanımları
// Bölüm, masa düzeni ve durumları
// =====================================================

/** Masa durumu */
export type MasaDurumu = 'bos' | 'dolu' | 'rezerve' | 'birlesti'

/** Bölüm (Salon, Bahçe, Teras vb.) */
export interface Bolum {
  id: number
  ad: string
  aktif: boolean
  sira?: number
  masalar?: Masa[]
  masa_sayisi?: number
}

/** Masa veri yapısı */
export interface Masa {
  id: number
  bolum_id: number
  numara: string
  kapasite: number
  durum: MasaDurumu
  konum_x: number
  konum_y: number
  aktif: boolean
  sira?: number
  // İlişkili veriler
  bolum_adi?: string
  aktif_hesap_id?: number
  aktif_hesap_tutari?: number
  acik_sure?: string  // Ne kadar süredir açık
  garson_adi?: string
}

/** Masa birleştirme */
export interface MasaBirlestirme {
  ana_masa_id: number
  birlesen_masa_idleri: number[]
}

/** Masa taşıma (hesap taşıma) */
export interface MasaTasima {
  kaynak_masa_id: number
  hedef_masa_id: number
  hesap_id: number
}

/** Yeni masa oluşturma */
export interface YeniMasa {
  bolum_id: number
  numara: string
  kapasite?: number
  konum_x?: number
  konum_y?: number
}
