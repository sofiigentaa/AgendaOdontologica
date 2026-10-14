# Oportunidades de automatización con Playwright

Criterio: **Sí** cuando el flujo es determinista, no depende de WhatsApp, Google, Gemini ni de un teléfono real, y el resultado se puede afirmar en UI o en API. **No** cuando el canal externo es el producto, cuando el caso es de un solo uso destructivo en producción, o cuando el defecto solo aparece en un huso que el CI no fija.

Lo ya automatizado hoy está solo en Agenda Odontológica: `e2e/critical-flows.spec.ts` (login, mes/lista/hoy, alta de turno, apertura de finanzas), más Vitest de colisiones, honorarios, filtros, vCard y backup. Los otros cuatro repos no tienen Playwright.

## Selectores que ya sirven

| Sistema | Anclas |
| --- | --- |
| AO | `auth-email`, `auth-password`, `auth-submit`, `btn-new-patient`, `contact-fullname`, `contact-phone`, `calendar-view-month`, `calendar-view-list`, `calendar-today`, `btn-add-turno-today`, `dentist-marie`, `treatment-consulta`, `appt-date`, `appt-save` |
| AM | Hay que agregarlos. Hoy el flujo se puede atar a roles y textos, que son más frágiles. |
| SK | `login-form`, `calandria-home`, `nav-tab-pos`, `pos-barcode-input`, `pos-checkout-modal-btn`, `pos-confirm-sale-final-btn`, `header-cash-shift-btn`, `asistente` |
| CS | `login-form`, `calandria-home`, `input-search-events`, `btn-create-event-action`, `btn-view-calendar`, `btn-view-cashflow` |
| IG | `login-form`, `#nav-dashboard`, `#nav-daily`, `#transaction-modal`, `#btn-submit-transaction`, `#input-transaction-amount` |

## Qué automatizar primero

1. **AO-TC-012 / AO-TC-013 / AO-TC-015 / AO-TC-017.** Colisión de la misma odontóloga, no colisión entre Marie y Yani, franjas pegadas, y el botón “Agendar de todos modos” contra el 409. El spec actual, si aparece el botón, lo pulsa y espera éxito. Eso congela el desvío de AO-BUG-001. El caso nuevo debe afirmar el rechazo del servidor o el mensaje de error, no el toast de éxito.
2. **AM-TC-006 a AM-TC-009 y AM-TC-016.** Horario, día hábil, solape y link público. El servidor se puede levantar con SQLite.
3. **SK-TC-004 a SK-TC-006 y SK-TC-012.** Venta, fiado sin nombre, stock y apertura de caja, en modo local sin Supabase.
4. **CS-TC-003 a CS-TC-006.** Alta con seña, seña mayor al total, conflicto de horario. Modo memoria, sin Gemini.
5. **IG-TC-003, IG-TC-007, IG-TC-009, IG-TC-012.** Balance del mes, categoría preseleccionada, monto cero, texto del reset. Modo local. Para IG-TC-006 fijar `TZ=Europe/Madrid` y otro job con `TZ=America/Argentina/Buenos_Aires`.

## Qué no automatizar de punta a punta

- Envío real de WhatsApp, Gmail o Calendar.
- Contrato con Gemini.
- Lectura del Google Sheet de producción de Agenda Médica.
- Borrar la base de un deploy público.
- Cámara de código de barras del kiosco (sí se puede simular el input del código).

## Entorno

Cada sistema con su propio `playwright.config.ts`, base URL local y usuario de prueba. En Agenda Odontológica el puerto de e2e ya es 3001 y la contraseña de dev es `admin123`. No correr altas contra Render: el script remoto ya se salta la creación de pacientes.

La columna `CandidatoAutomatizacion` de [casos-prueba.csv](./csv/casos-prueba.csv) es la lista operativa.
