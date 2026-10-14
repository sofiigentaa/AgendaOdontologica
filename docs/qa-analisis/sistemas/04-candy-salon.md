# Candy Salón de Eventos

Repositorio: `sofiigentaa/CandySalonDeEventos`. Express + React. Postgres si hay `DATABASE_URL` (u otras variables SQL); si no, datos demo en memoria que se pierden al reiniciar.

## Actores

Login compartido: `SALON_PASSWORD` y, si se define, lista `SALON_EMAILS`. Cookie `candy_session` 12 h. 8 intentos / 15 min. En producción la contraseña debe tener al menos 12 caracteres y el secreto 32. No hay roles. El email de la sesión se guarda en `user_id` y las consultas no filtran por ese campo: todas las personas autorizadas ven el mismo salón.

## CS-M01 Acceso

### CS-HU-01 Entrar al salón

Como quien administra el salón, quiero ingresar con la contraseña compartida, para ver eventos y caja.

Casos: `CS-TC-001`, `CS-TC-002`.

## CS-M02 Eventos y pagos

Montos enteros entre 0 y 1e9. Fecha `YYYY-MM-DD`, hora `HH:mm`. `depositAmount <= totalAmount`. `getTotalPaid <= totalAmount`.

**Total pagado** (`getTotalPaid`):

```text
si no hay historial → depositAmount
si algún pago tiene concepto "Seña inicial" → suma del historial
si no → suma del historial + depositAmount
```

**Saldo** = `max(0, totalAmount - getTotalPaid)`.

**Estado** (`computeStatus`):

| Estado | Condición |
| --- | --- |
| `no_deposit` | pagado 0 y no está completed ni cancelled |
| `deposit_paid` | pagado > 0 y < total |
| `fully_paid` | pagado >= total y total > 0 |
| `completed` | se conserva si ya estaba; Golondrina lo pone en eventos fully paid con fecha pasada |
| `cancelled` | el tipo existe y ninguna pantalla lo asigna |

Reserva: mismo día y misma hora, otro evento no cancelado → 409. Mismo día con otra hora: el cliente pide confirmación. Mismo día sin hora: el servidor no bloquea. Requiere validación.

La vista previa del modal de evento calcula `total - seña` y no usa el historial de abonos (CS-BUG-002). El preset de recordatorio de saldo en `RemindersView` resta solo la seña (CS-BUG-003).

Cotizador: bases por defecto día de semana 130000, viernes 160000, finde 195000. No hay calendario de feriados. Seña sugerida: redondeo a miles del porcentaje 30/50/100. Esas bases no se guardan en el servidor.

### CS-HU-02 Cargar un evento con seña

Como quien toma la reserva, quiero guardar el evento con seña y ver el saldo, para saber cuánto falta cobrar.

```gherkin
Escenario: seña inicial dentro del total
  Dado un total de 160000
  Cuando guardo una seña de 50000 como "Seña inicial"
  Entonces el saldo es 110000
  Y el estado es deposit_paid

Escenario: seña mayor al total
  Cuando la seña supera el total
  Entonces el servidor rechaza el evento

Escenario: mismo horario ocupado
  Dado un evento no cancelado ese día a las 21:00
  Cuando creo otro a las 21:00
  Entonces la API responde 409
```

Casos: `CS-TC-003` a `CS-TC-008`.

## CS-M03 Calendario

Muestra la lista ya filtrada, sin cancelados. Un evento `completed` sigue visible. Requiere validación si debería ocultarse.

Caso: `CS-TC-009`.

## CS-M04 Caja

Ingresos: cada ítem de `paymentHistory`, también de eventos cancelados o realizados. No resta el concepto `Devolución`. El resumen mensual de `App.tsx` sí resta `Devolución`. Por eso dos pantallas pueden mostrar totales distintos (CS-BUG-001).

```text
neto = ingresos del mes - egresos del mes
margen = ingresos > 0 ? neto / ingresos * 100 : 0
efectivo neto = ingresos en Efectivo - egresos en Efectivo
```

`filterMethod` existe en el estado y no hay control en la UI.

Egresos: monto entero > 0, categoría y concepto. El `eventId` es una referencia y no cambia el saldo del evento. Requiere validación si el margen debe ser por festejo.

### CS-HU-03 Ver la caja del mes

Como administración, quiero ver ingresos cobrados y egresos del mes, para saber el neto.

Casos: `CS-TC-010`, `CS-TC-011`.

## CS-M05 Recordatorios

Se persisten en la tabla `reminders`. El array `EventItem.reminders` no se guarda. Borrar el evento borra recordatorios con ese `eventId`.

Caso: `CS-TC-012`.

## CS-M06 Cotizador y contrato

El cotizador puede prellenar un evento nuevo. El contrato usa plantilla y, si hay `GEMINI_API_KEY`, Gemini. El texto generado no es una regla de negocio verificable sin la clave.

Caso: `CS-TC-013`.

## CS-M07 Respaldo

Exportar TXT/CSV. Restaurar lee un JSON embebido y actualiza React y `localStorage`. **No vuelve a escribir los eventos en la API** (CS-BUG-004). Al recargar, manda el servidor.

### CS-HU-04 Recuperar una copia

Como administración, quiero restaurar un respaldo y que quede en el servidor, para cambiar de computadora.

```gherkin
Escenario: restaurar y recargar
  Dado un respaldo con un evento que no está en el servidor
  Cuando lo importo y recargo la página
  Entonces hoy el evento importado no tiene por qué seguir
```

Ese escenario documenta el comportamiento actual. El resultado deseado por el negocio está abierto.

Caso: `CS-TC-014`.

## CS-M08 Golondrina

Aprueba propuestas (cobro de saldo, checklist, cierre). Cerrar evento realizado exige, en la sugerencia, evento `fully_paid` y fecha pasada. Requiere validación: ¿se puede realizar un evento con saldo?

Caso: `CS-TC-015`.

## Seguridad funcional

`/api/health` y auth son públicos. El resto pide sesión. Herramientas demo (`clear-all`, `reset-demo`) solo fuera de producción o con `ALLOW_DEMO_RESET=true`.

Caso: `CS-TC-016`.

## Bugs

| ID | Estado | Resumen |
| --- | --- | --- |
| CS-BUG-001 | Potencial | La caja no resta devoluciones y el resumen del mes sí |
| CS-BUG-002 | Potencial | El saldo del formulario ignora abonos posteriores a la seña |
| CS-BUG-003 | Potencial | El recordatorio rápido de saldo usa total − seña |
| CS-BUG-004 | Potencial | Restaurar backup no persiste en el servidor |
| CS-BUG-005 | Potencial | No hay forma de marcar `cancelled` |
| CS-BUG-006 | Potencial | Al leer de la base, `location` se pisa con el nombre del salón |

## Reglas abiertas

Cancelación y devolución de seña, feriados con tarifa de finde, varios eventos el mismo día sin hora, multi-usuario, y si el backup debe reemplazar la base.
