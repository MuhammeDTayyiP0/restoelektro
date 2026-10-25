// =====================================================
// Personel & Yetkilendirme Tip Tanımları
// Kullanıcı rolleri, izinler ve personel yönetimi
// =====================================================

/** Personel rolleri */
export type PersonelRol = 'admin' | 'mudur' | 'kasiyer' | 'garson' | 'mutfak'

/** Personel veri yapısı */
export interface Personel {
  id: number
  ad: string
  soyad: string
  kullanici_adi: string
  sifre_hash?: string // Asla client'a gönderilmez
  rol: PersonelRol
  /** PIN yalnızca özet olarak saklanır; istemci sadece tanımlı olup olmadığını bilir */
  pin_tanimli?: boolean | number
  aktif: boolean
  telefon: string | null
  created_at: string
  updated_at: string
  // Hesaplanan
  tam_adi?: string
}

/** Yeni personel oluşturma */
export interface YeniPersonel {
  ad: string
  soyad: string
  kullanici_adi: string
  sifre: string
  rol: PersonelRol
  pin_kodu?: string
  telefon?: string
}

/** Giriş bilgileri */
export interface GirisBilgileri {
  kullanici_adi?: string
  sifre?: string
  pin_kodu?: string
}

/** Giriş yanıtı */
export interface GirisYaniti {
  basarili: boolean
  personel?: Personel
  token?: string
  hata?: string
  /** Varsayılan (herkesçe bilinen) PIN ile girildi — devam etmeden önce değiştirilmeli */
  pinDegistirmeli?: boolean
}

/** Yönetici onayı gerektiren işlemlerin anahtarları (modul/islem) */
export type YetkiAnahtari = 'pos/iptal' | 'pos/ikram' | 'pos/indirim' | 'kasa/yazma' | 'menu/yazma' | 'personel/yazma'

/** Modül isimleri */
export type ModulAdi = 'pos' | 'rapor' | 'stok' | 'menu' | 'personel' | 'ayar' | 'musteri' | 'kasa'

/** İşlem tipleri */
export type IslemTipi = 'okuma' | 'yazma' | 'silme' | 'iptal' | 'ikram' | 'indirim'

/** Yetki tanımı */
export interface Yetki {
  id: number
  rol: PersonelRol
  modul: ModulAdi
  islem: IslemTipi
  izin: boolean
}

/** Oturum bilgisi */
export interface Oturum {
  personel: Personel
  token: string
  giris_zamani: string
  yetkiler: Yetki[]
}
