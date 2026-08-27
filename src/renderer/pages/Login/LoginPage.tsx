import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useToast } from '../../components/ui/Toast'
import { Numpad } from '../../components/ui/Numpad'
import { User, Lock, KeyRound, ShieldCheck, UtensilsCrossed, ChefHat, UserCircle } from 'lucide-react'
import { ipcInvoke } from '../../hooks/useIPC'
import { PERSONEL_KANALLARI } from '../../../common/ipc-channels'
import type { GirisYaniti, Personel } from '../../../common/types/staff.types'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'

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

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'admin':
      case 'mudur':
        return <ShieldCheck size={14} className="text-amber-400" />
      case 'mutfak':
        return <ChefHat size={14} className="text-emerald-400" />
      default:
        return <UtensilsCrossed size={14} className="text-blue-400" />
    }
  }

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return 'bg-amber-950/40 text-amber-300 border-amber-800/40'
      case 'mudur':
        return 'bg-purple-950/40 text-purple-300 border-purple-800/40'
      case 'kasiyer':
        return 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
      case 'mutfak':
        return 'bg-amber-950/40 text-amber-300 border-amber-800/40'
      default:
        return 'bg-blue-950/40 text-blue-300 border-blue-800/40'
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090A0F] text-surface-100 p-4 sm:p-6 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 lg:gap-12 items-stretch justify-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
        
        {/* Sol Panel: Terminal & Hızlı Profil Alanı */}
        <div className="flex-1 flex flex-col justify-between bg-[#0E111B] rounded-2xl border border-[#1E2436] p-6 sm:p-8 shadow-2xl">
          <div>
            {/* Logo ve Başlık */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-600 to-brand-800 flex items-center justify-center text-white font-bold text-2xl border border-brand-400/30 shadow-lg shadow-brand-900/30">
                ER
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                  ETİBOL <span className="text-brand-500 font-mono">RESTO</span>
                </h1>
                <p className="text-xs text-surface-400 uppercase tracking-widest font-mono">
                  Dokunmatik POS Terminal v2.0
                </p>
              </div>
            </div>

            <p className="text-sm text-surface-400 leading-relaxed mb-6">
              Hızlı giriş yapmak için numpad üzerinden 4 haneli PIN kodunuzu tuşlayın veya profilinizi seçin.
            </p>

            {/* Hızlı Profil Listesi */}
            {staffList.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-semibold text-surface-400 uppercase tracking-wider mb-3">
                  <span>Kayıtlı Personeller</span>
                  <span className="text-surface-500 font-mono">{staffList.length} aktif</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pos-scrollbar pr-1">
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
                          'flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-150',
                          isSelected
                            ? 'bg-brand-950/40 border-brand-500/60 shadow-md shadow-brand-950/50 text-white'
                            : 'bg-[#121624] hover:bg-[#181D2E] border-[#1E2538] text-surface-300'
                        )}
                      >
                        <div className="w-9 h-9 rounded-lg bg-[#181E30] border border-[#252E46] flex items-center justify-center text-surface-200 font-bold text-sm shrink-0">
                          {st.ad?.charAt(0)}{st.soyad?.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate leading-tight">
                            {st.ad} {st.soyad}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <span className={clsx('text-[10px] px-1.5 py-0.5 rounded border uppercase font-mono font-medium', getRoleBadge(st.rol))}>
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
          <div className="mt-8 pt-4 border-t border-[#1A1F30] flex items-center justify-between text-xs text-surface-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>TERMINAL READY</span>
            </div>
            <span>PORT : 3847</span>
          </div>
        </div>

        {/* Sağ Panel: PIN / Şifre Giriş Kartı */}
        <div className="w-full lg:w-[420px] bg-[#0E111B] rounded-2xl border border-[#1E2436] p-6 sm:p-8 flex flex-col justify-center shadow-2xl">
          
          {/* Giriş Modu Sekmeleri */}
          <div className="grid grid-cols-2 p-1 bg-[#090A10] rounded-xl border border-[#1A1F30] mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('pin')}
              className={clsx(
                'flex items-center justify-center gap-2 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all',
                activeTab === 'pin'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40'
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
                'flex items-center justify-center gap-2 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg transition-all',
                activeTab === 'password'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-900/40'
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
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141926] border border-[#222B40] text-xs text-surface-200 mb-5">
                  <UserCircle size={14} className="text-brand-400" />
                  <span>Seçili: <strong>{selectedStaff.ad} {selectedStaff.soyad}</strong></span>
                  <button 
                    type="button" 
                    onClick={() => setSelectedStaff(null)} 
                    className="ml-1 text-surface-400 hover:text-white font-mono text-[10px]"
                  >
                    (Kaldır)
                  </button>
                </div>
              ) : (
                <div className="text-xs text-surface-400 mb-5 font-mono">
                  4 Haneli PIN Kodunuzu Girin
                </div>
              )}

              {/* Animasyonlu PIN Göstergesi */}
              <motion.div
                animate={hasPinError ? { x: [-10, 10, -8, 8, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="flex items-center justify-center gap-4 mb-6"
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
                          ? 'rgba(59, 130, 246, 0.2)'
                          : '#090B11',
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="w-13 h-15 sm:w-14 sm:h-16 rounded-xl flex items-center justify-center border-2 shadow-inner"
                    >
                      <AnimatePresence>
                        {isFilled && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className={clsx(
                              'w-3.5 h-3.5 rounded-full shadow-glow',
                              hasPinError ? 'bg-red-500 shadow-red-500/50' : 'bg-brand-400 shadow-brand-500/50'
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
                <label className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                  Kullanıcı Adı
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" size={18} />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="admin"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-surface-400">
                  Şifre
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-500" size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 pl-10 pr-4 rounded-xl bg-[#090B11] border border-[#1E2436] text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                whileTap={{ scale: 0.96 }}
                disabled={isLoading}
                className="w-full h-12 mt-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-900/40 border border-brand-400/30 transition-colors disabled:opacity-50"
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

