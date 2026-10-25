import React from 'react'

type P = { boyut?: number; kalinlik?: number; renk?: string }
const svg = (cocuk: React.ReactNode, { boyut = 18, kalinlik = 2.2, renk = 'currentColor' }: P = {}) => (
  <svg width={boyut} height={boyut} viewBox="0 0 24 24" fill="none" stroke={renk} strokeWidth={kalinlik} strokeLinecap="round" strokeLinejoin="round">
    {cocuk}
  </svg>
)

export const Geri = () => svg(<><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>, { boyut: 20, kalinlik: 2.5 })
export const Kapat = () => svg(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>, { boyut: 16, kalinlik: 2.5 })
export const Kilit = () => svg(<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>, { boyut: 14, kalinlik: 2.5 })
export const Fincan = () => svg(<><path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></>, { boyut: 36 })
export const Cikis = () => svg(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>, { boyut: 15, kalinlik: 2.5 })
export const Izgara = () => svg(<><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>, { boyut: 22 })
export const Saat = () => svg(<><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>, { boyut: 22 })
export const Sepet = () => svg(<><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>)
export const Gonder = () => svg(<><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></>, { boyut: 20, kalinlik: 2.4 })
export const Arti = () => svg(<><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>, { kalinlik: 2.5 })
export const Bilgi = () => svg(<><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></>, { boyut: 12, kalinlik: 2 })
export const Hediye = () => svg(<><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /></>, { boyut: 13, kalinlik: 2 })
export const Carpi = () => svg(<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>, { boyut: 13, kalinlik: 2 })
export const Ara = () => svg(<><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>)
export const Gorsel = () => svg(<><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></>, { boyut: 24, kalinlik: 1.5 })
export const SilTus = () => svg(<><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" /><line x1="18" y1="9" x2="12" y2="15" /><line x1="12" y1="9" x2="18" y2="15" /></>, { boyut: 22 })
export const Basarili = () => svg(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>, { kalinlik: 2.5, renk: 'var(--pos-green)' })
export const Hata = () => svg(<><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>, { kalinlik: 2.5, renk: 'var(--pos-red)' })
