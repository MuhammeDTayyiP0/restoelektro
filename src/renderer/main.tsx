import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Electron IPC API tip tanımları için global namespace
declare global {
  interface Window {
    api: import('../preload/index').RestoElektroAPI
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
