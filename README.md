# Agenda Odontológica - Consultorio Marie & Yani

Agenda web para un consultorio con dos odontólogas: pacientes, turnos, ficha clínica y liquidación diaria.

**Demo:** [https://agendaodontologica-cuvt.onrender.com](https://agendaodontologica-cuvt.onrender.com)

Versión de trabajo: `Escritorio/Proyectos Personales/Agenda/mi-agenda(8)`

## Stack

React 19 + Vite + Express + Tailwind.
El deploy actual en Render **no tiene PostgreSQL conectado** (`/api/db/all` responde `dbAvailable: false`). 

## Funcionalidades

- Pacientes (alta, filtros, vCard)
- Calendario y turnos con colisiones
- Notas, recordatorios y archivos
- Finanzas Marie / Yani / ambas
- Backup JSON y TXT de contingencia
- Login de consultorio (demo) y WhatsApp / IA opcionales


## Tests

```bash
npm test                 # lógica (Vitest)
npm run test:e2e         # interfaz local (Playwright)
npm run test:e2e:prod    # interfaz contra Render (no crea pacientes)
npm run lint             # TypeScript
npm run build            # build de producción
```

Detalle: [TESTING.md](./TESTING.md)
