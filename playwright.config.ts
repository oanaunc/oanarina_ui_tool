import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests/e2e',fullyParallel:true,workers:2,use:{baseURL:'http://127.0.0.1:5173',viewport:{width:1512,height:982},headless:true},webServer:{command:'npm run dev',url:'http://127.0.0.1:5173',reuseExistingServer:true},reporter:'list'});
