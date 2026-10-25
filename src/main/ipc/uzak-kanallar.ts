// =====================================================
// İkinci kasanın LAN köprüsü (/api/ipc) üzerinden çağırabileceği kanallar
// Ana kasa yalnızca bu listedekileri kabul eder (izin listesi)
// =====================================================

import {
  PERSONEL_KANALLARI,
  MENU_KANALLARI,
  MASA_KANALLARI,
  HESAP_KANALLARI,
  MUTFAK_KANALLARI,
  STOK_KANALLARI,
  MUSTERI_KANALLARI,
  RAPOR_KANALLARI,
  KASA_KANALLARI,
  REZERVASYON_KANALLARI,
  DENETIM_KANALLARI,
  AYAR_KANALLARI,
  FATURA_KANALLARI,
} from '../../common/ipc-channels'
import { yerelKanalMi } from './ipc-registry'

const UZAK_KANALLAR: ReadonlySet<string> = new Set(
  [
    ...Object.values(PERSONEL_KANALLARI),
    ...Object.values(MENU_KANALLARI),
    ...Object.values(MASA_KANALLARI),
    ...Object.values(HESAP_KANALLARI),
    ...Object.values(MUTFAK_KANALLARI),
    ...Object.values(STOK_KANALLARI),
    ...Object.values(MUSTERI_KANALLARI),
    ...Object.values(RAPOR_KANALLARI),
    ...Object.values(KASA_KANALLARI),
    ...Object.values(REZERVASYON_KANALLARI),
    ...Object.values(DENETIM_KANALLARI),
    ...Object.values(AYAR_KANALLARI),
    ...Object.values(FATURA_KANALLARI),
  ].filter((k) => !yerelKanalMi(k))
)

export function uzakKanalListesi(): string[] {
  return [...UZAK_KANALLAR]
}

export function uzakKanalIzinliMi(kanal: string): boolean {
  return UZAK_KANALLAR.has(kanal)
}
