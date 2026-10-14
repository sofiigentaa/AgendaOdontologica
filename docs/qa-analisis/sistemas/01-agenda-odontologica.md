# Agenda Odontológica — Marie & Yani

Repositorio: `sofiigentaa/AgendaOdontologica`. Demo documentada: `https://agendaodontologica-cuvt.onrender.com`.  
Fuente de reglas: código de `server.ts`, `src/utils/*` y componentes. El documento funcional y el manual de casos de uso del repo se usan como referencia, y se marca cuando no coinciden con el código.

Stack: React 19, Vite, Express, Tailwind. Persistencia: Postgres si hay conexión; si no, memoria y archivo `agenda_storage.json`. El cliente también guarda en el navegador y muestra éxito antes de saber si el servidor aceptó el turno.

## Actores

| Actor de negocio | ¿El código lo distingue? |
| --- | --- |
| Personal del consultorio (Marie, Yani o recepción) | No. Una cookie de sesión habilita todas las pantallas, incluido vaciar la base. |
| Paciente | Sí, de forma acotada: solo el link público firmado de su turno. |

Contraseña de desarrollo si no hay `CONSULTORIO_PASSWORD` y no es producción: `admin123`. En producción el proceso no arranca si la contraseña tiene menos de 12 caracteres o `SESSION_SECRET` tiene menos de 32. Lista de emails: si `CONSULTORIO_EMAIL` está vacío, cualquier email con `@` entra con la contraseña correcta.

## AO-M01 Acceso

Pantalla de ingreso (`AuthModal`). Cookie `agenda_session`, HttpOnly, 12 horas, `SameSite=Strict`. Rate limit: 8 fallos por IP en una ventana (el mapa vive en memoria del proceso). Cambio de contraseña solo si hay base y la nueva tiene al menos 12 caracteres.

**Regla implementada:** email sin `@`, email fuera de la lista, o contraseña distinta, responden el mismo error: “Email o contraseña incorrectos”.

**Requiere validación:** ¿la recepción y cada odontóloga deben tener contraseñas distintas? Hoy no existe.

### AO-HU-01 Ingresar

Como personal del consultorio, quiero ingresar con el email y la contraseña del consultorio, para ver la agenda.

```gherkin
Escenario: ingreso válido
  Dado que la contraseña del consultorio es la configurada
  Cuando ingreso un email con @ y la contraseña correcta
  Entonces la cookie de sesión queda establecida
  Y veo Pacientes o Turnos y Agenda

Escenario: credencial incorrecta
  Cuando ingreso una contraseña distinta
  Entonces veo "Email o contraseña incorrectos"
  Y no veo la agenda
```

Casos: `AO-TC-001`, `AO-TC-002`, `AO-TC-003`, `AO-TC-004`.

## AO-M02 Pacientes

Alta y edición en `ContactFormModal`. La UI exige nombre y teléfono. Obra social: lista de `src/constants/insurances.ts` o texto libre “Otra”. Particular borra el número de afiliado al guardar. No hay validación de formato de email ni de teléfono más allá de “no vacío”. No hay control de duplicados.

El servidor `POST /api/contacts` exige `id` y no exige nombre ni teléfono.

**Borrar paciente:** se borran recordatorios, notas y adjuntos de ese id. **No se borran sus turnos.** Requiere validación: ¿debe bloquearse el borrado si hay turnos futuros?

Búsqueda (`contactFilters.ts`): nombre, teléfonos, email, obra social, afiliado, observaciones. Filtros: favoritos, particular, recordatorios activos, notas. El filtro `insurance` del tipo existe; el filtrado por prepaga concreta usa `selectedInsurance` por igualdad exacta del nombre.

### AO-HU-02 Registrar paciente

Como personal del consultorio, quiero registrar un paciente con nombre y teléfono, para agendarle turnos y contactarlo.

