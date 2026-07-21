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
    <div className="flex flex-col w-full h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        
        {/* Ana İçerik Alanı */}
        <main className="flex-1 relative overflow-hidden flex flex-col bg-surface-100 dark:bg-surface-950/50">
          <div className="flex-1 overflow-y-auto pos-scrollbar p-4 lg:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
