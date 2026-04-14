import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    minify: false,
    lib: {
      entry: resolve(__dirname, 'browser/index.js'),
      name: 'OMD',
      formats: ['es', 'umd'],
      fileName: (format) => (format === 'es' ? 'omd.browser.js' : 'omd.global.js'),
    },
    rollupOptions: {
      output: {
        exports: 'named',
      },
    },
  },
  esbuild: {
    keepNames: true,
  },
  resolve: {
    alias: {
      '@teachinglab/jsvg': resolve(__dirname, 'jsvg/jsvgComponents.js'),
    },
  },
});
