# Agenda Odontológica — Consultorio Marie & Yani

Aplicación web para gestionar **pacientes, turnos, ficha clínica y liquidación diaria** de un consultorio odontológico con dos odontólogas.

**Demo:** [https://agendaodontologica-cuvt.onrender.com](https://agendaodontologica-cuvt.onrender.com)

Código de trabajo: [`Escritorio/Proyectos Personales/Agenda/mi-agenda(8)`](Escritorio/Proyectos%20Personales/Agenda/mi-agenda(8))  
(las carpetas `mi-agenda(2)` a `(7)` son copias históricas)

## Funcionalidades

- Alta, búsqueda y filtros de pacientes (obra social / particular)
- Calendario de turnos (vista mes y lista) con detección de colisiones
- Ficha médica: notas, recordatorios y archivos
- Finanzas y liquidación Marie / Yani / ambas
- Backup JSON y TXT de contingencia
- Login de consultorio (demo), WhatsApp y asistente IA opcionales

## Stack

React 19, Vite, Express, Tailwind.  
Persistencia principal: **localStorage**. El deploy en Render **no usa PostgreSQL**; los datos quedan en el navegador.

## Instalación y ejecución

```bash
cd "Escritorio/Proyectos Personales/Agenda/mi-agenda(8)"
npm install
npx playwright install chromium
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).  
Email cualquiera y contraseña `admin123`.

Variables opcionales (`.env.example` → `.env.local`): `GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. En el servidor: `DATABASE_URL`, `ADMIN_API_TOKEN`.

## Tests automatizados

```bash
npm test              # 35 tests de lógica (Vitest)
npm run test:e2e      # flujos de UI (Playwright)
npm run test:e2e:prod # mismos flujos contra Render (no crea pacientes)
npm run lint
npm run build
```

Detalle: [TESTING.md](Escritorio/Proyectos%20Personales/Agenda/mi-agenda(8)/TESTING.md)

## Deploy

Render: [agendaodontologica-cuvt.onrender.com](https://agendaodontologica-cuvt.onrender.com)
