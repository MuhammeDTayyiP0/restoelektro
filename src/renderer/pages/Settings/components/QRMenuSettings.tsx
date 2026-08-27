import React, { useState, useEffect, useMemo } from 'react'
import { 
  QrCode, 
  Save, 
  Printer, 
  Smartphone, 
  Crown, 
  Utensils, 
  Copy, 
  ExternalLink, 
  Check, 
  RefreshCw, 
  Wifi, 
  Globe, 
  ShieldCheck, 
  Info,
  Layers,
  Sparkles,
  Maximize2
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { QRCodeSVG } from 'qrcode.react'
import { useIPC, ipcInvoke } from '../../../hooks/useIPC'
import { MASA_KANALLARI, AYAR_KANALLARI, UYGULAMA_KANALLARI } from '../../../../common/ipc-channels'
import type { Masa, Bolum } from '../../../../common/types/table.types'
import { useToast } from '../../../components/ui/Toast'
import QRPrintModal from './QRPrintModal'
import { QRPrintItem } from '../../../utils/print.utils'
import { motion, AnimatePresence } from 'framer-motion'

type QRTab = 'musteri' | 'garson' | 'patron'

const DEFAULT_MENU_URL = 'https://etibol.geldesat.com'

export default function QRMenuSettings() {
  const { success, error, info } = useToast()
  
  // Aktif Sekme (Müşteri Menüsü / Garson Terminali / Patron Takip)
  const [activeTab, setActiveTab] = useState<QRTab>('musteri')

  // URL State'leri (Kalıcı - Toggle değişiminde ASLA sıfırlanmaz)
  const [menuBaseUrl, setMenuBaseUrl] = useState<string>(DEFAULT_MENU_URL)
  const [isMasaParamEnabled, setIsMasaParamEnabled] = useState<boolean>(true)
  const [waiterUrl, setWaiterUrl] = useState<string>('')
  const [isCustomWaiterUrl, setIsCustomWaiterUrl] = useState<boolean>(false)
  const [bossUrl, setBossUrl] = useState<string>('')
  const [isCustomBossUrl, setIsCustomBossUrl] = useState<boolean>(false)
  
  // Sistem bilgileri & Restoran Bilgisi
  const [localIP, setLocalIP] = useState<string>('localhost')
  const [apiPort, setApiPort] = useState<number>(3847)
  const [restoName, setRestoName] = useState<string>('ETİBOL KEBAP & DÖNER')
  const [isSaving, setIsSaving] = useState(false)
  const [seciliBolum, setSeciliBolum] = useState<number | null>(null)
  const [aramaMetni, setAramaMetni] = useState<string>('')

  // Yazdırma Modalı State'leri
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [printItems, setPrintItems] = useState<QRPrintItem[]>([])
  const [seciliMasaIdleri, setSeciliMasaIdleri] = useState<number[]>([])

  // IPC Verileri (Bölümler ve Masalar)
  const { veri: bolumler = [] } = useIPC<Bolum[]>(MASA_KANALLARI.BOLUMLER, [])
  const { veri: masalar = [] } = useIPC<Masa[]>(MASA_KANALLARI.MASALAR, [])

  // Ayarları ve Sistem Bilgilerini Yükle
  useEffect(() => {
    const yukle = async () => {
      try {
        // 1. IP ve Sürüm Bilgisi
        const sysInfo = await ipcInvoke<any>(UYGULAMA_KANALLARI.SURUM_BILGISI)
        if (sysInfo) {
          if (sysInfo.localIP) setLocalIP(sysInfo.localIP)
          if (sysInfo.apiPort) setApiPort(sysInfo.apiPort)
        }

        // 2. Tüm Ayarlar
        const tumAyarlar = await ipcInvoke<Record<string, string>>(AYAR_KANALLARI.TUMU) || {}

        // Restoran Adı
        if (tumAyarlar.restoran_adi) {
          setRestoName(tumAyarlar.restoran_adi)
        }

        // Müşteri QR Menü URL'i (Varsayılan: https://etibol.geldesat.com)
        const savedMenuUrl = tumAyarlar.qr_menu_base_url || localStorage.getItem('etibol_qr_menu_base_url')
        if (savedMenuUrl) {
          setMenuBaseUrl(savedMenuUrl)
        } else {
          setMenuBaseUrl(DEFAULT_MENU_URL)
        }

        // Masa Parametresi Durumu
        const savedParam = tumAyarlar.qr_menu_param_enabled !== undefined 
          ? tumAyarlar.qr_menu_param_enabled === '1' || tumAyarlar.qr_menu_param_enabled === 'true'
          : true
        setIsMasaParamEnabled(savedParam)

        // Garson Terminal URL'i
        const detectedLocalIP = sysInfo?.localIP || 'localhost'
        const defaultWaiter = `http://${detectedLocalIP}:${sysInfo?.apiPort || 3847}/garson`
        if (tumAyarlar.qr_waiter_url) {
          setWaiterUrl(tumAyarlar.qr_waiter_url)
          setIsCustomWaiterUrl(tumAyarlar.qr_waiter_is_custom === '1')
        } else {
          setWaiterUrl(defaultWaiter)
        }

        // Patron Takip URL'i
        const defaultBoss = `http://${detectedLocalIP}:${sysInfo?.apiPort || 3847}/boss`
        if (tumAyarlar.qr_boss_url) {
          setBossUrl(tumAyarlar.qr_boss_url)
          setIsCustomBossUrl(tumAyarlar.qr_boss_is_custom === '1')
        } else {
          setBossUrl(defaultBoss)
        }

      } catch (e) {
        console.error('Ayarlar yüklenirken hata:', e)
      }
    }
    yukle()
  }, [])

  // Varsayılan Garson ve Patron Linkleri (IP değiştiğinde otomatik güncellemek için)
  const defaultLocalWaiterUrl = useMemo(() => `http://${localIP}:${apiPort}/garson`, [localIP, apiPort])
  const defaultLocalBossUrl = useMemo(() => `http://${localIP}:${apiPort}/boss`, [localIP, apiPort])

  // Menü URL'i Değiştiğinde Kaydet (Persistence)
  const handleMenuUrlChange = (newUrl: string) => {
    setMenuBaseUrl(newUrl)
    localStorage.setItem('etibol_qr_menu_base_url', newUrl)
  }

  // Ayarları DB'ye Kaydet
  const ayariKaydet = async () => {
    setIsSaving(true)
    try {
      await ipcInvoke(AYAR_KANALLARI.KAYDET, 'qr_menu_base_url', menuBaseUrl || DEFAULT_MENU_URL)
      await ipcInvoke(AYAR_KANALLARI.KAYDET, 'qr_menu_param_enabled', isMasaParamEnabled ? '1' : '0')
      await ipcInvoke(AYAR_KANALLARI.KAYDET, 'qr_waiter_url', waiterUrl || defaultLocalWaiterUrl)
      await ipcInvoke(AYAR_KANALLARI.KAYDET, 'qr_waiter_is_custom', isCustomWaiterUrl ? '1' : '0')
      await ipcInvoke(AYAR_KANALLARI.KAYDET, 'qr_boss_url', bossUrl || defaultLocalBossUrl)
      await ipcInvoke(AYAR_KANALLARI.KAYDET, 'qr_boss_is_custom', isCustomBossUrl ? '1' : '0')

      localStorage.setItem('etibol_qr_menu_base_url', menuBaseUrl || DEFAULT_MENU_URL)
      success('Ayarlar Kaydedildi', 'QR kod yönlendirme adresleri başarıyla güncellendi.')
    } catch (e: any) {
      error('Hata', e?.message || 'Ayarlar kaydedilemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  // Panoya Kopyala
  const panoyaKopyala = (metin: string, baslik: string = 'Bağlantı Kopyalandı') => {
    navigator.clipboard.writeText(metin)
    info(baslik, metin)
  }

  // Tarayıcıda Aç
  const tarayicidaAc = (url: string) => {
    window.open(url, '_blank')
  }

  // Masa için nihai URL oluştur
  const getMasaUrl = (masaNumara: string): string => {
    const cleanBase = (menuBaseUrl || DEFAULT_MENU_URL).trim()
    if (!isMasaParamEnabled) return cleanBase
    const seperator = cleanBase.includes('?') ? '&' : '?'
    return `${cleanBase}${seperator}masa=${encodeURIComponent(masaNumara)}`
  }

  // Filtrelenmiş Masalar
  const filtrelenmisMasalar = useMemo(() => {
    return masalar.filter(m => {
      const bolumUyumu = seciliBolum ? m.bolum_id === seciliBolum : true
      const aramaUyumu = aramaMetni 
        ? m.numara.toLowerCase().includes(aramaMetni.toLowerCase())
        : true
      return bolumUyumu && aramaUyumu
    })
  }, [masalar, seciliBolum, aramaMetni])

  // Tek Masa Yazdırma Modalı Aç
  const tekliMasaYazdir = (masa: Masa) => {
    const bolum = bolumler.find(b => b.id === masa.bolum_id)
    const item: QRPrintItem = {
      id: masa.id,
      title: `MASA: ${masa.numara}`,
      subTitle: bolum?.ad || 'Salon',
      type: 'masa',
      masaNo: masa.numara,
      bolumAdi: bolum?.ad,
      qrUrl: getMasaUrl(masa.numara),
      restoName
    }
    setPrintItems([item])
    setPrintModalOpen(true)
  }

  // Toplu / Tüm Masaları Yazdır
  const topluMasalariYazdir = () => {
    const hedefMasalar = seciliMasaIdleri.length > 0 
      ? masalar.filter(m => seciliMasaIdleri.includes(m.id))
      : filtrelenmisMasalar

    if (hedefMasalar.length === 0) {
      error('Uyarı', 'Yazdırılacak masa bulunamadı.')
      return
    }

    const items: QRPrintItem[] = hedefMasalar.map(m => {
      const bolum = bolumler.find(b => b.id === m.bolum_id)
      return {
        id: m.id,
        title: `MASA: ${m.numara}`,
        subTitle: bolum?.ad || 'Salon',
        type: 'masa',
        masaNo: m.numara,
        bolumAdi: bolum?.ad,
        qrUrl: getMasaUrl(m.numara),
        restoName
      }
    })

    setPrintItems(items)
    setPrintModalOpen(true)
  }

  // Garson Terminal QR Yazdır
  const garsonQRYazdir = () => {
    const finalUrl = isCustomWaiterUrl ? (waiterUrl || defaultLocalWaiterUrl) : defaultLocalWaiterUrl
    const item: QRPrintItem = {
      id: 'waiter-terminal',
      title: 'GARSON EL TERMİNALİ',
      subTitle: 'Hızlı Sipariş Girişi',
      type: 'garson',
      qrUrl: finalUrl,
      restoName
    }
    setPrintItems([item])
    setPrintModalOpen(true)
  }

  // Patron Takip QR Yazdır
  const patronQRYazdir = () => {
    const finalUrl = isCustomBossUrl ? (bossUrl || defaultLocalBossUrl) : defaultLocalBossUrl
    const item: QRPrintItem = {
      id: 'boss-dashboard',
      title: 'PATRON CANLI TAKİP',
      subTitle: 'Ciro ve Masa Özeti',
      type: 'patron',
      qrUrl: finalUrl,
      restoName
    }
    setPrintItems([item])
    setPrintModalOpen(true)
  }

  return (
    <div className="space-y-6 pb-12 select-none text-surface-100 max-w-6xl animate-fade-in">
      
      {/* Üst Başlık & Kaydet */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#1E2436]">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <QrCode size={22} className="text-brand-500" />
            QR Kod & Mobil Yönlendirme Yönetimi
          </h2>
          <p className="text-xs text-surface-400 mt-1 font-mono">
            Müşteri menüsü, Garson terminali ve Patron takip ekranı QR kodları ve baskı şablonları
          </p>
        </div>

        <motion.button 
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={ayariKaydet} 
          disabled={isSaving}
          className="h-11 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-brand-900/40 border border-brand-400/30 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {isSaving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </motion.button>
      </div>

      {/* 3 Ana Sekme Seçici (Müşteri / Garson / Patron) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Sekme 1: Müşteri QR Menü */}
        <button
          type="button"
          onClick={() => setActiveTab('musteri')}
          className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activeTab === 'musteri'
              ? 'bg-[#121727] border-brand-500/80 shadow-xl shadow-brand-950/30 text-white'
              : 'bg-[#0A0C14] border-[#1E2538] text-surface-400 hover:text-surface-200 hover:bg-[#0E121E]'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors shrink-0 ${
            activeTab === 'musteri'
              ? 'bg-brand-600 border-brand-400 text-white shadow-md'
              : 'bg-[#141928] border-[#222A40] text-surface-400'
          }`}>
            <Utensils size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              Müşteri QR Menü
              {activeTab === 'musteri' && <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />}
            </div>
            <div className="text-[11px] text-surface-400 truncate mt-0.5 font-mono">
              Masa bazlı dijital menü
            </div>
          </div>
        </button>

        {/* Sekme 2: Garson Terminali */}
        <button
          type="button"
          onClick={() => setActiveTab('garson')}
          className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activeTab === 'garson'
              ? 'bg-[#121727] border-blue-500/80 shadow-xl shadow-blue-950/30 text-white'
              : 'bg-[#0A0C14] border-[#1E2538] text-surface-400 hover:text-surface-200 hover:bg-[#0E121E]'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors shrink-0 ${
            activeTab === 'garson'
              ? 'bg-blue-600 border-blue-400 text-white shadow-md'
              : 'bg-[#141928] border-[#222A40] text-surface-400'
          }`}>
            <Smartphone size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              Garson Terminali QR
              {activeTab === 'garson' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
            </div>
            <div className="text-[11px] text-surface-400 truncate mt-0.5 font-mono">
              Mobil el terminali girişi
            </div>
          </div>
        </button>

        {/* Sekme 3: Patron (Boss) */}
        <button
          type="button"
          onClick={() => setActiveTab('patron')}
          className={`flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
            activeTab === 'patron'
              ? 'bg-[#121727] border-amber-500/80 shadow-xl shadow-amber-950/30 text-white'
              : 'bg-[#0A0C14] border-[#1E2538] text-surface-400 hover:text-surface-200 hover:bg-[#0E121E]'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors shrink-0 ${
            activeTab === 'patron'
              ? 'bg-amber-600 border-amber-400 text-white shadow-md'
              : 'bg-[#141928] border-[#222A40] text-surface-400'
          }`}>
            <Crown size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              Patron (Boss) QR
              {activeTab === 'patron' && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
            </div>
            <div className="text-[11px] text-surface-400 truncate mt-0.5 font-mono">
              Mobil ciro & canlı takip
            </div>
          </div>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* 1. SEKME: MÜŞTERİ QR MENÜ YÖNETİMİ & MASA LİSTESİ */}
      {/* ========================================================================= */}
      {activeTab === 'musteri' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* URL & Parametre Ayarları Kartı */}
          <div className="bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-[#1A1F30]">
              <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
                <Globe size={16} className="text-brand-400" />
                Müşteri Menü Bağlantı Yapısı
              </h3>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 flex items-center gap-1">
                <ShieldCheck size={12} /> KALICI LİNK HAFIZASI
              </span>
            </div>

            <p className="text-xs text-surface-400 leading-relaxed">
              Müşterilerin masada otururken akıllı telefonlarıyla okutacakları menü adresi. Toggle veya mod değişiminde girdiğiniz adres hafızada korunur.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
              
              {/* URL Giriş Alanı */}
              <div className="lg:col-span-8 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-surface-400">
                    Temel Menü Web Adresi (Domain / Cloudflare / IP)
                  </label>
                  {menuBaseUrl !== DEFAULT_MENU_URL && (
                    <button
                      type="button"
                      onClick={() => handleMenuUrlChange(DEFAULT_MENU_URL)}
                      className="text-[10px] text-brand-400 hover:underline font-mono"
                    >
                      Varsayılana Sıfırla (etibol.geldesat.com)
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={menuBaseUrl}
                    onChange={e => handleMenuUrlChange(e.target.value)}
                    className="w-full h-11 px-3.5 pr-24 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-mono focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="https://etibol.geldesat.com"
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => panoyaKopyala(menuBaseUrl, 'Menü URL Kopyalandı')}
                      className="p-1.5 rounded-lg bg-[#141928] hover:bg-[#1E2538] text-surface-400 hover:text-white transition-colors"
                      title="Kopyala"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => tarayicidaAc(menuBaseUrl)}
                      className="p-1.5 rounded-lg bg-[#141928] hover:bg-[#1E2538] text-surface-400 hover:text-white transition-colors"
                      title="Tarayıcıda Aç"
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Masa Parametresi Ekle Toggle */}
              <div className="lg:col-span-4 flex flex-col justify-end">
                <label className="flex items-center justify-between p-3 rounded-xl bg-[#090B11] border border-[#1E2436] cursor-pointer hover:border-[#2A344C] transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white">Masa Bazlı Parametre</span>
                    <span className="text-[10px] text-surface-500 font-mono">?masa=MasaNo ekle</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isMasaParamEnabled}
                    onChange={e => setIsMasaParamEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-[#1E2436] bg-[#141928] text-brand-500 focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>

            </div>

            {/* Önizleme Bilgi Çubuğu */}
            <div className="bg-[#07090F] p-3 rounded-xl border border-[#161B2C] flex items-center justify-between gap-2 text-xs font-mono">
              <span className="text-surface-500">Örnek Üretilen URL:</span>
              <code className="text-brand-400 truncate font-bold">
                {getMasaUrl('S 12')}
              </code>
            </div>

          </div>

          {/* Masalar Listesi & Yazdırma Başlığı */}
          <div className="bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] space-y-5 shadow-xl">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1A1F30]">
              <div>
                <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers size={16} className="text-brand-400" />
                  Masa QR Kodları & Baskı Matrisi
                </h3>
                <p className="text-[11px] text-surface-500 mt-0.5">
                  Termal POS veya Pleksi Masaüstü şablonunda yazdırmak için masa seçin veya toplu yazdırın.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={topluMasalariYazdir}
                  className="h-10 px-4 text-xs font-bold shadow-lg shadow-brand-900/30"
                >
                  <Printer size={15} className="mr-2" />
                  {seciliMasaIdleri.length > 0 
                    ? `Seçilen ${seciliMasaIdleri.length} Masayı Yazdır`
                    : 'Tüm Masaları Yazdır'}
                </Button>
              </div>
            </div>

            {/* Bölüm Filtreleri & Arama */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              
              {/* Bölüm Butonları */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pos-scrollbar">
                <button
                  type="button"
                  onClick={() => setSeciliBolum(null)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    seciliBolum === null
                      ? 'bg-brand-600 text-white'
                      : 'bg-[#121624] text-surface-400 hover:text-white border border-[#1E2538]'
                  }`}
                >
                  Tümü ({masalar.length})
                </button>
                {bolumler.map(b => {
                  const bolumMasaSayisi = masalar.filter(m => m.bolum_id === b.id).length
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSeciliBolum(b.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        seciliBolum === b.id
                          ? 'bg-brand-600 text-white'
                          : 'bg-[#121624] text-surface-400 hover:text-white border border-[#1E2538]'
                      }`}
                    >
                      {b.ad} ({bolumMasaSayisi})
                    </button>
                  )
                })}
              </div>

              {/* Masa Arama Input */}
              <input
                type="text"
                value={aramaMetni}
                onChange={e => setAramaMetni(e.target.value)}
                placeholder="Masa No ile ara..."
                className="h-9 px-3 bg-[#090B11] border border-[#1E2436] rounded-lg text-xs text-white placeholder-surface-500 focus:outline-none focus:border-brand-500 w-full sm:w-48"
              />

            </div>

            {/* Masa QR Kartları Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtrelenmisMasalar.map(masa => {
                const bolum = bolumler.find(b => b.id === masa.bolum_id)
                const masaUrl = getMasaUrl(masa.numara)
                const isSelected = seciliMasaIdleri.includes(masa.id)

                return (
                  <motion.div
                    key={masa.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`bg-[#0A0C14] border rounded-2xl p-4 flex flex-col items-center text-center transition-all relative group ${
                      isSelected 
                        ? 'border-brand-500 shadow-md shadow-brand-950/40 bg-[#0E1220]'
                        : 'border-[#1E2538] hover:border-[#2D3750] hover:bg-[#0D101A]'
                    }`}
                  >
                    {/* Çoklu Seçim Checkbox */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={e => {
                          if (e.target.checked) {
                            setSeciliMasaIdleri(p => [...p, masa.id])
                          } else {
                            setSeciliMasaIdleri(p => p.filter(id => id !== masa.id))
                          }
                        }}
                        className="w-4 h-4 rounded border-[#1E2538] bg-[#141928] text-brand-500 focus:ring-0 cursor-pointer"
                      />
                    </div>

                    {/* Masa No Başlığı & Bölüm */}
                    <div className="mb-2.5 pt-1">
                      <div className="font-mono font-black text-base text-white tracking-wide">
                        MASA {masa.numara}
                      </div>
                      <div className="text-[10px] font-semibold text-surface-500 uppercase tracking-wider">
                        {bolum?.ad || 'Salon'}
                      </div>
                    </div>

                    {/* QR Kod Çerçevesi (Yüksek Kontrast) */}
                    <div className="bg-white p-2.5 rounded-xl border border-white/20 shadow-md my-1 transition-transform group-hover:scale-105 duration-150">
                      <QRCodeSVG
                        value={masaUrl}
                        size={110}
                        level="M"
                        includeMargin={false}
                      />
                    </div>

                    {/* Yönlendirme & URL */}
                    <div className="mt-2 text-[9px] text-surface-500 font-mono truncate w-full px-1" title={masaUrl}>
                      {masaUrl}
                    </div>

                    {/* Tekli Yazdır Butonu */}
                    <div className="mt-3 w-full">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => tekliMasaYazdir(masa)}
                        className="w-full h-8 px-2 rounded-lg bg-[#141928] hover:bg-brand-600 text-surface-300 hover:text-white border border-[#20273D] hover:border-brand-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Printer size={13} />
                        Yazdır
                      </motion.button>
                    </div>

                  </motion.div>
                )
              })}
            </div>

            {filtrelenmisMasalar.length === 0 && (
              <div className="text-center py-12 text-surface-500 text-xs font-mono">
                Filtreye uygun masa bulunamadı.
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SEKME: GARSON MOBİL TERMİNALİ QR KODU */}
      {/* ========================================================================= */}
      {activeTab === 'garson' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sol: Bilgi & URL Ayarı */}
            <div className="lg:col-span-7 bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#1A1F30]">
                <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
                  <Smartphone size={16} className="text-blue-400" />
                  Garson El Terminali Giriş Parametreleri
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-800/40 flex items-center gap-1">
                  <Wifi size={12} /> WI-FI YEREL AĞ
                </span>
              </div>

              <p className="text-xs text-surface-400 leading-relaxed">
                Garsonlarınız telefon veya tablet kameralarıyla aşağıdaki QR kodu okutarak doğrudan sipariş alma ve masa yönetimi ekranına erişebilirler.
              </p>

              {/* IP / URL Bilgi Alanı */}
              <div className="space-y-3">
                
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-surface-300">
                    Terminal Bağlantı Adresi
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-surface-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCustomWaiterUrl}
                      onChange={e => {
                        const checked = e.target.checked
                        setIsCustomWaiterUrl(checked)
                        if (!checked && !waiterUrl) {
                          setWaiterUrl(defaultLocalWaiterUrl)
                        }
                      }}
                      className="rounded border-[#1E2538] bg-[#141928] text-brand-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Özel Link / Domain Kullan</span>
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={isCustomWaiterUrl ? waiterUrl : defaultLocalWaiterUrl}
                    disabled={!isCustomWaiterUrl}
                    onChange={e => setWaiterUrl(e.target.value)}
                    className="w-full h-11 px-3.5 pr-24 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-mono focus:outline-none focus:border-brand-500 transition-colors disabled:opacity-80"
                    placeholder={defaultLocalWaiterUrl}
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => panoyaKopyala(isCustomWaiterUrl ? waiterUrl : defaultLocalWaiterUrl, 'Garson Terminal Linki Kopyalandı')}
                      className="p-1.5 rounded-lg bg-[#141928] hover:bg-[#1E2538] text-surface-400 hover:text-white transition-colors"
                      title="Kopyala"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => tarayicidaAc(isCustomWaiterUrl ? waiterUrl : defaultLocalWaiterUrl)}
                      className="p-1.5 rounded-lg bg-[#141928] hover:bg-[#1E2538] text-surface-400 hover:text-white transition-colors"
                      title="Tarayıcıda Aç"
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>

              </div>

              {/* Kurulum / Rehber Kutusu */}
              <div className="bg-[#07090F] p-4 rounded-xl border border-[#161B2C] space-y-2">
                <div className="text-xs font-bold text-surface-300 flex items-center gap-2">
                  <Info size={14} className="text-blue-400" />
                  Garson Terminali Hızlı Kullanım Rehberi
                </div>
                <ul className="text-[11px] text-surface-400 space-y-1 list-disc list-inside">
                  <li>Garson cihazının ana bilgisayarla <b>aynı Wi-Fi ağına</b> bağlı olduğundan emin olun.</li>
                  <li>Telefon kamerasını sağdaki QR koda tutun veya adresi Chrome/Safari'ye girin.</li>
                  <li>Garson 4 haneli PIN kodunu girerek anında masaları yönetmeye başlar.</li>
                </ul>
              </div>

            </div>

            {/* Sağ: Büyük Garson QR Kartı & Yazdır */}
            <div className="lg:col-span-5 bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] flex flex-col items-center text-center justify-between shadow-xl">
              
              <div>
                <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1 font-mono">
                  GARSON EL TERMİNALİ
                </div>
                <div className="text-sm font-black text-white">
                  {restoName}
                </div>
              </div>

              <div className="my-5 p-4 bg-white rounded-2xl border-2 border-blue-500/40 shadow-2xl">
                <QRCodeSVG
                  value={isCustomWaiterUrl ? (waiterUrl || defaultLocalWaiterUrl) : defaultLocalWaiterUrl}
                  size={190}
                  level="Q"
                  includeMargin={false}
                />
              </div>

              <div className="w-full space-y-3">
                <div className="text-[11px] font-bold text-surface-300">
                  Garson Girişi İçin Telefonunuzla Okutunuz
                </div>
                
                <Button
                  variant="primary"
                  onClick={garsonQRYazdir}
                  className="w-full h-11 text-xs font-bold bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-950/40"
                >
                  <Printer size={16} className="mr-2" />
                  Garson QR Kodunu Yazdır
                </Button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SEKME: PATRON (BOSS) MOBİL TAKİP QR KODU */}
      {/* ========================================================================= */}
      {activeTab === 'patron' && (
        <div className="space-y-6 animate-fade-in">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sol: Bilgi & URL Ayarı */}
            <div className="lg:col-span-7 bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-[#1A1F30]">
                <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
                  <Crown size={16} className="text-amber-400" />
                  Patron (Boss) Mobil Takip Ekranı
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-800/40 flex items-center gap-1">
                  <ShieldCheck size={12} /> YÖNETİCİ ERİŞİMİ
                </span>
              </div>

              <p className="text-xs text-surface-400 leading-relaxed">
                İşletme sahibi ve yöneticilerin anlık ciroyu, açık masaları, kapanan hesapları ve ürün satış analizlerini telefonlarından canlı izlemeleri için özel mobil panel.
              </p>

              {/* IP / URL Bilgi Alanı */}
              <div className="space-y-3">
                
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-surface-300">
                    Patron Panel Bağlantı Adresi
                  </label>
                  <label className="flex items-center gap-1.5 text-xs text-surface-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCustomBossUrl}
                      onChange={e => {
                        const checked = e.target.checked
                        setIsCustomBossUrl(checked)
                        if (!checked && !bossUrl) {
                          setBossUrl(defaultLocalBossUrl)
                        }
                      }}
                      className="rounded border-[#1E2538] bg-[#141928] text-brand-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Özel Bulut Linki Kullan</span>
                  </label>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={isCustomBossUrl ? bossUrl : defaultLocalBossUrl}
                    disabled={!isCustomBossUrl}
                    onChange={e => setBossUrl(e.target.value)}
                    className="w-full h-11 px-3.5 pr-24 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-mono focus:outline-none focus:border-brand-500 transition-colors disabled:opacity-80"
                    placeholder={defaultLocalBossUrl}
                  />
                  <div className="absolute right-2 top-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => panoyaKopyala(isCustomBossUrl ? bossUrl : defaultLocalBossUrl, 'Patron Takip Linki Kopyalandı')}
                      className="p-1.5 rounded-lg bg-[#141928] hover:bg-[#1E2538] text-surface-400 hover:text-white transition-colors"
                      title="Kopyala"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => tarayicidaAc(isCustomBossUrl ? bossUrl : defaultLocalBossUrl)}
                      className="p-1.5 rounded-lg bg-[#141928] hover:bg-[#1E2538] text-surface-400 hover:text-white transition-colors"
                      title="Tarayıcıda Aç"
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                </div>

              </div>

              {/* Kurulum / Güvenlik Kutusu */}
              <div className="bg-[#07090F] p-4 rounded-xl border border-[#161B2C] space-y-2">
                <div className="text-xs font-bold text-surface-300 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-amber-400" />
                  Güvenli Patron Girişi & Özellikler
                </div>
                <ul className="text-[11px] text-surface-400 space-y-1 list-disc list-inside">
                  <li>Patron ekranı <b>yönetici PIN kodu</b> ile korunur; yetkisiz erişim engellenir.</li>
                  <li>Canlı masa durumları, açık adisyon tutarları ve bugünkü ciro tek ekranda güncellenir.</li>
                  <li>İşletme dışından takip için tünel URL'i (Cloudflare/Tailscale) tanımlayabilirsiniz.</li>
                </ul>
              </div>

            </div>

            {/* Sağ: Büyük Patron QR Kartı & Yazdır */}
            <div className="lg:col-span-5 bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] flex flex-col items-center text-center justify-between shadow-xl">
              
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-1 font-mono">
                  PATRON MOBİL TAKİP
                </div>
                <div className="text-sm font-black text-white">
                  {restoName}
                </div>
              </div>

              <div className="my-5 p-4 bg-white rounded-2xl border-2 border-amber-500/40 shadow-2xl">
                <QRCodeSVG
                  value={isCustomBossUrl ? (bossUrl || defaultLocalBossUrl) : defaultLocalBossUrl}
                  size={190}
                  level="Q"
                  includeMargin={false}
                />
              </div>

              <div className="w-full space-y-3">
                <div className="text-[11px] font-bold text-surface-300">
                  Ciro ve Canlı Takip İçin Okutunuz
                </div>
                
                <Button
                  variant="primary"
                  onClick={patronQRYazdir}
                  className="w-full h-11 text-xs font-bold bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-950/40"
                >
                  <Printer size={16} className="mr-2" />
                  Patron QR Kodunu Yazdır
                </Button>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* GELİŞMİŞ QR YAZDIRMA MODALI (Termal 80mm/58mm ve Standart A4/Sticker) */}
      {/* ========================================================================= */}
      <QRPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        items={printItems}
        defaultRestoName={restoName}
      />

    </div>
  )
}
