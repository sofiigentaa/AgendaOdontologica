# Inventario funcional y plan de análisis

Fecha de relevamiento: 2026-10-14.  
Método: lectura de los repositorios en GitHub de `sofiigentaa`, más ejecución puntual de dos comparaciones de fecha/hora. No se modificó código de las aplicaciones.

## Alcance

El pedido habla de “el sistema” y después aclara que son repositorios de GitHub. En la cuenta hay cursos, sitios y productos. Este análisis cubre los **cinco sistemas de gestión** con dominio de negocio propio. El resto queda fuera, con el motivo al final de este documento.

| ID | Repositorio | Producto | Commit de referencia | Persistencia |
| --- | --- | --- | --- | --- |
| AO | [AgendaOdontologica](https://github.com/sofiigentaa/AgendaOdontologica) | Consultorio Marie & Yani | `main` local del workspace | Express + Postgres/memoria + local; cookie de sesión |
| AM | [AgendaMedica](https://github.com/sofiigentaa/AgendaMedica) | Estética Láser Rosario | `main` clonado 2026-10-14 | Express + Prisma (SQLite dev / Postgres prod) + JWT |
| SK | [SistemaKiosco](https://github.com/sofiigentaa/SistemaKiosco) | Granja y Kiosco Don Ramón | `main` clonado 2026-10-14 | React + localStorage, o Supabase si hay env |
| CS | [CandySalonDeEventos](https://github.com/sofiigentaa/CandySalonDeEventos) | Candy Salón de Eventos | `main` clonado 2026-10-14 | Express + Postgres o memoria de demo |
| IG | [Gestion-de-Ingresos-y-Gastos-para-Emprendedor](https://github.com/sofiigentaa/Gestion-de-Ingresos-y-Gastos-para-Emprendedor) | Control financiero de emprendedor | `main` clonado 2026-10-14 | localStorage o Supabase |

## Hallazgo transversal de roles

Ninguno de los cinco implementa roles ni permisos por pantalla.

| Sistema | Lo que el código autentica | Lo que el negocio podría esperar y el código no separa |
| --- | --- | --- |
| AO | Una contraseña de consultorio. Emails opcionales en `CONSULTORIO_EMAIL`. Cualquier sesión puede borrar la agenda. | Recepción, Marie, Yani, paciente (este último solo por link firmado). |
| AM | Una contraseña compartida. JWT `{ clinic: true }`. | Recepción y profesionales. |
| SK | Si hay Supabase: un usuario autenticado dueño de sus filas. Sin Supabase: sin login. La doc pide la misma cuenta en todos los equipos. | Cajero, depósito, dueño. |
| CS | Email + contraseña compartida (`SALON_PASSWORD`). `user_id` se guarda y no filtra consultas. | Encargado, administración. |
| IG | Si hay Supabase: un usuario ve solo sus filas (`user_id = auth.uid()`). Sin Supabase: sin login. | Dueño vs colaborador. |

Las historias usan actores de negocio. Donde el sistema no distingue ese actor, el criterio de aceptación lo dice y la pregunta queda abierta en [07](./07-preguntas-y-requisitos-faltantes.md).

## Inventario de módulos

### Agenda Odontológica

| Módulo | Pantallas / componentes | Datos principales |
| --- | --- | --- |
| AO-M01 Acceso | `AuthModal`, `ChangePasswordModal` | Email, contraseña, cookie `agenda_session` 12 h |
| AO-M02 Pacientes | `ContactFormModal`, `ContactCard`, filtros | Nombre y teléfono obligatorios en UI; obra social o particular |
| AO-M03 Calendario | `CalendarView`, `DateJumpWidget` | Mes, lista, hoy, filtro Yani / Marie / Ambas |
| AO-M04 Turnos | `ScheduleAppointmentModal` | Paciente, fecha, hora, duración, odontóloga, motivo, colisión |
| AO-M05 Ficha | `ContactDetailModal`, notas, recordatorios, adjuntos | Historial del paciente |
| AO-M06 Finanzas | `FinanceSummaryModal` | Ingresos, descartables, estampillas, materiales, mecánico, % honorario |
| AO-M07 Obras sociales | `InsuranceFolderModal` | PDFs por prepaga |
| AO-M08 Respaldo y borrado | export/import, `ResetAgendaModal` | JSON y TXT |
| AO-M09 Confirmación del paciente | `PatientConfirmationView`, API pública | Token firmado, confirmar o cancelar |
| AO-M10 Opcionales | WhatsApp, Google Calendar/Gmail, asistente | Dependen de cuentas externas |

### Agenda Médica

| Módulo | Pantallas | Datos principales |
| --- | --- | --- |
| AM-M01 Acceso | `LoginScreen` | Contraseña única, cookie 12 h, 8 intentos / 15 min |
| AM-M02 Pacientes | `PatientManager`, `PatientModal`, import | DNI único, nombre, apellido, teléfono |
| AM-M03 Turnos y agenda | `CalendarView`, `AppointmentModal` | Lun/Mar/Vie, 14:30–20:00, tratamientos 15/30/45 min |
| AM-M04 Feriados y bloqueos | calendario, `Holiday` | Feriado, no laborable, vacaciones, bloqueo “NO DAR” |
| AM-M05 Finanzas y cierre | `DailyFinancialSummary`, `CierreCajaModal` | Honorarios, estado de pago, un cierre por fecha |
| AM-M06 Importación y Sheets | sync de turnos, import de pacientes | Lectura por enlace; escritura solo al limpiar cancelados |
| AM-M07 Backups | `BackupManager` | CSV/XLSX, historial máx. 30, backup nocturno |
| AM-M08 Acción del paciente | `PatientActionScreen` | `?confirm_turno=` / `?cancel_turno=` sin login |

### Sistema Kiosco

| Módulo | Pantallas | Datos principales |
| --- | --- | --- |
| SK-M01 Acceso y modo local | `LoginScreen`, `AuthGate` | Login solo si hay Supabase |
| SK-M02 Golondrina | `CalandriaHome` | Propuestas con aprobación; no ejecuta sola |
| SK-M03 Punto de venta | `PosScreen` | Carrito, descuento de ticket, efectivo, fiado, código de barras |
| SK-M04 Inventario | `InventoryScreen` | Precio, stock, mínimo, vencimiento, margen |
| SK-M05 Alertas y liquidación | `AlertsScreen`, `LiquidationModal` | Stock bajo, agotado, por vencer, vencido |
| SK-M06 Caja | `CashRegisterModal` | Apertura, arqueo, diferencia |
| SK-M07 Historial de ventas | `SalesHistoryScreen` | Filtros, cobro de fiado, CSV |
| SK-M08 Reportes | `ReportsScreen` | Día, semana, mes, todo; margen |
| SK-M09 Asistente | `AsistenteKiosco` | Respuestas por palabras clave, sin modelo de IA |

### Candy Salón de Eventos

| Módulo | Pantallas | Datos principales |
| --- | --- | --- |
| CS-M01 Acceso | `LoginScreen` | Cookie `candy_session` 12 h |
| CS-M02 Eventos y pagos | tabla, cards, `EventModal`, `PaymentModal` | Presupuesto, seña, abonos, estado |
| CS-M03 Calendario | `CalendarView` | Mes, alta en un día |
| CS-M04 Caja | `CashflowView` | Ingresos por fecha de pago vs egresos |
| CS-M05 Recordatorios | `RemindersView` | Tareas globales y por evento |
| CS-M06 Cotizador y contrato | `QuoteCalculatorModal`, `ContractModal` | Bases 130k / 160k / 195k; contrato plantilla o Gemini |
| CS-M07 Respaldo | `BackupModal` | TXT/CSV/JSON |
| CS-M08 Golondrina | home y panel | Cobros, preparativos, cierre de eventos realizados |

### Gestión de ingresos y gastos

| Módulo | Pantallas | Datos principales |
| --- | --- | --- |
| IG-M01 Acceso | `LoginScreen` | Solo en modo nube |
| IG-M02 Dashboard | `Dashboard` | Mes, ingresos, egresos, margen, registro rápido |
| IG-M03 Día | `DailyView` | Movimientos de una fecha |
| IG-M04 Categorías | `CategoryBreakdown` | Desglose; no hay alta de categorías en UI |
| IG-M05 Historial | `TransactionsTable`, `TransactionModal` | Filtros y CRUD |
| IG-M06 Exportación y reset | `ExportModal`, `ResetDataModal` | CSV, JSON, vaciar, muestra, categorías default |

## Plan de análisis (ejecutado)

1. Inventariar módulos, pantallas y el modelo real de acceso. Hecho en este documento.
2. Extraer reglas que el código implementa y separarlas de las que hay que preguntar. Hecho por sistema.
3. Escribir historias “Como / quiero / para” con Gherkin solo sobre comportamiento observable.
4. Diseñar casos positivos, negativos, de borde, de integración, de regresión, de seguridad funcional y de permisos.
5. Registrar bugs con evidencia y estado (confirmado o potencial).
6. Marcar candidatos a Playwright según estabilidad del flujo y selectores ya existentes.
7. Armar la matriz de trazabilidad.

## Fuera de alcance

| Repositorio | Motivo |
| --- | --- |
| SG | Landing comercial, sin operación transaccional |
| Planifica-Estudia | Herramienta de estudio, no de gestión de un negocio |
| PlayWright-QA-automation, Curso-de-Playwright, Fundamentos-de-TypeScript, POO, cursos HTML/JS/Python | Material de curso |
| seginfo-toolkit, monitor-ambiental-rosario, Scraping-automatizado-de-sitio-inmobiliario | Otras herramientas, no estos sistemas de gestión |

Si el alcance debía incluir alguno de esos repos, hay que decirlo: el método de este paquete se puede repetir sobre ese código.

## Límites de esta corrida

- No se desplegó ni se recorrió en navegador Agenda Odontológica, Agenda Médica, Kiosco ni Candy. Sus defectos de UI quedan como análisis estático, salvo las dos ejecuciones Node citadas en bugs.
- En Ingresos y Gastos, el conteo vacío del modal de reset y la categoría ignorada se confirman por el código (la prop no se pasa; el `categoryId` no se usa). Una corrida Playwright del relevamiento también vio el texto vacío y la categoría equivocada.
- No se inventan políticas de cancelación, seña, feriados del salón, umbral único de vencimiento ni separación de cajero/dueño.
