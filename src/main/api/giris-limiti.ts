// =====================================================
// PIN / şifre / LAN jetonu denemeleri için sınır
// İstemci başına artan kilit + tüm istemciler için genel tavan
// =====================================================

const ISTEMCI_MAX_HATA = 5
const ILK_KILIT_MS = 90_000
const EN_UZUN_KILIT_MS = 15 * 60_000
const GENEL_PENCERE_MS = 5 * 60_000
const GENEL_MAX_HATA = 40
const GENEL_KILIT_MS = 60_000

type Kayit = { hatali: number; kilitSayisi: number; kilitBitis: number; sonHata: number }
type Izin = { izinli: true } | { izinli: false; beklemeSn: number }

function yerelMi(adres: string): boolean {
  return adres === '127.0.0.1' || adres === '::1' || adres === '::ffff:127.0.0.1'
}

/**
 * İstemci adresini döndürür.
 * CF-Connecting-IP yalnızca istek bu makinedeki cloudflared'den (loopback) geliyorsa dikkate alınır;
 * LAN'dan gelen biri başlığı sahteleyerek kilidi atlatamaz.
 */
export function istemciAdresi(req: any): string {
  const soket = String(req.socket?.remoteAddress || req.ip || 'bilinmiyor')
  if (yerelMi(soket)) {
    const cf = req.headers?.['cf-connecting-ip']
    if (typeof cf === 'string' && cf.trim()) return 'cf:' + cf.trim()
  }
  return soket
}

export function girisLimitiOlustur() {
  const kayitlar = new Map<string, Kayit>()
  let genelHatalar: number[] = []
  let genelKilitBitis = 0

  return {
    /** Denemeye izin var mı? Yoksa kalan bekleme süresini (sn) döndürür. */
    izinVarMi(anahtar: string): Izin {
      const simdi = Date.now()
      if (genelKilitBitis > simdi) {
        return { izinli: false, beklemeSn: Math.ceil((genelKilitBitis - simdi) / 1000) }
      }
      const k = kayitlar.get(anahtar)
      if (k && k.kilitBitis > simdi) {
        return { izinli: false, beklemeSn: Math.ceil((k.kilitBitis - simdi) / 1000) }
      }
      return { izinli: true }
    },

    /** Hatalı denemeyi kaydeder; kilit başladıysa süresini (sn), yoksa 0 döndürür. */
    hatali(anahtar: string): number {
      const simdi = Date.now()

      genelHatalar = genelHatalar.filter((t) => simdi - t < GENEL_PENCERE_MS)
      genelHatalar.push(simdi)
      if (genelHatalar.length >= GENEL_MAX_HATA) {
        genelKilitBitis = simdi + GENEL_KILIT_MS
        genelHatalar = []
      }

      const k = kayitlar.get(anahtar) || { hatali: 0, kilitSayisi: 0, kilitBitis: 0, sonHata: 0 }
      // Uzun süre sessiz kalan istemcinin sayacı sıfırlanır
      if (simdi - k.sonHata > EN_UZUN_KILIT_MS) {
        k.hatali = 0
        k.kilitSayisi = 0
      }
      k.hatali += 1
      k.sonHata = simdi
      if (k.hatali >= ISTEMCI_MAX_HATA) {
        k.kilitSayisi += 1
        const sure = Math.min(ILK_KILIT_MS * 2 ** (k.kilitSayisi - 1), EN_UZUN_KILIT_MS)
        k.kilitBitis = simdi + sure
        k.hatali = 0
        kayitlar.set(anahtar, k)
        return Math.ceil(sure / 1000)
      }
      kayitlar.set(anahtar, k)
      return 0
    },

    basarili(anahtar: string): void {
      kayitlar.delete(anahtar)
    },
  }
}

/** Garson PIN, patron PIN ve kullanıcı adı/şifre girişleri */
export const pinGirisLimiti = girisLimitiOlustur()

/** İkinci kasa LAN jetonu — PIN saldırısı ikinci kasayı kilitlemesin diye ayrı tutulur */
export const lanJetonLimiti = girisLimitiOlustur()
