import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
 plugins: [react()],
 base: './',
 // Native installer staging contains an /Applications symlink. Scan only our entry page.
 optimizeDeps: { entries: ['index.html'] },
 server: { port: 5173, strictPort: true },
});
