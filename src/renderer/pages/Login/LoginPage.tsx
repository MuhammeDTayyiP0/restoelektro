import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useToast } from '../../components/ui/Toast'
import { Numpad } from '../../components/ui/Numpad'
import { User, Lock, KeyRound, ShieldCheck, UtensilsCrossed, ChefHat, UserCircle, Cpu, Radio, Sparkles } from 'lucide-react'
import { ipcInvoke } from '../../hooks/useIPC'
import { PERSONEL_KANALLARI } from '../../../common/ipc-channels'
import type { GirisYaniti, Personel } from '../../../common/types/staff.types'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { APP_VERSION_TAG } from '../../utils/version'

export default function LoginPage() {
  const navigate = useNavigate()
  const { girisYap, girisYapildi } = useAuthStore()
  const { error, success } = useToast()
  
  const [activeTab, setActiveTab] = useState<'pin' | 'password'>('pin')
  const [pin, setPin] = useState('')
  const [hasPinError, setHasPinError] = useState(false)
  
  const [staffList, setStaffList] = useState<Personel[]>([])
  const [selectedStaff, setSelectedStaff] = useState<Personel | null>(null)
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Zaten giriş yapmışsa yönlendir
  useEffect(() => {
    if (girisYapildi) {
      navigate('/tables')
    }
  }, [girisYapildi, navigate])

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

  const handlePinSubmit = async (p: string) => {
    if (p.length !== 4) return
    
    setIsLoading(true)
    try {
      const response = await ipcInvoke<GirisYaniti>(PERSONEL_KANALLARI.PIN_GIRIS, p)
      
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
      setIsLoading(false)
    }
  }

  // Pin 4 haneye ulaştığında otomatik gönder
  useEffect(() => {
    if (pin.length === 4) {
      handlePinSubmit(pin)
    }
  }, [pin])

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

  return (
    <div 
      className="min-h-screen w-full flex items-center justify-center bg-[#090A0F] bg-pos-grid text-surface-100 p-4 sm:p-6 lg:p-8 select-none relative overflow-hidden" 
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Odaklayıcı Merkez Radyal Işığı */}
      <div className="absolute inset-0 bg-pos-radial pointer-events-none" />

      {/* Ana Giriş Kutusu */}
      <div 
        className="w-full max-w-5xl flex flex-col lg:flex-row gap-6 sm:gap-8 items-stretch justify-center relative z-10" 
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        
        {/* Sol Panel: Terminal Kimliği & Personel Seçimi */}
        <div className="flex-1 flex flex-col justify-between bg-[#0E121E]/95 backdrop-blur-xl rounded-2xl border border-[#1E2436] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Üst İnce Vurgu Çizgisi */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

          <div>
            {/* Logo ve Başlık */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-[#141928] border border-brand-500/40 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-brand-950/50 relative">
                <span className="text-brand-400 font-mono tracking-tighter">ER</span>
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-brand-500 status-beacon-blue" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 font-sans">
                  ETİBOL <span className="text-brand-400 font-mono">RESTO</span>
                </h1>
                <p className="text-[11px] text-surface-400 uppercase tracking-wider font-mono flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 status-beacon-green" />
                  TOUCH POS TERMINAL • {APP_VERSION_TAG}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-surface-400 leading-relaxed mb-6 font-medium">
              Sisteme erişmek için 4 haneli PIN kodunuzu tuşlayın veya kayıtlı profilinizi seçin.
            </p>

            {/* Hızlı Profil Listesi */}
            {staffList.length > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">
                  <span className="flex items-center gap-1.5">
                    <UserCircle size={14} className="text-brand-400" />
                    Kayıtlı Personeller
                  </span>
                  <span className="text-surface-500 font-mono text-[11px] bg-[#141824] px-2 py-0.5 rounded-md border border-[#1E2436]">
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
                          if (username !== st.kullanici_adi) {
                            setUsername(st.kullanici_adi)
                          }
                          setPin('')
                        }}
                        className={clsx(
                          'flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150 touch-feedback relative overflow-hidden',
                          isSelected
                            ? 'bg-brand-950/40 border-brand-500 text-white shadow-md shadow-brand-950/60'
                            : 'bg-[#121624] hover:bg-[#181E30] border-[#1E2538] text-surface-300 hover:text-white'
                        )}
                      >
                        {isSelected && (
                          <span className="absolute left-0 inset-y-0 w-1 bg-brand-500" />
                        )}
                        <div className="w-9 h-9 rounded-lg bg-[#181F33] border border-[#252F48] flex items-center justify-center text-surface-200 font-bold text-sm shrink-0">
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

          {/* Alt Durum Çubuğu */}
          <div className="mt-6 pt-4 border-t border-[#1E2436] flex items-center justify-between text-xs text-surface-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 status-beacon-green" />
              <span className="font-semibold text-surface-300">NODE-01 • READY</span>
            </div>
            <div className="flex items-center gap-1.5 text-surface-500 text-[11px]">
              <Radio size={13} className="text-brand-400" />
              <span>LAN : ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Sağ Panel: PIN / Şifre Giriş Kartı */}
        <div className="w-full lg:w-[420px] bg-[#0E121E]/95 backdrop-blur-xl rounded-2xl border border-[#1E2436] p-6 sm:p-8 flex flex-col justify-center shadow-2xl relative overflow-hidden">
          
          {/* Üst İnce Vurgu Çizgisi */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand-500/50 to-transparent" />

          {/* Giriş Modu Sekmeleri */}
          <div className="grid grid-cols-2 p-1 bg-[#090A0F] rounded-xl border border-[#1E2436] mb-6">
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
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#131826] border border-[#20273B] text-xs text-surface-200 mb-5">
                  <UserCircle size={15} className="text-brand-400" />
                  <span>Personel: <strong className="text-white">{selectedStaff.ad} {selectedStaff.soyad}</strong></span>
                  <button 
                    type="button" 
                    onClick={() => setSelectedStaff(null)} 
                    className="ml-1 text-surface-400 hover:text-rose-400 font-mono text-[10px] uppercase font-bold"
                  >
                    (Kaldır)
                  </button>
                </div>
              ) : (
                <div className="text-xs text-surface-400 mb-5 font-mono tracking-wider uppercase font-semibold">
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
                          ? '#3B82F6'
                          : '#1E2436',
                        backgroundColor: hasPinError
                          ? 'rgba(239, 68, 68, 0.15)'
                          : isFilled
                          ? 'rgba(59, 130, 246, 0.15)'
                          : '#090A0F',
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
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#090A0F] border border-[#1E2436] text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
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
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#090A0F] border border-[#1E2436] text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
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


