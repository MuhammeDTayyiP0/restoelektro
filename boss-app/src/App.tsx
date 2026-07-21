import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, BarChart3 } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import LiveSales from './pages/LiveSales'
import Reports from './pages/Reports'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 md:pl-64 flex flex-col">
        
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-slate-900 border-r border-slate-800 z-50 shadow-xl">
          <div className="p-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Resto Boss</h1>
            <p className="text-slate-400 text-sm mt-1">Yönetim Paneli</p>
          </div>
          <nav className="flex-1 px-4 space-y-2 mt-4">
            <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Özet" desktop />
            <NavItem to="/livesales" icon={<Users size={20} />} label="Canlı Masalar" desktop />
            <NavItem to="/reports" icon={<BarChart3 size={20} />} label="Raporlar" desktop />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden p-4 md:p-8 pt-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/livesales" element={<LiveSales />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-lg border-t border-slate-200 z-50 flex items-center justify-around h-16 px-2 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
          <NavItem to="/" icon={<LayoutDashboard size={24} />} label="Özet" />
          <NavItem to="/livesales" icon={<Users size={24} />} label="Masalar" />
          <NavItem to="/reports" icon={<BarChart3 size={24} />} label="Raporlar" />
        </nav>

      </div>
    </Router>
  )
}

function NavItem({ to, icon, label, desktop = false }: { to: string, icon: React.ReactNode, label: string, desktop?: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        desktop
          ? `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              isActive 
                ? 'bg-blue-600/20 text-blue-400 font-medium' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`
          : `flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300 ${
              isActive 
                ? 'text-blue-600' 
                : 'text-slate-400 hover:text-slate-600'
            }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`${isActive && !desktop ? 'scale-110 -translate-y-1' : ''} transition-transform duration-300`}>
            {icon}
          </div>
          <span className={`${desktop ? 'text-base' : 'text-[10px]'} ${isActive ? 'font-semibold' : 'font-medium'}`}>
            {label}
          </span>
          {/* Mobile Active Dot Indicator */}
          {!desktop && isActive && (
            <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-blue-600" />
          )}
        </>
      )}
    </NavLink>
  )
}
