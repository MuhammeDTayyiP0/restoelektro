import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import pkg from './package.json'

// electron-vite yapılandırması — Ana, Preload ve Renderer işlemleri ayrı ayrı build edilir
export default defineConfig({
  // Ana işlem (Main Process) yapılandırması
  main: {
    plugins: [
      externalizeDepsPlugin(),
      viteStaticCopy({
        targets: [
          {
            src: 'public/uploads/**/*',
            dest: 'uploads'
          }
        ]
      })
    ],
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
    publicDir: resolve('public'),
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer'),
        '@common': resolve('src/common')
      }
    },
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: 'public/uploads/**/*',
            dest: 'uploads'
          }
        ]
      })
    ],
    css: {
      postcss: './postcss.config.js'
    }
  }
})
