// =====================================================
// Getir Yemek Adaptörü
// Getir API'si ile sipariş entegrasyonu (Mock)
// =====================================================

export interface GetirSiparis {
  id: string
  tutar: number
  urunler: any[]
  musteriAd: string
  adres: string
}

export class GetirAdapter {
  private restoranId: string
  private token: string

  constructor(restoranId: string = 'MOCK_RESTO', token: string = 'MOCK_TOKEN') {
    this.restoranId = restoranId
    this.token = token
  }

  /**
   * Yeni siparişleri kontrol eder
   */
  public async yeniSiparisleriAl(): Promise<GetirSiparis[]> {
    console.log(`[Getir] ${this.restoranId} için yeni siparişler kontrol ediliyor...`)
    
    // Gerçek hayatta Getir API'ye GET isteği atılır.
    // Şimdilik test amaçlı rastgele %10 ihtimalle yeni sipariş dönelim.
    if (Math.random() > 0.9) {
      const mockSiparis: GetirSiparis = {
        id: `GTR-${Math.floor(Math.random() * 100000)}`,
        tutar: 150.50,
        urunler: [{ ad: 'Karışık Pizza', miktar: 1, fiyat: 150.50 }],
        musteriAd: 'Ahmet Yılmaz',
        adres: 'Örnek Mah. Test Sok. No:1'
      }
      console.log(`[Getir] Yeni sipariş geldi: ${mockSiparis.id}`)
      return [mockSiparis]
    }

    return []
  }

  /**
   * Sipariş durumunu günceller (Örn: Hazırlanıyor, Yola Çıktı, Teslim Edildi)
   */
  public async durumGuncelle(siparisId: string, durum: 'hazirlaniyor' | 'yola_cikti' | 'teslim' | 'iptal'): Promise<boolean> {
    console.log(`[Getir] Sipariş #${siparisId} durumu güncelleniyor: ${durum}`)
    return true
  }

  /**
   * Restoranı Getir sisteminde açık/kapalı duruma getirir
   */
  public async restoranDurumuDegistir(acik: boolean): Promise<boolean> {
    console.log(`[Getir] Restoran durumu ${acik ? 'AÇIK' : 'KAPALI'} olarak ayarlandı.`)
    return true
  }
}
