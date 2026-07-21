// =====================================================
// IPC Kanal İsimleri
// Ana işlem ile renderer arasındaki tüm iletişim kanalları
// Merkezi tanım — her iki tarafta da bu sabitler kullanılır
// =====================================================

/** Personel & Oturum kanalları */
export const PERSONEL_KANALLARI = {
  GIRIS_YAP: 'personel:giris-yap',
  CIKIS_YAP: 'personel:cikis-yap',
  PIN_GIRIS: 'personel:pin-giris',
  LISTELE: 'personel:listele',
  EKLE: 'personel:ekle',
  GUNCELLE: 'personel:guncelle',
  SIL: 'personel:sil',
  YETKILERI_GETIR: 'personel:yetkileri-getir',
  YETKI_GUNCELLE: 'personel:yetki-guncelle',
} as const

/** Menü kanalları */
export const MENU_KANALLARI = {
  KATEGORILER: 'menu:kategoriler',
  KATEGORI_EKLE: 'menu:kategori-ekle',
  KATEGORI_GUNCELLE: 'menu:kategori-guncelle',
  KATEGORI_SIL: 'menu:kategori-sil',
  URUNLER: 'menu:urunler',
  URUN_DETAY: 'menu:urun-detay',
  URUN_EKLE: 'menu:urun-ekle',
  URUN_GUNCELLE: 'menu:urun-guncelle',
  URUN_SIL: 'menu:urun-sil',
  URUN_ARA: 'menu:urun-ara',
} as const

/** Masa kanalları */
export const MASA_KANALLARI = {
  BOLUMLER: 'masa:bolumler',
  BOLUM_EKLE: 'masa:bolum-ekle',
  BOLUM_GUNCELLE: 'masa:bolum-guncelle',
  MASALAR: 'masa:masalar',
  MASA_EKLE: 'masa:masa-ekle',
  MASA_GUNCELLE: 'masa:masa-guncelle',
  MASA_DURUMU: 'masa:durumu',
  MASA_BIRLESTIR: 'masa:birlestir',
  MASA_TASI: 'masa:tasi',
} as const

/** Hesap & Sipariş kanalları */
export const HESAP_KANALLARI = {
  AC: 'hesap:ac',
  KAPAT: 'hesap:kapat',
  IPTAL: 'hesap:iptal',
  DETAY: 'hesap:detay',
  LISTELE: 'hesap:listele',
  ACIK_HESAPLAR: 'hesap:acik-hesaplar',
  SIPARIS_EKLE: 'hesap:siparis-ekle',
  SIPARIS_IPTAL: 'hesap:siparis-iptal',
  SIPARIS_GUNCELLE: 'hesap:siparis-guncelle',
  SIPARIS_IKRAM_TOGGLE: 'hesap:siparis-ikram-toggle',
  INDIRIM_UYGULA: 'hesap:indirim-uygula',
  HESAP_BOL: 'hesap:bol',
  ODEME_AL: 'hesap:odeme-al',
} as const

/** Mutfak kanalları */
export const MUTFAK_KANALLARI = {
  BEKLEYEN_SIPARISLER: 'mutfak:bekleyen-siparisler',
  DURUM_GUNCELLE: 'mutfak:durum-guncelle',
  YENI_SIPARIS_BILDIRIMI: 'mutfak:yeni-siparis',
} as const

/** Stok kanalları */
export const STOK_KANALLARI = {
  HAMMADDELER: 'stok:hammaddeler',
  HAMMADDE_EKLE: 'stok:hammadde-ekle',
  HAMMADDE_GUNCELLE: 'stok:hammadde-guncelle',
  STOK_GIRIS: 'stok:giris',
  STOK_HAREKETLERI: 'stok:hareketleri',
  RECETELER: 'stok:receteler',
  RECETE_EKLE: 'stok:recete-ekle',
  RECETE_GUNCELLE: 'stok:recete-guncelle',
  MALIYET_ANALIZI: 'stok:maliyet-analizi',
} as const

/** Müşteri kanalları */
export const MUSTERI_KANALLARI = {
  LISTELE: 'musteri:listele',
  EKLE: 'musteri:ekle',
  GUNCELLE: 'musteri:guncelle',
  ARA: 'musteri:ara',
  DETAY: 'musteri:detay',
  SADAKAT_KART: 'musteri:sadakat-kart',
  SADAKAT_YUKLE: 'musteri:sadakat-yukle',
  SADAKAT_HARCAMA: 'musteri:sadakat-harcama',
  CALLER_ID: 'musteri:caller-id',
} as const

/** Rapor kanalları */
export const RAPOR_KANALLARI = {
  GUNLUK_OZET: 'rapor:gunluk-ozet',
  SATIS_RAPORU: 'rapor:satis-raporu',
  KATEGORI_RAPORU: 'rapor:kategori-raporu',
  URUN_RAPORU: 'rapor:urun-raporu',
  PERSONEL_RAPORU: 'rapor:personel-raporu',
  SAATLIK_DAGILIM: 'rapor:saatlik-dagilim',
  STOK_RAPORU: 'rapor:stok-raporu',
  KASA_RAPORU: 'rapor:kasa-raporu',
  DISA_AKTAR: 'rapor:disa-aktar',
} as const

/** Kasa kanalları */
export const KASA_KANALLARI = {
  LISTELE: 'kasa:listele',
  HAREKET_EKLE: 'kasa:hareket-ekle',
  HAREKETLER: 'kasa:hareketler',
} as const

/** Yazıcı kanalları */
export const YAZICI_KANALLARI = {
  FISI_YAZDIR: 'yazici:fisi-yazdir',
  MUTFAK_YAZDIR: 'yazici:mutfak-yazdir',
  TEST_YAZDIR: 'yazici:test-yazdir',
  AYARLAR: 'yazici:ayarlar',
} as const

/** Fatura kanalları */
export const FATURA_KANALLARI = {
  E_FATURA_OLUSTUR: 'fatura:e-fatura-olustur',
  E_ARSIV_OLUSTUR: 'fatura:e-arsiv-olustur',
  FATURA_SORGULA: 'fatura:sorgula',
  FATURA_LISTELE: 'fatura:listele',
} as const

/** Ayar kanalları */
export const AYAR_KANALLARI = {
  GETIR: 'ayar:getir',
  KAYDET: 'ayar:kaydet',
  TUMU: 'ayar:tumu',
} as const

/** Genel uygulama kanalları */
export const UYGULAMA_KANALLARI = {
  SURUM_BILGISI: 'uygulama:surum',
  YENIDEN_BASLAT: 'uygulama:yeniden-baslat',
  KAPAT: 'uygulama:kapat',
  TAM_EKRAN: 'uygulama:tam-ekran',
  VERITABANI_YEDEKLE: 'uygulama:veritabani-yedekle',
} as const
