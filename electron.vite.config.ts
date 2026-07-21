import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

// electron-vite yapılandırması — Ana, Preload ve Renderer işlemleri ayrı ayrı build edilir
export default defineConfig({
  // Ana işlem (Main Process) yapılandırması
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        // Native modüller (better-sqlite3 vb.) harici bırakılır
        external: ['better-sqlite3', 'serialport', 'escpos']
      }
    }
  },

  // Preload script yapılandırması
  preload: {
    plugins: [externalizeDepsPlugin()]
  },

  // Renderer (React) yapılandırması
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer'),
        '@common': resolve('src/common')
      }
    },
    plugins: [react()],
    css: {
      postcss: './postcss.config.js'
    }
  }
})
