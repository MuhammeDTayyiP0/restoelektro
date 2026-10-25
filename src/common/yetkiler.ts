// =====================================================
// Onay gerektiren işlemler (yetki tablosundaki modul/islem çiftleri)
// Ana işlem kontrol eder, arayüz yetki ekranında ve onay penceresinde gösterir
// =====================================================

export const YETKI_ETIKETLERI: Record<string, string> = {
  'pos/iptal': 'Sipariş ve hesap iptali',
  'pos/ikram': 'İkram',
  'pos/indirim': 'İndirim',
  'kasa/yazma': 'Kasa işlemleri (vardiya, gider)',
  'menu/yazma': 'Menü ve fiyat değiştirme',
  'personel/yazma': 'Personel ve yetki yönetimi',
}

/** Yetki ekranında düzenlenebilen roller (admin her zaman tam yetkilidir) */
export const DUZENLENEBILIR_ROLLER: Array<{ rol: string; ad: string }> = [
  { rol: 'mudur', ad: 'Müdür' },
  { rol: 'kasiyer', ad: 'Kasiyer' },
  { rol: 'garson', ad: 'Garson' },
  { rol: 'mutfak', ad: 'Mutfak' },
]
