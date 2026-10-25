import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json'

// Telefon arayüzleri (garson, patron, QR menü) — Express tarafından /m/ altından sunulur.
// Telefon tarayıcıları için derlenir; Windows 7 / Electron 22 kısıtı burada geçerli değildir.
export default defineConfig({
  root: resolve(__dirname, 'src/mobile'),
  base: '/m/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    outDir: resolve(__dirname, 'out/mobile'),
    emptyOutDir: true,
    target: ['es2019', 'safari13'],
    rollupOptions: {
      input: {
        garson: resolve(__dirname, 'src/mobile/garson.html'),
        boss: resolve(__dirname, 'src/mobile/boss.html'),
        menu: resolve(__dirname, 'src/mobile/menu.html'),
      },
    },
  },
})
