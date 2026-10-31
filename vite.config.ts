import { defineConfig } from 'vite';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { prototypePlayer } from './scripts/prototype-player-plugin.mjs';
// Dev only. The dev client reconnects through a blob SharedWorker, and any port but 5173 fails its socket first.
// Shipped pages keep the stricter policy in index.html: this never runs for a build.
const devPolicy = (): Plugin => ({
 name: 'forma-dev-policy',
 apply: 'serve',
 transformIndexHtml: {
  order: 'pre',
  handler(html, context) {
   const socket = (context.server?.config.server.host === true ? 'localhost' : context.server?.config.server.host) || '127.0.0.1';
   return html.replace('ws://127.0.0.1:5173', `ws://${socket}:${context.server?.config.server.port ?? 5173}`).replace("object-src 'none'", "worker-src 'self' blob:; object-src 'none'");
  },
 },
});
export default defineConfig({
 plugins: [react(), prototypePlayer(), devPolicy()],
 base: './',
 // Worktrees may share node_modules; keep optimizer/worker caches local to this root.
 cacheDir: '.vite',
 // Native installer staging contains an /Applications symlink. Scan only our entry page.
 // The .fig decoder is first imported by a worker, outside the entry scan.
 // Discover it up front so opening a file cannot trigger a dev dependency reload.
 optimizeDeps: { entries: ['index.html'], include: ['fzstd'] },
 server: { port: 5173, strictPort: true },
});
