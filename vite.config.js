import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        demo: resolve(__dirname, 'examples/demo/index.html'),
      }
    }
  },
  server: {
    open: '/examples/demo/index.html',
    fs: {
      allow: ['..', '.']
    }
  }
})
