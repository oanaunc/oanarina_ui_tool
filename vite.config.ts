import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
 plugins: [react()],
 base: './',
 // Worktrees may share node_modules; keep optimizer/worker caches local to this root.
 cacheDir: '.vite',
 // Native installer staging contains an /Applications symlink. Scan only our entry page.
 // The .fig decoder is first imported by a worker, outside the entry scan.
 // Discover it up front so opening a file cannot trigger a dev dependency reload.
 optimizeDeps: { entries: ['index.html'], include: ['fzstd'] },
 server: { port: 5173, strictPort: true },
});
