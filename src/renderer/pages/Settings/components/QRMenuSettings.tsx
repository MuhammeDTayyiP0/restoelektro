import React, { useState, useEffect } from 'react'
import { QrCode, Save, Printer } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { QRCodeSVG } from 'qrcode.react'
import { useIPC, ipcInvoke } from '../../../hooks/useIPC'
import { MASA_KANALLARI, AYAR_KANALLARI } from '../../../../common/ipc-channels'
import type { Masa, Bolum } from '../../../../common/types/table.types'
import { useToast } from '../../../components/ui/Toast'

export default function QRMenuSettings() {
  const { success, error } = useToast()
  const [baseUrl, setBaseUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [seciliBolum, setSeciliBolum] = useState<number | null>(null)

  const { veri: bolumler = [] } = useIPC<Bolum[]>(MASA_KANALLARI.BOLUMLER, [])
  const { veri: masalar = [] } = useIPC<Masa[]>(MASA_KANALLARI.MASALAR, [])

  // Ayarı yükle
  useEffect(() => {
    const ayariYukle = async () => {
      try {
        const res = await ipcInvoke<any>(AYAR_KANALLARI.GETIR, 'qr_menu_base_url')
        if (res && res.deger) {
          setBaseUrl(res.deger)
        } else {
          setBaseUrl('https://menu.geldesat.com/qrmenu') // Default
        }
      } catch (e) {
        console.error(e)
      }
    }
    ayariYukle()
  }, [])

  // Ayarı kaydet
  const ayariKaydet = async () => {
    setIsSaving(true)
    try {
      await ipcInvoke(AYAR_KANALLARI.KAYDET, 'qr_menu_base_url', baseUrl)
      success('Başarılı', 'QR Menü temel adresi kaydedildi.')
    } catch (e) {
      error('Hata', 'Ayar kaydedilemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  // Yazdır
  const yazdir = () => {
    window.print()
  }

  const filtrelenmisMasalar = seciliBolum 
    ? masalar.filter(m => m.bolum_id === seciliBolum)
    : masalar

  return (
    <div className="space-y-8 pb-10">
      
      {/* Ayarlar Kartı */}
      <div className="bg-white dark:bg-surface-800 p-6 rounded-pos border border-surface-200 dark:border-surface-700 no-print">
        <h2 className="text-pos-lg font-bold text-surface-900 dark:text-white flex items-center gap-2 mb-4">
          <QrCode size={20} className="text-brand-500" /> 
          QR Menü Temel Adresi
        </h2>
        <p className="text-surface-500 dark:text-surface-400 text-sm mb-4">
          Masaların QR kodlarını oluştururken kullanılacak temel web adresi. Cloudflare tünel adresinizi veya domain adresinizi buraya girin. 
          Örn: <code>https://menu.geldesat.com/qrmenu</code>
        </p>

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
              Temel Menü URL'si
            </label>
            <input 
              type="text" 
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full h-11 px-4 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-pos-sm focus:outline-none focus:border-brand-500 text-surface-900 dark:text-white transition-colors"
              placeholder="https://menu.geldesat.com/qrmenu"
            />
          </div>
          <Button 
            onClick={ayariKaydet} 
            loading={isSaving}
            className="h-11"
          >
            <Save size={18} className="mr-2" />
            Kaydet
          </Button>
        </div>
      </div>

      {/* Yazdırma Bölümü (Sadece baskıda görünür/gizlenir vs ayarlayacağız ama tailwind print class'ları kullanacağız) */}
      <div className="bg-white dark:bg-surface-800 p-6 rounded-pos border border-surface-200 dark:border-surface-700 print:border-none print:p-0">
        <div className="flex justify-between items-center mb-6 no-print">
          <h2 className="text-pos-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
            <Printer size={20} className="text-brand-500" /> 
            Masa QR Kodları
          </h2>
          <Button onClick={yazdir} variant="secondary">
            <Printer size={18} className="mr-2" />
            Sayfayı Yazdır
          </Button>
        </div>

        {/* Bölüm Filtresi */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-print">
          <button
            onClick={() => setSeciliBolum(null)}
            className={`px-4 py-2 rounded-pos-sm font-medium text-sm whitespace-nowrap transition-colors ${
              seciliBolum === null 
                ? 'bg-brand-500 text-white' 
                : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
            }`}
          >
            Tümü
          </button>
          {bolumler.map(b => (
            <button
              key={b.id}
              onClick={() => setSeciliBolum(b.id)}
              className={`px-4 py-2 rounded-pos-sm font-medium text-sm whitespace-nowrap transition-colors ${
                seciliBolum === b.id 
                  ? 'bg-brand-500 text-white' 
                  : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
              }`}
            >
              {b.ad}
            </button>
          ))}
        </div>

        {/* QR Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 print-container print:grid-cols-4 print:gap-8">
          {filtrelenmisMasalar.map(masa => {
            const bolum = bolumler.find(b => b.id === masa.bolum_id)
            // URL formatı: baseUrl?masa=MasaNumarasi
            // baseUrl zaten query string içeriyorsa & ile bağla, içermiyorsa ? ile bağla
            const isBaseUrlHasQuery = baseUrl.includes('?')
            const seperator = isBaseUrlHasQuery ? '&' : '?'
            const finalUrl = `${baseUrl}${seperator}masa=${encodeURIComponent(masa.numara)}`

            return (
              <div key={masa.id} className="flex flex-col items-center p-4 border border-surface-200 dark:border-surface-700 rounded-pos bg-white break-inside-avoid shadow-sm print:shadow-none print:border-gray-300">
                <div className="text-center mb-3">
                  <div className="font-bold text-lg text-surface-900 print:text-black">{masa.numara}</div>
                  <div className="text-xs text-surface-500 print:text-gray-600">{bolum?.ad}</div>
                </div>
                
                <div className="bg-white p-2 border border-surface-100 rounded-lg shadow-sm print:border-none print:shadow-none">
                  <QRCodeSVG 
                    value={finalUrl}
                    size={130}
                    level="Q"
                    includeMargin={false}
                  />
                </div>
                
                <div className="mt-3 text-[10px] text-center text-surface-400 print:text-gray-500 truncate w-full" title={finalUrl}>
                  {finalUrl}
                </div>
              </div>
            )
          })}
        </div>
        
        {filtrelenmisMasalar.length === 0 && (
          <div className="text-center py-12 text-surface-500 dark:text-surface-400 no-print">
            Gösterilecek masa bulunamadı.
          </div>
        )}

      </div>
      
      {/* Özel Print CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 1cm; size: A4 portrait; }
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          header, aside, .no-print, .tabs, .sidebar { display: none !important; }
        }
      `}} />
    </div>
  )
}
