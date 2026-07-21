import React from 'react'
import { Outlet, Navigate, useNavigate } from 'react-router-dom'
import { ArrowLeft, Clock, Menu, Wifi, WifiOff } from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUIStore } from '../../stores/useUIStore'

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
    <div className="flex flex-col w-full h-screen bg-surface-100 dark:bg-surface-900 overflow-hidden select-none">
      {/* Özel POS Header - Dar ve Sadece gerekli bilgileri içerir */}
      <header className="h-14 bg-surface-800 text-white flex items-center justify-between px-3 shadow-md z-10 shrink-0">
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/tables')}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-700 hover:bg-surface-600 rounded-pos transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="font-medium hidden sm:inline">Masalara Dön</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-surface-900/50 px-3 py-1 rounded-full">
            <Clock size={16} className="text-brand-400" />
            <span className="font-mono font-medium">
              {zaman.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1 bg-surface-900/50 rounded-full">
            <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold">
              {personel?.ad?.charAt(0)}{personel?.soyad?.charAt(0)}
            </div>
            <span className="font-medium text-sm hidden sm:inline">{personel?.ad} {personel?.soyad}</span>
          </div>
          
          <div className="hidden sm:block">
            {online ? <Wifi size={18} className="text-green-400" /> : <WifiOff size={18} className="text-red-400" />}
          </div>
        </div>
      </header>

      {/* POS İçeriği - Tam genişlik ve yükseklik */}
      <main className="flex-1 flex overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
