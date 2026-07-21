// =====================================================
// Uygulama Sabitleri
// Renkler, durum etiketleri ve genel ayarlar
// =====================================================

export const DURUM_RENKLERI = {
  // Masa durumları
  MASA: {
    bos: 'bg-pos-bos text-white',
    dolu: 'bg-pos-dolu text-white',
    rezerve: 'bg-pos-rezerve text-white',
    birlesti: 'bg-surface-500 text-white',
  },
  
  // Sipariş durumları
  SIPARIS: {
    bekliyor: 'bg-surface-400 text-white',
    hazirlaniyor: 'bg-blue-500 text-white',
    hazir: 'bg-green-500 text-white',
    teslim: 'bg-surface-200 text-surface-800 dark:bg-surface-800 dark:text-surface-300',
    iptal: 'bg-red-500 text-white line-through',
  }
}

export const DURUM_ETIKETLERI = {
  // Masa
  MASA: {
    bos: 'Boş',
    dolu: 'Dolu',
    rezerve: 'Rezerve',
    birlesti: 'Birleşti',
  },
  
  // Sipariş
  SIPARIS: {
    bekliyor: 'Bekliyor',
    hazirlaniyor: 'Hazırlanıyor',
    hazir: 'Hazır',
    teslim: 'Teslim Edildi',
    iptal: 'İptal',
  }
}

// Numpad varsayılan dizilimi (POS cihazlarındaki standart dizilim)
export const NUMPAD_TUSLARI = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  ['C', '0', '⌫'] // C: Temizle, ⌫: Sil
]

// Hızlı miktar tuşları
export const HIZLI_MIKTARLAR = [1, 2, 3, 4, 5, 10]
