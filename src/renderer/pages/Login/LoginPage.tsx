import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useToast } from '../../components/ui/Toast'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Numpad } from '../../components/ui/Numpad'
import { Tabs } from '../../components/ui/Tabs'
import { User, Lock, KeyRound } from 'lucide-react'
import { ipcInvoke } from '../../hooks/useIPC'
import { PERSONEL_KANALLARI } from '../../../common/ipc-channels'
import type { GirisYaniti } from '../../../common/types/staff.types'

export default function LoginPage() {
  const navigate = useNavigate()
  const { girisYap, girisYapildi } = useAuthStore()
  const { error, success } = useToast()
  
  const [activeTab, setActiveTab] = useState('pin')
  const [pin, setPin] = useState('')
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Zaten giriş yapmışsa yönlendir
  useEffect(() => {
    if (girisYapildi) {
      navigate('/tables')
    }
  }, [girisYapildi, navigate])

  const handlePinSubmit = async (p: string) => {
    if (p.length !== 4) return
    
    setIsLoading(true)
    try {
      const response = await ipcInvoke<GirisYaniti>(PERSONEL_KANALLARI.PIN_GIRIS, p)
      
      if (response.basarili && response.personel && response.token) {
        girisYap(response.personel, response.token)
        success(`Hoş geldin, ${response.personel.ad}`)
        navigate('/tables')
      } else {
        error('Giriş Başarısız', response.hata || 'Geçersiz PIN Kodu')
        setPin('')
      }
    } catch (err: any) {
      error('Bağlantı Hatası', err.message)
      setPin('')
    } finally {
      setIsLoading(false)
    }
  }

  // Pin otomatik gönderim
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
        success(`Hoş geldin, ${response.personel.ad}`)
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

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-4" style={{ WebkitAppRegion: 'drag' } as any}>
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-center justify-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
        
        {/* Sol Taraf - Branding */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className="w-24 h-24 bg-brand-500 rounded-pos-xl flex items-center justify-center text-white text-4xl font-bold shadow-pos-glow mb-6 animate-fade-in">
            ER
          </div>
          <h1 className="text-pos-3xl font-bold text-surface-900 dark:text-white mb-4 animate-slide-up">
            ETİBOL <span className="text-brand-500">RESTO</span>
          </h1>
          <p className="text-pos-lg text-surface-600 dark:text-surface-400 max-w-md animate-slide-up" style={{ animationDelay: '100ms' }}>
            Restoranınız için akıllı, hızlı ve dokunmatik optimize edilmiş yönetim sistemi.
          </p>
        </div>

        {/* Sağ Taraf - Login Card */}
        <Card className="w-full max-w-md animate-scale-in" padding="lg">
          <Tabs 
            variant="pills"
            fullWidth
            activeTabId={activeTab}
            onChange={setActiveTab}
            tabs={[
              { id: 'pin', label: 'Hızlı PIN', icon: <KeyRound size={18} /> },
              { id: 'password', label: 'Şifre', icon: <User size={18} /> },
            ]}
          />

          <div className="mt-8">
            {activeTab === 'pin' ? (
              <div className="flex flex-col items-center">
                {/* Pin Display */}
                <div className="flex gap-4 mb-8">
                  {[0, 1, 2, 3].map((index) => (
                    <div 
                      key={index}
                      className={`w-14 h-16 rounded-pos flex items-center justify-center text-pos-2xl font-bold border-2 transition-colors ${
                        pin.length > index 
                          ? 'border-brand-500 text-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                          : 'border-surface-200 dark:border-surface-700 text-surface-300 dark:text-surface-600'
                      }`}
                    >
                      {pin.length > index ? '•' : ''}
                    </div>
                  ))}
                </div>
                
                {/* Numpad */}
                <Numpad 
                  onKeyPress={(key) => {
                    if (key === '⌫') {
                      setPin(p => p.slice(0, -1))
                    } else if (pin.length < 4) {
                      setPin(p => p + key)
                    }
                  }}
                  onClear={() => setPin('')}
                  layout={[
                    ['1', '2', '3'],
                    ['4', '5', '6'],
                    ['7', '8', '9'],
                    ['C', '0', '⌫']
                  ]}
                  className="w-full"
                />
              </div>
            ) : (
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Kullanıcı Adı
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={20} />
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full h-14 pl-10 pr-4 rounded-pos border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      placeholder="admin"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Şifre
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={20} />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-14 pl-10 pr-4 rounded-pos border border-surface-300 dark:border-surface-700 bg-white dark:bg-surface-900 focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  fullWidth 
                  isLoading={isLoading}
                  className="mt-2"
                >
                  Giriş Yap
                </Button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
