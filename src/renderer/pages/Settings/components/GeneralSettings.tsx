import React, { useState, useEffect } from 'react'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/Toast'
import { ipcInvoke } from '../../../hooks/useIPC'
import { AYAR_KANALLARI, YAZICI_KANALLARI } from '../../../../common/ipc-channels'
import { Save, Printer } from 'lucide-react'

export default function GeneralSettings() {
  const [ayarlar, setAyarlar] = useState<Record<string, string>>({})
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [yazicilar, setYazicilar] = useState<{name: string, displayName: string, description: string}[]>([])
  const { success, error } = useToast()

  const ayariGetir = (anahtar: string) => ayarlar[anahtar] || ''
  
  const ayarDegistir = (anahtar: string, deger: string) => {
    setAyarlar(prev => ({ ...prev, [anahtar]: deger }))
  }

  const verileriYukle = async () => {
    try {
      const data = await ipcInvoke<Record<string, string>>(AYAR_KANALLARI.TUMU)
      setAyarlar(data || {})

      // Yazıcıları çek
      const printerRes = await ipcInvoke<any>(YAZICI_KANALLARI.AYARLAR)
      if (printerRes?.basarili && printerRes.yazicilar) {
        setYazicilar(printerRes.yazicilar)
      }
    } catch (err: any) {
      error('Hata', err.message || 'Ayarlar yüklenemedi')
    }
  }

  useEffect(() => {
    verileriYukle()
  }, [])

  const kaydet = async () => {
    setKaydediliyor(true)
    try {
      // Değişen tüm ayarları kaydet
      for (const [anahtar, deger] of Object.entries(ayarlar)) {
        await ipcInvoke(AYAR_KANALLARI.KAYDET, anahtar, deger)
      }
      success('Başarılı', 'Genel ayarlar kaydedildi.')
    } catch (err: any) {
      error('Hata', err.message || 'Ayarlar kaydedilemedi')
    } finally {
      setKaydediliyor(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-pos-lg font-bold text-surface-900 dark:text-white">Genel İşletme Ayarları</h2>
          <p className="text-sm text-surface-500 mt-1">İşletme bilgilerini ve fiş yazdırma parametrelerini düzenleyin.</p>
        </div>
        <Button onClick={kaydet} variant="primary" leftIcon={<Save size={20} />} isLoading={kaydediliyor}>
          Değişiklikleri Kaydet
        </Button>
      </div>

      <div className="flex flex-col gap-6 bg-surface-50 dark:bg-surface-800/50 p-6 rounded-pos-lg border border-surface-200 dark:border-surface-700">
        <h3 className="font-bold text-surface-900 dark:text-white pb-2 border-b border-surface-200 dark:border-surface-700">İşletme Bilgileri</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Restoran Adı</label>
            <input 
              type="text" 
              value={ayariGetir('restoran_adi')} 
              onChange={e => ayarDegistir('restoran_adi', e.target.value)} 
              className="w-full px-4 py-2.5 border rounded-pos dark:bg-surface-900 dark:border-surface-700" 
              placeholder="Örn: Lezzet Dünyası" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Telefon</label>
            <input 
              type="text" 
              value={ayariGetir('restoran_telefon')} 
              onChange={e => ayarDegistir('restoran_telefon', e.target.value)} 
              className="w-full px-4 py-2.5 border rounded-pos dark:bg-surface-900 dark:border-surface-700" 
              placeholder="Örn: 0555 123 45 67" 
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <label className="text-sm font-medium">Adres</label>
            <textarea 
              value={ayariGetir('restoran_adres')} 
              onChange={e => ayarDegistir('restoran_adres', e.target.value)} 
              className="w-full px-4 py-2.5 border rounded-pos dark:bg-surface-900 dark:border-surface-700 resize-none h-24" 
              placeholder="Restoran adresi (Fişlerde çıkacak)" 
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 bg-surface-50 dark:bg-surface-800/50 p-6 rounded-pos-lg border border-surface-200 dark:border-surface-700">
        <h3 className="font-bold text-surface-900 dark:text-white pb-2 border-b border-surface-200 dark:border-surface-700">Vergi ve Mali İşlemler</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Varsayılan KDV Oranı (%)</label>
            <input 
              type="number" 
              value={ayariGetir('varsayilan_kdv')} 
              onChange={e => ayarDegistir('varsayilan_kdv', e.target.value)} 
              className="w-full px-4 py-2.5 border rounded-pos dark:bg-surface-900 dark:border-surface-700" 
              placeholder="Örn: 10" 
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Para Birimi</label>
            <select 
              value={ayariGetir('para_birimi') || 'TL'} 
              onChange={e => ayarDegistir('para_birimi', e.target.value)} 
              className="w-full px-4 py-2.5 border rounded-pos dark:bg-surface-900 dark:border-surface-700"
            >
              <option value="TL">Türk Lirası (₺)</option>
              <option value="USD">Dolar ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 bg-surface-50 dark:bg-surface-800/50 p-6 rounded-pos-lg border border-surface-200 dark:border-surface-700">
        <h3 className="font-bold text-surface-900 dark:text-white pb-2 border-b border-surface-200 dark:border-surface-700 flex items-center gap-2">
          <Printer size={20} /> Yazıcı Ayarları (Fiş & Sipariş)
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Müşteri Fiş Yazıcısı (Kasa)</label>
            <div className="flex gap-2">
              <select 
                value={ayariGetir('kasa_yazici')} 
                onChange={e => ayarDegistir('kasa_yazici', e.target.value)} 
                className="flex-1 px-4 py-2.5 border rounded-pos dark:bg-surface-900 dark:border-surface-700"
              >
                <option value="">-- Yazıcı Seçin --</option>
                {yazicilar.map(p => (
                  <option key={p.name} value={p.name}>{p.displayName || p.name}</option>
                ))}
              </select>
              <Button 
                variant="outline" 
                onClick={async () => {
                  const pName = ayariGetir('kasa_yazici');
                  if (!pName) return error('Hata', 'Önce yazıcı seçmelisiniz.');
                  const res = await ipcInvoke<any>(YAZICI_KANALLARI.TEST_YAZDIR, pName);
                  if (res?.basarili) success('Başarılı', 'Test yazdırması gönderildi.');
                  else error('Hata', res?.hata || 'Yazdırma başarısız.');
                }}
              >
                Sına
              </Button>
            </div>
            <span className="text-xs text-surface-500">Müşteriye verilecek adisyon fişlerini yazdırır.</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Mutfak Sipariş Yazıcısı</label>
            <div className="flex gap-2">
              <select 
                value={ayariGetir('mutfak_yazici')} 
                onChange={e => ayarDegistir('mutfak_yazici', e.target.value)} 
                className="flex-1 px-4 py-2.5 border rounded-pos dark:bg-surface-900 dark:border-surface-700"
              >
                <option value="">-- Yazıcı Seçin --</option>
                {yazicilar.map(p => (
                  <option key={p.name} value={p.name}>{p.displayName || p.name}</option>
                ))}
              </select>
              <Button 
                variant="outline" 
                onClick={async () => {
                  const pName = ayariGetir('mutfak_yazici');
                  if (!pName) return error('Hata', 'Önce yazıcı seçmelisiniz.');
                  const res = await ipcInvoke<any>(YAZICI_KANALLARI.TEST_YAZDIR, pName);
                  if (res?.basarili) success('Başarılı', 'Test yazdırması gönderildi.');
                  else error('Hata', res?.hata || 'Yazdırma başarısız.');
                }}
              >
                Sına
              </Button>
            </div>
            <span className="text-xs text-surface-500">Sipariş verildiği anda mutfağa giden bilgi fişlerini yazdırır.</span>
          </div>
          
          <div className="flex flex-col gap-2">
             <label className="text-sm font-medium">Müşteri Fişi Alt Notu</label>
             <input 
               type="text" 
               value={ayariGetir('fis_alt_not')} 
               onChange={e => ayarDegistir('fis_alt_not', e.target.value)} 
               className="w-full px-4 py-2.5 border rounded-pos dark:bg-surface-900 dark:border-surface-700" 
               placeholder="Örn: Afiyet olsun, yine bekleriz!" 
             />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-pos-lg border border-indigo-200 dark:border-indigo-800">
        <h3 className="font-bold text-indigo-900 dark:text-indigo-300 pb-2 border-b border-indigo-200 dark:border-indigo-800 flex items-center gap-2">
          📱 Garson Mobil Terminali
        </h3>
        
        <div className="flex flex-col gap-4">
          <p className="text-sm text-indigo-800 dark:text-indigo-300">
            Garsonlarınız telefonlarının tarayıcısından (Chrome/Safari) aşağıdaki adresi yazarak sipariş alabilirler. 
            Bilgisayar ve telefonlar <strong>aynı Wi-Fi ağına</strong> bağlı olmalıdır.
          </p>
          
          <div className="bg-white dark:bg-surface-900 rounded-pos p-4 border border-indigo-200 dark:border-indigo-700 flex items-center justify-between">
            <code className="text-lg font-mono font-bold text-indigo-600 dark:text-indigo-400">
              http://&lt;bilgisayar-ip&gt;:3847/garson
            </code>
          </div>
          
          <div className="text-sm text-indigo-700 dark:text-indigo-400 space-y-2">
            <p>🔹 <strong>Adımlar:</strong></p>
            <p>1. Uygulamanın çalıştığı bilgisayarın IP adresini öğrenin (konsolda yazan IP).</p>
            <p>2. Telefonun tarayıcısına yazın: <code className="bg-indigo-100 dark:bg-indigo-800 px-2 py-0.5 rounded">http://192.168.x.x:3847/garson</code></p>
            <p>3. Garson PIN kodunu girerek sisteme bağlansın.</p>
            <p>4. Ana Sayfa ikonuna ekleyerek uygulama gibi kullanılabilir.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
