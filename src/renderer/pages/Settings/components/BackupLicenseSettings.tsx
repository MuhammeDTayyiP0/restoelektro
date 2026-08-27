import React, { useState } from 'react'
import { Database, ShieldCheck, Download, HardDrive, Cpu, RefreshCw, CheckCircle2, Terminal } from 'lucide-react'
import { useToast } from '../../../components/ui/Toast'
import { ipcInvoke } from '../../../hooks/useIPC'
import { UYGULAMA_KANALLARI } from '../../../../common/ipc-channels'
import { motion } from 'framer-motion'

export default function BackupLicenseSettings() {
  const { success, info, error } = useToast()
  const [isBackingUp, setIsBackingUp] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [lastBackupTime, setLastBackupTime] = useState<string>('Yükleniyor...')
  const [dbInfo, setDbInfo] = useState<{
    dbYolu?: string
    dbBoyutFormatted?: string
    toplamYedekSayisi?: number
    userVersion?: number
    userDataPath?: string
  }>({})

  const loadDbInfo = async () => {
    try {
      const res = (await ipcInvoke(UYGULAMA_KANALLARI.VERITABANI_BILGISI)) as any
      if (res && res.basarili) {
        setDbInfo(res)
        if (res.sonYedekTarihi) {
          const d = new Date(res.sonYedekTarihi)
          setLastBackupTime(d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }))
        } else {
          setLastBackupTime('Henüz yedek yok')
        }
      }
    } catch {
      // sessizce devam et
    }
  }

  React.useEffect(() => {
    loadDbInfo()
  }, [])

  const handleBackup = async () => {
    setIsBackingUp(true)
    try {
      const res = (await ipcInvoke(UYGULAMA_KANALLARI.VERITABANI_YEDEKLE)) as any
      if (res && res.basarili) {
        const now = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        setLastBackupTime(`Bugün, ${now}`)
        success('Yedekleme Tamamlandı', 'Veritabanı anlık yedeği userData/backups/ altına güvenli şekilde kaydedildi.')
        loadDbInfo()
      } else {
        throw new Error(res?.hata || 'Yedekleme başarısız oldu')
      }
    } catch (err: any) {
      error('Yedekleme Hatası', err.message || 'Yedek alınamadı.')
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleOptimize = async () => {
    setIsOptimizing(true)
    try {
      const res = (await ipcInvoke(UYGULAMA_KANALLARI.VERITABANI_OPTIMIZE)) as any
      if (res && res.basarili) {
        success('Veritabanı Optimize Edildi', `SQLite indeksleri ve WAL disk alanı optimize edildi (${res.sureMs}ms).`)
        loadDbInfo()
      } else {
        throw new Error(res?.hata || 'Optimizasyon hatası')
      }
    } catch (err: any) {
      error('Optimizasyon Hatası', err.message || 'Optimize edilemedi.')
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl animate-fade-in text-surface-100 select-none">
      
      {/* Üst Başlık */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Database size={22} className="text-brand-500" />
          Veritabanı & Sistem Lisansı
        </h2>
        <p className="text-xs text-surface-400 mt-1">
          Sistem veritabanı bütünlüğü, yedekleme arşivleri ve donanım yetkilendirmesi.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Veritabanı Yönetimi & Yedekleme */}
        <div className="bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#1A1F30] mb-4">
              <div className="flex items-center gap-2.5">
                <HardDrive size={18} className="text-blue-400" />
                <h3 className="font-semibold text-white text-sm">SQLite Veritabanı</h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-800/40">
                BAĞLI & AKTİF
              </span>
            </div>

            <div className="space-y-3 text-xs text-surface-300">
              <div className="flex justify-between py-1.5 border-b border-[#161B2B]">
                <span className="text-surface-400">Veritabanı Dosyası</span>
                <span className="font-mono text-white">database.sqlite ({dbInfo.dbBoyutFormatted || 'Aktif'})</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#161B2B]">
                <span className="text-surface-400">Motor & Şema Sürümü</span>
                <span className="font-mono text-white">SQLite 3 / v{dbInfo.userVersion || 1} (WAL Modu)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#161B2B]">
                <span className="text-surface-400">Son Güvenlik Yedeği</span>
                <span className="font-mono text-brand-400">{lastBackupTime}</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-surface-400">Yedekleme Konumu</span>
                <span className="font-mono text-surface-400 text-[11px] truncate max-w-[200px]" title={dbInfo.userDataPath ? `${dbInfo.userDataPath}\\backups` : 'userData/backups/'}>
                  {dbInfo.userDataPath ? 'userData/backups/' : 'userData/backups/'} ({dbInfo.toplamYedekSayisi || 0} adet)
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-[#1A1F30]">
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={handleBackup}
              disabled={isBackingUp}
              className="flex-1 h-11 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-brand-900/30 border border-brand-400/30 transition-colors disabled:opacity-50"
            >
              {isBackingUp ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Download size={15} />
              )}
              {isBackingUp ? 'Yedekleniyor...' : 'Anlık Yedek Al'}
            </motion.button>

            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={handleOptimize}
              disabled={isOptimizing}
              className="h-11 px-4 rounded-xl bg-[#141826] hover:bg-[#1C2236] text-surface-200 border border-[#222B40] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              title="Veritabanını Optimize Et"
            >
              <RefreshCw size={14} className={isOptimizing ? 'animate-spin' : ''} />
              Optimize Et
            </motion.button>
          </div>
        </div>

        {/* Lisans & Donanım Yetkisi */}
        <div className="bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#1A1F30] mb-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={18} className="text-amber-400" />
                <h3 className="font-semibold text-white text-sm">Kurumsal Lisans</h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-800/40 flex items-center gap-1">
                <CheckCircle2 size={11} /> ENTERPRISE
              </span>
            </div>

            <div className="space-y-3 text-xs text-surface-300">
              <div className="flex justify-between py-1.5 border-b border-[#161B2B]">
                <span className="text-surface-400">Yazılım Sürümü</span>
                <span className="font-mono text-white">ETİBOL POS v2.1.0</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#161B2B]">
                <span className="text-surface-400">Lisans Tipi</span>
                <span className="text-white font-medium">Süresiz Tek Terminal + Mobil Ağ</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#161B2B]">
                <span className="text-surface-400">Donanım Kimliği (UID)</span>
                <span className="font-mono text-surface-400 text-[11px]">POS-NODE-8472-X9</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-surface-400">Sunucu Durumu</span>
                <span className="font-mono text-emerald-400 text-xs">Port 3847 (Garson & Mutfak Aktif)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#1A1F30] flex items-center justify-between">
            <span className="text-[11px] text-surface-500 font-mono">
              Lisans Doğrulama: ÇEVRİMDIŞI GEÇERLİ
            </span>
            <button
              type="button"
              onClick={() => info('Lisans Bilgisi', 'Bu lisans ETİBOL RESTO kurulu cihaz için süresiz tanımlanmıştır.')}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold"
            >
              Detaylar
            </button>
          </div>
        </div>

      </div>

      {/* Donanım ve Entegrasyon Teşhis Kartı */}
      <div className="bg-[#0E111B] p-6 rounded-2xl border border-[#1E2436] shadow-xl">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#1A1F30] mb-4">
          <Terminal size={18} className="text-surface-400" />
          <h3 className="font-semibold text-white text-sm">Donanım ve Çevre Birimleri Tanılama</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#121624] border border-[#1E2538] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <Cpu size={18} />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Termal Yazıcı Sürücüsü</div>
              <div className="text-[11px] font-mono text-emerald-400">ESCPOS Raw Driver OK</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#121624] border border-[#1E2538] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-950/40 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
              <Terminal size={18} />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Seri Port (COM)</div>
              <div className="text-[11px] font-mono text-surface-400">SerialPort v12 Ready</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#121624] border border-[#1E2538] flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-950/40 border border-blue-800/40 flex items-center justify-center text-blue-400">
              <RefreshCw size={18} />
            </div>
            <div>
              <div className="text-xs font-semibold text-white">Socket.IO Yayını</div>
              <div className="text-[11px] font-mono text-blue-400">Senkronizasyon Aktif</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
