import {defineConfig} from '@playwright/test';
const baseURL=process.env.PLAYWRIGHT_BASE_URL??'http://127.0.0.1:5251';
export default defineConfig({testDir:'tests/dev',testMatch:'fig-scene-validation.spec.ts',workers:2,use:{baseURL,headless:true},webServer:{command:process.env.PLAYWRIGHT_SERVER_COMMAND??'npm run dev -- --port 5251 --strictPort',url:baseURL,reuseExistingServer:!process.env.PLAYWRIGHT_SERVER_COMMAND},reporter:'list'});
