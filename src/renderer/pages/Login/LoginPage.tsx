import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useToast } from '../../components/ui/Toast'
import { Numpad } from '../../components/ui/Numpad'
import { User, Lock, KeyRound, UserCircle, Radio, Keyboard } from 'lucide-react'
import { ipcInvoke } from '../../hooks/useIPC'
import { PERSONEL_KANALLARI, AG_KANALLARI } from '../../../common/ipc-channels'
import type { GirisYaniti, Personel } from '../../../common/types/staff.types'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { APP_VERSION_TAG } from '../../utils/version'
import { useTerminalStore } from '../../stores/useTerminalStore'
import { WindowControls } from '../../components/layout/WindowControls'

export default function LoginPage() {
  const navigate = useNavigate()
  const { girisYap, girisYapildi } = useAuthStore()
  const { error, success } = useToast()
  const terminalId = useTerminalStore((s) => s.ayar?.terminalId)
  
  const [activeTab, setActiveTab] = useState<'pin' | 'password'>('pin')
  const [pin, setPin] = useState('')
  const [hasPinError, setHasPinError] = useState(false)
  
  const [staffList, setStaffList] = useState<Personel[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Personel | null>(null)
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const pinGonderiliyor = useRef(false)

  const [zaman, setZaman] = useState(() => new Date())
  const [lanIp, setLanIp] = useState('')
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  // Zaten giriş yapmışsa yönlendir
  useEffect(() => {
    if (girisYapildi) {
      navigate('/tables')
    }
  }, [girisYapildi, navigate])

  useEffect(() => {
    const t = setInterval(() => setZaman(new Date()), 1000)
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    ipcInvoke<any>(AG_KANALLARI.YEREL_IP_GETIR)
      .then((res) => {
        if (res?.ip) setLanIp(String(res.ip))
      })
      .catch(() => setLanIp(''))

    return () => {
      clearInterval(t)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Personel listesini yükle (Hızlı profil seçimi için)
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const staff = await ipcInvoke<Personel[]>(PERSONEL_KANALLARI.LISTELE)
        if (Array.isArray(staff)) {
          const activeStaff = staff.filter(s => (s as any).aktif !== 0)
          setStaffList(activeStaff)
        }
      } catch (e) {
        // Liste yüklenemezse manuel PIN girişine devam edilir
      }
    }
    fetchStaff()
  }, [])

  const handlePinSubmit = useCallback(async (p: string, personel?: Personel | null) => {
    if (p.length !== 4 || pinGonderiliyor.current) return
    pinGonderiliyor.current = true
    
    setIsLoading(true)
    try {
      const payload = personel?.id
        ? { pin: p, personel_id: personel.id }
        : p
      const response = await ipcInvoke<GirisYaniti>(PERSONEL_KANALLARI.PIN_GIRIS, payload)
      
      if (response.basarili && response.personel && response.token) {
        setHasPinError(false)
        girisYap(response.personel, response.token)
        success('Giriş Başarılı', `Hoş geldin, ${response.personel.ad}`)
        navigate('/tables')
      } else {
        setHasPinError(true)
        error('Giriş Başarısız', response.hata || 'Geçersiz PIN Kodu')
        setTimeout(() => {
          setPin('')
          setHasPinError(false)
        }, 500)
      }
    } catch (err: any) {
      setHasPinError(true)
      error('Bağlantı Hatası', err.message)
      setTimeout(() => {
        setPin('')
        setHasPinError(false)
      }, 500)
    } finally {
      pinGonderiliyor.current = false
      setIsLoading(false)
    }
  }, [girisYap, success, error, navigate])

  // Pin 4 haneye ulaştığında otomatik gönder
  useEffect(() => {
    if (pin.length === 4 && !isLoading) {
      handlePinSubmit(pin, selectedStaff)
    }
  }, [pin])

  useEffect(() => {
    if (activeTab !== 'pin' || isLoading) return

    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const hedef = e.target as HTMLElement | null
      const etiket = hedef?.tagName
      if (etiket === 'INPUT' || etiket === 'TEXTAREA' || etiket === 'SELECT') return

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        setPin((p) => (p.length < 4 ? p + e.key : p))
        return
      }
      if (e.key === 'Backspace') {
        e.preventDefault()
        setPin((p) => p.slice(0, -1))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (pin.length === 4) handlePinSubmit(pin, selectedStaff)
        return
      }
      if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault()
        setPin('')
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeTab, isLoading, pin, selectedStaff, handlePinSubmit])

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) return
    
    setIsLoading(true)
    try {
      const response = await ipcInvoke<GirisYaniti>(PERSONEL_KANALLARI.GIRIS_YAP, {
        kullanici_adi: username,
        sifre: password
      })
      
      if (response.basarili && response.personel && response.token) {
        girisYap(response.personel, response.token)
        success('Giriş Başarılı', `Hoş geldin, ${response.personel.ad}`)
        navigate('/tables')
      } else {
        error('Giriş Başarısız', response.hata || 'Kullanıcı adı veya şifre hatalı')
      }
    } catch (err: any) {
      error('Bağlantı Hatası', err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-950/40 text-amber-300 border-amber-700/50'
      case 'mudur':
        return 'bg-amber-950/40 text-amber-300 border-amber-700/50'
      case 'kasiyer':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50'
      case 'mutfak':
        return 'bg-orange-950/40 text-orange-300 border-orange-700/50'
      default:
        return 'bg-cyan-950/40 text-cyan-300 border-cyan-700/50'
    }
  }

  const lanAktif = online && lanIp && lanIp !== '127.0.0.1'
  const saatYazi = zaman.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center bg-[#0B0A08] bg-pos-grid text-surface-100 p-4 sm:p-6 lg:p-8 select-none relative overflow-hidden" 
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      <div
        className="absolute top-0 inset-x-0 h-11 flex items-center justify-between px-3 z-50"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="text-[11px] font-mono text-surface-500 pl-1">{APP_VERSION_TAG}</div>
        <WindowControls compact />
      </div>

      {/* Odaklayıcı Merkez Radyal Işığı */}
      <div className="absolute inset-0 bg-pos-radial pointer-events-none" />

      {/* Ana Giriş Kutusu */}
      <div 
        className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 sm:gap-8 items-stretch justify-center relative z-10 mt-6" 
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        
        {/* Sol Panel: Terminal Kimliği & Personel Seçimi */}
        <div className="flex-1 flex flex-col justify-between bg-[#171410] rounded-2xl border border-[#322C26] p-6 sm:p-8 shadow-xl relative overflow-hidden">
          
          {/* Üst İnce Vurgu Çizgisi */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

          <div>
            {/* Logo ve Başlık */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-brand-600 border border-brand-400/25 flex items-center justify-center text-white font-semibold text-2xl shadow-pos relative">
                <span className="tracking-tight">ER</span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 status-beacon-green" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-surface-50 tracking-tight flex items-center gap-2 font-sans">
                  ETİBOL <span className="text-brand-400">RESTO</span>
                </h1>
                <p className="text-[11px] text-surface-400 uppercase tracking-wider font-mono flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 status-beacon-green" />
                  TOUCH POS TERMINAL • {APP_VERSION_TAG}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-surface-400 leading-relaxed mb-6 font-medium">
              Personel kartını seçin, ardından o kişiye ait 4 haneli PIN'i tuşlayın. Kart seçmeden PIN, koda sahip personeli açar.
            </p>

            {/* Hızlı Profil Listesi */}
            {staffList.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">
                  <span className="flex items-center gap-1.5">
                    <UserCircle size={14} className="text-brand-400" />
                    Kayıtlı Personeller
                  </span>
                  <span className="text-surface-500 font-mono text-[11px] bg-[#1e1a16] px-2 py-0.5 rounded-md border border-[#322C26]">
                    {staffList.length} Aktif
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pos-scrollbar pr-1">
                  {staffList.map((st) => {
                    const isSelected = selectedStaff?.id === st.id
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setSelectedStaff(isSelected ? null : st)
                          setUsername(isSelected ? '' : st.kullanici_adi)
                          setPin('')
                        }}
                        className={clsx(
                          'flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 touch-feedback relative overflow-hidden',
                          isSelected
                            ? 'bg-brand-950/40 border-brand-500 text-white shadow-md shadow-brand-950/60'
                            : 'bg-[#1e1a16] hover:bg-[#241F1A] border-[#322C26] text-surface-300 hover:text-white'
                        )}
                      >
                        {isSelected && (
                          <span className="absolute left-0 inset-y-0 w-1 bg-brand-500" />
                        )}
                        <div className="w-9 h-9 rounded-lg bg-[#241F1A] border border-[#403830] flex items-center justify-center text-surface-200 font-bold text-sm shrink-0">
                          {st.ad?.charAt(0)}{st.soyad?.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate leading-tight">
                            {st.ad} {st.soyad}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono font-medium tracking-wider', getRoleBadge(st.rol))}>
                              {st.rol}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Alt Durum Çubuğu — gerçek saat + IP */}
          <div className="mt-6 pt-4 border-t border-[#322C26] flex items-center justify-between gap-3 text-xs text-surface-400 font-mono">
            <div className="flex items-center gap-2 min-w-0">
              <span className={clsx('w-2 h-2 rounded-full shrink-0', lanAktif ? 'bg-emerald-500 status-beacon-green' : 'bg-rose-500')} />
              <span className="font-semibold text-surface-300 truncate">
                {terminalId || 'POS'} • {saatYazi}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-surface-400 text-[11px] shrink-0">
              <Radio size={13} className={lanAktif ? 'text-brand-400' : 'text-rose-400'} />
              <span>
                {lanAktif ? `${lanIp} · LAN` : (online ? (lanIp || 'IP yok') : 'OFFLINE')}
              </span>
            </div>
          </div>
        </div>

        {/* Sağ Panel: PIN / Şifre Giriş Kartı */}
        <div className="w-full lg:w-[420px] bg-[#171410] rounded-2xl border border-[#322C26] p-6 sm:p-8 flex flex-col justify-center shadow-xl relative overflow-hidden">
          
          {/* Üst İnce Vurgu Çizgisi */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

          {/* Giriş Modu Sekmeleri */}
          <div className="grid grid-cols-2 p-1 bg-[#0B0A08] rounded-xl border border-[#322C26] mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('pin')}
              className={clsx(
                'flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all touch-feedback',
                activeTab === 'pin'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-950/60 border border-brand-400/30'
                  : 'text-surface-400 hover:text-white'
              )}
            >
              <KeyRound size={15} />
              Hızlı PIN
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              className={clsx(
                'flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all touch-feedback',
                activeTab === 'password'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-950/60 border border-brand-400/30'
                  : 'text-surface-400 hover:text-white'
              )}
            >
              <User size={15} />
              Şifre İle
            </button>
          </div>

          {activeTab === 'pin' ? (
            <div className="flex flex-col items-center">
              
              {/* Seçili Personel Rozeti */}
              {selectedStaff ? (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1e1a16] border border-[#3A342C] text-xs text-surface-200 mb-5">
                  <UserCircle size={15} className="text-brand-400" />
                  <span>
                    PIN yalnızca <strong className="text-white">{selectedStaff.ad} {selectedStaff.soyad}</strong> için
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setSelectedStaff(null)} 
                    className="ml-1 text-surface-400 hover:text-rose-400 font-mono text-[10px] uppercase font-bold"
                  >
                    (Kaldır)
                  </button>
                </div>
              ) : (
                <div className="text-xs text-surface-400 mb-5 font-mono tracking-wider uppercase font-semibold text-center">
                  4 Haneli PIN Kodunu Tuşlayın
                </div>
              )}

              {/* Animasyonlu Endüstriyel PIN Göstergesi */}
              <motion.div
                animate={hasPinError ? { x: [-12, 12, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-center gap-3.5 sm:gap-4 mb-6"
              >
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = pin.length > index
                  return (
                    <motion.div
                      key={index}
                      initial={false}
                      animate={{
                        scale: isFilled ? 1.05 : 1,
                        borderColor: hasPinError
                          ? '#EF4444'
                          : isFilled
                          ? '#9A5F48'
                          : '#322C26',
                        backgroundColor: hasPinError
                          ? 'rgba(239, 68, 68, 0.15)'
                          : isFilled
                          ? 'rgba(154, 95, 72, 0.15)'
                          : '#0B0A08',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="w-12 h-14 sm:w-14 sm:h-16 rounded-xl flex items-center justify-center border-2 shadow-inner relative overflow-hidden"
                    >
                      <AnimatePresence>
                        {isFilled && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className={clsx(
                              'w-4 h-4 rounded-full',
                              hasPinError 
                                ? 'bg-red-500 status-beacon-red' 
                                : 'bg-brand-400 status-beacon-blue'
                            )}
                          />
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </motion.div>

              {/* Dokunmatik Endüstriyel Numpad */}
              <Numpad
                onKeyPress={(key) => {
                  if (key === '⌫') {
                    setPin((p) => p.slice(0, -1))
                  } else if (pin.length < 4) {
                    setPin((p) => p + key)
                  }
                }}
                onClear={() => setPin('')}
                layout={[
                  ['1', '2', '3'],
                  ['4', '5', '6'],
                  ['7', '8', '9'],
                  ['C', '0', '⌫'],
                ]}
                className="w-full max-w-[320px]"
              />

              <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-surface-500">
                <Keyboard size={12} />
                <span>Kasa klavyesi: 0–9 · Backspace · Enter</span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-surface-400">
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="admin"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-surface-400">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#0B0A08] border border-[#322C26] text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                disabled={isLoading}
                className="w-full h-12 mt-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-950/60 border border-brand-400/30 transition-colors disabled:opacity-50 touch-feedback"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>Giriş Yap</span>
                )}
              </motion.button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
