import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
 plugins: [react()],
 base: './',
 // Worktrees may share node_modules; keep optimizer/worker caches local to this root.
 cacheDir: '.vite',
 // Native installer staging contains an /Applications symlink. Scan only our entry page.
 optimizeDeps: { entries: ['index.html'] },
 server: { port: 5173, strictPort: true },
});
