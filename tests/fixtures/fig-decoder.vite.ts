import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({build:{outDir:'build/fig-decoder-browser',emptyOutDir:true,rollupOptions:{input:resolve('tests/fixtures/fig-decoder.html')}}});
