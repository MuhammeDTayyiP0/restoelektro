import React, { useState } from 'react'
import { 
  Settings as SettingsIcon, 
  Users, 
  BookOpen, 
  LayoutGrid, 
  Printer, 
  QrCode, 
  Database,
  Sliders
} from 'lucide-react'
import StaffSettings from './components/StaffSettings'
import GeneralSettings from './components/GeneralSettings'
import MenuSettings from './components/MenuSettings'
import TableSettings from './components/TableSettings'
import PrinterTemplateSettings from './components/PrinterTemplateSettings'
import QRMenuSettings from './components/QRMenuSettings'
import BackupLicenseSettings from './components/BackupLicenseSettings'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('templates')

  const categories = [
    { id: 'templates', label: 'Yazıcı & Fiş Tasarımı', icon: <Printer size={18} />, desc: 'Termal adisyon & mutfak şablonları' },
    { id: 'tables', label: 'Masa Düzeni', icon: <LayoutGrid size={18} />, desc: 'Bölümler ve masa krokisi' },
    { id: 'general', label: 'İşletme & Donanım', icon: <Sliders size={18} />, desc: 'Yazıcı portları & restoran künyesi' },
    { id: 'backup', label: 'Veritabanı & Lisans', icon: <Database size={18} />, desc: 'SQLite yedeği & sistem durumu' },
    { id: 'staff', label: 'Personeller & Yetkiler', icon: <Users size={18} />, desc: 'Kullanıcılar ve PIN kodları' },
    { id: 'menu', label: 'Menü Yönetimi', icon: <BookOpen size={18} />, desc: 'Kategoriler, ürünler ve fiyatlar' },
    { id: 'qrmenu', label: 'QR', icon: <QrCode size={18} />, desc: 'Masa, garson ve patron QR kodları' },
  ]

  return (
    <div className="flex flex-col h-full w-full bg-[#090A0F] text-surface-100 p-4 sm:p-6 overflow-hidden select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-5 shrink-0 pb-4 border-b border-[#1A1F30]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#121624] border border-[#1E2538] flex items-center justify-center text-brand-400 shadow-md">
            <SettingsIcon size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Sistem & Donanım Ayarları
            </h1>
            <p className="text-xs text-surface-400 mt-0.5 font-mono">
              Yazıcılar, masalar, personeller, veritabanı ve parametreler
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-surface-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>CONFIG SYNCHRONIZED</span>
        </div>
      </div>

      {/* Ana Çerçeve (Kategori Menüsü + İçerik) */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-[#0E111B] rounded-2xl border border-[#1E2436] overflow-hidden shadow-2xl">
        
        {/* Sol Kategori Menüsü */}
        <div className="w-full lg:w-72 bg-[#090B12] border-b lg:border-b-0 lg:border-r border-[#1A1F30] p-3 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto shrink-0 pos-scrollbar">
          <div className="hidden lg:block px-3 py-2 text-[10px] font-bold text-surface-500 uppercase tracking-wider font-mono">
            Ayar Modülleri
          </div>

          {categories.map((cat) => {
            const isActive = activeTab === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className={clsx(
                  "flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-150 shrink-0 lg:w-full",
                  isActive
                    ? "bg-brand-950/50 text-white border border-brand-500/50 shadow-md shadow-brand-950/40"
                    : "text-surface-400 hover:text-surface-200 hover:bg-[#121522] border border-transparent"
                )}
              >
                <div className={clsx(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                  isActive
                    ? "bg-brand-600 border-brand-400 text-white"
                    : "bg-[#141826] border-[#1E2436] text-surface-400"
                )}>
                  {cat.icon}
                </div>
                <div className="min-w-0 flex-1 hidden sm:block">
                  <div className="text-xs font-semibold truncate leading-snug">
                    {cat.label}
                  </div>
                  <div className="text-[10px] text-surface-500 truncate leading-tight mt-0.5 hidden lg:block">
                    {cat.desc}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Sağ İçerik Alanı */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pos-scrollbar bg-[#0D101A]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === 'templates' && <PrinterTemplateSettings />}
              {activeTab === 'tables' && <TableSettings />}
              {activeTab === 'general' && <GeneralSettings />}
              {activeTab === 'backup' && <BackupLicenseSettings />}
              {activeTab === 'staff' && <StaffSettings />}
              {activeTab === 'menu' && <MenuSettings />}
              {activeTab === 'qrmenu' && <QRMenuSettings />}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}

