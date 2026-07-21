import React, { useState, useEffect } from 'react'
import { Search, Plus, Phone, CreditCard, Gift, User, MapPin } from 'lucide-react'
import { clsx } from 'clsx'
import { useIPC, useIPCListener, ipcInvoke } from '../../hooks/useIPC'
import { MUSTERI_KANALLARI } from '../../../common/ipc-channels'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { SearchInput } from '../../components/ui/SearchInput'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { formatPara, formatTelefon, formatTarih } from '../../utils/formatters'
import { useToast } from '../../components/ui/Toast'

export default function CustomerPage() {
  const [arama, setArama] = useState('')
  const { veri: musteriler, yukleniyor, yenile } = useIPC<any[]>(MUSTERI_KANALLARI.LISTELE, [])
  const { success, error, info } = useToast()

  const [seciliMusteriId, setSeciliMusteriId] = useState<number | null>(null)
  const [musteriDetay, setMusteriDetay] = useState<any>(null)
  
  const [yeniMusteriModalAcik, setYeniMusteriModalAcik] = useState(false)
  const [gelenArama, setGelenArama] = useState<{ telefon: string, musteri: any | null } | null>(null)

  // Arama metnine göre filtreleme
  const gosterilenMusteriler = arama 
    ? musteriler.filter(m => 
        m.ad.toLowerCase().includes(arama.toLowerCase()) || 
        (m.soyad && m.soyad.toLowerCase().includes(arama.toLowerCase())) ||
        (m.telefon && m.telefon.includes(arama))
      )
    : musteriler

  // Müşteri Detayını Çek
  useEffect(() => {
    if (seciliMusteriId) {
      ipcInvoke(MUSTERI_KANALLARI.DETAY, seciliMusteriId)
        .then(detay => setMusteriDetay(detay))
        .catch(err => error('Hata', err.message))
    } else {
      setMusteriDetay(null)
    }
  }, [seciliMusteriId, error])

  // Caller ID Dinleyicisi
  useIPCListener('caller-id:arama', async (telefon: string) => {
    info('Yeni Arama', `${formatTelefon(telefon)} arıyor...`)
    try {
      const response = await ipcInvoke(MUSTERI_KANALLARI.CALLER_ID, telefon)
      setGelenArama({ telefon, musteri: response.musteri })
    } catch (err) {
      console.error(err)
    }
  })

  const handleSadakatKartiOlustur = async () => {
    if (!musteriDetay?.id) return
    try {
      const islem = await ipcInvoke(MUSTERI_KANALLARI.SADAKAT_KART, musteriDetay.id)
      if (islem.basarili) {
        success('Başarılı', `Sadakat kartı oluşturuldu: ${islem.kart_no}`)
        // Detayı yenile
        const detay = await ipcInvoke(MUSTERI_KANALLARI.DETAY, musteriDetay.id)
        setMusteriDetay(detay)
      }
    } catch (err: any) {
      error('Hata', err.message)
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface-100 dark:bg-surface-950 p-4 lg:p-6 overflow-hidden animate-fade-in">
      
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="text-pos-2xl font-bold text-surface-900 dark:text-white">
          Müşteri Yönetimi & Sadakat
        </h2>
        <Button variant="primary" leftIcon={<Plus size={18} />} onClick={() => setYeniMusteriModalAcik(true)}>
          Yeni Müşteri
        </Button>
      </div>

      {/* Gelen Arama Bildirimi (Caller ID) */}
      {gelenArama && (
        <div className="mb-6 p-4 bg-brand-500/10 border border-brand-500 rounded-pos-lg flex items-center justify-between animate-slide-down">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-500 text-white rounded-full flex items-center justify-center animate-pulse">
              <Phone size={24} />
            </div>
            <div>
              <h3 className="text-pos-lg font-bold text-brand-600 dark:text-brand-400">
                Gelen Arama
              </h3>
              <p className="text-surface-600 dark:text-surface-300">
                {formatTelefon(gelenArama.telefon)} 
                {gelenArama.musteri ? ` - ${gelenArama.musteri.ad} ${gelenArama.musteri.soyad || ''}` : ' - Kayıtlı Değil'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {gelenArama.musteri ? (
              <Button variant="primary" onClick={() => { setSeciliMusteriId(gelenArama.musteri.id); setGelenArama(null) }}>
                Siparişe Başla
              </Button>
            ) : (
              <Button variant="success" onClick={() => { 
                setYeniMusteriModalAcik(true)
                // Modal formuna telefonu otomatik aktarmak için state kullanılabilir
                setGelenArama(null) 
              }}>
                Müşteri Olarak Kaydet
              </Button>
            )}
            <Button variant="ghost" onClick={() => setGelenArama(null)}>Gizle</Button>
          </div>
        </div>
      )}

      <div className="flex gap-6 flex-1 overflow-hidden">
        
        {/* Sol Taraf - Müşteri Listesi */}
        <div className="w-1/3 flex flex-col bg-white dark:bg-surface-900 rounded-pos-lg border border-surface-200 dark:border-surface-800 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-surface-200 dark:border-surface-800">
            <SearchInput value={arama} onChange={setArama} placeholder="İsim veya telefon ara..." />
          </div>
          
          <div className="flex-1 overflow-y-auto pos-scrollbar divide-y divide-surface-100 dark:divide-surface-800/50">
            {yukleniyor ? (
              <p className="p-4 text-center text-surface-500">Yükleniyor...</p>
            ) : (
              gosterilenMusteriler.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSeciliMusteriId(m.id)}
                  className={clsx(
                    'w-full text-left p-4 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors focus:outline-none touch-feedback',
                    seciliMusteriId === m.id && 'bg-brand-50 dark:bg-brand-900/20 border-l-4 border-l-brand-500'
                  )}
                >
                  <div className="font-bold text-pos-base">{m.ad} {m.soyad}</div>
                  <div className="text-sm text-surface-500 flex items-center gap-1 mt-1">
                    <Phone size={14} /> {formatTelefon(m.telefon) || 'Telefon yok'}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Sağ Taraf - Detay Görünümü */}
        <div className="flex-1 bg-white dark:bg-surface-900 rounded-pos-lg border border-surface-200 dark:border-surface-800 overflow-hidden shadow-sm flex flex-col">
          {musteriDetay ? (
            <div className="flex-1 overflow-y-auto pos-scrollbar p-6">
              
              {/* Profil Header */}
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-surface-100 dark:bg-surface-800 rounded-full flex items-center justify-center text-surface-400">
                    <User size={40} />
                  </div>
                  <div>
                    <h2 className="text-pos-3xl font-bold">{musteriDetay.ad} {musteriDetay.soyad}</h2>
                    <p className="text-surface-500 text-pos-lg flex items-center gap-2 mt-1">
                      <Phone size={18} /> {formatTelefon(musteriDetay.telefon) || '-'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Düzenle</Button>
                  <Button variant="primary">Sipariş Al</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* İletişim Bilgileri */}
                <Card className="bg-surface-50/50 dark:bg-surface-950/50 border-none shadow-none">
                  <h3 className="font-bold text-pos-lg mb-4 flex items-center gap-2">
                    <MapPin size={20} className="text-surface-400" /> Adres ve Notlar
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <span className="block text-xs font-semibold text-surface-500 uppercase">Adres</span>
                      <span className="text-surface-800 dark:text-surface-200">{musteriDetay.adres || 'Belirtilmemiş'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-surface-500 uppercase">Firma / Ünvan</span>
                      <span className="text-surface-800 dark:text-surface-200">{musteriDetay.unvan || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-semibold text-surface-500 uppercase">Özel Notlar</span>
                      <span className="text-surface-800 dark:text-surface-200">{musteriDetay.notlar || '-'}</span>
                    </div>
                  </div>
                </Card>

                {/* Sadakat Kartı */}
                <Card className={clsx(
                  "border-none shadow-none text-white",
                  musteriDetay.sadakat_karti ? "bg-gradient-to-br from-brand-500 to-indigo-600" : "bg-surface-200 dark:bg-surface-800 text-surface-800 dark:text-surface-300"
                )}>
                  <h3 className="font-bold text-pos-lg mb-4 flex items-center gap-2">
                    {musteriDetay.sadakat_karti ? <Gift size={20} /> : <CreditCard size={20} />}
                    Sadakat (Puan) Kartı
                  </h3>
                  
                  {musteriDetay.sadakat_karti ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-end">
                        <span className="text-sm opacity-80">Kart Numarası</span>
                        <span className="font-mono font-bold tracking-widest">{musteriDetay.sadakat_karti.kart_no}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-sm opacity-80">Kullanılabilir Puan Bakiye</span>
                        <span className="text-pos-3xl font-black">{formatPara(musteriDetay.sadakat_karti.bakiye)}</span>
                      </div>
                      <div className="pt-2">
                        <Button variant="ghost" className="w-full bg-white/20 hover:bg-white/30 text-white">
                          Puan Yükle / Kullan
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                      <p className="mb-4">Bu müşterinin henüz bir sadakat kartı bulunmuyor.</p>
                      <Button variant="primary" onClick={handleSadakatKartiOlustur}>
                        Sadakat Kartı Oluştur
                      </Button>
                    </div>
                  )}
                </Card>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-surface-400">
              <User size={64} className="mb-4 opacity-20" />
              <p className="text-xl">Detayını görmek için listeden bir müşteri seçin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
