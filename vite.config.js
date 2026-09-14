import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        demo:        resolve(__dirname, 'examples/demo/index.html'),
        numberlineInteractive: resolve(__dirname, 'examples/numberline-interactive/index.html'),
        g5Unit2:     resolve(__dirname, 'examples/g5-unit2/index.html'),
        screenshots: resolve(__dirname, 'examples/screenshots/index.html'),
      }
    }
  },
  server: {
    open: '/examples/screenshots/index.html',
    fs: {
      allow: ['..', '.']
    }
  }
})