```gherkin
Escenario: alta particular
  Dado que estoy autenticado
  Cuando cargo nombre y teléfono y marco particular
  Entonces el paciente aparece en el listado
  Y veo el mensaje de contacto registrado

Escenario: falta el teléfono
  Cuando dejo el teléfono vacío y guardo
  Entonces veo "El teléfono principal es obligatorio"
  Y el paciente no se crea
```

Casos: `AO-TC-005` a `AO-TC-010`.

## AO-M03 Calendario y AO-M04 Turnos

Vistas: mes y lista. Filtro de odontóloga exclusivo: Yani solo Yani, Marie solo Marie, Ambas solo turnos conjuntos (`matchesDentistFilter`). Un valor desconocido se normaliza a Yani.

Presets de motivo y duración (`treatments.ts`): Consulta 20, Limpieza 40, Restauración 45, TC uni 60, TC bi 75, TC multi 100, Especiales 120, Otro 30. Si no hay duración, la colisión usa 30.

**Colisión implementada** (`appointmentConflicts.ts` y `POST /api/appointments`):

- Dos rangos chocan si comparten un intervalo abierto. 09:00–09:30 y 09:30–10:00 no chocan.
- Misma odontóloga choca. Marie y Yani a la misma hora no chocan.
- “Ambas” choca con Marie y con Yani.
- Turno `completed` o `whatsappStatus === 'cancelled'` no bloquea.
- Turno existente sin odontóloga se trata como Yani. Turno nuevo sin odontóloga se trata como Marie. Esa asimetría está en el código y requiere validación.

**Inconsistencia UI / servidor (AO-BUG-001, potencial):** en un alta, si hay choque, la UI ofrece “Agendar de todos modos” y llama a `processSave`. `handleSaveAppointment` actualiza el estado local y muestra “Nuevo turno agendado” sin esperar la respuesta. El servidor responde 409 y `upsertAppointment` ignora ese fallo. Al editar, la UI ni siquiera muestra el aviso de choque y guarda igual. El manual del repo documenta el botón de forzar; el servidor no lo permite.

### AO-HU-03 Agendar sin pisar a la misma odontóloga

Como personal del consultorio, quiero que el sistema avise si Marie (o Yani) ya tiene ese horario, para no dar dos turnos a la vez.

```gherkin
Escenario: misma odontóloga, horarios solapados
  Dado un turno de Marie de 09:00 a 09:20 pendiente
  Cuando agendo a Marie el mismo día a las 09:10 por 20 minutos
  Entonces la interfaz advierte el choque
  Y el servidor rechaza el alta con 409 si igual se envía

Escenario: odontólogas distintas
  Dado un turno de Marie a las 09:00
  Cuando agendo a Yani el mismo día a las 09:00
  Entonces el turno se guarda

Escenario: franjas pegadas
  Dado un turno de Yani de 09:00 a 09:30
  Cuando agendo a Yani de 09:30 a 10:00
  Entonces no hay colisión
```

Casos: `AO-TC-011` a `AO-TC-018`, `AO-TC-030`.

## AO-M05 Ficha

Historial de turnos, notas (colores yellow/pink/blue/green/amber), recordatorios con fecha y completado, adjuntos en data URL. WhatsApp abre `wa.me` si hay teléfono; el envío no lo hace este sistema.

### AO-HU-04 Dejar una nota en la ficha

Como personal del consultorio, quiero anotar una observación en la ficha, para verla la próxima vez que atiendo a esa persona.

Casos: `AO-TC-019`, `AO-TC-029`.

## AO-M06 Finanzas

Fórmula implementada y cubierta por `finance.test.ts`:

```text
egresos = descartables + estampillas + materiales + mecánico dental
balance = max(0, ingresos - egresos)
honorario = balance * (porcentaje / 100)
```

Porcentaje vacío o inválido: 50. Tope 0–100. Odontóloga Marie: todo el honorario a Marie. Yani: todo a Yani. Ambas: mitad y mitad. Nombre desconocido: Yani.

La liquidación diaria suma **solo** turnos con `completed === true`. La UI de finanzas no deja elegir una fecha posterior a hoy (`selectedDate > hoy` vuelve a hoy).

