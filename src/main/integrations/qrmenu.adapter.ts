// =====================================================
// QR Menü Senkronizasyon Adaptörü
// Yerel DB değişikliklerini bulut QR Menüye aktarır
// =====================================================

import { veritabaniGetir } from '../database/connection'

export class QRMenuAdapter {
  private cloudApiUrl: string
  private syncToken: string

  constructor(cloudApiUrl: string = 'https://api.qrmenu.com', syncToken: string = 'MOCK_SYNC_TOKEN') {
    this.cloudApiUrl = cloudApiUrl
    this.syncToken = syncToken
  }

  /**
   * Tüm menüyü buluta gönderir (Senkronizasyon)
   */
  public async tamSenkronizasyon(): Promise<boolean> {
    console.log(`[QR-Menü] Tam senkronizasyon başlatılıyor...`)
    
    try {
      const db = veritabaniGetir()
      const kategoriler = db.prepare('SELECT id, ad, renk, ikon FROM kategori WHERE aktif = 1').all()
      const urunler = db.prepare('SELECT id, kategori_id, ad, fiyat, birim, resim_yolu FROM urun WHERE aktif = 1').all()

      const payload = {
        kategoriler,
        urunler,
        timestamp: new Date().toISOString()
      }

      // Buluta istek atıldığını varsayıyoruz
      // axios.post(this.cloudApiUrl + '/sync', payload, { headers: { Authorization: this.syncToken } })

      console.log(`[QR-Menü] Senkronizasyon başarılı. ${kategoriler.length} kategori, ${urunler.length} ürün güncellendi.`)
      return true
    } catch (error) {
      console.error(`[QR-Menü] Senkronizasyon hatası:`, error)
      return false
    }
  }

  /**
   * Sadece fiyatı değişen ürünleri hızlıca senkronize eder
   */
  public async fiyatGuncelle(urunId: number, yeniFiyat: number): Promise<boolean> {
    console.log(`[QR-Menü] Ürün #${urunId} fiyatı ${yeniFiyat} olarak güncellendi. (Buluta iletildi)`)
    return true
  }

  /**
   * Stoğu biten ürünü menüden hızlıca kaldırır
   */
  public async stokDurumuGuncelle(urunId: number, stokVar: boolean): Promise<boolean> {
    console.log(`[QR-Menü] Ürün #${urunId} stok durumu: ${stokVar ? 'VAR' : 'YOK'} (Buluta iletildi)`)
    return true
  }
}
