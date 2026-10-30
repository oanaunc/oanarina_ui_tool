import {defineConfig} from '@playwright/test';
import {fileURLToPath} from 'node:url';
const baseURL=process.env.PLAYWRIGHT_BASE_URL??'http://127.0.0.1:5242';
export default defineConfig({
 testDir:'../browser-decoder',workers:1,reporter:'list',use:{baseURL,headless:true},
 webServer:{command:process.env.PLAYWRIGHT_SERVER_COMMAND??'npx vite preview --outDir build/fig-decoder-browser --host 127.0.0.1 --port 5242 --strictPort',cwd:fileURLToPath(new URL('../..',import.meta.url)),url:new URL('/tests/fixtures/fig-decoder.html',baseURL).href,reuseExistingServer:false},
});
