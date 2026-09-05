import React, { useEffect, useState } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import { initTema } from './stores/useUIStore'
import { useIPCListener, ipcInvoke } from './hooks/useIPC'
import { yazdirMutfak } from './utils/print.utils'
import { AYAR_KANALLARI } from '../common/ipc-channels'
import AutoLaunchModal from './components/modals/AutoLaunchModal'

// Sayfalar ve Layoutlar
import LoginPage from './pages/Login/LoginPage'
import { MainLayout } from './components/layout/MainLayout'
import { PosLayout } from './components/layout/PosLayout'
import PosPage from './pages/POS/PosPage'
import TablesPage from './pages/Tables/TablesPage'
import KitchenScreen from './pages/Kitchen/KitchenScreen'
import InventoryPage from './pages/Inventory/InventoryPage'
import CustomerPage from './pages/Customers/CustomerPage'
import ReportsPage from './pages/Reports/ReportsPage'
import SettingsPage from './pages/Settings/SettingsPage'

/**
 * Ana Uygulama Bileşeni
 * HashRouter kullanımı Electron uygulamaları için zorunludur (file:// protokolü ile çalışırken)
 */
export default function App() {
  const [autoLaunchModalAcik, setAutoLaunchModalAcik] = useState(false)

  // Uygulama başlarken temayı yükle ve ilk açılışta otomatik başlatma tercihini kontrol et
  useEffect(() => {
    initTema()

    const sorulduMu = localStorage.getItem('etibol_auto_launch_prompted')
    if (!sorulduMu) {
      const timer = setTimeout(() => {
        setAutoLaunchModalAcik(true)
      }, 1200)
      return () => clearTimeout(timer)
    }
  }, [])

  // Arka planda gelen (örneğin Garson modülünden) mutfak yazdırma isteklerini dinle
  useIPCListener('mutfak:yazdir-istek', async (siparisler: any[], masaNo: string, iptaller: any[] = []) => {
    try {
      const mutfakYazici = await ipcInvoke<string>(AYAR_KANALLARI.GETIR, 'mutfak_yazici')
      if (mutfakYazici) {
        yazdirMutfak(siparisler, masaNo, mutfakYazici, iptaller)
      }
    } catch (err) {
      console.error('Arka plan mutfak yazdırma hatası:', err)
    }
  })

  return (
    <ToastProvider>
      <HashRouter>
        <div className="w-screen h-screen overflow-hidden select-none bg-[#090A0F] font-sans text-surface-100 selection:bg-brand-500/30">
          <Routes>
            {/* Kök dizin kontrolü */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* Giriş Ekranı */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* POS Modülü (Tam ekran genişlik, sidebar yok) */}
            <Route element={<PosLayout />}>
              <Route path="/pos/:hesapId?" element={<PosPage />} />
            </Route>

            {/* Standart Modüller (Sidebar ve Header ile) */}
            <Route element={<MainLayout />}>
              <Route path="/tables" element={<TablesPage />} />
              <Route path="/kitchen" element={<KitchenScreen />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/customers" element={<CustomerPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            
            {/* Bulunamayan rotalar */}
            <Route path="*" element={<Navigate to="/tables" replace />} />
          </Routes>

          {/* İlk Açılışta Windows Başlangıcında Otomatik Başlatma Modalı */}
          <AutoLaunchModal
            isOpen={autoLaunchModalAcik}
            onClose={() => setAutoLaunchModalAcik(false)}
          />
        </div>
      </HashRouter>
    </ToastProvider>
  )
}
