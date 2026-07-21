// =====================================================
// Yemeksepeti Adaptörü
// Yemeksepeti API'si ile sipariş entegrasyonu (Mock)
// =====================================================

export interface YemeksepetiSiparis {
  ysId: string
  tutar: number
  odemeTipi: string
  urunler: any[]
  musteriBilgi: {
    ad: string
    telefon: string
    adres: string
  }
}

export class YemeksepetiAdapter {
  private apiUser: string
  private apiPass: string

  constructor(apiUser: string = 'mock_user', apiPass: string = 'mock_pass') {
    this.apiUser = apiUser
    this.apiPass = apiPass
  }

  /**
   * Yeni siparişleri kontrol eder
   */
  public async aktifSiparisleriGetir(): Promise<YemeksepetiSiparis[]> {
    console.log(`[Yemeksepeti] Yeni siparişler kontrol ediliyor...`)
    
    // Gerçekte Yemeksepeti SOAP/REST API'ye istek atılır.
    if (Math.random() > 0.9) {
      const mock: YemeksepetiSiparis = {
        ysId: `YS-${Math.floor(Math.random() * 100000)}`,
        tutar: 120.00,
        odemeTipi: 'Online',
        urunler: [{ ad: 'Hamburger Menü', miktar: 1, fiyat: 120.00 }],
        musteriBilgi: {
          ad: 'Ayşe Demir',
          telefon: '0555 555 5555',
          adres: 'Merkez Mah. Test Cad.'
        }
      }
      console.log(`[Yemeksepeti] Yeni sipariş geldi: ${mock.ysId}`)
      return [mock]
    }

    return []
  }

  /**
   * Siparişi onaylar
   */
  public async siparisOnayla(ysId: string, hazirlikSuresiDk: number = 30): Promise<boolean> {
    console.log(`[Yemeksepeti] Sipariş #${ysId} onaylandı. Hazırlık: ${hazirlikSuresiDk} dk.`)
    return true
  }

  /**
   * Siparişi reddeder
   */
  public async siparisReddet(ysId: string, neden: string): Promise<boolean> {
    console.log(`[Yemeksepeti] Sipariş #${ysId} reddedildi. Neden: ${neden}`)
    return true
  }
}
