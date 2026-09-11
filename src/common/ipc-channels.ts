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
  RESIM_YUKLE: 'menu:resim-yukle',
  TOPLU_FIYAT_GUNCELLE: 'menu:toplu-fiyat-guncelle',
} as const

/** Masa kanalları */
export const MASA_KANALLARI = {
  BOLUMLER: 'masa:bolumler',
  BOLUM_EKLE: 'masa:bolum-ekle',
  BOLUM_GUNCELLE: 'masa:bolum-guncelle',
  MASALAR: 'masa:masalar',
  MASA_EKLE: 'masa:masa-ekle',
  MASA_TOPLU_EKLE: 'masa:toplu-ekle',
  MASA_GUNCELLE: 'masa:masa-guncelle',
  MASA_DURUMU: 'masa:durumu',
  MASA_BIRLESTIR: 'masa:birlestir',
  MASA_TASI: 'masa:tasi',
  KILIT: 'masa:kilit',
  KILIT_AC: 'masa:kilit-ac',
  KILITLER: 'masa:kilitler',
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
  PAKET_LISTELE: 'hesap:paket-listele',
  TESLIMAT_GUNCELLE: 'hesap:teslimat-guncelle',
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
  TEDARIKCI_LISTELE: 'stok:tedarikci-listele',
  TEDARIKCI_EKLE: 'stok:tedarikci-ekle',
  TEDARIKCI_GUNCELLE: 'stok:tedarikci-guncelle',
  ALIS_LISTELE: 'stok:alis-listele',
  ALIS_KAYDET: 'stok:alis-kaydet',
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
  VARDIYA_ACIK: 'kasa:vardiya-acik',
  VARDIYA_AC: 'kasa:vardiya-ac',
  VARDIYA_KAPAT: 'kasa:vardiya-kapat',
  VARDIYA_OZET: 'kasa:vardiya-ozet',
  VARDIYA_GECMIS: 'kasa:vardiya-gecmis',
  GIDER_EKLE: 'kasa:gider-ekle',
} as const

/** Rezervasyon kanalları */
export const REZERVASYON_KANALLARI = {
  LISTELE: 'rezervasyon:listele',
  EKLE: 'rezervasyon:ekle',
  GUNCELLE: 'rezervasyon:guncelle',
  SIL: 'rezervasyon:sil',
  DURUM: 'rezervasyon:durum',
} as const

/** Denetim izi kanalları */
export const DENETIM_KANALLARI = {
  LISTELE: 'denetim:listele',
} as const

/** Terminal / ikinci kasa / eğitim modu */
export const TERMINAL_KANALLARI = {
  GETIR: 'terminal:getir',
  KAYDET: 'terminal:kaydet',
  BAGLANTI_TEST: 'terminal:baglanti-test',
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
  VERITABANI_BILGISI: 'uygulama:veritabani-bilgisi',
  VERITABANI_OPTIMIZE: 'uygulama:veritabani-optimize',
  VERITABANI_YEDEKLER: 'uygulama:veritabani-yedekler',
  OTOMATIK_BASLATMA_DURUM: 'uygulama:otomatik-baslatma-durum',
  OTOMATIK_BASLATMA_AYARLA: 'uygulama:otomatik-baslatma-ayarla',
  PENRECEDEN_GIZLE: 'uygulama:gizle',
  PENRECEDEN_GOSTER: 'uygulama:goster',
} as const

/** Otomatik Güncelleme kanalları (electron-updater) */
export const GUNCELLEME_KANALLARI = {
  KONTROL_ET: 'guncelleme:kontrol-et',
  INDIR: 'guncelleme:indir',
  YUKLE_VE_BASLAT: 'guncelleme:yukle-ve-baslat',
  DURUM_GETIR: 'guncelleme:durum-getir',
  // Bildirimler (Main -> Renderer)
  DURUM_BILDIRIMI: 'guncelleme:durum-bildirimi',
  ILERLEME_BILDIRIMI: 'guncelleme:ilerleme-bildirimi',
} as const

/** Ağ ve IP kanalları */
export const AG_KANALLARI = {
  KARTLARI_GETIR: 'ag:kartlari-getir',
  YEREL_IP_GETIR: 'ag:yerel-ip-getir',
} as const
