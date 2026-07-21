// =====================================================
// Stok & Reçete Tip Tanımları
// Hammadde, reçete (BOM) ve stok hareketleri
// =====================================================

/** Hammadde birimi */
export type HammaddeBirimi = 'gram' | 'ml' | 'adet' | 'kg' | 'lt'

/** Hammadde veri yapısı */
export interface Hammadde {
  id: number
  ad: string
  birim: HammaddeBirimi
  mevcut_stok: number
  min_stok: number
  maliyet_birim: number
  tedarikci: string | null
  aktif: boolean
  created_at: string
  updated_at: string
  // Hesaplanan alanlar
  stok_durumu?: 'normal' | 'dusuk' | 'kritik' | 'tukendi'
}

/** Reçete kalemi (Bill of Materials — BOM) */
export interface ReceteKalemi {
  id: number
  urun_id: number
  hammadde_id: number
  miktar: number
  birim: HammaddeBirimi
  // İlişkili veriler
  hammadde_adi?: string
  birim_maliyet?: number
  kalem_maliyet?: number // miktar × birim_maliyet
}

/** Tam reçete (ürün + malzeme listesi) */
export interface Recete {
  urun_id: number
  urun_adi: string
  satis_fiyati: number
  kalemler: ReceteKalemi[]
  toplam_maliyet: number
  kar_marji: number        // yüzde
  kar_tutari: number       // TL
}

/** Stok hareketi tipi */
export type StokHareketTipi = 'giris' | 'cikis' | 'sayim' | 'fire'

/** Stok hareketi */
export interface StokHareket {
  id: number
  hammadde_id: number
  islem_tipi: StokHareketTipi
  miktar: number
  birim_maliyet: number
  aciklama: string | null
  personel_id: number | null
  created_at: string
  // İlişkili
  hammadde_adi?: string
  personel_adi?: string
}

/** Yeni stok girişi */
export interface YeniStokGiris {
  hammadde_id: number
  islem_tipi: StokHareketTipi
  miktar: number
  birim_maliyet?: number
  aciklama?: string
}

/** Maliyet analiz raporu */
export interface MaliyetAnalizi {
  urun_id: number
  urun_adi: string
  kategori_adi: string
  satis_fiyati: number
  hammadde_maliyeti: number
  kar_marji: number
  satis_adedi: number
  toplam_ciro: number
  toplam_kar: number
}
