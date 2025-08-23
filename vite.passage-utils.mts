import { defineConfig } from 'vite';
import path from 'node:path';

// Standalone build for passage rendering utilities
// Outputs a single IIFE bundle exposing `window.sugarcubeRenderExtensions`
// at public/static/passage-render-utils.js
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/util/passage-render.ts'),
      name: 'sugarcubeRenderExtensions',
      formats: ['iife'],
      fileName: () => 'passage-render-utils.js',
    },
    outDir: 'public/static',
    emptyOutDir: false,
    rollupOptions: {
      output: {
        // ensure we don't overwrite a pre-existing global, we just assign
        extend: true,
      },
    },
  },
});
