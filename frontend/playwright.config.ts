import { defineConfig, devices } from '@playwright/test';

/**
 * Fase 16: pruebas de punta a punta sobre la compilación de demostración (sin servidor).
 * Las reglas de negocio y los permisos se prueban en el backend (mvn test); aquí se prueban las pantallas.
 * Ejecutar: npm run test:e2e
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://localhost:4175/', trace: 'off', locale: 'es-CO', timezoneId: 'America/Bogota' },
  projects: [
    { name: 'escritorio', use: { viewport: { width: 1440, height: 900 } }, testIgnore: /responsive\.spec\.ts/ },
    { name: 'celular', use: { ...devices['iPhone 13'], browserName: 'chromium' }, testMatch: /responsive\.spec\.ts/ },
  ],
  webServer: {
    command: 'npm run build:demo -- --outDir dist-demo --emptyOutDir && npx vite preview --outDir dist-demo --port 4175 --strictPort',
    url: 'http://localhost:4175/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
