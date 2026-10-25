// =====================================================
// IPC Hook'u
// Renderer'dan Main process'e güvenli çağrı yapmak için
// =====================================================

import { useCallback, useEffect, useState, useRef } from 'react'
import { PERSONEL_KANALLARI } from '../../common/ipc-channels'
import { yoneticiOnayiIste } from '../stores/useOnayStore'

/**
 * IPC üzerinden asenkron veri çeken ve durumu yöneten hook
 * @param kanal IPC kanal adı
 * @param varsayilanDeger Başlangıç değeri
 * @param argumanlar IPC çağrısına gidecek parametreler (array olarak)
 */
export function useIPC<T>(kanal: string, varsayilanDeger: T, argumanlar: any[] = []) {
  const [veri, setVeri] = useState<T>(varsayilanDeger)
  const [yukleniyor, setYukleniyor] = useState<boolean>(true)
  const [hata, setHata] = useState<string | null>(null)

  // Veriyi manuel yenilemek için fonksiyon
  const yenile = useCallback(async (...yeniArgs: any[]) => {
    setYukleniyor(true)
    setHata(null)
    try {
      // @ts-ignore - window.api tip tanımı main.tsx içinde yapıldı
      const args = yeniArgs.length > 0 ? yeniArgs : argumanlar
      const sonuc = await window.api.invoke(kanal, ...args)
      setVeri(sonuc as T)
    } catch (err: any) {
      setHata(err.message || 'IPC çağrısı başarısız oldu')
      console.error(`[IPC Error] ${kanal}:`, err)
    } finally {
      setYukleniyor(false)
    }
  }, [kanal, JSON.stringify(argumanlar)])

  // Bileşen yüklendiğinde otomatik çağır
  useEffect(() => {
    yenile()
  }, [yenile])

  return { veri, yukleniyor, hata, yenile, setVeri }
}

/**
 * Sadece olay dinlemek için hook (Main -> Renderer bildirimleri)
 */
export function useIPCListener(kanal: string, callback: (...args: any[]) => void) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    const handler = (...args: any[]) => savedCallback.current(...args)
    // @ts-ignore
    window.api.on(kanal, handler)
    return () => {
      // @ts-ignore
      window.api.off(kanal, handler)
    }
  }, [kanal])
}

/**
 * Beklemeye gerek kalmadan basit bir invoke yapmak için yardımcı fonksiyon.
 * Ana işlem yönetici onayı isterse (yetkiGerekli) PIN penceresi açılır ve onaylanınca çağrı bir kez tekrarlanır.
 */
export async function ipcInvoke<T = any>(kanal: string, ...args: any[]): Promise<T> {
  const sonuc: any = await window.api.invoke(kanal, ...args)
  if (sonuc && typeof sonuc === 'object' && sonuc.yetkiGerekli && kanal !== PERSONEL_KANALLARI.YONETICI_ONAYI) {
    const onaylandi = await yoneticiOnayiIste(sonuc.yetkiGerekli, sonuc.hata)
    if (onaylandi) return (await window.api.invoke(kanal, ...args)) as T
  }
  return sonuc as T
}
