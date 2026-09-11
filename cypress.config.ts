import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:3001',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: false,
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1400,
    viewportHeight: 900,
    defaultCommandTimeout: 15000,
  },
});
