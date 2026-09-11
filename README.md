# Agenda Odontológica — Consultorio Marie & Yani

Agenda web para un consultorio con dos odontólogas: pacientes, turnos, ficha clínica y liquidación diaria.

**Demo:** [https://agendaodontologica-cuvt.onrender.com](https://agendaodontologica-cuvt.onrender.com)

Versión de trabajo: `Escritorio/Proyectos Personales/Agenda/mi-agenda(8)`

## Stack

React 19 + Vite + Express + Tailwind. Persistencia principal: **localStorage** del navegador. Opcional: archivo en el servidor, Supabase, Firebase/Google y PostgreSQL (Drizzle) si hay variables de entorno.

El deploy actual en Render **no tiene PostgreSQL conectado** (`/api/db/all` responde `dbAvailable: false`). Los datos viven en el browser de cada dispositivo. Si Render reinicia el servicio, el archivo `agenda_storage.json` del servidor se pierde.

## Funcionalidades

- Pacientes (alta, filtros, vCard)
- Calendario y turnos con colisiones
- Notas, recordatorios y archivos
- Finanzas Marie / Yani / ambas
- Backup JSON y TXT de contingencia
- Login de consultorio (demo) y WhatsApp / IA opcionales

## Instalación

```bash
cd "Escritorio/Proyectos Personales/Agenda/mi-agenda(8)"
npm install
npx playwright install chromium
npm run dev
```

Abrí http://localhost:3000 — email cualquiera y contraseña `admin123`.

Variables opcionales: copiá `.env.example` a `.env.local` (`GEMINI_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). En el servidor: `DATABASE_URL` (Postgres), `ADMIN_API_TOKEN` (protege wipe de datos).

## Tests

```bash
npm test                 # lógica (Vitest)
npm run test:e2e         # interfaz local (Playwright)
npm run test:e2e:prod    # interfaz contra Render (no crea pacientes)
npm run lint             # TypeScript
npm run build            # build de producción
```

Detalle: [TESTING.md](./TESTING.md)
