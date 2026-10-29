import {defineConfig} from '@playwright/test';
const baseURL=process.env.PLAYWRIGHT_BASE_URL??'http://127.0.0.1:5173';
export default defineConfig({testDir:'tests/e2e',fullyParallel:true,workers:2,use:{baseURL,viewport:{width:1512,height:982},headless:true},webServer:{command:process.env.PLAYWRIGHT_SERVER_COMMAND??'npm run dev',url:baseURL,reuseExistingServer:!process.env.PLAYWRIGHT_SERVER_COMMAND},reporter:'list'});
