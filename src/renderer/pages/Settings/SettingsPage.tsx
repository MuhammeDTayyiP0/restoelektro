import React, { useState } from 'react'
import { 
  Settings as SettingsIcon, 
  Users, 
  BookOpen, 
  LayoutGrid, 
  Printer, 
  QrCode, 
  Database,
  Sliders,
  MonitorSmartphone
} from 'lucide-react'
import StaffSettings from './components/StaffSettings'
import GeneralSettings from './components/GeneralSettings'
import MenuSettings from './components/MenuSettings'
import TableSettings from './components/TableSettings'
import PrinterTemplateSettings from './components/PrinterTemplateSettings'
import QRMenuSettings from './components/QRMenuSettings'
import BackupLicenseSettings from './components/BackupLicenseSettings'
import TerminalSettings from './components/TerminalSettings'
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
    { id: 'terminal', label: 'Terminal & Eğitim', icon: <MonitorSmartphone size={18} />, desc: 'İkinci kasa, LAN ve eğitim modu' },
  ]

  return (
    <div className="flex flex-col h-full w-full bg-[#0B0A08] text-surface-100 p-2 sm:p-4 lg:p-6 overflow-hidden select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-5 shrink-0 pb-3 sm:pb-4 border-b border-[#322C26]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#1e1a16] border border-[#322C26] flex items-center justify-center text-brand-400 shadow-md">
            <SettingsIcon size={20} className="sm:w-[22px] sm:h-[22px]" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Sistem & Donanım Ayarları
            </h1>
            <p className="text-[11px] sm:text-xs text-surface-400 mt-0.5 font-mono">
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
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row bg-[#171410] rounded-2xl border border-[#322C26] overflow-hidden shadow-2xl">
        
        {/* Sol Kategori Menüsü */}
        <div className="w-full lg:w-60 xl:w-72 bg-[#110F0C] border-b lg:border-b-0 lg:border-r border-[#322C26] p-2 sm:p-3 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-y-auto shrink-0 pos-scrollbar">
          <div className="hidden lg:block px-3 py-1.5 text-[10px] font-bold text-surface-500 uppercase tracking-wider font-mono">
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
                  "flex items-center gap-2.5 sm:gap-3 px-3 py-2.5 sm:px-3.5 sm:py-3 rounded-xl text-left transition-all duration-150 shrink-0 lg:w-full",
                  isActive
                    ? "bg-brand-950/50 text-white border border-brand-500/50 shadow-md shadow-brand-950/40"
                    : "text-surface-400 hover:text-surface-200 hover:bg-[#1e1a16] border border-transparent"
                )}
              >
                <div className={clsx(
                  "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 border transition-colors",
                  isActive
                    ? "bg-brand-600 border-brand-400 text-white"
                    : "bg-[#1e1a16] border-[#322C26] text-surface-400"
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
        <div className={clsx(
          "flex-1 min-h-0 bg-[#171410] flex flex-col",
          activeTab === 'menu'
            ? "overflow-hidden p-1.5 sm:p-3"
            : "overflow-y-auto p-4 sm:p-6 lg:p-8 pos-scrollbar"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="h-full flex flex-col min-h-0"
            >
              {activeTab === 'templates' && <PrinterTemplateSettings />}
              {activeTab === 'tables' && <TableSettings />}
              {activeTab === 'general' && <GeneralSettings />}
              {activeTab === 'backup' && <BackupLicenseSettings />}
              {activeTab === 'staff' && <StaffSettings />}
              {activeTab === 'menu' && <MenuSettings />}
              {activeTab === 'qrmenu' && <QRMenuSettings />}
              {activeTab === 'terminal' && <TerminalSettings />}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}

