import React from 'react'
import { Menu, Wifi, Clock, WifiOff, Maximize, Minimize, Moon, Sun, X, Minus, UserCheck, Radio, Shield } from 'lucide-react'
import { useUIStore } from '../../stores/useUIStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { clsx } from 'clsx'

export function Header() {
  const { sidebarTetikle, karanlikTema, temaDegistir } = useUIStore()
  const { personel } = useAuthStore()
  
  const [zaman, setZaman] = React.useState(new Date())
  const [online, setOnline] = React.useState(navigator.onLine)
  const [tamEkran, setTamEkran] = React.useState(false)

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

  const handleTamEkran = async () => {
    try {
      // @ts-ignore
      const durum = await window.api.pencere.tamEkran()
      setTamEkran(durum)
    } catch (e) {
      console.error('Tam ekran hatası', e)
    }
  }

  const handleKucult = async () => {
    try {
      // @ts-ignore
      await window.api.pencere.kucult()
    } catch (e) {
      console.error('Küçültme hatası', e)
    }
  }

  const handleKapat = async () => {
    // @ts-ignore
    await window.api.pencere.kapat()
  }

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
      case 'mudur':
        return 'bg-amber-950/40 text-amber-300 border-amber-700/50'
      case 'kasiyer':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50'
      case 'mutfak':
        return 'bg-orange-950/40 text-orange-300 border-orange-700/50'
      default:
        return 'bg-cyan-950/40 text-cyan-300 border-cyan-700/50'
    }
  }

  return (
    <header 
      className="h-16 bg-[#0B0E17] border-b border-[#1E2436] flex items-center justify-between px-3 sm:px-4 no-select relative z-30 shadow-md" 
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Sol Taraf — Menü & Başlık */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button 
          onClick={() => sidebarTetikle()}
          className="p-2 lg:hidden text-surface-400 hover:text-white hover:bg-[#141926] rounded-xl touch-feedback border border-transparent hover:border-[#1E2436]"
          aria-label="Menüyü Aç/Kapat"
        >
          <Menu size={22} />
        </button>
        
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5 font-sans">
            ETİBOL <span className="text-brand-400 font-mono">RESTO</span>
          </h1>
          <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#121726] border border-[#1E2436] text-surface-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-beacon-green" />
            POS-MAIN
          </span>
        </div>
      </div>

      {/* Orta Taraf — Endüstriyel Canlı Saat & Tarih */}
      <div className="flex items-center gap-3 bg-[#090A0F] border border-[#1E2436] px-4 py-1.5 rounded-xl shadow-inner">
        <Clock size={16} className="text-brand-400 shrink-0" />
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wider">
            {zaman.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="hidden lg:inline text-surface-500 font-mono text-xs">|</span>
          <span className="hidden lg:inline text-xs text-surface-400 font-medium">
            {zaman.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Sağ Taraf — Durum, Kullanıcı ve Pencere Kontrolleri */}
      <div className="flex items-center gap-2 sm:gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
        
        {/* Kullanıcı Profili Çipi */}
        {personel && (
          <div className="hidden md:flex items-center gap-2.5 bg-[#121624] border border-[#1E2436] py-1 px-2.5 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-[#182035] border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold text-xs">
              {personel?.ad?.charAt(0)}{personel?.soyad?.charAt(0)}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">
                {personel?.ad} {personel?.soyad}
              </span>
              <span className={clsx('text-[9px] px-1 py-0.2 rounded border uppercase font-mono font-medium leading-tight mt-0.5 inline-block text-center', getRoleBadge(personel?.rol))}>
                {personel?.rol}
              </span>
            </div>
          </div>
        )}

        {/* Ağ & LAN Durumu Rozeti */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-[#121624] border border-[#1E2436] rounded-xl text-xs font-mono">
          {online ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 status-beacon-green" />
              <span className="text-surface-300 text-[11px] font-semibold">LAN: AKTİF</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-500 status-beacon-red" />
              <span className="text-rose-400 text-[11px] font-semibold">OFFLINE</span>
            </>
          )}
        </div>

        {/* Tema Değiştirme Butonu */}
        <button 
          onClick={temaDegistir}
          className="w-9 h-9 flex items-center justify-center text-surface-400 hover:text-white hover:bg-[#151B2B] border border-transparent hover:border-[#1E2436] rounded-xl touch-feedback"
          title="Tema Değiştir"
          aria-label="Tema Değiştir"
        >
          {karanlikTema ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Ayırıcı Çizgi */}
        <div className="h-5 w-px bg-[#1E2436] mx-0.5"></div>

        {/* Endüstriyel Pencere Kontrolleri */}
        <div className="flex items-center gap-1">
          {/* Simge Durumuna Küçült */}
          <button 
            onClick={handleKucult}
            className="w-8 h-8 flex items-center justify-center text-surface-400 hover:text-white hover:bg-[#151B2B] border border-transparent hover:border-[#1E2436] rounded-lg touch-feedback"
            title="Küçült"
            aria-label="Küçült"
          >
            <Minus size={16} />
          </button>

          {/* Tam Ekran / Büyüt */}
          <button 
            onClick={handleTamEkran}
            className="w-8 h-8 flex items-center justify-center text-surface-400 hover:text-white hover:bg-[#151B2B] border border-transparent hover:border-[#1E2436] rounded-lg touch-feedback"
            title="Tam Ekran"
            aria-label="Tam Ekran"
          >
            {tamEkran ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>

          {/* Uygulamayı Gizle / Tepsiye Küçült */}
          <button 
            onClick={handleKapat}
            className="w-8 h-8 flex items-center justify-center text-surface-400 hover:text-white hover:bg-rose-600 border border-transparent hover:border-rose-500 rounded-lg touch-feedback transition-colors"
            title="Arka Plana Gizle (Tepsiye Küçült)"
            aria-label="Arka Plana Gizle"
          >
            <X size={17} />
          </button>
        </div>
      </div>
    </header>
  )
}

