import React from 'react'
import { Menu, Wifi, Battery, Clock, WifiOff, Maximize, Minimize, Moon, Sun, X } from 'lucide-react'
import { useUIStore } from '../../stores/useUIStore'
import { useAuthStore } from '../../stores/useAuthStore'

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

  const handleKapat = async () => {
    // @ts-ignore
    await window.api.pencere.kapat()
  }

  return (
    <header className="h-16 bg-white dark:bg-surface-900 border-b border-surface-200 dark:border-surface-800 flex items-center justify-between px-4 no-select" style={{ WebkitAppRegion: 'drag' } as any}>
      {/* Sol Taraf */}
      <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <button 
          onClick={() => sidebarTetikle()}
          className="p-2 lg:hidden text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-pos touch-feedback"
        >
          <Menu size={28} />
        </button>
        
        <h1 className="text-pos-lg font-bold text-surface-900 dark:text-white hidden sm:block">
          ETİBOL <span className="text-brand-500">RESTO</span>
        </h1>
      </div>

      {/* Orta Taraf - Saat */}
      <div className="flex items-center gap-2 bg-surface-100 dark:bg-surface-800 px-4 py-1.5 rounded-full">
        <Clock size={18} className="text-brand-500" />
        <span className="font-mono text-pos-base font-medium text-surface-900 dark:text-white">
          {zaman.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      {/* Sağ Taraf - Durum ve Kontroller */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
        
        {/* Kullanıcı */}
        <div className="hidden md:flex items-center gap-2 mr-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold">
            {personel?.ad?.charAt(0)}{personel?.soyad?.charAt(0)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-tight">{personel?.ad} {personel?.soyad}</span>
            <span className="text-xs text-surface-500 leading-tight capitalize">{personel?.rol}</span>
          </div>
        </div>

        {/* Ağ Durumu */}
        <div className="p-2 rounded-full">
          {online ? (
            <Wifi size={20} className="text-green-500" />
          ) : (
            <WifiOff size={20} className="text-red-500" />
          )}
        </div>

        <div className="h-6 w-px bg-surface-300 dark:bg-surface-700 mx-1"></div>

        {/* Tema Değiştirme */}
        <button 
          onClick={temaDegistir}
          className="p-2 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full touch-feedback"
        >
          {karanlikTema ? <Sun size={22} /> : <Moon size={22} />}
        </button>

        {/* Tam Ekran */}
        <button 
          onClick={handleTamEkran}
          className="p-2 text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-full touch-feedback hidden sm:block"
        >
          {tamEkran ? <Minimize size={22} /> : <Maximize size={22} />}
        </button>

        {/* Uygulamayı Kapat */}
        <button 
          onClick={handleKapat}
          className="p-2 text-surface-600 dark:text-surface-300 hover:bg-red-500 hover:text-white rounded-full touch-feedback"
        >
          <X size={24} />
        </button>
      </div>
    </header>
  )
}
