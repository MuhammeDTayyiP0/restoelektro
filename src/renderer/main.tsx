import React from 'react'
import ReactDOM from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import App from './App'
import './index.css'

// Electron IPC API tip tanımları için global namespace
declare global {
  const __APP_VERSION__: string
  interface Window {
    api: import('../preload/index').RestoElektroAPI
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* GPU kapalıyken (Windows 7/8) hareket animasyonları CPU'yu yormasın */}
    <MotionConfig reducedMotion={window.api?.sistem?.azHareket ? 'always' : 'user'}>
      <App />
    </MotionConfig>
  </React.StrictMode>
)
