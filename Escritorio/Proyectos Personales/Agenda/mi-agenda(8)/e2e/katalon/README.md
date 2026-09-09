# Tests Katalon Studio

Katalon Studio es un programa de escritorio (no se corre con `npm`). Estos scripts son los mismos flujos que Playwright/Cypress.

## Cómo usarlos

1. Instalá [Katalon Studio](https://katalon.com/download).
2. New Project → Web.
3. New Test Case y pegá el contenido de cada archivo `.groovy` de esta carpeta.
4. En Profile / GlobalVariable, `baseUrl` = `http://localhost:3000` (con `npm run dev`) o la URL de Render.
5. Run.

Flujos: login, calendario, finanzas.

La suite que se ejecuta en CI/GitHub es **Playwright** (`npm run test:e2e`). Katalon es para quienes pidan esa herramienta en una entrevista o en un equipo QA.
