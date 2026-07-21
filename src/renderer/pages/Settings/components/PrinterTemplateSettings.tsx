import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '../../../components/ui/Button'
import { Save, FileText, Utensils } from 'lucide-react'
import { clsx } from 'clsx'
import { useIPC, ipcInvoke } from '../../../hooks/useIPC'
import { AYAR_KANALLARI } from '../../../../common/ipc-channels'
import { useToast } from '../../../components/ui/Toast'
import { 
  MutfakSablonConfig, 
  KasaSablonConfig, 
  defaultMutfakConfig, 
  defaultKasaConfig,
  generateMutfakHtml,
  generateAdisyonHtml
} from '../../../utils/print.utils'

// Sahte (Mock) veriler - Sadece önizleme amaçlı
const mockMasaNo = "12";
const mockRestoranBilgileri = {
  ad: "ETİBOL KEBAP & DÖNER",
  telefon: "0212 555 44 33",
  adres: "Atatürk Cad. No:123 Kadıköy/İstanbul",
  altNot: ""
};

const mockSiparisler = [
  { urun_adi: "Adana Kebap", miktar: 1, birim_fiyat: 250, toplam_fiyat: 250, opsiyonlar: [{ ad: "Acılı" }], notlar: "Az pişmiş olsun" },
  { urun_adi: "Kutu Kola", miktar: 2, birim_fiyat: 40, toplam_fiyat: 80, opsiyonlar: [] },
  { urun_adi: "Çoban Salata", miktar: 1, birim_fiyat: 70, toplam_fiyat: 70, opsiyonlar: [] }
];

const mockIptaller = [
  { urun_adi: "Ayran", miktar: 1, opsiyonlar: [] }
];

const mockHesap = {
  hesap_no: "84729",
  masa_id: 12,
  toplam_tutar: 400,
  indirim_tutari: 0,
  net_tutar: 400,
  odemeler: [{ tutar: 200, tip: "nakit" }],
  siparisler: mockSiparisler
};

