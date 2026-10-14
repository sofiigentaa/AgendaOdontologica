# Agenda Médica — Estética Láser Rosario

Repositorio: `sofiigentaa/AgendaMedica`. Lectura de `server/routes/*`, `AppointmentModal.tsx`, `storage.ts` y `DEPLOY.md`. `npm run lint` (`tsc --noEmit`) fue reportado en verde en el relevamiento. No hay suite Playwright en el repo.

## Actores

Una contraseña de consultorio (`AUTH_PASSWORD_HASH`), JWT 12 h, cookie `agenda_session`. No hay usuarios ni profesionales. La agenda es única. El paciente solo entra por query `confirm_turno` o `cancel_turno`.

**No hay seña.** El cobro es `honorarios` + `estadoPago` + `metodoPago`. Si el negocio necesita anticipo separado, es un requisito faltante.

## AM-M01 Acceso

8 intentos / 15 min / IP. Producción exige `DATABASE_URL`, `SESSION_SECRET` y `AUTH_PASSWORD_HASH`.

### AM-HU-01 Ingresar al consultorio

Como recepción, quiero entrar con la contraseña del consultorio, para ver la agenda compartida.

```gherkin
Escenario: contraseña correcta
  Cuando envío la contraseña del consultorio
  Entonces recibo la cookie de sesión
  Y veo la pestaña Agenda

Escenario: octavo fallo
  Dado que ya fallé 8 veces desde la misma IP dentro de la ventana
  Cuando vuelvo a intentar
  Entonces la API limita el login
```

Casos: `AM-TC-001`, `AM-TC-002`.

## AM-M02 Pacientes

Obligatorios en API y en modal: DNI, nombre, apellido, teléfono. DNI único. Nombre y apellido rechazan dígitos y `,;` en el cliente. Fecha de nacimiento no posterior a hoy. Import masivo saltea DNI duplicado. “Sin DNI” recibe un sufijo para no chocar.

`ReminderManager` e `ImportTurnosModal` existen y no están montados en `App.tsx`. El sync de turnos activo no usa ese modal.

### AM-HU-02 Registrar paciente

Como recepción, quiero cargar un paciente con DNI único, para asignarle turnos y no duplicar el padrón.

Casos: `AM-TC-003`, `AM-TC-004`, `AM-TC-005`.

## AM-M03 Turnos y AM-M04 Feriados

Estados: `confirmado`, `atendido`, `cancelado`, `no_asistio`. Alta manual e import quedan en `confirmado`.

Días de atención implementados: lunes, martes y viernes. Horario: 14:30 a 20:00. No se agenda fecha pasada ni feriado desde el modal. Duración según tratamiento (15, 30 o 45) o inicio/fin.

Colisión en el cliente: mismo día, excluye `cancelado`, solape `horaInicio < horaFin del otro`. **El `PUT /api/appointments/:id` no rechaza solapes, feriados ni días con caja cerrada.**

**AM-BUG-001 confirmado por ejecución Node:** la comparación es de texto. `'9:00' < '14:30'` es `false` y `'9:00' > '20:00'` es `true`. Un horario sin cero a la izquierda no se evalúa como la hora que la persona cree. El regex de formato sí acepta `9:00` (`[01]?\d`).

Bloqueo “NO DAR”: el cliente no aplica `hasScheduleConflict` en ese modo. Puede solapar turnos reales. Requiere validación si un bloqueo debe impedir turnos.

### AM-HU-03 Agendar en el horario del consultorio

Como recepción, quiero agendar solo en lunes, martes o viernes entre 14:30 y 20:00, para respetar el horario de atención.

```gherkin
Escenario: jueves
  Cuando elijo un jueves y un tratamiento dentro de 14:30 a 20:00
  Entonces el modal no permite guardar

Escenario: solape
  Dado un turno confirmado de 15:00 a 15:30
  Cuando cargo otro de 15:15 a 15:45 el mismo día
  Entonces el modal muestra el conflicto

Escenario: la API no repite la regla
  Dado un turno ya guardado
  Cuando un cliente autenticado hace PUT con un horario solapado
  Entonces hoy el servidor puede aceptarlo
```

Casos: `AM-TC-006` a `AM-TC-011`.

## AM-M05 Finanzas y cierre

`computeDailySummary`:

- Esperado: suma `honorarios` si el estado no es `cancelado` (y no es bloqueo).
- Percibido: `estadoPago === 'pagado'` **o** (`estado === 'atendido'` y el pago no es `bonificado`).

Eso hace que un turno atendido y facturado a obra social entre en percibido. Requiere validación con el equipo: ¿“facturado” es plata ya cobrada?

El cierre guarda el `totalPercibido` que manda el cliente. El servidor no recalcula. La UI bloquea cambios de estado y pago con la caja cerrada; la API no.

### AM-HU-04 Cerrar la caja del día

Como recepción, quiero cerrar la caja con el total percibido del día, para que no se sigan cambiando cobros de esa fecha.

Casos: `AM-TC-012`, `AM-TC-013`.

## AM-M06 Importación

Pacientes: CSV público de Google Sheets, con chequeo de que la hoja no sea de turnos. Turnos: export XLSX de un spreadsheet con id en el cliente, deduplicación y fusión de bloqueos. Escritura a Sheets solo al borrar cancelados, si hay service account.

Caso: `AM-TC-014`.

## AM-M07 Backups

Export CSV/Excel, historial en servidor con poda a 30, config de backup nocturno. `POST /api/demo/load` borra pacientes y turnos y está autenticado, pero el modal de reset no lo ofrece aunque `DEPLOY.md` lo menciona.

Caso: `AM-TC-015`.

## AM-M08 Acción del paciente

Público, rate limit 30 / 15 min. Confirmar pone `confirmado`. Cancelar pone `cancelado`. No mira si el turno ya fue atendido, si es un bloqueo o si la fecha pasó.

### AM-HU-05 Responder el recordatorio

Como paciente, quiero confirmar o cancelar desde el enlace, para avisar sin ver el padrón.

```gherkin
Escenario: sin sesión de consultorio
  Dado un id de turno válido
  Cuando abro la pantalla pública y confirmo
  Entonces el turno queda confirmado
  Y no veo pacientes ni finanzas
```

Caso: `AM-TC-016`.

## Bugs

| ID | Estado | Resumen |
| --- | --- | --- |
| AM-BUG-001 | Confirmado (Node) | Comparación lexicográfica de horas sin padding |
| AM-BUG-002 | Potencial | El servidor no impide solapes |
| AM-BUG-003 | Potencial | La caja cerrada solo se respeta en la UI |
| AM-BUG-004 | Potencial | Un bloqueo puede solapar turnos |
| AM-BUG-005 | Potencial | El link público puede cancelar un turno ya atendido |
| AM-BUG-006 | Potencial | `DEPLOY.md` documenta “cargar demo” y el modal no tiene esa acción |
