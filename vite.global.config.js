import { defineConfig } from 'vite';
import { resolve } from 'path';

// Emits dist/omd.global.js — the artifact referenced by the `unpkg`,
// `jsdelivr`, and `./global` entries in package.json. Before this config
// existed nothing regenerated that file, so the published CDN bundle drifted
// months behind src/. Keep it wired into `npm run build`.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: false,
    minify: false,
    lib: {
      entry: resolve(__dirname, 'index.js'),
      formats: ['umd'],
      name: 'OMD',
      fileName: () => 'omd.global.js'
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        exports: 'named'
      }
    }
  }
});
