import React, { useEffect, useState } from 'react'
import { MonitorSmartphone, GraduationCap, RefreshCw } from 'lucide-react'
import { ipcInvoke } from '../../../hooks/useIPC'
import { TERMINAL_KANALLARI, AG_KANALLARI } from '../../../../common/ipc-channels'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/Toast'
import { useTerminalStore } from '../../../stores/useTerminalStore'

export default function TerminalSettings() {
  const { success, error, info } = useToast()
  const { yukle: storeYukle } = useTerminalStore()
  const [ayar, setAyar] = useState<any>(null)
  const [rol, setRol] = useState<'ana' | 'ikinci'>('ana')
  const [anaUrl, setAnaUrl] = useState('')
  const [lanToken, setLanToken] = useState('')
  const [egitim, setEgitim] = useState(false)
  const [yerelIp, setYerelIp] = useState('')
  const [testSonuc, setTestSonuc] = useState('')

  const yukle = async () => {
    const t = await ipcInvoke<any>(TERMINAL_KANALLARI.GETIR)
    setAyar(t)
    setRol(t.rol || 'ana')
    setAnaUrl(t.anaUrl || '')
    setLanToken(t.lanToken || '')
    setEgitim(Boolean(t.egitim))
    try {
      const ipRes = await ipcInvoke<any>(AG_KANALLARI.YEREL_IP_GETIR)
      setYerelIp(ipRes?.ip || '')
    } catch {
      // yok say
    }
  }

  useEffect(() => { yukle() }, [])

  const kaydet = async (yenidenBaslat: boolean) => {
    if (rol === 'ikinci' && !anaUrl) {
      error('Eksik', 'İkinci kasa için ana kasa adresi gerekli')
      return
    }
    const res = await ipcInvoke<any>(TERMINAL_KANALLARI.KAYDET, {
      rol, anaUrl, lanToken, egitim: rol === 'ikinci' ? false : egitim, yenidenBaslat,
    })
    if (!res?.basarili) return error('Hata', res?.hata)
    await storeYukle()
    if (yenidenBaslat) info('Yeniden başlatılıyor', 'Yeni mod uygulanıyor')
    else success('Kaydedildi', 'Değişiklikler bir sonraki açılışta da kalır')
    yukle()
  }

  const testEt = async () => {
    setTestSonuc('deneniyor…')
    const res = await ipcInvoke<any>(TERMINAL_KANALLARI.BAGLANTI_TEST, anaUrl, lanToken)
    setTestSonuc(res?.basarili ? `Bağlandı: ${res.ping?.isletme || 'ana kasa'}` : (res?.hata || 'başarısız'))
  }

  if (!ayar) return <div className="text-surface-400 font-mono text-sm">Yükleniyor…</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <MonitorSmartphone size={18} className="text-brand-400" /> Terminal & İkinci Kasa
        </h2>
        <p className="text-xs text-surface-400 mt-1 font-mono">
          Bu cihaz: {ayar.terminalId} · LAN API 3847
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setRol('ana')}
          className={`p-4 rounded-xl border text-left ${rol === 'ana' ? 'border-brand-500 bg-brand-950/40' : 'border-[#322C26] bg-[#110F0C]'}`}
        >
          <div className="font-semibold">Ana kasa</div>
          <div className="text-[11px] text-surface-400 mt-1">SQLite burada. Diğer kasa bu PC’ye bağlanır.</div>
        </button>
        <button
          onClick={() => setRol('ikinci')}
          className={`p-4 rounded-xl border text-left ${rol === 'ikinci' ? 'border-cyan-500 bg-cyan-950/30' : 'border-[#322C26] bg-[#110F0C]'}`}
        >
          <div className="font-semibold">İkinci kasa</div>
          <div className="text-[11px] text-surface-400 mt-1">Aynı ağdaki başka PC. Veri ana kasadan gelir.</div>
        </button>
      </div>

      {rol === 'ana' && (
        <div className="bg-[#110F0C] border border-[#322C26] rounded-xl p-4 space-y-2 text-sm">
          <div>İkinci kasanın gireceği adres:</div>
          <div className="font-mono text-brand-300">http://{yerelIp || 'BU-PC-IP'}:3847</div>
          <div className="text-surface-400 text-xs">LAN jetonu (ikinci kasaya aynen yazın)</div>
          <input value={lanToken} onChange={(e) => setLanToken(e.target.value)} className="w-full h-10 px-3 rounded-lg bg-[#0B0A08] border border-[#322C26] font-mono text-sm" />
        </div>
      )}

      {rol === 'ikinci' && (
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase text-surface-400">Ana kasa adresi</label>
          <input value={anaUrl} onChange={(e) => setAnaUrl(e.target.value)} placeholder="http://192.168.1.10:3847"
            className="w-full h-11 px-3 rounded-xl bg-[#0B0A08] border border-[#322C26] font-mono" />
          <label className="text-[11px] font-mono uppercase text-surface-400">LAN jetonu</label>
          <input value={lanToken} onChange={(e) => setLanToken(e.target.value)}
            className="w-full h-11 px-3 rounded-xl bg-[#0B0A08] border border-[#322C26] font-mono" />
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={testEt}>Bağlantıyı dene</Button>
            {testSonuc && <span className="text-xs font-mono text-surface-300">{testSonuc}</span>}
          </div>
        </div>
      )}

      <div className="bg-[#110F0C] border border-[#322C26] rounded-xl p-4">
        <div className="flex items-center gap-2 font-semibold">
          <GraduationCap size={16} className="text-amber-400" /> Eğitim modu
        </div>
        <p className="text-xs text-surface-400 mt-1">
          Ayrı <span className="font-mono">egitim.sqlite</span> dosyası. Rapor ve ciro gerçek kasaya karışmaz. Değişiklik uygulamayı yeniden başlatır.
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={egitim}
            disabled={rol === 'ikinci'}
            onChange={(e) => setEgitim(e.target.checked)}
          />
          Eğitim modunu aç {rol === 'ikinci' && <span className="text-surface-500">(ikinci kasada yok)</span>}
        </label>
      </div>

      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => kaydet(false)}>Kaydet</Button>
        <Button leftIcon={<RefreshCw size={14} />} onClick={() => kaydet(true)}>Kaydet ve yeniden başlat</Button>
      </div>
    </div>
  )
}
