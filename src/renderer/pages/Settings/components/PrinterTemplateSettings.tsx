import React, { useState, useEffect, useMemo } from 'react'
import { Save, FileText, Utensils, Printer, Check, Eye } from 'lucide-react'
import { clsx } from 'clsx'
import { ipcInvoke } from '../../../hooks/useIPC'
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
import { motion } from 'framer-motion'

// Mock önizleme verileri
const mockMasaNo = "12"
const mockRestoranBilgileri = {
  ad: "ETİBOL KEBAP & DÖNER",
  telefon: "0212 555 44 33",
  adres: "Atatürk Cad. No:123 Kadıköy/İstanbul",
  altNot: "Afiyet olsun, yine bekleriz!"
}

const mockSiparisler = [
  { urun_adi: "Adana Kebap", miktar: 1, birim_fiyat: 250, toplam_fiyat: 250, opsiyonlar: [{ ad: "Acılı" }], notlar: "Az pişmiş olsun" },
  { urun_adi: "Kutu Kola", miktar: 2, birim_fiyat: 40, toplam_fiyat: 80, opsiyonlar: [] },
  { urun_adi: "Çoban Salata", miktar: 1, birim_fiyat: 70, toplam_fiyat: 70, opsiyonlar: [] }
]

const mockIptaller = [
  { urun_adi: "Ayran", miktar: 1, opsiyonlar: [] }
]

