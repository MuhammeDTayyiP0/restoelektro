// =====================================================
// e-Fatura & e-Arşiv Adaptörü
// GİB / Özel Entegratör API'leri ile iletişim katmanı (Mock)
// =====================================================

import { v4 as uuidv4 } from 'uuid'

export interface FaturaIcerik {
  hesapId: number
  musteriVkn?: string
  musteriUnvan?: string
  toplamTutar: number
  kdvTutar: number
  urunler: Array<{
    ad: string
    miktar: number
    birimFiyat: number
    kdvOran: number
  }>
}

export class EFaturaAdapter {
  private apiKey: string
  private entegratorUrl: string

  constructor(apiKey: string = 'MOCK_API_KEY', entegratorUrl: string = 'https://api.mock-entegrator.com') {
    this.apiKey = apiKey
    this.entegratorUrl = entegratorUrl
  }

  /**
   * Basit bir UBL-TR mock XML şablonu oluşturur
   */
  private generateUBL(fatura: FaturaIcerik): string {
    return `
      <Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
        <ID>${Math.floor(Math.random() * 1000000000)}</ID>
        <UUID>${uuidv4()}</UUID>
        <IssueDate>${new Date().toISOString().split('T')[0]}</IssueDate>
        <AccountingCustomerParty>
          <Party>
            <PartyName><Name>${fatura.musteriUnvan || 'Nihai Tüketici'}</Name></PartyName>
          </Party>
        </AccountingCustomerParty>
        <LegalMonetaryTotal>
          <TaxExclusiveAmount>${(fatura.toplamTutar - fatura.kdvTutar).toFixed(2)}</TaxExclusiveAmount>
          <TaxInclusiveAmount>${fatura.toplamTutar.toFixed(2)}</TaxInclusiveAmount>
        </LegalMonetaryTotal>
      </Invoice>
    `
  }

  /**
   * Faturayı entegratöre gönderir (Mock)
   */
  public async faturaGonder(fatura: FaturaIcerik): Promise<{ basarili: boolean; faturano?: string; uuid?: string; hata?: string }> {
    try {
      console.log(`[e-Fatura] Hesap #${fatura.hesapId} için UBL hazırlanıyor...`)
      
      const xml = this.generateUBL(fatura)
      const uubid = uuidv4()
      const faturano = \`GIB\${new Date().getFullYear()}\${Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')}\`

      console.log(`[e-Fatura] Fatura kuyruğa eklendi. Fatura No: ${faturano}, UUID: ${uubid}`)
      
      // Gerçek hayatta burada axios.post ile entegratör API'sine istek atılır.
      // return axios.post(this.entegratorUrl + '/send', { xml }, { headers: { Authorization: this.apiKey }})

      return {
        basarili: true,
        faturano,
        uuid: uubid
      }
    } catch (error: any) {
      console.error('[e-Fatura] Gönderim Hatası:', error)
      return {
        basarili: false,
        hata: error.message || 'Bilinmeyen hata'
      }
    }
  }

  /**
   * Fatura durumunu sorgular (Mock)
   */
  public async durumSorgula(uuid: string): Promise<string> {
    console.log(`[e-Fatura] Fatura durumu sorgulanıyor: ${uuid}`)
    return 'ONAYLANDI'
  }
}
