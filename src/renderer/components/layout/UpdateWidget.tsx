// =====================================================
// Sol Alt Güncelleme Bileşeni (UpdateWidget.tsx)
// Sürüm rozeti, durum göstergesi ve açılır kontrol Popover menüsü
// =====================================================

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RotateCcw, 
  X, 
  HardDriveDownload,
  ShieldCheck,
  ArrowUpCircle,
  Zap
} from 'lucide-react'
import { clsx } from 'clsx'
import { useUpdateStore } from '../../stores/useUpdateStore'

// Bayt ve hız biçimlendirme yardımcıları
function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 MB'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const calculated = parseFloat((bytes / Math.pow(k, i)).toFixed(dm))
  return `${calculated} ${sizes[i]}`
}

function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 KB/s'
  return `${formatBytes(bytesPerSec, 1)}/s`
}

export function UpdateWidget() {
  const {
    status,
    currentVersion,
    newVersion,
    releaseDate,
    releaseNotes,
    progress,
    error,
    lastChecked,
    isPopoverOpen,
    setPopoverOpen,
    togglePopover,
    initUpdater,
    kontrolEt,
    indir,
    yukleVeYenidenBaslat,
    temizleHata,
  } = useUpdateStore()

  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // İlk yüklemede IPC dinleyicilerini başlat
  useEffect(() => {
    initUpdater()
  }, [initUpdater])

  // Dışarı tıklama ve ESC ile kapatma
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setPopoverOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isPopoverOpen) {
        setPopoverOpen(false)
      }
    }

    if (isPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPopoverOpen, setPopoverOpen])

  // Tetikleyici İkon & Durum Göstergesi
  const renderTriggerIcon = () => {
    switch (status) {
      case 'checking':
        return <RefreshCw size={14} className="text-amber-400 animate-spin" />
      case 'available':
        return (
          <span className="relative flex h-3 w-3 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <ArrowUpCircle size={14} className="text-amber-400 relative" />
          </span>
        )
      case 'downloading':
        return <HardDriveDownload size={14} className="text-brand-400 animate-bounce" />
      case 'downloaded':
        return (
          <span className="relative flex h-3 w-3 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <CheckCircle2 size={14} className="text-emerald-400 relative" />
          </span>
        )
      case 'error':
        return <AlertCircle size={14} className="text-rose-400" />
      case 'not-available':
      case 'idle':
      default:
        return <ShieldCheck size={14} className="text-emerald-400" />
    }
  }

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Tetikleyici Buton / Rozet (Sidebar içi sol alt alan) */}
      <button
        ref={triggerRef}
        onClick={togglePopover}
        className={clsx(
          'w-full group flex flex-col items-center justify-center gap-1 py-2 px-1.5 rounded-xl border transition-all duration-200 touch-feedback select-none relative',
          isPopoverOpen
            ? 'bg-[#241F1A] border-brand-500/50 shadow-lg shadow-brand-950/60 text-white'
            : status === 'available' || status === 'downloaded'
            ? 'bg-[#1E1A16] border-amber-500/50 text-white hover:border-amber-400'
            : status === 'error'
            ? 'bg-[#1e1a16] border-rose-900/60 text-rose-300 hover:border-rose-700'
            : 'bg-[#171410] border-[#322C26] text-surface-300 hover:text-white hover:bg-[#1e1a16] hover:border-brand-500/30'
        )}
        title="Uygulama Güncelleme Modülü"
        aria-label="Uygulama Güncelleme Paneli"
      >
        {/* İkon & Versiyon Bilgisi */}
        <div className="flex items-center gap-1.5">
          {renderTriggerIcon()}
          <span className="font-mono font-bold text-[11px] tracking-tight text-surface-100">
            {currentVersion}
          </span>
        </div>

        {/* Küçük Durum Etiketi */}
        <span className={clsx(
          'text-[9px] font-semibold tracking-wider uppercase leading-none',
          status === 'checking' && 'text-amber-400',
          status === 'available' && 'text-amber-300 font-bold',
          status === 'downloading' && 'text-brand-400 font-bold',
          status === 'downloaded' && 'text-emerald-400 font-bold',
          status === 'error' && 'text-rose-400',
          (status === 'idle' || status === 'not-available') && 'text-surface-400 group-hover:text-surface-300'
        )}>
          {status === 'checking' && 'KONTROL...'}
          {status === 'available' && 'YENİ SÜRÜM'}
          {status === 'downloading' && `%${progress ? Math.round(progress.percent) : 0}`}
          {status === 'downloaded' && 'HAZIR'}
          {status === 'error' && 'HATA'}
          {status === 'not-available' && 'GÜNCEL'}
          {status === 'idle' && 'GÜNCELLEME'}
        </span>

        {/* Bildirim Noktası (Güncelleme hazır veya mevcutsa) */}
        {(status === 'available' || status === 'downloaded') && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-[#12110E]" />
        )}
      </button>

      {/* Popover / Dropdown Menü (Sidebar sağından/üstünden açılır) */}
      <AnimatePresence>
        {isPopoverOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.94, y: 6, x: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 6, x: -6 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="fixed z-50 left-24 bottom-4 w-80 max-w-[calc(100vw-7.5rem)] max-h-[min(28rem,calc(100vh-5rem))] overflow-y-auto lg:absolute lg:left-[calc(100%+10px)] lg:bottom-0 bg-[#12110E] border border-[#322C26] rounded-2xl shadow-2xl p-4 text-surface-100 flex flex-col gap-3 select-none pos-scrollbar"
            style={{
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(30, 36, 54, 0.9)',
            }}
          >
            {/* Header: Başlık ve Kapat Butonu */}
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-[#322C26]">
              <div className="flex items-start gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#1e1a16] border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0">
                  <Zap size={16} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white leading-tight">
                    Güncelleyici
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-mono text-surface-400 mt-0.5">
                    <span>Sürüm</span>
                    <span className="text-surface-200 font-bold">{currentVersion}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPopoverOpen(false)}
                className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-surface-400 hover:text-white hover:bg-[#241F1A] border border-transparent hover:border-[#322C26] transition-colors"
                aria-label="Kapat"
              >
                <X size={15} />
              </button>
            </div>

            {/* İçerik: Durum 1, 2, 3, 4 ve Hata Yönetimi */}
            <div className="flex flex-col gap-3">
              
              {/* DURUM 1: Varsayılan (Idle) veya Güncel (Not Available) */}
              {(status === 'idle' || status === 'not-available') && (
                <div className="flex flex-col gap-3">
                  <div className="p-3 bg-[#171410] border border-[#322C26] rounded-xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-950/40 border border-emerald-700/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="flex flex-col min-w-0 text-left">
                      <span className="text-xs font-semibold text-white leading-snug">
                        {status === 'not-available' ? 'Sisteminiz En Güncel Sürümde' : 'Güncelleme Kontrolü'}
                      </span>
                      <span className="text-[10px] text-surface-400 leading-snug mt-0.5 break-words">
                        {lastChecked 
                          ? `Son kontrol: ${new Date(lastChecked).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`
                          : 'GitHub Releases üzerinden yeni sürümleri denetleyin.'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={kontrolEt}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1E1A16] hover:bg-[#322C26] text-white font-semibold text-xs rounded-xl border border-brand-500/40 hover:border-brand-400 shadow-md shadow-brand-950/40 transition-all touch-feedback"
                  >
                    <RefreshCw size={14} className="text-brand-400" />
                    <span>Güncellemeleri Kontrol Et</span>
                  </button>
                </div>
              )}

              {/* DURUM 1.5: Kontrol Ediliyor (Checking) */}
              {status === 'checking' && (
                <div className="p-4 bg-[#171410] border border-[#322C26] rounded-xl flex flex-col items-center justify-center gap-2.5 py-6">
                  <RefreshCw size={24} className="text-amber-400 animate-spin" />
                  <span className="text-xs font-semibold text-surface-200">
                    GitHub Releases Kontrol Ediliyor...
                  </span>
                  <span className="text-[10px] text-surface-400">
                    Lütfen bekleyin, sunucu ile iletişim kuruluyor.
                  </span>
                </div>
              )}

              {/* DURUM 2: Güncelleme Bulundu (Available) */}
              {status === 'available' && (
                <div className="flex flex-col gap-3">
                  <div className="p-3 bg-[#241F1A] border border-amber-700/50 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-950/60 border border-amber-600/50 flex items-center justify-center text-amber-400 shrink-0">
                        <Sparkles size={18} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-amber-300 leading-snug">
                          Yeni Sürüm {newVersion ? `(${newVersion})` : ''}
                        </span>
                        <span className="text-[10px] text-surface-300 leading-snug mt-0.5">
                          Yeni özellikler ve kararlılık iyileştirmeleri hazır.
                        </span>
                      </div>
                    </div>

                    {releaseNotes && (
                      <div className="mt-1 p-2 bg-[#171410] border border-[#3a342c] rounded-lg max-h-24 overflow-y-auto pos-scrollbar text-[10px] text-surface-300 font-mono">
                        {releaseNotes}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={indir}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-amber-950/50 transition-all touch-feedback"
                  >
                    <Download size={16} />
                    <span>Güncellemeyi İndir</span>
                  </button>
                </div>
              )}

              {/* DURUM 3: İndiriliyor (Downloading - Canlı Progress Bar) */}
              {status === 'downloading' && (
                <div className="flex flex-col gap-3">
                  <div className="p-3 bg-[#171410] border border-[#3A342C] rounded-xl flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDriveDownload size={16} className="text-brand-400 animate-pulse" />
                        <span className="text-xs font-bold text-white">Yeni Sürüm İndiriliyor</span>
                      </div>
                      <span className="font-mono font-bold text-sm text-brand-400">
                        %{progress ? Math.round(progress.percent) : 0}
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full h-3 bg-[#110F0C] border border-[#322C26] rounded-full overflow-hidden p-0.5 relative">
                      <motion.div
                        className="h-full bg-gradient-to-r from-brand-500 via-amber-400 to-amber-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress ? Math.min(100, Math.max(0, progress.percent)) : 0}%` }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      />
                    </div>

                    {/* İlerleme ve Hız İstatistikleri */}
                    <div className="flex flex-col gap-1 text-[10px] font-mono text-surface-300 px-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-surface-400">Hız</span>
                        <span className="text-surface-200 font-semibold truncate">
                          {progress ? formatSpeed(progress.bytesPerSecond) : '0 KB/s'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-surface-400 shrink-0">İndirilen</span>
                        <span className="text-surface-200 font-semibold truncate">
                          {progress ? `${formatBytes(progress.transferred)} / ${formatBytes(progress.total)}` : '0 MB'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 py-1 text-[10px] text-surface-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-ping" />
                    <span>İndirme tamamlandığında bildirim verilecektir.</span>
                  </div>
                </div>
              )}

              {/* DURUM 4: Hazır (Downloaded - Yeniden Başlat ve Yükle) */}
              {status === 'downloaded' && (
                <div className="flex flex-col gap-3">
                  <div className="p-3 bg-[#171410] border border-emerald-700/50 rounded-xl flex flex-col gap-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-600/50 flex items-center justify-center text-emerald-400 shrink-0">
                        <CheckCircle2 size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-emerald-300">
                          Güncelleme İndirildi & Hazır!
                        </span>
                        <span className="text-[10px] text-surface-300">
                          Yeni sürüme geçmek için uygulamayı yeniden başlatın.
                        </span>
                      </div>
                    </div>

                    {/* %100 Yeşil Bar */}
                    <div className="w-full h-2.5 bg-[#07130E] border border-emerald-800/40 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-full" />
                    </div>
                  </div>

                  <button
                    onClick={yukleVeYenidenBaslat}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 transition-all touch-feedback"
                  >
                    <RotateCcw size={16} />
                    <span>Şimdi Yeniden Başlat ve Yükle</span>
                  </button>
                </div>
              )}

              {/* HATA DURUMU (Error) */}
              {status === 'error' && (
                <div className="flex flex-col gap-3">
                  <div className="p-3 bg-[#241F1A] border border-rose-800/50 rounded-xl flex flex-col gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-950/60 border border-rose-700/50 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                        <AlertCircle size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-rose-300">
                          Güncelleme Hatası
                        </span>
                        <span className="text-[10px] text-rose-200/80 leading-snug mt-0.5">
                          {error || 'Güncelleme sunucusuna ulaşılamadı veya işlem başarısız oldu.'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={temizleHata}
                      className="flex-1 py-2 px-3 bg-[#1e1a16] hover:bg-[#322C26] text-surface-300 hover:text-white text-xs font-semibold rounded-xl border border-[#322C26] transition-colors"
                    >
                      Kapat
                    </button>
                    <button
                      onClick={kontrolEt}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-md shadow-brand-950/40"
                    >
                      <RefreshCw size={13} />
                      <span>Tekrar Dene</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Bilgi Çizgisi */}
            <div className="pt-2 border-t border-[#1e1a16] flex items-center justify-between gap-2 text-[9px] font-mono text-surface-500">
              <span className="truncate">ETİBOL POS</span>
              <span className="shrink-0">GitHub Releases</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
