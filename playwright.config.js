// ─────────────────────────────────────────────────────────────
// playwright.config.js — ตั้งค่า Playwright ของ Zone Alert
// รันกับเว็บในเครื่อง (npm run dev พอร์ต 3001) เป็นค่าเริ่มต้น
// ถ้าตั้ง BASE_URL ไว้ (เช่นรันกับเว็บออนไลน์) จะไม่เปิดเซิร์ฟเวอร์ในเครื่องเอง
// ─────────────────────────────────────────────────────────────
import { defineConfig } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3001";

export default defineConfig({
  testDir: "tests",
  testMatch: "**/*.spec.mjs",
  timeout: 60000,
  retries: 0,
  workers: 1,
  reporter: [["list"], ["json", { outputFile: "test-results/results.json" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    headless: true,
    locale: "th-TH"
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        port: 3001,
        reuseExistingServer: true
      }
});