const mockHesap = {
  hesap_no: "84729",
  masa_id: 12,
  toplam_tutar: 400,
  indirim_tutari: 0,
  net_tutar: 400,
  odemeler: [{ tutar: 400, tip: "kredi_karti" }],
  siparisler: mockSiparisler
}

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
      success('Başarılı', 'Yazıcı şablonları başarıyla kaydedildi.')
    } catch (err: any) {
      error('Hata', err.message || 'Şablon kaydedilemedi.')
    } finally {
      setSaving(false)
    }
  }

  // Canlı Önizleme HTML Üretimi
  const previewHtml = useMemo(() => {
    if (activeTab === 'kasa') {
      return generateAdisyonHtml(mockHesap, mockRestoranBilgileri, kasaConfig)
    } else {
      return generateMutfakHtml(mockSiparisler, mockMasaNo, mockIptaller, mutfakConfig)
    }
  }, [activeTab, kasaConfig, mutfakConfig])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-surface-400 font-mono text-sm">
        <span className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mr-3" />
        Şablon parametreleri yükleniyor...
      </div>
    )
  }

  const isKasa = activeTab === 'kasa'
  const currentPaperWidth = isKasa ? kasaConfig.paperWidth : mutfakConfig.paperWidth
  const currentFontSize = isKasa ? kasaConfig.fontSize : mutfakConfig.fontSize

  return (
    <div className="flex flex-col gap-6 animate-fade-in text-surface-100 select-none pb-8">
      
      {/* Başlık ve Aksiyon */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Printer size={22} className="text-brand-500" />
            Termal Fiş & Yazıcı Tasarımı
          </h2>
          <p className="text-xs text-surface-400 mt-1">
            Kasa adisyonu ve mutfak sipariş bilgi fişlerinin termal baskı düzenini yapılandırın.
          </p>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={saving}
          className="h-11 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-brand-900/40 border border-brand-400/30 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Kaydediliyor...' : 'Şablonları Kaydet'}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Sol Taraf: Kontrol Paneli (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          
          {/* Fiş Tipi Seçimi */}
          <div className="grid grid-cols-2 p-1 bg-[#090B12] rounded-xl border border-[#1A1F30]">
            <button
              type="button"
              className={clsx(
                "flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all",
                activeTab === 'kasa'
                  ? "bg-[#161B2B] text-white border border-[#252E46] shadow-md"
                  : "text-surface-400 hover:text-white"
              )}
              onClick={() => setActiveTab('kasa')}
            >
              <FileText size={15} className="text-brand-400" />
              Kasa (Adisyon) Fişi
            </button>
            <button
              type="button"
              className={clsx(
                "flex items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all",
                activeTab === 'mutfak'
                  ? "bg-[#161B2B] text-white border border-[#252E46] shadow-md"
                  : "text-surface-400 hover:text-white"
              )}
              onClick={() => setActiveTab('mutfak')}
            >
              <Utensils size={15} className="text-amber-400" />
              Mutfak Sipariş Fişi
            </button>
          </div>

          {/* Ortak Parametreler Kartı */}
          <div className="bg-[#0E111B] p-5 sm:p-6 rounded-2xl border border-[#1E2436] space-y-5 shadow-xl">
            <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center justify-between pb-3 border-b border-[#1A1F30]">
              <span>Kağıt ve Tipografi Parametreleri</span>
              <span className="font-mono text-brand-400 text-[11px]">{currentPaperWidth} / {currentFontSize}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kağıt Genişliği */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-surface-400">Termal Rulo Genişliği</label>
                <div className="grid grid-cols-2 gap-2">
                  {['58mm', '80mm'].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => isKasa ? handleKasaChange('paperWidth', w) : handleMutfakChange('paperWidth', w)}
                      className={clsx(
                        "h-11 rounded-xl font-mono text-xs font-semibold border flex items-center justify-center transition-all",
                        currentPaperWidth === w
                          ? "bg-brand-950/40 text-brand-300 border-brand-500/60 shadow-inner"
                          : "bg-[#121624] text-surface-400 border-[#1E2538] hover:text-white"
                      )}
                    >
                      {w} {w === '80mm' ? '(Standart)' : '(Dar)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Yazı Boyutu */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-surface-400">Fiş Font Ölçeği</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'small', label: 'Küçük' },
                    { id: 'normal', label: 'Normal' },
                    { id: 'large', label: 'Büyük' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => isKasa ? handleKasaChange('fontSize', s.id) : handleMutfakChange('fontSize', s.id)}
                      className={clsx(
                        "h-11 rounded-xl text-xs font-semibold border flex items-center justify-center transition-all",
                        currentFontSize === s.id
                          ? "bg-brand-950/40 text-brand-300 border-brand-500/60 shadow-inner"
                          : "bg-[#121624] text-surface-400 border-[#1E2538] hover:text-white"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Görünürlük Anahtarları Kartı */}
          <div className="bg-[#0E111B] p-5 sm:p-6 rounded-2xl border border-[#1E2436] space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider pb-3 border-b border-[#1A1F30]">
              {isKasa ? 'Kasa Fişi Alanları' : 'Mutfak Fişi Alanları'}
            </h3>

            {isKasa ? (
              <div className="space-y-3">
                {[
                  { key: 'showRestoName', label: 'Restoran Adı Başlığı', desc: 'İşletme ünvanını en üstte kalın gösterir' },
                  { key: 'showRestoInfo', label: 'Adres & Telefon Bilgisi', desc: 'İletişim ve konum bilgilerini ekler' },
                  { key: 'showTime', label: 'Tarih ve Saat Damgası', desc: 'Baskı zamanını kaydeder' },
                  { key: 'showOrderNo', label: 'Adisyon & Hesap Numarası', desc: 'Benzersiz fiş takip numarasını yazar' },
                  { key: 'showPrices', label: 'Birim Fiyatlar & KDV Toplamı', desc: 'Ödeme ve tutar dökümünü gösterir' },
                  { key: 'showFooter', label: 'Alt Teşekkür Mesajı', desc: 'Fişin sonunda özel kapanış notu yer alır' },
                ].map((item) => {
                  const isChecked = !!(kasaConfig as any)[item.key]
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleKasaChange(item.key as any, !isChecked)}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#121624] hover:bg-[#161B2B] border border-[#1E2538] cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{item.label}</div>
                        <div className="text-[11px] text-surface-400">{item.desc}</div>
                      </div>
                      <div className={clsx(
                        "w-6 h-6 rounded-lg flex items-center justify-center border transition-all",
                        isChecked
                          ? "bg-brand-600 border-brand-400 text-white"
                          : "bg-[#090A10] border-[#222B40] text-transparent"
                      )}>
                        <Check size={14} />
                      </div>
                    </div>
                  )
                })}

                {kasaConfig.showFooter && (
                  <div className="mt-4 pt-4 border-t border-[#1A1F30] flex flex-col gap-2">
                    <label className="text-xs font-semibold text-surface-300">Özel Alt Bilgi Notu</label>
                    <textarea
                      rows={2}
                      value={kasaConfig.footerText || ''}
                      onChange={(e) => handleKasaChange('footerText', e.target.value)}
                      className="w-full p-3 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs focus:outline-none focus:border-brand-500 transition-colors resize-none"
                      placeholder="Örn: Afiyet olsun, yine bekleriz!"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { key: 'showTable', label: 'Masa Numarası Vurgusu', desc: 'Büyük puntolarla hedef masayı belirtir' },
                  { key: 'showTime', label: 'Sipariş İletim Saati', desc: 'Mutfağa geliş dakikasını gösterir' },
                ].map((item) => {
                  const isChecked = !!(mutfakConfig as any)[item.key]
                  return (
                    <div
                      key={item.key}
                      onClick={() => handleMutfakChange(item.key as any, !isChecked)}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#121624] hover:bg-[#161B2B] border border-[#1E2538] cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{item.label}</div>
                        <div className="text-[11px] text-surface-400">{item.desc}</div>
                      </div>
                      <div className={clsx(
                        "w-6 h-6 rounded-lg flex items-center justify-center border transition-all",
                        isChecked
                          ? "bg-brand-600 border-brand-400 text-white"
                          : "bg-[#090A10] border-[#222B40] text-transparent"
                      )}>
                        <Check size={14} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sağ Taraf: Canlı Termal Simülatör (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full bg-[#0E111B] p-5 rounded-2xl border border-[#1E2436] shadow-xl flex flex-col items-center">
            
            <div className="w-full flex items-center justify-between pb-3 mb-4 border-b border-[#1A1F30]">
              <div className="flex items-center gap-2 text-xs font-bold text-surface-300 uppercase tracking-wider">
                <Eye size={16} className="text-brand-400" />
                <span>Canlı Termal Kağıt</span>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#141928] text-surface-300 border border-[#222B40]">
                {currentPaperWidth} RULO
              </span>
            </div>

            {/* Termal Rulo Kağıt Çerçevesi */}
            <div className="w-full py-6 px-4 bg-[#07090F] rounded-xl border border-[#161B2A] flex justify-center items-center overflow-x-auto">
              <div 
                className="bg-white text-black shadow-2xl rounded-sm transition-all duration-200 overflow-hidden relative border-t-8 border-t-zinc-300 border-b-8 border-b-zinc-300"
                style={{
                  width: currentPaperWidth === '58mm' ? '240px' : '310px',
                  minHeight: '420px',
                }}
              >
                {/* Jagged / Tear Edge simülasyonu */}
                <div className="h-2 w-full bg-zinc-200 border-b border-dashed border-zinc-400" />
                
                <iframe
                  srcDoc={previewHtml}
                  title="Termal Önizleme"
                  className="w-full min-h-[400px] border-none"
                  style={{ height: '420px' }}
                />

                <div className="h-2 w-full bg-zinc-200 border-t border-dashed border-zinc-400" />
              </div>
            </div>

            <div className="w-full mt-4 flex items-center justify-between text-[11px] text-surface-400 font-mono">
              <span>GERÇEK ZAMANLI MOTOR</span>
              <span>100% ESC/POS UYUMLU</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  )
}

