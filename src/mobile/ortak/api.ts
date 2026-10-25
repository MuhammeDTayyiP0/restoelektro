// Telefon arayüzleri için POS API istemcisi (aynı origin)

export class ApiHatasi extends Error {
  constructor(public durum: number, mesaj: string, public veri: any = null) {
    super(mesaj)
  }
}

/**
 * JSON isteği. 401 → oturumKapandi çağrılır; ağ hatası durum 0 ile ApiHatasi olarak fırlatılır.
 */
export async function istek<T = any>(
  yol: string,
  secenek: { token?: string | null; govde?: unknown; yontem?: string; oturumKapandi?: () => void } = {}
): Promise<T> {
  let cevap: Response
  try {
    cevap = await fetch(yol, {
      method: secenek.yontem || (secenek.govde !== undefined ? 'POST' : 'GET'),
      headers: {
        ...(secenek.govde !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(secenek.token ? { Authorization: 'Bearer ' + secenek.token } : {}),
      },
      body: secenek.govde !== undefined ? JSON.stringify(secenek.govde) : undefined,
    })
  } catch {
    throw new ApiHatasi(0, 'Bağlantı hatası — POS açık mı?')
  }
  const veri = await cevap.json().catch(() => null)
  if (cevap.status === 401 && secenek.token) secenek.oturumKapandi?.()
  if (!cevap.ok) throw new ApiHatasi(cevap.status, veri?.hata || `İstek başarısız (HTTP ${cevap.status})`, veri)
  return veri as T
}
