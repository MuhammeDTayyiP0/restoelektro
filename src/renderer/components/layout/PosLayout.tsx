import React from 'react'
import { Outlet, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Wifi, WifiOff } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUIStore } from '../../stores/useUIStore'
import { clsx } from 'clsx'

export function PosLayout() {
  const { girisYapildi, personel } = useAuthStore()
  const { sidebarTetikle } = useUIStore()
  const navigate = useNavigate()
  
  const [zaman, setZaman] = React.useState(new Date())
  const [online, setOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const timer = setInterval(() => setZaman(new Date()), 1000)
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      clearInterval(timer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!girisYapildi) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex flex-col w-full h-screen bg-[#090A0F] overflow-hidden select-none">
      {/* Özel POS Header - Kompakt, Endüstriyel ve Odaklı */}
      <header 
        className="h-14 bg-[#0B0E17] border-b border-[#1E2436] text-white flex items-center justify-between px-3 sm:px-4 z-20 shrink-0 shadow-md"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        
        <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button 
            onClick={() => navigate('/tables')}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-[#141926] hover:bg-[#1C2336] text-surface-200 hover:text-white rounded-xl border border-[#1E2436] hover:border-brand-500/50 transition-all touch-feedback shadow-sm"
          >
            <ArrowLeft size={18} className="text-brand-400" />
            <span className="font-semibold text-xs sm:text-sm">Masalara Dön</span>
          </button>
        </div>

        {/* Orta & Sağ Taraf — Saat, Personel ve Durum */}
        <div className="flex items-center gap-2.5 sm:gap-3.5" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* Canlı Saat */}
          <div className="flex items-center gap-2 bg-[#090A0F] border border-[#1E2436] px-3 py-1 rounded-xl">
            <Clock size={15} className="text-brand-400" />
            <span className="font-mono font-bold text-xs sm:text-sm text-white tracking-wider">
              {zaman.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Kasiyer / Personel Bilgisi */}
          {personel && (
            <div className="flex items-center gap-2 px-2.5 py-1 bg-[#121624] border border-[#1E2436] rounded-xl">
              <div className="w-6 h-6 rounded-lg bg-[#182035] border border-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-bold">
                {personel?.ad?.charAt(0)}{personel?.soyad?.charAt(0)}
              </div>
              <span className="font-semibold text-xs text-white hidden sm:inline">
                {personel?.ad} {personel?.soyad}
              </span>
            </div>
          )}
          
          {/* Bağlantı Durumu */}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#121624] border border-[#1E2436] rounded-xl">
            {online ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 status-beacon-green" />
                <span className="text-[10px] font-mono font-semibold text-surface-300 hidden md:inline">ONLINE</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 status-beacon-red" />
                <span className="text-[10px] font-mono font-semibold text-rose-400 hidden md:inline">OFFLINE</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* POS İçeriği - Tam genişlik ve yükseklik */}
      <main className="flex-1 flex overflow-hidden bg-[#090A0F]">
        <Outlet />
      </main>
    </div>
  )
}

