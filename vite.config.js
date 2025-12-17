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
        simpleApi: resolve(__dirname, 'simple-api-example.html'),
        buildTools: resolve(__dirname, 'build-tools.html'),
        htmlExampleGuide: resolve(__dirname, 'html-example-guide.html'),
        commonUseCases: resolve(__dirname, 'common-use-cases.html')
      }
    }
  },
  resolve: {
    alias: {
      '@teachinglab/jsvg': resolve(__dirname, 'jsvg/jsvgComponents.js')
    }
  },
  // Copy static assets - includes dist/ directory for npm-docs
  publicDir: false, // We'll handle this manually
  // Configure dev server to serve the built npm-docs from dist
  server: {
    fs: {
      // Allow serving files from parent directory and dist
      allow: ['..', '.', './dist']
    },
    // Middleware to serve dist/npm-docs at /npm-docs
    middlewareMode: false
  }
})
