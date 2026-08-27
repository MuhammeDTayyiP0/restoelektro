import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, BarChart3 } from 'lucide-react'

import Dashboard from './pages/Dashboard'
import LiveSales from './pages/LiveSales'
import Reports from './pages/Reports'

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#090A0F] text-slate-100 pb-20 md:pb-0 md:pl-64 flex flex-col selection:bg-brand-500 selection:text-white">
        
        {/* Desktop Sidebar (Industrial Dark) */}
        <aside className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-[#0C1017] border-r border-[#1A2234] z-50 shadow-2xl">
          <div className="p-6 border-b border-[#1A2234]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#121724] border border-[#232F47] flex items-center justify-center text-sky-400 font-mono font-black text-lg shadow-sm">
                EB
              </div>
              <div>
                <h1 className="text-base font-mono font-black text-white uppercase tracking-wider flex items-center gap-2">
                  ETİBOL BOSS
                </h1>
                <p className="text-xs font-mono text-slate-400">Yönetici Paneli</p>
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-3 space-y-1.5 mt-4">
            <NavItem to="/" icon={<LayoutDashboard size={19} />} label="Genel Bakış" desktop />
            <NavItem to="/livesales" icon={<Users size={19} />} label="Canlı Masalar" desktop />
            <NavItem to="/reports" icon={<BarChart3 size={19} />} label="Satış Raporları" desktop />
          </nav>

          {/* Footer Status */}
          <div className="p-4 border-t border-[#1A2234] m-3 rounded-2xl bg-[#0E131F] border">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <span className="text-xs font-mono text-slate-300 font-bold">POS Canlı Senkronize</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden p-4 md:p-8 pt-5 max-w-6xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/livesales" element={<LiveSales />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>

        {/* Mobile Bottom Navigation (Glassmorphic Industrial Bar) */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 bg-[#0E121E]/90 backdrop-blur-xl border-t border-[#1E2538] z-50 flex items-center justify-around h-16 px-3 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
          <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Özet" />
          <NavItem to="/livesales" icon={<Users size={20} />} label="Masalar" />
          <NavItem to="/reports" icon={<BarChart3 size={20} />} label="Raporlar" />
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
          ? `flex items-center gap-3 px-4 py-3 rounded-xl font-mono text-xs font-bold transition-all duration-200 ${
              isActive 
                ? 'bg-[#151E30] text-sky-300 border border-sky-500/30 shadow-sm' 
                : 'text-slate-400 hover:bg-[#121724] hover:text-slate-200'
            }`
          : `relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-200 min-h-[48px] ${
              isActive 
                ? 'text-sky-400 font-bold' 
                : 'text-slate-400 hover:text-slate-200'
            }`
      }
    >
      {({ isActive }) => (
        <>
          <div className={`${isActive && !desktop ? 'scale-110 -translate-y-0.5 text-sky-400' : ''} transition-transform duration-200`}>
            {icon}
          </div>
          <span className={`${desktop ? 'text-xs font-bold' : 'text-[10px] font-mono'} ${isActive ? 'font-black' : 'font-medium'}`}>
            {label}
          </span>
          {/* Mobile Active Glow Indicator */}
          {!desktop && isActive && (
            <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38BDF8]" />
          )}
        </>
      )}
    </NavLink>
  )
}

