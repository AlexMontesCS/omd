import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Don't empty since we're adding docs
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ai: resolve(__dirname, 'index-ai.html'),
        simpleApi: resolve(__dirname, 'simple-api-example.html')
      }
    }
  },
  // Copy static assets
  publicDir: 'public',
  // Configure dev server to serve static files
  server: {
    fs: {
      // Allow serving files from parent directory
      allow: ['..', '.']
    }
  }
})
