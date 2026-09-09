# Cómo ver y correr las pruebas automatizadas

Todo se corre desde:

`Escritorio/Proyectos Personales/Agenda/mi-agenda(8)`

## 1. Lógica (Vitest) — la más rápida

```bash
npm test
```

Tiene que decir **35 passed**.  
Archivos: `src/utils/*.test.ts`.

## 2. Interfaz con Playwright (la suite principal)

```bash
npx playwright install chromium   # una sola vez
npm run test:e2e
```

Se abre Chrome en modo invisible (headless) y simula: login, calendario, turno, finanzas, mobile.

Ver el reporte HTML si algo falla:

```bash
npx playwright show-report
```

Contra Render (no crea pacientes):

```bash
npm run test:e2e:prod
```

## 3. Cypress

Con el servidor en marcha (`PORT=3001 npm run dev` en otra terminal):

```bash
npm run test:e2e:cypress
```

UI interactiva (para “ver” los clics):

```bash
npx cypress open
```

## 4. Selenium WebDriver

```bash
PORT=3001 npm run dev    # en otra terminal
npm run test:e2e:selenium
```

Hace falta Chrome instalado en la PC.

## 5. Katalon Studio

No corre con npm. Abrí `e2e/katalon/README.md` e importá `ConsultorioFlujos.groovy` en Katalon.

## Qué usar en una entrevista

Decí: “la suite oficial es Playwright + Vitest (`npm test` y `npm run test:e2e`). También dejé los mismos flujos en Cypress, Selenium y Katalon.”
