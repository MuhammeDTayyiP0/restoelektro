import React, { useState } from 'react'
import { Tabs } from '../../components/ui/Tabs'
import { Settings as SettingsIcon, Users, BookOpen, LayoutGrid, Printer } from 'lucide-react'
import StaffSettings from './components/StaffSettings'
import GeneralSettings from './components/GeneralSettings'
import MenuSettings from './components/MenuSettings'
import TableSettings from './components/TableSettings'
import PrinterTemplateSettings from './components/PrinterTemplateSettings'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('menu') // Default to menu for now

  return (
    <div className="flex flex-col h-full w-full bg-surface-50 dark:bg-surface-950 p-6 overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 shrink-0">
        <div className="w-12 h-12 rounded-pos bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 className="text-pos-2xl font-bold text-surface-900 dark:text-white">Ayarlar</h1>
          <p className="text-surface-500 text-sm mt-1">Sistem, personel, menü ve masa yönetimi</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-surface-900 rounded-pos-lg shadow-sm border border-surface-200 dark:border-surface-800 overflow-hidden">
        <div className="p-4 border-b border-surface-200 dark:border-surface-800 shrink-0">
          <Tabs 
            activeTabId={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'menu', label: 'Menü Yönetimi', icon: <BookOpen size={18} /> },
              { id: 'tables', label: 'Masa Düzeni', icon: <LayoutGrid size={18} /> },
              { id: 'staff', label: 'Personeller', icon: <Users size={18} /> },
              { id: 'templates', label: 'Fiş Tasarımı', icon: <Printer size={18} /> },
              { id: 'general', label: 'Genel Ayarlar', icon: <SettingsIcon size={18} /> }
            ]}
          />
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 pos-scrollbar">
          { activeTab === 'menu' && <MenuSettings /> }
          { activeTab === 'tables' && <TableSettings /> }
          { activeTab === 'staff' && <StaffSettings /> }
          { activeTab === 'templates' && <PrinterTemplateSettings /> }
          { activeTab === 'general' && <GeneralSettings /> }
        </div>
      </div>
    </div>
  )
}
