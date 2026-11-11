import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001';
const useExternalServer = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1400, height: 900 },
    locale: 'es-AR',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: useExternalServer
    ? undefined
    : {
        // Modo demo: entra sin login, así la suite corre sin credenciales.
        // DATABASE_URL vacío a propósito: dotenv no pisa variables ya
        // definidas, así la suite nunca escribe en la base de .env.local.
        command: 'DATABASE_URL= POSTGRES_URL= PORT=3001 DEMO_MODE=true npm run dev',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 } },
    },
  ],
});
