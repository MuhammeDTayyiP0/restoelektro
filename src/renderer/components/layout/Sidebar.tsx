import React from 'react'
import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { 
  LayoutDashboard, 
  ChefHat, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Utensils
} from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUIStore } from '../../stores/useUIStore'
import { UpdateWidget } from './UpdateWidget'

export function Sidebar() {
  const { cikisYap, personel } = useAuthStore()
  const { sidebarAcik, sidebarTetikle } = useUIStore()

  // Yetkilere göre menü öğeleri
  const navItems = [
    { to: '/tables', icon: LayoutDashboard, label: 'Masalar', allowedRoles: ['admin', 'mudur', 'kasiyer', 'garson'] },
    { to: '/kitchen', icon: ChefHat, label: 'Mutfak', allowedRoles: ['admin', 'mutfak'] },
    { to: '/inventory', icon: Package, label: 'Stok & Menü', allowedRoles: ['admin', 'mudur'] },
    { to: '/customers', icon: Users, label: 'Müşteriler', allowedRoles: ['admin', 'mudur', 'kasiyer', 'garson'] },
    { to: '/reports', icon: BarChart3, label: 'Raporlar', allowedRoles: ['admin', 'mudur', 'kasiyer'] },
    { to: '/settings', icon: Settings, label: 'Ayarlar', allowedRoles: ['admin', 'mudur'] },
  ]

  const filteredItems = navItems.filter(item => 
    personel?.rol && item.allowedRoles.includes(personel.rol)
  )

  const handleLogout = () => {
    cikisYap()
  }

  return (
    <>
      {/* Mobil Overlay */}
      {sidebarAcik && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => sidebarTetikle(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-24 lg:w-26 bg-[#0B0E17] text-surface-200 transition-transform duration-300 ease-in-out border-r border-[#1E2436] select-none shadow-2xl',
          sidebarAcik ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Alanı */}
        <div className="h-18 flex flex-col items-center justify-center border-b border-[#1A1F30] px-2 relative">
          <div className="w-11 h-11 rounded-xl bg-[#141928] border border-brand-500/40 flex items-center justify-center text-white font-mono font-bold text-lg shadow-md shadow-brand-950/50 relative">
            <span className="text-brand-400">ER</span>
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 status-beacon-green" />
          </div>
          <span className="text-[10px] font-mono font-semibold tracking-wider text-surface-400 mt-1 uppercase">
            ETİBOL POS
          </span>
        </div>

        {/* Navigasyon Linkleri */}
        <nav className="flex-1 overflow-y-auto pos-scrollbar py-3 flex flex-col gap-1.5 px-2">
          {filteredItems.map((item) => {
            const IconComponent = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => sidebarTetikle(false)}
                className={({ isActive }) => clsx(
                  'group relative flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl transition-all duration-150 touch-feedback min-h-[64px]',
                  isActive 
                    ? 'bg-[#151D33] text-white shadow-md shadow-brand-950/40 border border-brand-500/40' 
                    : 'text-surface-400 hover:text-surface-100 hover:bg-[#121624] border border-transparent'
                )}
              >
                {({ isActive }) => (
                  <>
                    {/* Aktif sol dikey neon çizgi */}
                    {isActive && (
                      <span className="absolute left-0 inset-y-2 w-1 rounded-r-full bg-brand-500 status-beacon-blue" />
                    )}
                    <IconComponent 
                      size={22} 
                      className={clsx(
                        'transition-transform duration-150 group-hover:scale-110',
                        isActive ? 'text-brand-400' : 'text-surface-400 group-hover:text-surface-200'
                      )} 
                    />
                    <span className={clsx(
                      'text-[11px] font-semibold tracking-tight text-center leading-none',
                      isActive ? 'text-white' : 'text-surface-400 group-hover:text-surface-200'
                    )}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Alt Alan — Güncelleme Modülü & Çıkış Butonu */}
        <div className="p-2 border-t border-[#1A1F30] flex flex-col items-center gap-2">
          {/* Güncelleme Durum Rozeti ve Popover */}
          <UpdateWidget />

          <button
            onClick={handleLogout}
            className="w-full flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl text-surface-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/50 transition-all duration-150 touch-feedback"
            title="Güvenli Çıkış"
            aria-label="Güvenli Çıkış"
          >
            <LogOut size={18} className="text-rose-400" />
            <span className="text-[10px] font-semibold tracking-wider uppercase">Çıkış</span>
          </button>
        </div>
      </aside>
    </>
  )
}