El documento funcional dice `honorario = (ingreso − gastos) × porcentaje`. El código además pone el balance en cero si los gastos superan el ingreso, así que no hay honorario negativo. Esa decisión está testeada. Si el negocio quiere ver la pérdida, hay que validarlo (AO-BUG-004 es comportamiento implementado, no un fallo, salvo que el negocio diga lo contrario).

### AO-HU-05 Liquidar el día

Como personal del consultorio, quiero ver el honorario del día solo de turnos atendidos, para pagar a Marie y a Yani lo que corresponde.

```gherkin
Escenario: turno atendido de Marie al 50%
  Dado un turno atendido de Marie con ingreso 10000 y egresos 1000
  Entonces el honorario de Marie es 4500
  Y el de Yani es 0

Escenario: turno pendiente
  Dado el mismo turno sin marcar atendido
  Cuando miro la liquidación del día
  Entonces ese turno no suma honorario
```

Casos: `AO-TC-020` a `AO-TC-023`.

## AO-M07 Obras sociales

Carpeta de archivos por nombre de prepaga. El alta va por API de sesión. No hay una regla de negocio de nomenclador más allá de guardar el archivo. Requiere validación: tamaño máximo, tipos permitidos, si un archivo es visible para las dos odontólogas (hoy sí, misma sesión).

Caso: `AO-TC-031`.

## AO-M08 Respaldo y borrado

Export JSON / TXT e import. `POST /api/db/clear` con sesión puede vaciar turnos, recordatorios o todo. `GET /api/db/all` no usa la cookie de sesión: usa `isAdminRequest`. Sin `ADMIN_API_TOKEN`, en no-producción esa lectura responde 200. En producción sin token responde 403.

Casos: `AO-TC-026`, `AO-TC-027`, `AO-TC-028`.

## AO-M09 Confirmación del paciente

`GET/POST /api/public/appointment/:token` sin sesión. El token es `id` + firma HMAC. Sin `SESSION_SECRET` en producción la firma no se puede resolver y el link no abre. Links viejos sin firma solo si `ALLOW_LEGACY_PUBLIC_LINKS=true`. Cancelar marca `whatsappStatus = cancelled` y libera el horario. No hay regla que impida confirmar un turno ya atendido: requiere validación.

La respuesta pública incluye nombre, fecha, hora, odontóloga y motivo. No incluye teléfonos ni notas clínicas en el JSON armado en el handler leído.

### AO-HU-06 Confirmar desde el link

Como paciente, quiero confirmar o cancelar mi turno desde el enlace, para que el consultorio vea mi respuesta sin darme acceso al resto de la agenda.

Casos: `AO-TC-024`, `AO-TC-025`.

## AO-M10 Opcionales

Google Calendar y Gmail dependen de Firebase/OAuth. El asistente usa Gemini si hay clave. WhatsApp es un enlace. No forman parte del camino crítico de agenda. Candidatos a automatización: no, salvo un mock.

## Dependencias

```text
Paciente → Turno → (estado atendido) → Liquidación
Turno cancelado → deja de bloquear horario
Link público → actualiza whatsappStatus del turno
Borrar paciente → no borra turnos
```

## Bugs de este sistema

| ID | Estado | Resumen |
| --- | --- | --- |
| AO-BUG-001 | Potencial | “Agendar de todos modos” y la edición muestran éxito local aunque el servidor responde 409 |
| AO-BUG-002 | Potencial | Borrar paciente deja turnos huérfanos |
| AO-BUG-003 | Potencial | `POST /api/contacts` acepta paciente sin nombre ni teléfono |
| AO-BUG-004 | Implementado, a validar | Gastos mayores al ingreso dejan honorario en 0, no en negativo |
| AO-BUG-005 | Potencial | Firestore rules del repo permiten lectura y escritura total si ese proyecto sigue en uso |
| AO-BUG-006 | Potencial | `GET /api/db/all` queda abierto si el deploy no está en `NODE_ENV=production` y no hay token admin |

Detalle en [bugs.csv](../csv/bugs.csv).
