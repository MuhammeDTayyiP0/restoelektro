import React from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { useAuthStore } from '../../stores/useAuthStore'

export function MainLayout() {
  const { girisYapildi } = useAuthStore()

  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  if (!girisYapildi) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex flex-col w-screen h-screen bg-[#090A0F] text-surface-100 overflow-hidden select-none">
      <Header />
      
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        
        {/* Ana İçerik Alanı */}
        <main className="flex-1 min-h-0 relative overflow-hidden flex flex-col bg-[#090A0F]">
          <div className="flex-1 min-h-0 overflow-y-auto pos-scrollbar p-3 sm:p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

