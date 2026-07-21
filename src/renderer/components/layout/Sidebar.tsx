import React from 'react'
import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import { 
  LayoutDashboard, 
  MonitorPlay, 
  ChefHat, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut 
} from 'lucide-react'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUIStore } from '../../stores/useUIStore'

export function Sidebar() {
  const { cikisYap, personel } = useAuthStore()
  const { sidebarAcik, sidebarTetikle } = useUIStore()

  // Yetkilere göre menü öğeleri
  const navItems = [
    { to: '/tables', icon: <LayoutDashboard size={24} />, label: 'Masalar', allowedRoles: ['admin', 'mudur', 'kasiyer', 'garson'] },
    { to: '/pos', icon: <MonitorPlay size={24} />, label: 'POS', allowedRoles: ['admin', 'mudur', 'kasiyer', 'garson'] },
    { to: '/kitchen', icon: <ChefHat size={24} />, label: 'Mutfak', allowedRoles: ['admin', 'mutfak'] },
    { to: '/inventory', icon: <Package size={24} />, label: 'Stok & Menü', allowedRoles: ['admin', 'mudur'] },
    { to: '/customers', icon: <Users size={24} />, label: 'Müşteriler', allowedRoles: ['admin', 'mudur', 'kasiyer', 'garson'] },
    { to: '/reports', icon: <BarChart3 size={24} />, label: 'Raporlar', allowedRoles: ['admin', 'mudur', 'kasiyer'] },
    { to: '/settings', icon: <Settings size={24} />, label: 'Ayarlar', allowedRoles: ['admin', 'mudur'] },
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => sidebarTetikle(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 flex flex-col w-24 lg:w-28 bg-surface-800 text-white transition-transform duration-300 ease-in-out shadow-pos border-r border-surface-700',
          sidebarAcik ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo Alanı */}
        <div className="h-20 flex items-center justify-center border-b border-surface-700">
          <div className="w-14 h-14 bg-brand-500 rounded-pos-lg flex items-center justify-center text-pos-xl font-bold">
            ER
          </div>
        </div>

        {/* Navigasyon Linkleri */}
        <nav className="flex-1 overflow-y-auto pos-scrollbar py-4 flex flex-col gap-2 px-3">
          {filteredItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => sidebarTetikle(false)}
              className={({ isActive }) => clsx(
                'flex flex-col items-center justify-center gap-1.5 p-3 rounded-pos transition-colors h-24 touch-feedback',
                isActive 
                  ? 'bg-brand-500 text-white' 
                  : 'text-surface-300 hover:bg-surface-700 hover:text-white'
              )}
            >
              {item.icon}
              <span className="text-xs font-medium text-center">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Alt Alan (Çıkış vb.) */}
        <div className="p-3 border-t border-surface-700">
          <button
            onClick={handleLogout}
            className="w-full flex flex-col items-center justify-center gap-1.5 p-3 rounded-pos text-surface-400 hover:bg-red-500/20 hover:text-red-500 transition-colors h-20 touch-feedback"
          >
            <LogOut size={24} />
            <span className="text-xs font-medium">Çıkış</span>
          </button>
        </div>
      </aside>
    </>
  )
}
