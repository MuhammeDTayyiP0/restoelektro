// =====================================================
// Test çalıştırıcı
// tests/*.test.ts → esbuild ile CJS paketlenir → Electron'un kendi Node 16'sında çalışır.
// Böylece better-sqlite3'ün Electron için derlenmiş native modülü ve gerçek çalışma ortamı kullanılır.
// =====================================================

import { build } from 'esbuild'
import { spawnSync } from 'child_process'
import { createRequire } from 'module'
import { readdirSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const kok = fileURLToPath(new URL('..', import.meta.url))
const testDizini = join(kok, 'tests')
const ciktiDizini = join(kok, 'out', 'test')
const electron = require('electron')

const filtre = process.argv[2]
const dosyalar = readdirSync(testDizini).filter((f) => f.endsWith('.test.ts') && (!filtre || f.includes(filtre)))

rmSync(ciktiDizini, { recursive: true, force: true })
mkdirSync(ciktiDizini, { recursive: true })

let basarisiz = 0
for (const dosya of dosyalar) {
  const cikti = join(ciktiDizini, dosya.replace(/\.ts$/, '.cjs'))
  await build({
    entryPoints: [join(testDizini, dosya)],
    outfile: cikti,
    bundle: true,
    platform: 'node',
    target: 'node16',
    format: 'cjs',
    external: ['better-sqlite3', 'electron'],
    logLevel: 'error',
  })

  console.log(`\n▶ ${dosya}`)
  const sonuc = spawnSync(electron, [cikti], {
    cwd: kok,
    stdio: 'inherit',
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  })
  if (sonuc.status !== 0) basarisiz++
}

if (basarisiz) {
  console.error(`\n✖ ${basarisiz} test dosyası başarısız`)
  process.exit(1)
}
console.log(`\n✔ ${dosyalar.length} test dosyası geçti`)
