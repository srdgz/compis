import { defineConfig, devices } from "@playwright/test";

const API_PORT = 5001;
const WEB_PORT = 3001;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 45_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    locale: "es-ES",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "node e2e/start-backend.mjs",
      url: `http://localhost:${API_PORT}/api/health`,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "ignore",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      timeout: 120_000,
      stdout: "ignore",
      stderr: "ignore",
      reuseExistingServer: !process.env.CI,
      env: {
        VITE_PROXY_TARGET: `http://localhost:${API_PORT}`,
        VITE_CLOUDINARY_CLOUD_NAME: "e2e",
        VITE_CLOUDINARY_UPLOAD_PRESET: "e2e",
      },
    },
  ],
});
