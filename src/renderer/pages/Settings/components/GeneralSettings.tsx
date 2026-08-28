import React, { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../../components/ui/Toast'
import { ipcInvoke } from '../../../hooks/useIPC'
import {
  AYAR_KANALLARI,
  YAZICI_KANALLARI,
  UYGULAMA_KANALLARI,
  AG_KANALLARI
} from '../../../../common/ipc-channels'
import {
  Save,
  Printer,
  Smartphone,
  Building2,
  Receipt,
  CheckCircle2,
  Play,
  Power,
  Layers,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Radio,
  Info
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'
import { clsx } from 'clsx'

interface AgKarti {
  id: string
  ad: string
  ip: string
  aile: string
  mac: string
  dahili: boolean
  oncelikli: boolean
  tip: 'wifi' | 'ethernet' | 'diger'
  etiket: string
}

export default function GeneralSettings() {
  const [ayarlar, setAyarlar] = useState<Record<string, string>>({})
  const [kaydediliyor, setKaydediliyor] = useState(false)
  const [yazicilar, setYazicilar] = useState<{ name: string; displayName: string; description: string }[]>([])
  const [otomatikBaslat, setOtomatikBaslat] = useState(false)
  const [otomatikBaslatYukleniyor, setOtomatikBaslatYukleniyor] = useState(false)

  // Ağ & Garson Terminali State'leri
  const [agKartlari, setAgKartlari] = useState<AgKarti[]>([])
  const [seciliKartId, setSeciliKartId] = useState<string>('')
  const [aktifIp, setAktifIp] = useState<string>('')
  const [isManualIp, setIsManualIp] = useState<boolean>(false)
  const [manuelIpInput, setManuelIpInput] = useState<string>('')
  const [agTaramasiYukleniyor, setAgTaramasiYukleniyor] = useState<boolean>(false)
  const [kopyalandi, setKopyalandi] = useState<boolean>(false)

  const { success, error } = useToast()

  const ayariGetir = (anahtar: string) => ayarlar[anahtar] || ''

  const ayarDegistir = (anahtar: string, deger: string) => {
    setAyarlar(prev => ({ ...prev, [anahtar]: deger }))
  }

  // Ağ kartlarını tara ve en uygun yerel IP'yi belirle
  const agKartlariniYukle = useCallback(async (kayitliAyarlar?: Record<string, string>) => {
    setAgTaramasiYukleniyor(true)
    try {
      const res = await ipcInvoke<any>(AG_KANALLARI.KARTLARI_GETIR)
      let kartlar: AgKarti[] = res?.kartlar || []

      // Eğer ağ servisi boş dönerse sürüm bilgisi servisinden dene
      if (kartlar.length === 0) {
        const sysInfo = await ipcInvoke<any>(UYGULAMA_KANALLARI.SURUM_BILGISI)
        if (sysInfo?.localIP && sysInfo.localIP !== '127.0.0.1' && sysInfo.localIP !== 'localhost') {
          kartlar = [
            {
              id: `otomatik_${sysInfo.localIP}`,
              ad: 'Yerel Ağ Bağdaştırıcısı',
              ip: sysInfo.localIP,
              aile: 'IPv4',
              mac: '',
              dahili: false,
              oncelikli: true,
              tip: 'ethernet',
              etiket: `🔌 Yerel Ağ — ${sysInfo.localIP} (Önerilen)`
            }
          ]
        }
      }

      setAgKartlari(kartlar)

      const ayarHavuzu = kayitliAyarlar || ayarlar
      const kayitliIp = ayarHavuzu.garson_ip
      const kayitliMod = ayarHavuzu.garson_ip_modu
      const kayitliKartId = ayarHavuzu.garson_secili_kart

      // Manuel mod kontrolü: sadece kullanıcı bilinçli olarak 'manual' seçmişse ve geçerli bir IP yazmışsa
      if (kayitliMod === 'manual' && kayitliIp && kayitliIp !== '127.0.0.1' && kayitliIp !== 'localhost') {
        setIsManualIp(true)
        setSeciliKartId('manual')
        setAktifIp(kayitliIp)
        setManuelIpInput(kayitliIp)
      } else {
        // Otomatik mod: aktif ağ kartlarından öncelikli olanı bul
        setIsManualIp(false)
        let secilecekKart: AgKarti | undefined

        if (kayitliKartId) {
          secilecekKart = kartlar.find(k => k.id === kayitliKartId)
        }
        if (!secilecekKart && kayitliIp && kayitliIp !== '127.0.0.1' && kayitliIp !== 'localhost') {
          secilecekKart = kartlar.find(k => k.ip === kayitliIp)
        }
        if (!secilecekKart) {
          secilecekKart = kartlar.find(k => k.oncelikli) || kartlar[0]
        }

        if (secilecekKart) {
          setSeciliKartId(secilecekKart.id)
          setAktifIp(secilecekKart.ip)
          ayarDegistir('garson_secili_kart', secilecekKart.id)
          ayarDegistir('garson_ip', secilecekKart.ip)
          ayarDegistir('garson_ip_modu', 'auto')
        } else {
          // Hiçbir ağ kartı bulunamazsa res.varsayilanIp veya 127.0.0.1
          const defIp = res?.varsayilanIp || '127.0.0.1'
          setSeciliKartId('')
          setAktifIp(defIp)
        }
      }
    } catch (err: any) {
      console.error('Ağ kartları taranamadı:', err)
    } finally {
      setAgTaramasiYukleniyor(false)
    }
  }, [ayarlar])

  const verileriYukle = async () => {
    try {
      const data = (await ipcInvoke<Record<string, string>>(AYAR_KANALLARI.TUMU)) || {}
      setAyarlar(data)

      // Ağ kartlarını yükle
      await agKartlariniYukle(data)

      // Yazıcıları çek
      const printerRes = await ipcInvoke<any>(YAZICI_KANALLARI.AYARLAR)
      if (printerRes?.basarili && printerRes.yazicilar) {
        setYazicilar(printerRes.yazicilar)
      }

      // Otomatik başlatma durumunu sorgula
      const autoRes = await ipcInvoke<any>(UYGULAMA_KANALLARI.OTOMATIK_BASLATMA_DURUM)
      if (autoRes?.basarili) {
        setOtomatikBaslat(Boolean(autoRes.openAtLogin))
      }
    } catch (err: any) {
      error('Hata', err.message || 'Ayarlar yüklenemedi')
    }
  }

  useEffect(() => {
    verileriYukle()
  }, [])

  // Kart seçimi değiştiğinde
  const handleKartSecimi = (kartId: string) => {
    if (kartId === 'manual') {
      setIsManualIp(true)
      setSeciliKartId('manual')
      const ipVal = manuelIpInput || (aktifIp && aktifIp !== '127.0.0.1' ? aktifIp : '192.168.1.')
      setManuelIpInput(ipVal)
      setAktifIp(ipVal)
      ayarDegistir('garson_secili_kart', 'manual')
      ayarDegistir('garson_ip', ipVal)
      ayarDegistir('garson_ip_modu', 'manual')
    } else {
      setIsManualIp(false)
      setSeciliKartId(kartId)
      const secilenKart = agKartlari.find(k => k.id === kartId)
      if (secilenKart) {
        setAktifIp(secilenKart.ip)
        ayarDegistir('garson_secili_kart', secilenKart.id)
        ayarDegistir('garson_ip', secilenKart.ip)
        ayarDegistir('garson_ip_modu', 'auto')
      }
    }
  }

  // Manuel IP değiştiğinde
  const handleManuelIpDegisim = (val: string) => {
    setManuelIpInput(val)
    setAktifIp(val.trim())
    ayarDegistir('garson_ip', val.trim())
    ayarDegistir('garson_secili_kart', 'manual')
    ayarDegistir('garson_ip_modu', 'manual')
  }

  // Canlı Garson URL'i (Otomatik algılanan IP kullanılır)
  const gosterilenIp = aktifIp || (agKartlari.length > 0 ? agKartlari[0].ip : '127.0.0.1')
  const garsonTerminalUrl = `http://${gosterilenIp}:3847/garson`

  // Panoya Kopyalama
  const adresiKopyala = () => {
    if (!garsonTerminalUrl) return
    navigator.clipboard.writeText(garsonTerminalUrl)
    setKopyalandi(true)
    success('Kopyalandı', 'Garson terminal web adresi panoya kopyalandı.')
    setTimeout(() => setKopyalandi(false), 2000)
  }

  // Tarayıcıda Aç
  const tarayicidaAc = () => {
    window.open(garsonTerminalUrl, '_blank')
  }

  const kaydet = async () => {
    setKaydediliyor(true)
    try {
      // Değişen tüm ayarları kaydet
      for (const [anahtar, deger] of Object.entries(ayarlar)) {
        await ipcInvoke(AYAR_KANALLARI.KAYDET, anahtar, deger)
      }
      success('Başarılı', 'Genel işletme ve donanım ayarları kaydedildi.')
    } catch (err: any) {
      error('Hata', err.message || 'Ayarlar kaydedilemedi')
    } finally {
      setKaydediliyor(false)
    }
  }

  const toggleOtomatikBaslat = async () => {
    setOtomatikBaslatYukleniyor(true)
    const yeniDurum = !otomatikBaslat
    try {
      const res = await ipcInvoke<any>(UYGULAMA_KANALLARI.OTOMATIK_BASLATMA_AYARLA, yeniDurum)
      if (res && res.basarili) {
        setOtomatikBaslat(yeniDurum)
        success(
          'Başlangıç Ayarı Güncellendi',
          yeniDurum
            ? 'ETİBOL POS, Windows açılışında otomatik başlatılacaktır.'
            : 'Windows başlangıcında otomatik başlatma devre dışı bırakıldı.'
        )
      } else {
        throw new Error(res?.hata || 'Ayar güncellenemedi')
      }
    } catch (err: any) {
      error('Hata', err.message || 'Otomatik başlatma ayarı değiştirilemedi.')
    } finally {
      setOtomatikBaslatYukleniyor(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl animate-fade-in text-surface-100 select-none pb-8">

      {/* Üst Başlık & Kaydet Butonu */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Building2 size={22} className="text-brand-500" />
            Genel İşletme & Donanım Ayarları
          </h2>
          <p className="text-xs text-surface-400 mt-1 font-mono">
            Garson el terminalleri, başlangıç parametreleri ve termal donanım yönlendirmeleri
          </p>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          onClick={kaydet}
          disabled={kaydediliyor}
          className="h-11 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-brand-900/40 border border-brand-400/30 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {kaydediliyor ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
        </motion.button>
      </div>

      {/* 1. SIRADA: GARSON MOBİL EL TERMİNALİ & AKILLI IP KARTI (EN ÜSTTE) */}
      <div className="bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] space-y-5 shadow-2xl relative overflow-hidden">
        {/* Dekoratif hafif ışıma */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Kart Başlığı & Durum Rozeti */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#1A1F30]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/50 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
              <Smartphone size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                Garson Mobil El Terminali
              </h3>
              <span className="text-[11px] text-surface-400">
                Tablet ve telefonlardan yerel Wi-Fi ağı üzerinden masa & sipariş yönetimi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-beacon-green" />
              REST API :3847 AKTİF
            </span>
          </div>
        </div>

        {/* IP Seçimi ve QR Kod / Canlı URL Alanı */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Sol Kolon: Ağ Kartı / IP Seçimi & Manuel Giriş */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-surface-300 flex items-center gap-1.5">
                  <Radio size={14} className="text-brand-400" />
                  Aktif Ağ Kartı / IP Seçimi
                </label>
                <button
                  type="button"
                  onClick={() => agKartlariniYukle()}
                  disabled={agTaramasiYukleniyor}
                  className="text-[11px] text-brand-400 hover:text-brand-300 flex items-center gap-1 font-mono hover:underline disabled:opacity-50"
                  title="Ağ kartlarını yeniden tara"
                >
                  <RefreshCw size={11} className={clsx(agTaramasiYukleniyor && "animate-spin")} />
                  {agTaramasiYukleniyor ? 'Taranıyor...' : 'Ağları Yenile'}
                </button>
              </div>

              <select
                value={seciliKartId}
                onChange={e => handleKartSecimi(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-medium focus:outline-none focus:border-brand-500 transition-colors"
              >
                {agKartlari.map(kart => (
                  <option key={kart.id} value={kart.id}>
                    {kart.etiket}
                  </option>
                ))}
                <option value="manual">✍️ Manuel IP Gir... (Özel Yapılandırma)</option>
              </select>
              <p className="text-[11px] text-surface-400 leading-relaxed">
                Garsonların bağlı olduğu Wi-Fi veya yerel Ethernet bağdaştırıcısını seçin.
              </p>
            </div>

            {/* Manuel IP Giriş Alanı (Override) */}
            {isManualIp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#090B12] p-3.5 rounded-xl border border-brand-500/40 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-brand-300 flex items-center gap-1.5">
                    <span>Manuel IP Adresi / Host</span>
                  </label>
                  <span className="text-[10px] font-mono text-surface-500 uppercase">ÖZEL YÖNLENDİRME</span>
                </div>
                <input
                  type="text"
                  value={manuelIpInput}
                  onChange={e => handleManuelIpDegisim(e.target.value)}
                  placeholder="Örn: 192.168.1.50"
                  className="w-full h-10 px-3 rounded-lg bg-[#0E111B] border border-[#262D42] text-white text-xs font-mono focus:outline-none focus:border-brand-400 transition-colors"
                />
                <span className="text-[10px] text-surface-400 block font-mono">
                  İpucu: Sabit (statik) IP veya özel DNS adı kullanıyorsanız buraya giriniz.
                </span>
              </motion.div>
            )}

            {/* Canlı URL Gösterimi & Butonlar */}
            <div className="bg-[#090B12] rounded-xl p-3.5 border border-[#181D2E] space-y-2.5">
              <div className="text-[11px] font-semibold text-surface-400 flex items-center justify-between">
                <span>Canlı Terminal Bağlantı Adresi:</span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 size={11} /> CANLI YEREL BAĞLANTI
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#05070A] border border-[#1E2538] rounded-lg px-3 py-2 text-xs font-mono font-bold text-brand-400 truncate select-all tracking-wide">
                  {garsonTerminalUrl}
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={adresiKopyala}
                  className={clsx(
                    "h-9 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 border",
                    kopyalandi
                      ? "bg-emerald-600 text-white border-emerald-500"
                      : "bg-[#141826] hover:bg-[#1C2236] text-surface-200 border-[#222B40]"
                  )}
                  title="Terminal Adresini Kopyala"
                >
                  {kopyalandi ? (
                    <>
                      <Check size={13} className="text-white" />
                      Kopyalandı
                    </>
                  ) : (
                    <>
                      <Copy size={13} className="text-surface-300" />
                      Adresi Kopyala
                    </>
                  )}
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={tarayicidaAc}
                  className="h-9 px-3 rounded-lg bg-[#141826] hover:bg-[#1C2236] text-surface-200 border border-[#222B40] text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                  title="Varsayılan tarayıcıda açıp test et"
                >
                  <ExternalLink size={13} className="text-blue-400" />
                  Aç
                </motion.button>
              </div>
            </div>

            {/* Bilgilendirme Notu */}
            <div className="flex items-start gap-2.5 text-[11px] text-surface-400 bg-[#090B12]/60 p-3 rounded-xl border border-[#161B2B]">
              <Info size={14} className="text-brand-400 shrink-0 mt-0.5" />
              <span>
                Garson telefonlarının terminale erişebilmesi için bu ana bilgisayarla <strong>aynı Wi-Fi ağına</strong> bağlı olması gerekir.
              </span>
            </div>

          </div>

          {/* Sağ Kolon: Yüksek Kontrastlı Canlı QR Kod Kartı */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-5 rounded-2xl bg-[#090B12] border border-[#181D2E] text-center space-y-3">
            <div className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>Hızlı Bağlantı QR Kodu</span>
            </div>

            {/* QR Kod Çerçevesi */}
            <div className="bg-white p-3.5 rounded-2xl shadow-xl shadow-black/60 border border-white/20 transition-transform duration-200 hover:scale-105">
              <QRCodeSVG
                value={garsonTerminalUrl}
                size={135}
                level="M"
                includeMargin={false}
              />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-semibold text-white">
                Garson Telefonundan Okutun
              </div>
              <p className="text-[11px] text-surface-400 font-mono">
                Kamera veya QR okuyucu ile anında terminal açılır
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* 2. SIRADA: Sistem & Başlangıç Tercihleri Kartı (Auto-Launch & System Tray) */}
      <div className="bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1F30]">
          <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
            <Power size={16} className="text-brand-400" />
            Sistem & Başlangıç Tercihleri
          </h3>
          <span className={clsx(
            "text-[11px] font-mono px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 transition-colors",
            otomatikBaslat
              ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/40"
              : "bg-[#141826] text-surface-400 border-[#1E2436]"
          )}>
            <span className={clsx(
              "w-1.5 h-1.5 rounded-full",
              otomatikBaslat ? "bg-emerald-400 status-beacon-green" : "bg-surface-500"
            )} />
            {otomatikBaslat ? 'BAŞLANGIÇTA ÇALIŞIR' : 'MANUEL BAŞLATMA'}
          </span>
        </div>

        {/* Windows Başlangıcında Otomatik Başlat Switch */}
        <div className="bg-[#090B12] rounded-xl p-4 border border-[#181D2E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <span>Windows Başlangıcında Otomatik Başlat</span>
              {otomatikBaslat && (
                <span className="text-[10px] bg-brand-950/60 text-brand-400 border border-brand-800/40 px-2 py-0.2 rounded font-mono">
                  ÖNERİLEN
                </span>
              )}
            </div>
            <p className="text-[11px] text-surface-400 max-w-xl leading-relaxed">
              Bilgisayar açıldığında ETİBOL POS arka planda hazır başlatılır; garson terminalleri ve mutfak ekranları kesintisiz çalışır.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={otomatikBaslat}
            disabled={otomatikBaslatYukleniyor}
            onClick={toggleOtomatikBaslat}
            className={clsx(
              "relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50",
              otomatikBaslat ? "bg-brand-600" : "bg-[#1A2032]"
            )}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className={clsx(
                "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                otomatikBaslat ? "translate-x-6" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* System Tray Bilgilendirme Kutusu */}
        <div className="bg-[#090B12]/60 rounded-xl p-3.5 border border-[#161B2B] flex items-start gap-3">
          <div className="w-6 h-6 rounded-lg bg-blue-950/40 border border-blue-800/40 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
            <Layers size={13} />
          </div>
          <div className="text-[11px] text-surface-400 leading-relaxed">
            <strong className="text-surface-200 font-semibold">Arka Planda Çalışma (System Tray):</strong> Sağ üstteki <span className="text-rose-400 font-mono">[X]</span> butonuna basıldığında uygulama tamamen kapanmaz, Windows sağ alt bildirim alanına (System Tray) küçültülür. Tamamen kapatmak için bildirim alanındaki ikona sağ tıklayıp <span className="text-brand-300 font-medium">"Sistemden Tamamen Çık"</span> seçeneğini kullanabilirsiniz.
          </div>
        </div>
      </div>

      {/* 3. SIRADA: İşletme Bilgileri Kartı */}
      <div className="bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] space-y-4 shadow-xl">
        <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider pb-3 border-b border-[#1A1F30] flex items-center gap-2">
          <Building2 size={16} className="text-brand-400" />
          İşletme Kimlik Bilgileri
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-surface-400">Restoran / İşletme Adı</label>
            <input
              type="text"
              value={ayariGetir('restoran_adi')}
              onChange={e => ayarDegistir('restoran_adi', e.target.value)}
              className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="Örn: ETİBOL RESTO & KEBAP"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-surface-400">İletişim Telefonu</label>
            <input
              type="text"
              value={ayariGetir('restoran_telefon')}
              onChange={e => ayarDegistir('restoran_telefon', e.target.value)}
              className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="Örn: 0212 555 00 00"
            />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-surface-400">Açık Adres (Fiş ve Adisyon Başlığında Çıkar)</label>
            <textarea
              rows={2}
              value={ayariGetir('restoran_adres')}
              onChange={e => ayarDegistir('restoran_adres', e.target.value)}
              className="p-3 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs focus:outline-none focus:border-brand-500 transition-colors resize-none"
              placeholder="Restoran açık adresi..."
            />
          </div>
        </div>
      </div>

      {/* 4. SIRADA: Vergi ve Para Birimi Kartı */}
      <div className="bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] space-y-4 shadow-xl">
        <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider pb-3 border-b border-[#1A1F30] flex items-center gap-2">
          <Receipt size={16} className="text-emerald-400" />
          Vergi & Mali Parametreler
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-surface-400">Varsayılan KDV Oranı (%)</label>
            <input
              type="number"
              value={ayariGetir('varsayilan_kdv')}
              onChange={e => ayarDegistir('varsayilan_kdv', e.target.value)}
              className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-mono focus:outline-none focus:border-brand-500 transition-colors"
              placeholder="Örn: 10"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-surface-400">Para Birimi Sembolü</label>
            <select
              value={ayariGetir('para_birimi') || 'TL'}
              onChange={e => ayarDegistir('para_birimi', e.target.value)}
              className="h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs font-semibold focus:outline-none focus:border-brand-500 transition-colors"
            >
              <option value="TL">Türk Lirası (₺)</option>
              <option value="USD">Amerikan Doları ($)</option>
              <option value="EUR">Euro (€)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. SIRADA: Yazıcı Port Yönlendirmeleri */}
      <div className="bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] space-y-4 shadow-xl">
        <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider pb-3 border-b border-[#1A1F30] flex items-center gap-2">
          <Printer size={16} className="text-blue-400" />
          Yazıcı Aygıt Yönlendirmeleri
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-surface-400">Müşteri Fiş Yazıcısı (Kasa)</label>
            <div className="flex gap-2">
              <select
                value={ayariGetir('kasa_yazici')}
                onChange={e => ayarDegistir('kasa_yazici', e.target.value)}
                className="flex-1 h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs focus:outline-none focus:border-brand-500 transition-colors"
              >
                <option value="">-- Yazıcı Seçin --</option>
                {yazicilar.map(p => (
                  <option key={p.name} value={p.name}>{p.displayName || p.name}</option>
                ))}
              </select>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  const pName = ayariGetir('kasa_yazici')
                  if (!pName) return error('Hata', 'Önce yazıcı seçmelisiniz.')
                  const res = await ipcInvoke<any>(YAZICI_KANALLARI.TEST_YAZDIR, pName)
                  if (res?.basarili) success('Başarılı', 'Kasa yazıcısına test fişi gönderildi.')
                  else error('Hata', res?.hata || 'Yazdırma başarısız.')
                }}
                className="h-11 px-3.5 rounded-xl bg-[#141826] hover:bg-[#1C2236] text-surface-200 border border-[#222B40] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Play size={12} className="text-emerald-400" />
                Sına
              </motion.button>
            </div>
            <span className="text-[11px] text-surface-500">Müşteriye verilecek adisyon fişlerini basar.</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-surface-400">Mutfak Sipariş Yazıcısı</label>
            <div className="flex gap-2">
              <select
                value={ayariGetir('mutfak_yazici')}
                onChange={e => ayarDegistir('mutfak_yazici', e.target.value)}
                className="flex-1 h-11 px-3.5 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-xs focus:outline-none focus:border-brand-500 transition-colors"
              >
                <option value="">-- Yazıcı Seçin --</option>
                {yazicilar.map(p => (
                  <option key={p.name} value={p.name}>{p.displayName || p.name}</option>
                ))}
              </select>
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={async () => {
                  const pName = ayariGetir('mutfak_yazici')
                  if (!pName) return error('Hata', 'Önce yazıcı seçmelisiniz.')
                  const res = await ipcInvoke<any>(YAZICI_KANALLARI.TEST_YAZDIR, pName)
                  if (res?.basarili) success('Başarılı', 'Mutfak yazıcısına test fişi gönderildi.')
                  else error('Hata', res?.hata || 'Yazdırma başarısız.')
                }}
                className="h-11 px-3.5 rounded-xl bg-[#141826] hover:bg-[#1C2236] text-surface-200 border border-[#222B40] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Play size={12} className="text-emerald-400" />
                Sına
              </motion.button>
            </div>
            <span className="text-[11px] text-surface-500">Sipariş onaylandığı anda mutfak istasyonuna bilgi fişi basar.</span>
          </div>
        </div>
      </div>

    </div>
  )
}
