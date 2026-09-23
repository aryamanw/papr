import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './manifest.json'
import fs from 'node:fs'
import path from 'node:path'

export default defineConfig({
  plugins: [
    crx({ manifest }),
    {
      name: 'post-build',
      closeBundle() {
        // Copy inactive toolbar icons (not referenced in manifest, so crxjs skips them).
        const src = path.resolve('assets/icons/inactive')
        const dest = path.resolve('dist/assets/icons/inactive')
        fs.mkdirSync(dest, { recursive: true })
        for (const file of fs.readdirSync(src)) {
          fs.copyFileSync(path.join(src, file), path.join(dest, file))
        }
      },
    },
  ],
  build: { outDir: 'dist' },
})
