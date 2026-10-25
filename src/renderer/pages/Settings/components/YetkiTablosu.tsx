import React, { useEffect, useState } from 'react'
import { Lock, ShieldCheck } from 'lucide-react'
import { clsx } from 'clsx'
import { ipcInvoke } from '../../../hooks/useIPC'
import { useToast } from '../../../components/ui/Toast'
import { PERSONEL_KANALLARI } from '../../../../common/ipc-channels'
import { YETKI_ETIKETLERI, DUZENLENEBILIR_ROLLER } from '../../../../common/yetkiler'

type YetkiSatiri = { id: number; rol: string; modul: string; islem: string; izin: number }

/**
 * Rol × işlem yetki tablosu. İzni olmayan personel bu işlemleri yönetici PIN'iyle yapabilir.
 */
export default function YetkiTablosu() {
  const { error } = useToast()
  const [satirlar, setSatirlar] = useState<Record<string, YetkiSatiri>>({})
  const [kaydediliyor, setKaydediliyor] = useState<number | null>(null)

  const yukle = async () => {
    const harita: Record<string, YetkiSatiri> = {}
    for (const { rol } of DUZENLENEBILIR_ROLLER) {
      const liste = await ipcInvoke<YetkiSatiri[]>(PERSONEL_KANALLARI.YETKILERI_GETIR, rol)
      for (const y of liste || []) harita[`${y.rol}:${y.modul}/${y.islem}`] = y
    }
    setSatirlar(harita)
  }

  useEffect(() => { yukle().catch((e) => error('Yetkiler yüklenemedi', e.message)) }, [])

  const degistir = async (satir: YetkiSatiri) => {
    setKaydediliyor(satir.id)
    try {
      const res = await ipcInvoke<any>(PERSONEL_KANALLARI.YETKI_GUNCELLE, satir.id, satir.izin !== 1)
      if (!res?.basarili) return error('Değiştirilemedi', res?.hata)
      await yukle()
    } finally {
      setKaydediliyor(null)
    }
  }

  return (
    <div className="bg-[#171410] rounded-2xl border border-[#322C26] p-5 shadow-xl">
      <h3 className="font-semibold text-white text-sm flex items-center gap-2">
        <ShieldCheck size={16} className="text-brand-400" /> Rol Yetkileri
      </h3>
      <p className="text-xs text-surface-400 mt-1">
        İzni kapalı olan personel bu işlemleri yapmak istediğinde ekranda yönetici PIN'i istenir.
        Onaylar denetim kaydına yazılır.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-surface-400">
              <th className="text-left font-semibold py-2 pr-3">İşlem</th>
              <th className="font-semibold py-2 px-2">Yönetici</th>
              {DUZENLENEBILIR_ROLLER.map((r) => (
                <th key={r.rol} className="font-semibold py-2 px-2">{r.ad}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(YETKI_ETIKETLERI).map(([anahtar, etiket]) => (
              <tr key={anahtar} className="border-t border-[#1E1A16]">
                <td className="py-2.5 pr-3 text-surface-200">{etiket}</td>
                <td className="py-2.5 px-2 text-center">
                  <Lock size={12} className="inline text-surface-500" aria-label="Her zaman açık" />
                </td>
                {DUZENLENEBILIR_ROLLER.map(({ rol }) => {
                  const satir = satirlar[`${rol}:${anahtar}`]
                  const acik = satir?.izin === 1
                  return (
                    <td key={rol} className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        disabled={!satir || kaydediliyor === satir.id}
                        onClick={() => satir && degistir(satir)}
                        aria-pressed={acik}
                        className={clsx(
                          'h-7 w-12 rounded-full border text-[10px] font-bold transition-colors disabled:opacity-40',
                          acik
                            ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                            : 'bg-[#110F0C] border-[#3A342C] text-surface-500'
                        )}
                      >
                        {acik ? 'AÇIK' : 'ONAY'}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
