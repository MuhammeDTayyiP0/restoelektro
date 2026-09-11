import React, { useEffect } from 'react'
import { GraduationCap, MonitorSmartphone } from 'lucide-react'
import { useTerminalStore } from '../../stores/useTerminalStore'

export function TerminalBanner() {
  const { ayar, yukle } = useTerminalStore()

  useEffect(() => {
    yukle()
  }, [yukle])

  if (!ayar) return null
  if (!ayar.egitim && ayar.rol !== 'ikinci') return null

  if (ayar.egitim) {
    return (
      <div className="h-8 shrink-0 bg-amber-600 text-[#1A120C] flex items-center justify-center gap-2 px-3 text-[11px] font-bold tracking-wide font-mono">
        <GraduationCap size={14} />
        EĞİTİM MODU — işlemler gerçek kasa verisine yazılmaz (egitim.sqlite)
      </div>
    )
  }

  return (
    <div className="h-8 shrink-0 bg-cyan-800 text-cyan-50 flex items-center justify-center gap-2 px-3 text-[11px] font-bold tracking-wide font-mono">
      <MonitorSmartphone size={14} />
      İKİNCİ KASA — {ayar.anaUrl || 'ana kasa adresi yok'}
    </div>
  )
}
