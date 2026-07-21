import React, { useEffect, useState, useMemo } from 'react'
import { Check, Clock, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'
import { useIPC, useIPCListener, ipcInvoke } from '../../hooks/useIPC'
import { MUTFAK_KANALLARI } from '../../../common/ipc-channels'
import type { Siparis } from '../../../common/types/pos.types'
import { formatSaat, gecenDakikaHesapla } from '../../utils/formatters'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'

export default function KitchenScreen() {
  const { veri: siparisler, yukleniyor, yenile, setVeri: setSiparisler } = useIPC<Siparis[]>(MUTFAK_KANALLARI.BEKLEYEN_SIPARISLER, [])
  const { success, error } = useToast()
  
  // Anlık saniye güncelleyici (Bekleme sürelerini canlı tutmak için)
  const [ticker, setTicker] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTicker(t => t + 1), 60000) // Dakikada bir
    return () => clearInterval(timer)
  }, [])

  // Yeni sipariş geldiğinde listeyi otomatik yenile
  useIPCListener('mutfak:yeni-siparis', () => {
    yenile()
    // Opsiyonel: Burada bir zil sesi çalınabilir
  })

  const durumGuncelle = async (siparisId: number, yeniDurum: string) => {
    try {
      const response = await ipcInvoke(MUTFAK_KANALLARI.DURUM_GUNCELLE, siparisId, yeniDurum)
      if (response.basarili) {
        // UI'dan da anında kaldır (veya durumunu değiştir)
        if (yeniDurum === 'hazir') {
          setSiparisler(mevcut => mevcut.filter(s => s.id !== siparisId))
          success('Sipariş Hazır', 'Sipariş hazır olarak işaretlendi ve garsona bildirildi.')
        } else {
          setSiparisler(mevcut => mevcut.map(s => s.id === siparisId ? { ...s, durum: yeniDurum } : s))
        }
      } else {
        error('Hata', 'Sipariş durumu güncellenemedi')
      }
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  // Siparişleri masalara/hesaplara göre grupla (Fiş görünümü)
  const fisler = useMemo(() => {
    const gruplar: Record<number, Siparis[]> = {}
    siparisler.forEach(siparis => {
      if (!gruplar[siparis.hesap_id]) {
        gruplar[siparis.hesap_id] = []
      }
      gruplar[siparis.hesap_id].push(siparis)
    })
    return Object.values(gruplar).sort((a, b) => {
      const zamanA = new Date(a[0].siparis_zamani!).getTime()
      const zamanB = new Date(b[0].siparis_zamani!).getTime()
      return zamanA - zamanB
    })
  }, [siparisler])

  if (yukleniyor && siparisler.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-surface-500 animate-pulse text-xl">Bekleyen Siparişler Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full animate-fade-in p-4 bg-surface-800 text-white min-h-screen">
      
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6 border-b border-surface-700 pb-4">
        <h2 className="text-pos-3xl font-bold text-white flex items-center gap-3">
          Mutfak Ekranı
          <span className="bg-brand-500 text-white text-sm px-3 py-1 rounded-full">
            {siparisler.length} Bekleyen
          </span>
        </h2>
      </div>

      {/* Fişler Grid */}
      <div className="flex-1 overflow-x-auto pos-scrollbar pb-4">
        <div className="flex gap-4 h-full items-start">
          {fisler.map((fis, index) => {
            const ilkSiparis = fis[0]
            const beklemeSuresi = gecenDakikaHesapla(ilkSiparis.siparis_zamani)
            const acilMi = beklemeSuresi > 15

            return (
              <div 
                key={ilkSiparis.hesap_id}
                className={clsx(
                  'flex-shrink-0 w-80 max-h-full flex flex-col rounded-pos-lg shadow-pos-lg overflow-hidden border',
                  acilMi 
                    ? 'bg-red-950/30 border-red-500/50' 
                    : 'bg-surface-900 border-surface-700'
                )}
              >
                {/* Fiş Başlığı */}
                <div className={clsx(
                  'p-4 flex flex-col gap-2',
                  acilMi ? 'bg-red-600' : 'bg-surface-700'
                )}>
                  <div className="flex justify-between items-center">
                    <span className="text-pos-xl font-bold">
                      {ilkSiparis.masa_numara ? `Masa ${ilkSiparis.masa_numara}` : 'Paket'}
                    </span>
                    <div className="flex items-center gap-1 text-sm font-medium bg-black/20 px-2 py-1 rounded-md">
                      <Clock size={16} />
                      {beklemeSuresi} dk
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm opacity-80">
                    <span>Garson: {ilkSiparis.garson_adi}</span>
                    <span>{formatSaat(ilkSiparis.siparis_zamani)}</span>
                  </div>
                </div>

                {/* Fiş Kalemleri */}
                <div className="flex-1 overflow-y-auto pos-scrollbar p-3 flex flex-col gap-3">
                  {fis.map(kalem => (
                    <div 
                      key={kalem.id}
                      className={clsx(
                        'p-3 rounded-pos border transition-colors',
                        kalem.durum === 'hazirlaniyor' 
                          ? 'bg-brand-900/40 border-brand-500/50' 
                          : 'bg-surface-800 border-surface-600'
                      )}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-2">
                          <span className="text-pos-lg font-bold w-6 text-brand-400">{kalem.miktar}x</span>
                          <div className="flex flex-col">
                            <span className="text-pos-lg font-bold leading-tight">{kalem.urun_adi}</span>
                            {kalem.varyant_adi && <span className="text-sm text-surface-400">[{kalem.varyant_adi}]</span>}
                          </div>
                        </div>
                      </div>
                      
                      {kalem.notlar && (
                        <div className="mt-2 mb-3 p-2 bg-amber-500/20 text-amber-200 border border-amber-500/30 rounded-md text-sm italic flex gap-2 items-start">
                          <AlertCircle size={16} className="mt-0.5 shrink-0" />
                          <span>{kalem.notlar}</span>
                        </div>
                      )}

                      {/* Aksiyon Butonları */}
                      <div className="flex gap-2 mt-3 pt-3 border-t border-surface-700/50">
                        {kalem.durum === 'bekliyor' ? (
                          <Button 
                            variant="outline" 
                            fullWidth 
                            size="sm"
                            className="border-brand-500 text-brand-400 hover:bg-brand-500/20"
                            onClick={() => durumGuncelle(kalem.id!, 'hazirlaniyor')}
                          >
                            Başla
                          </Button>
                        ) : (
                          <Button 
                            variant="success" 
                            fullWidth 
                            size="sm"
                            leftIcon={<Check size={18} />}
                            onClick={() => durumGuncelle(kalem.id!, 'hazir')}
                          >
                            Hazır
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Toplu İşlem Footer */}
                <div className="p-3 bg-surface-950 border-t border-surface-700">
                   <Button 
                     variant="primary" 
                     fullWidth 
                     leftIcon={<Check size={20} />}
                     onClick={() => {
                        // Tümü hazırla
                        fis.forEach(k => {
                           if (k.durum !== 'hazir') durumGuncelle(k.id!, 'hazir')
                        })
                     }}
                   >
                     Tümünü Hazırla
                   </Button>
                </div>
              </div>
            )
          })}
          
          {fisler.length === 0 && (
            <div className="flex flex-col items-center justify-center w-full h-[60vh] text-surface-500">
              <Check size={64} className="mb-4 opacity-20" />
              <p className="text-2xl font-medium">Mutfak rahat, bekleyen sipariş yok.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
