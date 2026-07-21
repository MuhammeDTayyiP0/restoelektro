// =====================================================
// Numpad (Sayısal Tuş Takımı) Hook'u
// POS ekranında miktar/tutar girişleri için
// =====================================================

import { useState, useCallback } from 'react'

interface UseKeypadOptions {
  baslangicDegeri?: string
  maksimumKarakter?: number
  ondalikliMi?: boolean
}

export function useKeypad(options: UseKeypadOptions = {}) {
  const { 
    baslangicDegeri = '', 
    maksimumKarakter = 10,
    ondalikliMi = false 
  } = options
  
  const [deger, setDeger] = useState<string>(baslangicDegeri)

  const tusBasildi = useCallback((tus: string) => {
    setDeger(Mevcut => {
      // Temizle
      if (tus === 'C') return ''
      
      // Sil
      if (tus === '⌫') return Mevcut.slice(0, -1)
      
      // Ondalık nokta
      if (tus === ',' || tus === '.') {
        if (!ondalikliMi) return Mevcut
        const nokta = ondalikliMi ? '.' : '' // JS tarafında hesaplama için nokta kullanalım
        if (Mevcut.includes(nokta)) return Mevcut // Zaten varsa ekleme
        return Mevcut === '' ? `0${nokta}` : `${Mevcut}${nokta}`
      }
      
      // Maksimum karakter kontrolü
      if (Mevcut.length >= maksimumKarakter) return Mevcut
      
      // Sayı girişi
      if (Mevcut === '0' && tus !== '0') return tus // Sadece 0 varsa yeni sayıyla değiştir
      if (Mevcut === '0' && tus === '0') return Mevcut // Sadece 0 varken tekrar 0 ekletme
      
      return `${Mevcut}${tus}`
    })
  }, [maksimumKarakter, ondalikliMi])

  const temizle = useCallback(() => setDeger(''), [])
  
  const sayiDegeri = parseFloat(deger) || 0

  return { 
    deger, 
    setDeger, 
    sayiDegeri, 
    tusBasildi, 
    temizle 
  }
}
