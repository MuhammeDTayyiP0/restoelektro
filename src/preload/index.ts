// =====================================================
// Preload Script — contextBridge API Köprüsü
// Renderer (React) ile Main Process arasında güvenli iletişim
// =====================================================

import { contextBridge, ipcRenderer } from 'electron'

// Tip tanımları için — renderer tarafında window.api olarak erişilir
export interface RestoElektroAPI {
  // Genel IPC çağrısı
  invoke: (kanal: string, ...args: unknown[]) => Promise<unknown>
  // Olay dinleyici (main → renderer bildirimleri)
  on: (kanal: string, callback: (...args: unknown[]) => void) => void
  // Olay dinleyiciyi kaldır
  off: (kanal: string, callback: (...args: unknown[]) => void) => void
  // Pencere kontrolleri
  pencere: {
    kucult: () => Promise<void>
    buyut: () => Promise<void>
    kapat: () => Promise<void>
    tamEkran: () => Promise<boolean>
  }
}

// İzin verilen IPC kanalları — güvenlik için filtreleme
const izinliKanallar = [
  // Personel
  'personel:giris-yap', 'personel:cikis-yap', 'personel:pin-giris',
  'personel:listele', 'personel:ekle', 'personel:guncelle', 'personel:sil',
  'personel:yetkileri-getir', 'personel:yetki-guncelle',
  // Menü
  'menu:kategoriler', 'menu:kategori-ekle', 'menu:kategori-guncelle', 'menu:kategori-sil',
  'menu:urunler', 'menu:urun-detay', 'menu:urun-ekle', 'menu:urun-guncelle', 'menu:urun-sil',
  'menu:urun-ara',
  // Masa
  'masa:bolumler', 'masa:bolum-ekle', 'masa:bolum-guncelle', 'masa:masalar', 'masa:masa-ekle',
  'masa:masa-guncelle', 'masa:durumu', 'masa:birlestir', 'masa:tasi',
  // Hesap & Sipariş
  'hesap:ac', 'hesap:kapat', 'hesap:iptal', 'hesap:detay', 'hesap:listele',
  'hesap:acik-hesaplar', 'hesap:siparis-ekle', 'hesap:siparis-iptal',
  'hesap:siparis-guncelle', 'hesap:siparis-ikram-toggle', 'hesap:indirim-uygula', 'hesap:bol', 'hesap:odeme-al',
  // Mutfak
  'mutfak:bekleyen-siparisler', 'mutfak:durum-guncelle', 'mutfak:yeni-siparis',
  // Stok
  'stok:hammaddeler', 'stok:hammadde-ekle', 'stok:hammadde-guncelle',
  'stok:giris', 'stok:hareketleri', 'stok:receteler', 'stok:recete-ekle',
  'stok:recete-guncelle', 'stok:maliyet-analizi',
  // Müşteri
  'musteri:listele', 'musteri:ekle', 'musteri:guncelle', 'musteri:ara',
  'musteri:detay', 'musteri:sadakat-kart', 'musteri:sadakat-yukle',
  'musteri:sadakat-harcama', 'musteri:caller-id',
  // Rapor
  'rapor:gunluk-ozet', 'rapor:satis-raporu', 'rapor:kategori-raporu',
  'rapor:urun-raporu', 'rapor:personel-raporu', 'rapor:saatlik-dagilim',
  'rapor:stok-raporu', 'rapor:kasa-raporu', 'rapor:disa-aktar',
  // Kasa
  'kasa:listele', 'kasa:hareket-ekle', 'kasa:hareketler',
  // Yazıcı
  'yazici:fisi-yazdir', 'yazici:mutfak-yazdir', 'yazici:test-yazdir', 'yazici:ayarlar',
  // Fatura
  'fatura:e-fatura-olustur', 'fatura:e-arsiv-olustur', 'fatura:sorgula', 'fatura:listele',
  // Ayar
  'ayar:getir', 'ayar:kaydet', 'ayar:tumu',
  // Uygulama
  'uygulama:surum', 'uygulama:yeniden-baslat', 'uygulama:kapat',
  'uygulama:tam-ekran', 'uygulama:veritabani-yedekle',
]

// Bildirim kanalları (main → renderer)
const bildirimKanallari = [
  'mutfak:yeni-siparis',
  'musteri:caller-id',
  'masalar:guncellendi',
  'siparis:guncellendi',
  'mutfak:yazdir-istek',
]

// Callback sarmalayıcılarını tutmak için Map
const sarmalayicilar = new WeakMap<Function, any>()

// API'yi renderer'a güvenli şekilde aç
contextBridge.exposeInMainWorld('api', {
  // Genel invoke — sadece izin verilen kanallar
  invoke: (kanal: string, ...args: unknown[]) => {
    if (izinliKanallar.includes(kanal)) {
      return ipcRenderer.invoke(kanal, ...args)
    }
    return Promise.reject(new Error(`İzin verilmeyen IPC kanalı: ${kanal}`))
  },

  // Olay dinleyici — sadece bildirim kanalları
  on: (kanal: string, callback: (...args: unknown[]) => void) => {
    if (bildirimKanallari.includes(kanal)) {
      const sarmalayici = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args)
      sarmalayicilar.set(callback, sarmalayici)
      ipcRenderer.on(kanal, sarmalayici)
    }
  },

  // Olay dinleyiciyi kaldır
  off: (kanal: string, callback: (...args: unknown[]) => void) => {
    const sarmalayici = sarmalayicilar.get(callback)
    if (sarmalayici) {
      ipcRenderer.removeListener(kanal, sarmalayici)
      sarmalayicilar.delete(callback)
    }
  },

  // Pencere kontrolleri
  pencere: {
    kucult: () => ipcRenderer.invoke('pencere:kucult'),
    buyut: () => ipcRenderer.invoke('pencere:buyut'),
    kapat: () => ipcRenderer.invoke('pencere:kapat'),
    tamEkran: () => ipcRenderer.invoke('uygulama:tam-ekran'),
  },
} satisfies RestoElektroAPI)
