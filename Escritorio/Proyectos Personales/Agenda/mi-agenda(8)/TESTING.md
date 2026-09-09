# Testing — Agenda Odontológica

Los tests automatizan la lógica crítica que antes se validaba a mano. No cubren Google/WhatsApp/IA de punta a punta (dependen de cuentas y de la UI).

## Cómo correrlos

Desde esta carpeta:

```bash
npm test
```

Modo watch:

```bash
npm run test:watch
```

## Interfaz (Playwright)

Primera vez: `npx playwright install chromium`

```bash
npm run test:e2e
```

Levanta la app en `http://localhost:3001` (no usa el `npm run dev` del puerto 3000).

Contra un deploy (Render):

```bash
PLAYWRIGHT_BASE_URL=https://tu-app.onrender.com npm run test:e2e
```

| Flujo | Archivo | Qué hace el usuario simulado |
| --- | --- | --- |
| Calendario | `e2e/critical-flows.spec.ts` | Login, tab Turnos, Vista Mes, Lista, Hoy |
| Alta de turno | `e2e/critical-flows.spec.ts` | Alta de paciente, agendar consulta con Marie y guardar |
| Finanzas | `e2e/critical-flows.spec.ts` | Abre liquidación diaria Marie / Yani |

## Qué está automatizado (lógica)

| Módulo manual | Archivo de test | Qué valida |
| --- | --- | --- |
| Horarios y fechas (MOD-4 / MOD-5) | `src/utils/time.test.ts` | Rangos 24h, duraciones, fechas flexibles DD/MM |
| Colisiones (TC-AGE-04 / TC-AGE-05) | `src/utils/appointmentConflicts.test.ts` | Solapes, odontólogas distintas, cancelados/atendidos |
| Finanzas (MOD-7) | `src/utils/finance.test.ts` | Honorarios Marie / Yani / Ambas, solo turnos atendidos |
| Filtros de pacientes (TC-PAC-05, MOD-2) | `src/utils/contactFilters.test.ts` | Búsqueda, favoritos, particular, OS, recordatorios, notas |
| WhatsApp y vCard (TC-PAC-06 / 07) | `src/utils/whatsappVcard.test.ts` | `wa.me` y ficha vCard |
| Backup JSON/TXT (MOD-11) | `src/utils/fileImporter.test.ts` | Import JSON, roundtrip TXT, fecha ISO |

## Qué sigue siendo manual / fuera de alcance

- Envío real de WhatsApp / Gmail / Google Calendar
- Asistente IA (Gemini)
- Persistencia IndexedDB de PDFs grandes
- Sync en vivo con Supabase/Firebase contra cuentas reales
- Layout mobile detallado (los E2E corren en viewport desktop)

## Bugs corregidos al automatizar

- Confirmación por Gmail usaba `primaryEmail` (no existe en el modelo); ahora usa `email`.
- Import TXT con fecha `YYYY-MM-DD` invertía día y año.
- La copia de seguridad JSON no normalizaba turnos incompletos.
- Fechas por defecto del turno usaban UTC (`toISOString`), incorrecto de noche en Argentina.