export default function PrinterTemplateSettings() {
  const { success, error } = useToast()
  
  const [activeTab, setActiveTab] = useState<'kasa' | 'mutfak'>('kasa')
  const [kasaConfig, setKasaConfig] = useState<KasaSablonConfig>(defaultKasaConfig)
  const [mutfakConfig, setMutfakConfig] = useState<MutfakSablonConfig>(defaultMutfakConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const yukle = async () => {
      try {
        const kasaData = await ipcInvoke<string>(AYAR_KANALLARI.GETIR, 'yazici_sablon_kasa')
        if (kasaData) {
          try { setKasaConfig({ ...defaultKasaConfig, ...JSON.parse(kasaData) }) } catch(e){}
        }
        
        const mutfakData = await ipcInvoke<string>(AYAR_KANALLARI.GETIR, 'yazici_sablon_mutfak')
        if (mutfakData) {
          try { setMutfakConfig({ ...defaultMutfakConfig, ...JSON.parse(mutfakData) }) } catch(e){}
        }
      } catch (err) {
        console.error("Şablonlar yüklenemedi", err)
      } finally {
        setLoading(false)
      }
    }
    yukle()
  }, [])

  const handleKasaChange = (key: keyof KasaSablonConfig, value: any) => {
    setKasaConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleMutfakChange = (key: keyof MutfakSablonConfig, value: any) => {
    setMutfakConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await ipcInvoke(AYAR_KANALLARI.KAYDET, 'yazici_sablon_kasa', JSON.stringify(kasaConfig))
      await ipcInvoke(AYAR_KANALLARI.KAYDET, 'yazici_sablon_mutfak', JSON.stringify(mutfakConfig))
      success('Başarılı', 'Yazıcı şablonları kaydedildi.')
    } catch (err: any) {
      error('Hata', err.message)
    } finally {
      setSaving(false)
    }
  }

  // Canlı Önizleme HTML Üretimi
  const previewHtml = useMemo(() => {
    if (activeTab === 'kasa') {
      return generateAdisyonHtml(mockHesap, mockRestoranBilgileri, kasaConfig);
    } else {
      return generateMutfakHtml(mockSiparisler, mockMasaNo, mockIptaller, mutfakConfig);
    }
  }, [activeTab, kasaConfig, mutfakConfig])

  if (loading) return <div className="p-4">Yükleniyor...</div>

  return (
    <div className="flex flex-col h-full gap-6">
      
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-surface-900 dark:text-white">Yazıcı Fiş Tasarımı</h2>
          <p className="text-sm text-surface-500">Müşteri ve mutfak fişlerinin görünümünü özelleştirin.</p>
        </div>
        <Button 
          variant="primary" 
          leftIcon={<Save size={18} />} 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Kaydediliyor...' : 'Tasarımları Kaydet'}
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Sol Taraf - Kontroller */}
        <div className="w-1/2 flex flex-col gap-4">
          <div className="flex bg-surface-100 dark:bg-surface-800 p-1 rounded-pos">
            <button
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-pos transition-colors",
                activeTab === 'kasa' ? "bg-white dark:bg-surface-900 shadow-sm text-brand-600" : "text-surface-600 hover:text-surface-900"
              )}
              onClick={() => setActiveTab('kasa')}
            >
              <FileText size={16} /> Kasa (Adisyon) Fişi
            </button>
            <button
              className={clsx(
                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-pos transition-colors",
                activeTab === 'mutfak' ? "bg-white dark:bg-surface-900 shadow-sm text-brand-600" : "text-surface-600 hover:text-surface-900"
              )}
              onClick={() => setActiveTab('mutfak')}
            >
              <Utensils size={16} /> Mutfak Fişi
            </button>
          </div>

          <div className="bg-white dark:bg-surface-900 p-5 rounded-pos-lg border border-surface-200 dark:border-surface-800 flex flex-col gap-4">
            
            {/* Ortak Ayarlar */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Yazı Boyutu</label>
                <select 
                  className="w-full bg-surface-50 border border-surface-300 rounded-pos px-3 py-2 text-sm"
                  value={activeTab === 'kasa' ? kasaConfig.fontSize : mutfakConfig.fontSize}
                  onChange={(e) => activeTab === 'kasa' 
                    ? handleKasaChange('fontSize', e.target.value) 
                    : handleMutfakChange('fontSize', e.target.value)
                  }
                >
                  <option value="small">Küçük</option>
                  <option value="normal">Normal</option>
                  <option value="large">Büyük</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Kağıt Genişliği</label>
                <select 
                  className="w-full bg-surface-50 border border-surface-300 rounded-pos px-3 py-2 text-sm"
                  value={activeTab === 'kasa' ? kasaConfig.paperWidth : mutfakConfig.paperWidth}
                  onChange={(e) => activeTab === 'kasa' 
                    ? handleKasaChange('paperWidth', e.target.value) 
                    : handleMutfakChange('paperWidth', e.target.value)
                  }
                >
                  <option value="58mm">58 mm (Küçük Termal)</option>
                  <option value="80mm">80 mm (Standart Termal)</option>
                </select>
              </div>
            </div>

            <hr className="border-surface-200 dark:border-surface-700" />

            {/* Kasa Özel Ayarlar */}
            {activeTab === 'kasa' && (
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={kasaConfig.showRestoName} onChange={e => handleKasaChange('showRestoName', e.target.checked)} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm font-medium">Restoran Adını Göster</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={kasaConfig.showRestoInfo} onChange={e => handleKasaChange('showRestoInfo', e.target.checked)} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm font-medium">Adres & Telefon Göster</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={kasaConfig.showTime} onChange={e => handleKasaChange('showTime', e.target.checked)} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm font-medium">Tarih & Saat Göster</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={kasaConfig.showOrderNo} onChange={e => handleKasaChange('showOrderNo', e.target.checked)} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm font-medium">Sipariş / Hesap No Göster</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={kasaConfig.showPrices} onChange={e => handleKasaChange('showPrices', e.target.checked)} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm font-medium">Fiyatları ve Toplamı Göster</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={kasaConfig.showFooter} onChange={e => handleKasaChange('showFooter', e.target.checked)} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm font-medium">Alt Bilgi (Teşekkür Mesajı) Göster</span>
                </label>
                
                {kasaConfig.showFooter && (
                  <div className="mt-2">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Alt Bilgi Metni</label>
                    <textarea 
                      className="w-full bg-surface-50 border border-surface-300 rounded-pos px-3 py-2 text-sm"
                      rows={3}
                      value={kasaConfig.footerText}
                      onChange={e => handleKasaChange('footerText', e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Mutfak Özel Ayarlar */}
            {activeTab === 'mutfak' && (
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={mutfakConfig.showTable} onChange={e => handleMutfakChange('showTable', e.target.checked)} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm font-medium">Masa Numarasını Göster</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={mutfakConfig.showTime} onChange={e => handleMutfakChange('showTime', e.target.checked)} className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500" />
                  <span className="text-sm font-medium">Tarih & Saat Göster</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Sağ Taraf - Canlı Önizleme */}
        <div className="w-1/2 flex flex-col h-[500px]">
          <div className="text-sm font-bold text-surface-500 mb-2 uppercase tracking-wider">Canlı Önizleme</div>
          <div className="flex-1 bg-surface-200 dark:bg-surface-800 rounded-pos-lg border border-surface-300 dark:border-surface-700 p-4 flex items-center justify-center overflow-auto pos-scrollbar">
            {/* Önizleme Kağıdı */}
            <div 
              className="bg-white shadow-lg overflow-hidden transition-all duration-300 mx-auto"
              style={{
                width: activeTab === 'kasa' 
                  ? (kasaConfig.paperWidth === '58mm' ? '220px' : '320px') 
                  : (mutfakConfig.paperWidth === '58mm' ? '220px' : '320px'),
                height: '100%',
                minHeight: '400px'
              }}
            >
              <iframe 
                srcDoc={previewHtml} 
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Fiş Önizleme"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
