import React, { useState, useEffect } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { 
  Printer, 
  Receipt, 
  FileText, 
  Sparkles, 
  Layers, 
  Sliders, 
  Check, 
  Scissors, 
  Building2,
  Eye
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { 
  QRPrintItem, 
  QRPrintOptions, 
  defaultQROptions, 
  yazdirQR 
} from '../../../utils/print.utils'
import { useToast } from '../../../components/ui/Toast'
import { ipcInvoke } from '../../../hooks/useIPC'
import { YAZICI_KANALLARI, AYAR_KANALLARI } from '../../../../common/ipc-channels'
import { motion, AnimatePresence } from 'framer-motion'

interface QRPrintModalProps {
  isOpen: boolean
  onClose: () => void
  items: QRPrintItem[]
  defaultRestoName?: string
}

export default function QRPrintModal({
  isOpen,
  onClose,
  items,
  defaultRestoName = 'ETİBOL RESTORAN'
}: QRPrintModalProps) {
  const { success, error } = useToast()
  const [printOptions, setPrintOptions] = useState<QRPrintOptions>({
    ...defaultQROptions,
    restoName: defaultRestoName
  })
  const [yazicilar, setYazicilar] = useState<{ name: string; displayName: string }[]>([])
  const [seciliYazici, setSeciliYazici] = useState<string>('')
  const [isPrinting, setIsPrinting] = useState(false)
  const [activePreviewIndex, setActivePreviewIndex] = useState(0)

  // Sistem yazıcılarını yükle
  useEffect(() => {
    const yukle = async () => {
      try {
        const res = await ipcInvoke<any>(YAZICI_KANALLARI.AYARLAR)
        if (res?.basarili && res.yazicilar) {
          setYazicilar(res.yazicilar)
        }
        // Kaydedilmiş adisyon yazıcısını getir
        const defPrinter = await ipcInvoke<string>(AYAR_KANALLARI.GETIR, 'yazici_adisyon')
        if (defPrinter) {
          setSeciliYazici(defPrinter)
        }
      } catch (err) {
        console.error('Yazıcılar yüklenemedi:', err)
      }
    }
    if (isOpen) {
      yukle()
      setPrintOptions(prev => ({
        ...prev,
        restoName: defaultRestoName || prev.restoName
      }))
    }
  }, [isOpen, defaultRestoName])

  const previewItem = items[activePreviewIndex] || items[0]

  // Yazdırma işlemi
  const handlePrint = async (directToPrinter: boolean = false) => {
    if (items.length === 0) return
    setIsPrinting(true)

    try {
      // DOM'daki her bir QR SVG'sini serialize et veya üret
      const itemsWithSvg = items.map(item => {
        // Geçici bir sanal render veya SVG string
        const container = document.getElementById(`modal-qr-svg-${item.id || item.title}`)
        let svgHtml = ''
        if (container) {
          const svgEl = container.querySelector('svg')
          if (svgEl) {
            svgHtml = new XMLSerializer().serializeToString(svgEl)
          }
        }
        // Fallback: Eğer DOM'da bulunamadıysa preview SVG'sini kullan
        if (!svgHtml) {
          const fallbackEl = document.getElementById('preview-qr-svg')
          if (fallbackEl) {
            const svgEl = fallbackEl.querySelector('svg')
            if (svgEl) svgHtml = new XMLSerializer().serializeToString(svgEl)
          }
        }

        return {
          item,
          svgHtml
        }
      })

      const targetPrinter = directToPrinter && seciliYazici ? seciliYazici : undefined
      const ok = await yazdirQR(itemsWithSvg, printOptions, targetPrinter)

      if (ok) {
        success('Yazdırma Başlatıldı', `${items.length} adet QR kod ${printOptions.mode === 'thermal' ? 'termal düzende' : 'standart düzende'} yazdırılıyor.`)
        onClose()
      } else {
        error('Hata', 'Yazdırma penceresi açılamadı veya işlem iptal edildi.')
      }
    } catch (err: any) {
      error('Yazdırma Hatası', err?.message || 'Bir hata oluştu.')
    } finally {
      setIsPrinting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="QR Kod Yazdırma & Şablon Seçimi"
      size="xl"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Sol Panel: Seçenekler ve Kontroller */}
        <div className="flex-1 space-y-5">
          
          {/* Yazdırma Modu Seçici Kartları */}
          <div>
            <label className="text-xs font-bold text-surface-400 uppercase tracking-wider block mb-2 font-mono">
              1. Yazdırma Düzeni & Cihaz Tipi
            </label>
            <div className="grid grid-cols-2 gap-3">
              
              {/* Termal POS Butonu */}
              <button
                type="button"
                onClick={() => setPrintOptions(p => ({ ...p, mode: 'thermal' }))}
                className={`flex flex-col p-4 rounded-xl text-left border transition-all relative overflow-hidden ${
                  printOptions.mode === 'thermal'
                    ? 'bg-[#101526] border-brand-500 shadow-lg shadow-brand-950/40 text-white'
                    : 'bg-[#0A0C14] border-[#1E2538] text-surface-400 hover:text-surface-200 hover:bg-[#0E1220]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    printOptions.mode === 'thermal' ? 'bg-brand-600 text-white' : 'bg-[#141928] text-surface-400'
                  }`}>
                    <Receipt size={20} />
                  </div>
                  {printOptions.mode === 'thermal' && (
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px]">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-white mb-0.5">Termal Fiş Yazıcı</div>
                <div className="text-[11px] text-surface-400 leading-tight">
                  80mm / 58mm dikey kompakt düzen, minimum kağıt tüketimi.
                </div>
              </button>

              {/* Standart Yazıcı / PDF Butonu */}
              <button
                type="button"
                onClick={() => setPrintOptions(p => ({ ...p, mode: 'standard' }))}
                className={`flex flex-col p-4 rounded-xl text-left border transition-all relative overflow-hidden ${
                  printOptions.mode === 'standard'
                    ? 'bg-[#101526] border-brand-500 shadow-lg shadow-brand-950/40 text-white'
                    : 'bg-[#0A0C14] border-[#1E2538] text-surface-400 hover:text-surface-200 hover:bg-[#0E1220]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    printOptions.mode === 'standard' ? 'bg-brand-600 text-white' : 'bg-[#141928] text-surface-400'
                  }`}>
                    <FileText size={20} />
                  </div>
                  {printOptions.mode === 'standard' && (
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px]">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-white mb-0.5">Standart / A4 / Sticker</div>
                <div className="text-[11px] text-surface-400 leading-tight">
                  Pleksi masa standı ve masaüstü etiket basımı için kurumsal ızgara.
                </div>
              </button>

            </div>
          </div>

          {/* Termal / Standart Özel Ayarlar */}
          <div className="bg-[#0A0C14] p-4 rounded-xl border border-[#1E2538] space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1A2032]">
              <span className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
                <Sliders size={14} className="text-brand-400" />
                Şablon & Düzen Seçenekleri
              </span>
              <span className="text-[11px] font-mono text-surface-500">
                {items.length} Öğe Seçili
              </span>
            </div>

            {printOptions.mode === 'thermal' ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-surface-400 block mb-1.5">Kağıt Genişliği</label>
                  <div className="flex gap-2">
                    {(['80mm', '58mm'] as const).map(w => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setPrintOptions(p => ({ ...p, paperWidth: w }))}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${
                          printOptions.paperWidth === w
                            ? 'bg-brand-600 border-brand-400 text-white'
                            : 'bg-[#121624] border-[#1E2538] text-surface-400 hover:text-white'
                        }`}
                      >
                        {w === '80mm' ? '80mm (Standart)' : '58mm (Dar)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-surface-400 block mb-1.5">Doğrudan Yazıcı</label>
                  <select
                    value={seciliYazici}
                    onChange={e => setSeciliYazici(e.target.value)}
                    className="w-full h-9 px-3 bg-[#121624] border border-[#1E2538] rounded-lg text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Varsayılan Sistem Diyaloğu</option>
                    {yazicilar.map(y => (
                      <option key={y.name} value={y.name}>{y.displayName || y.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-surface-400 block mb-1.5">A4 Sayfa Düzeni</label>
                  <div className="flex gap-2">
                    {([2, 3, 4] as const).map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setPrintOptions(p => ({ ...p, gridCols: c }))}
                        className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold border transition-colors ${
                          printOptions.gridCols === c
                            ? 'bg-brand-600 border-brand-400 text-white'
                            : 'bg-[#121624] border-[#1E2538] text-surface-400 hover:text-white'
                        }`}
                      >
                        {c} Sütun
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-xs text-surface-300 cursor-pointer select-none py-2">
                    <input
                      type="checkbox"
                      checked={printOptions.showCutGuides !== false}
                      onChange={e => setPrintOptions(p => ({ ...p, showCutGuides: e.target.checked }))}
                      className="rounded border-[#1E2538] bg-[#121624] text-brand-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <Scissors size={14} className="text-surface-400" />
                    <span>Kesim Kılavuz Çizgileri</span>
                  </label>
                </div>
              </div>
            )}

            {/* Restoran Adı & Metin Ayarları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#181D2E]">
              <div>
                <label className="text-[11px] font-semibold text-surface-400 block mb-1">İşletme Adı</label>
                <input
                  type="text"
                  value={printOptions.restoName || ''}
                  onChange={e => setPrintOptions(p => ({ ...p, restoName: e.target.value }))}
                  className="w-full h-8 px-3 rounded-lg bg-[#121624] border border-[#1E2538] text-xs text-white focus:outline-none focus:border-brand-500"
                  placeholder="ETİBOL RESTORAN"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-surface-400 block mb-1">Yönlendirme Metni</label>
                <input
                  type="text"
                  value={printOptions.guideText || ''}
                  onChange={e => setPrintOptions(p => ({ ...p, guideText: e.target.value }))}
                  className="w-full h-8 px-3 rounded-lg bg-[#121624] border border-[#1E2538] text-xs text-white focus:outline-none focus:border-brand-500"
                  placeholder="Menüyü İncelemek İçin Okutunuz"
                />
              </div>
            </div>

          </div>

          {/* Alt Aksiyon Butonları */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1 h-11"
            >
              Vazgeç
            </Button>
            
            {printOptions.mode === 'thermal' && seciliYazici && (
              <Button
                variant="primary"
                onClick={() => handlePrint(true)}
                isLoading={isPrinting}
                className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 border-emerald-400/30"
              >
                <Receipt size={16} className="mr-2" />
                Direkt Termal Yazdır
              </Button>
            )}

            <Button
              variant="primary"
              onClick={() => handlePrint(false)}
              isLoading={isPrinting}
              className="flex-1 h-11 shadow-lg shadow-brand-900/40"
            >
              <Printer size={16} className="mr-2" />
              Yazdır ({items.length})
            </Button>
          </div>

        </div>

        {/* Sağ Panel: Canlı Çıktı Önizleme Simülatörü */}
        <div className="w-full lg:w-80 flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-surface-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Eye size={14} className="text-brand-400" />
              Canlı Çıktı Önizleme
            </span>
            {items.length > 1 && (
              <div className="flex items-center gap-1 text-[11px] text-surface-500">
                <button
                  type="button"
                  onClick={() => setActivePreviewIndex(p => Math.max(0, p - 1))}
                  disabled={activePreviewIndex === 0}
                  className="px-2 py-0.5 rounded bg-[#141828] text-surface-300 disabled:opacity-30"
                >
                  ◀
                </button>
                <span>{activePreviewIndex + 1}/{items.length}</span>
                <button
                  type="button"
                  onClick={() => setActivePreviewIndex(p => Math.min(items.length - 1, p + 1))}
                  disabled={activePreviewIndex === items.length - 1}
                  className="px-2 py-0.5 rounded bg-[#141828] text-surface-300 disabled:opacity-30"
                >
                  ▶
                </button>
              </div>
            )}
          </div>

          {/* Önizleme Kağıdı / Kartı */}
          <div className="w-full bg-[#07090F] p-4 rounded-2xl border border-[#1E2538] flex items-center justify-center min-h-[380px] shadow-inner relative overflow-hidden">
            
            {/* Termal Önizleme */}
            {printOptions.mode === 'thermal' ? (
              <div 
                className={`bg-white text-black shadow-2xl transition-all duration-200 ${
                  printOptions.paperWidth === '58mm' ? 'w-[200px] p-3' : 'w-[240px] p-4'
                }`}
                style={{ fontFamily: 'sans-serif' }}
              >
                {/* Restoran Adı */}
                {printOptions.showRestoName !== false && (
                  <div className="text-center font-black uppercase tracking-tight text-xs mb-0.5 text-black">
                    {printOptions.restoName || 'ETİBOL RESTORAN'}
                  </div>
                )}
                
                <div className="text-center text-[10px] font-bold text-gray-700 tracking-wider mb-2">
                  {previewItem?.type === 'garson' ? 'GARSON EL TERMİNALİ' : previewItem?.type === 'patron' ? 'PATRON CANLI TAKİP' : 'DİJİTAL QR MENÜ'}
                </div>

                <div className="border-t border-dashed border-black my-1.5" />

                {/* Masa No Badge */}
                <div className="text-center my-2">
                  <div className="inline-block bg-black text-white px-2.5 py-1 rounded font-black text-sm tracking-wider leading-tight">
                    {previewItem?.masaNo ? `MASA: ${previewItem.masaNo}` : previewItem?.title}
                  </div>
                  {previewItem?.bolumAdi && (
                    <div className="text-[9px] font-bold text-gray-700 mt-0.5 uppercase">
                      ({previewItem.bolumAdi})
                    </div>
                  )}
                </div>

                {/* QR Code */}
                <div className="flex justify-center my-2 p-1.5 bg-white border border-black rounded inline-block mx-auto w-fit">
                  <div id="preview-qr-svg" className="flex items-center justify-center">
                    <QRCodeSVG
                      value={previewItem?.qrUrl || 'https://etibol.geldesat.com'}
                      size={printOptions.paperWidth === '58mm' ? 100 : 130}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                </div>

                {/* Yönlendirme */}
                {printOptions.showGuideText !== false && (
                  <div className="text-center text-[10px] font-bold text-black leading-tight mt-1">
                    {previewItem?.type === 'garson' 
                      ? 'Garson Girişi İçin Okutunuz' 
                      : previewItem?.type === 'patron'
                      ? 'Mobil Ciro Takibi İçin Okutunuz'
                      : (printOptions.guideText || 'Menüyü İncelemek İçin Okutunuz')}
                  </div>
                )}

                <div className="text-center text-[8px] text-gray-500 font-mono truncate mt-1">
                  {previewItem?.qrUrl}
                </div>

                <div className="border-t border-dashed border-black my-2" />
                <div className="text-center text-[8px] font-bold text-gray-600">
                  ★ ETİBOL POS ★
                </div>
              </div>
            ) : (
              /* Standart / Pleksi Masa Standı Önizlemesi */
              <div className="w-[250px] bg-white text-black rounded-2xl p-4 border-2 border-[#1E2538] shadow-2xl text-center relative">
                {printOptions.showCutGuides !== false && (
                  <>
                    <div className="absolute top-1.5 left-1.5 w-2 h-2 border-t border-l border-dashed border-gray-400" />
                    <div className="absolute top-1.5 right-1.5 w-2 h-2 border-t border-r border-dashed border-gray-400" />
                    <div className="absolute bottom-1.5 left-1.5 w-2 h-2 border-bottom border-l border-dashed border-gray-400" />
                    <div className="absolute bottom-1.5 right-1.5 w-2 h-2 border-bottom border-r border-dashed border-gray-400" />
                  </>
                )}

                <div className="font-black text-xs uppercase tracking-tight text-gray-900 mb-0.5">
                  {printOptions.restoName || 'ETİBOL RESTORAN'}
                </div>
                <div className="text-[10px] font-bold text-blue-600 tracking-wider uppercase mb-2">
                  {previewItem?.type === 'garson' ? 'GARSON TERMİNALİ' : previewItem?.type === 'patron' ? 'PATRON TAKİP' : 'DİJİTAL MENÜ'}
                </div>

                {/* Masa No Badge */}
                <div className="inline-block bg-[#090A0F] text-white px-3 py-1 rounded-lg border border-[#1E2538] mb-2">
                  <div className="text-sm font-black tracking-wider leading-tight">
                    {previewItem?.masaNo ? `MASA: ${previewItem.masaNo}` : previewItem?.title}
                  </div>
                  {previewItem?.bolumAdi && (
                    <div className="text-[8px] font-bold text-gray-300 uppercase">
                      {previewItem.bolumAdi}
                    </div>
                  )}
                </div>

                {/* QR Code */}
                <div className="p-2 bg-white rounded-xl border border-gray-200 inline-block mx-auto mb-2 shadow-xs">
                  <QRCodeSVG
                    value={previewItem?.qrUrl || 'https://etibol.geldesat.com'}
                    size={120}
                    level="Q"
                    includeMargin={false}
                  />
                </div>

                <div className="text-[10px] font-bold text-gray-900 leading-tight">
                  {previewItem?.type === 'garson'
                    ? 'Garson Girişi İçin Kameranızla Okutunuz'
                    : previewItem?.type === 'patron'
                    ? 'Mobil Ciro Takibi İçin Okutunuz'
                    : (printOptions.guideText || 'Menüyü İncelemek İçin Okutunuz')}
                </div>

                <div className="text-[8px] text-gray-500 font-mono truncate mt-1">
                  {previewItem?.qrUrl}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Arka planda gizli SVG containerları (Serileştirme için) */}
      <div className="hidden" aria-hidden="true">
        {items.map(item => (
          <div key={item.id || item.title} id={`modal-qr-svg-${item.id || item.title}`}>
            <QRCodeSVG
              value={item.qrUrl}
              size={printOptions.paperWidth === '58mm' ? 120 : 160}
              level="M"
              includeMargin={false}
            />
          </div>
        ))}
      </div>
    </Modal>
  )
}
