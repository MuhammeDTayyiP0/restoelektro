import React, { useState, useEffect } from 'react'
import { useToast } from '../../../components/ui/Toast'
import { ipcInvoke } from '../../../hooks/useIPC'
import { AYAR_KANALLARI, YAZICI_KANALLARI } from '../../../../common/ipc-channels'
import { Save, Printer, Smartphone, Building2, Receipt, CheckCircle2, Play } from 'lucide-react'
import { motion } from 'framer-motion'

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
      success('Başarılı', 'Genel işletme ayarları kaydedildi.')
    } catch (err: any) {
      error('Hata', err.message || 'Ayarlar kaydedilemedi')
    } finally {
      setKaydediliyor(false)
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
          <p className="text-xs text-surface-400 mt-1">
            İşletme kimlik bilgileri, termal donanım yönlendirmeleri ve mali parametreler.
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

      {/* İşletme Bilgileri Kartı */}
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

      {/* Vergi ve Para Birimi Kartı */}
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

      {/* Yazıcı Port Yönlendirmeleri */}
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

      {/* Garson Mobil Terminali Kartı */}
      <div className="bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#1A1F30]">
          <h3 className="text-xs font-bold text-surface-300 uppercase tracking-wider flex items-center gap-2">
            <Smartphone size={16} className="text-blue-400" />
            Garson Mobil El Terminali
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/40 text-blue-400 border border-blue-800/40 flex items-center gap-1">
            <CheckCircle2 size={11} /> WI-FI YEREL AĞ
          </span>
        </div>
        
        <p className="text-xs text-surface-400 leading-relaxed">
          Garsonlarınız telefon veya tabletlerinin tarayıcısından (Chrome/Safari) aşağıdaki adresi girerek doğrudan masa ve sipariş yönetimi yapabilirler.
        </p>
        
        <div className="bg-[#080A10] rounded-xl p-4 border border-[#181D2E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono">
          <div className="text-xs text-surface-400">Terminal Web Adresi:</div>
          <code className="text-sm font-bold text-brand-400 bg-[#121624] px-3 py-1.5 rounded-lg border border-[#1E2538]">
            http://&lt;yerel-ip&gt;:3847/garson
          </code>
        </div>
      </div>

    </div>
  )
}

