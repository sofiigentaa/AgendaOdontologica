# 📋 Matriz Integral de Casos de Prueba (QA Test Cases)
### Aplicación: **Consultorio Odontológico Marie - Yani**
**Versión:** 2.0.0 (Lista para Producción)  
**Fecha de Actualización:** Agosto 2026  
**Objetivo:** Protocolo exhaustivo de verificación funcional, pruebas de regresión, integración y aceptación para el sistema integral de gestión de consultorio, agenda, pacientes, finanzas e IA.

---

## 📑 Índice General de Módulos de Prueba

1. [Módulo 1: Gestión Integral de Pacientes y Contactos](#módulo-1-gestión-integral-de-pacientes-y-contactos)
2. [Módulo 2: Buscadores Predictivos, Autocompletado y Selección Rápida](#módulo-2-buscadores-predictivos-autocompletado-y-selección-rápida)
3. [Módulo 3: Ficha Médica, Historia Clínica, Notas y Archivos](#módulo-3-ficha-médica-historia-clínica-notas-y-archivos)
4. [Módulo 4: Calendario, Vistas (Mes / Lista) y Navegación Inteligente](#módulo-4-calendario-vistas-mes--lista-y-navegación-inteligente)
5. [Módulo 5: Agendamiento, Detección de Colisiones y Tratamientos](#módulo-5-agendamiento-detección-de-colisiones-y-tratamientos)
6. [Módulo 6: Edición y Bloqueo Seguro de Paciente en Turnos](#módulo-6-edición-y-bloqueo-seguro-de-paciente-en-turnos)
7. [Módulo 7: Finanzas, Costos y Liquidaciones Marie / Yani](#módulo-7-finanzas-costos-y-liquidaciones-marie--yani)
8. [Módulo 8: Asistente IA (Agendamiento por Lenguaje Natural y Notas)](#módulo-8-asistente-ia-agendamiento-por-lenguaje-natural-y-notas)
9. [Módulo 9: Recordatorios, Notificaciones y Envíos por WhatsApp](#módulo-9-recordatorios-notificaciones-y-envíos-por-whatsapp)
10. [Módulo 10: Carpeta de Obras Sociales y Nomencladores PDF](#módulo-10-carpeta-de-obras-sociales-y-nomencladores-pdf)
11. [Módulo 11: Copias de Seguridad (Exportar / Importar JSON) y Reset de Agenda](#módulo-11-copias-de-seguridad-exportar--importar-json-y-reset-de-agenda)
12. [Módulo 12: Pruebas de Usabilidad, Responsive y Rendimiento](#módulo-12-pruebas-de-usabilidad-responsive-y-rendimiento)
13. [Checklist Final de Firma de Calidad para Producción](#checklist-final-de-firma-de-calidad-para-producción)

---

## Módulo 1: Gestión Integral de Pacientes y Contactos

| ID | Caso de Prueba | Precondiciones | Pasos de Ejecución | Resultado Esperado | Prioridad | Estado |
|---|---|---|---|---|:---:|:---:|
| **TC-PAC-01** | Alta de Paciente Particular | Sistema iniciado en pestaña Pacientes o Calendario. | 1. Click en `+ Nuevo Contacto` o `+ Nuevo Paciente`.<br>2. Ingresar Nombre y Apellido, Teléfono principal.<br>3. Activar el interruptor **"Atención Particular"**.<br>4. Presionar `Guardar Paciente`. | El paciente se guarda en la base de datos local y aparece con distintivo verde de **Particular**. Notificación Toast de éxito. | Alta | 🟩 Pasa |
| **TC-PAC-02** | Alta de Paciente con Prepaga / Obra Social | Sistema iniciado. | 1. Abrir modal de nuevo paciente.<br>2. Desmarcar Particular.<br>3. Seleccionar Obra Social (ej: OSDE, Swiss Medical, Galeno) e ingresar **N° de Afiliado**.<br>4. Guardar. | El paciente se guarda reflejando el logo/nombre de su prepaga y número de credencial visible en todas las vistas. | Alta | 🟩 Pasa |
| **TC-PAC-03** | Modificación de Datos de Paciente | Paciente existente en la lista. | 1. En la tarjeta del paciente, presionar botón Editar (`✏️`).<br>2. Modificar teléfono, email o dirección.<br>3. Presionar `Guardar Cambios`. | Los cambios se persisten inmediatamente en la ficha y en todos los turnos asociados. | Alta | 🟩 Pasa |
| **TC-PAC-04** | Eliminación de Paciente con Confirmación | Paciente sin turnos críticos o seleccionado. | 1. Presionar ícono de eliminar (`🗑️`) en la tarjeta.<br>2. Verificar modal de confirmación.<br>3. Confirmar eliminación. | El paciente es eliminado de la base de datos y se actualiza el contador total de pacientes. | Media | 🟩 Pasa |
| **TC-PAC-05** | Filtros de la Barra de Contactos | Pacientes cargados con diferentes obras sociales y favoritos. | 1. Marcar pacientes con estrella (`⭐`).<br>2. Presionar filtro `Favoritos`.<br>3. Seleccionar una prepaga en el desplegable de filtro.<br>4. Presionar `Con Notas`. | La vista filtra en tiempo real mostrando únicamente los contactos que coinciden con los criterios seleccionados. | Media | 🟩 Pasa |
| **TC-PAC-06** | Acciones Rápidas: WhatsApp y Llamada | Paciente con teléfono válido. | 1. Presionar el ícono de WhatsApp en la tarjeta.<br>2. Presionar el ícono de llamada. | Abre WhatsApp con el número preformateado y el marcador telefónico respectivamente. | Alta | 🟩 Pasa |
| **TC-PAC-07** | Compartir Ficha y Exportar vCard (.vcf) | Paciente seleccionado. | 1. Abrir menú de opciones del paciente y presionar `Compartir Contacto`.<br>2. Probar copiar datos en texto, ver código QR y `Exportar vCard`. | Se descarga el archivo `.vcf` compatible con teléfonos móviles (Android/iOS) y se generan los datos listos para enviar. | Media | 🟩 Pasa |

---

## Módulo 2: Buscadores Predictivos, Autocompletado y Selección Rápida

| ID | Caso de Prueba | Precondiciones | Pasos de Ejecución | Resultado Esperado | Prioridad | Estado |
|---|---|---|---|---|:---:|:---:|
| **TC-BUS-01** | Búsqueda Predictiva en Calendario por Nombre | Pacientes cargados en el sistema. | 1. En la barra superior del Calendario, tipear las primeras letras del nombre (ej: *"Car"* o *"Guz"*). | Se despliega la lista flotante en tiempo real con sugerencias coincidentes. | Alta | 🟩 Pasa |
| **TC-BUS-02** | Selección desde Sugerencias de Autocompletado | Lista desplegada. | 1. Navegar con flechas ↑ / ↓ o hacer click en el paciente sugerido. | Se abre inmediatamente la **Ficha Médica Personal** del paciente seleccionado. | Alta | 🟩 Pasa |
| **TC-BUS-03** | Despliegue de Lista Completa al hacer click | Barra de búsqueda vacía. | 1. Hacer click en el campo o en el ícono de flecha hacia abajo. | Se visualiza el listado completo ordenado alfabéticamente con distintivos de cobertura. | Media | 🟩 Pasa |
| **TC-BUS-04** | Buscador en Modal de Agendar Turno (Sin preselección) | Modal `Agendar Turno` abierto. | 1. Verificar que el campo de paciente comience **completamente vacío**.<br>2. Escribir nombre, DNI o teléfono.<br>3. Seleccionar el paciente. | El buscador filtra en tiempo real y, al seleccionar, muestra una única tarjeta de confirmación con cobertura y teléfono. | Crítica | 🟩 Pasa |
| **TC-BUS-05** | Botón Rápido "+ Nuevo Paciente" dentro del Buscador | Modal de turno o ficha. | 1. En el autocompletado, presionar `+ Nuevo Paciente`.<br>2. Crear el paciente en el submodal. | Al guardar, el nuevo paciente queda automáticamente seleccionado en el turno sin perder los datos ya ingresados. | Alta | 🟩 Pasa |

---

## Módulo 3: Ficha Médica, Historia Clínica, Notas y Archivos

| ID | Caso de Prueba | Precondiciones | Pasos de Ejecución | Resultado Esperado | Prioridad | Estado |
|---|---|---|---|---|:---:|:---:|
| **TC-FIC-01** | Historial Cronológico de Turnos en Ficha | Paciente con turnos pasados y futuros. | 1. Abrir la ficha médica del paciente.<br>2. Ingresar a la pestaña `Turnos`. | Se muestra el listado ordenado por fecha y hora con odontóloga, motivo, duración y estado (Atendido/Pendiente). | Alta | 🟩 Pasa |
| **TC-FIC-02** | Agregar Notas y Observaciones Clínicas | Ficha médica abierta. | 1. Ir a la pestaña `Notas`.<br>2. Escribir una observación clínica.<br>3. Elegir color de nota (amarillo, verde, azul, etc.) y presionar `Guardar Nota`. | La nota se almacena con fecha, hora exacta y color, visualizándose en la ficha. | Alta | 🟩 Pasa |
| **TC-FIC-03** | Carga de Archivos Adjuntos (Radiografías / Estudios) | Archivo JPG, PNG o PDF en el dispositivo. | 1. Ir a la pestaña `Archivos`.<br>2. Arrastrar o seleccionar un archivo (ej: radiografía panorámica).<br>3. Asignar título y guardar. | El archivo se guarda localmente y permite previsualización inmediata y descarga. | Media | 🟩 Pasa |
| **TC-FIC-04** | Recordatorios con Edición Inline (`✏️`) | Ficha médica abierta. | 1. Programar un recordatorio con fecha y hora.<br>2. Presionar el lápiz (`✏️`) para editar texto o fecha.<br>3. Guardar cambios y marcar como completado. | Se sincroniza en tiempo real con la campana de notificaciones de la cabecera. | Alta | 🟩 Pasa |
| **TC-FIC-05** | Edición Directa de Turno desde la Ficha Médica | Turno listado en la pestaña `Turnos`. | 1. Presionar botón `✏️ Editar` en el turno.<br>2. Modificar horario, duración o tratamiento.<br>3. Guardar. | Se abre el modal con el paciente bloqueado, se aplican los cambios y se actualiza de inmediato el calendario. | Alta | 🟩 Pasa |

---

## Módulo 4: Calendario, Vistas (Mes / Lista) y Navegación Inteligente

| ID | Caso de Prueba | Precondiciones | Pasos de Ejecución | Resultado Esperado | Prioridad | Estado |
|---|---|---|---|---|:---:|:---:|
| **TC-CAL-01** | Alternar Vista Mes vs. Lista Cronológica | Pestaña Calendario activa. | 1. Hacer click en `Vista Mes` y luego en `Lista de Turnos`. | La vista cambia fluidamente entre la cuadrícula mensual y el listado cronológico de tarjetas. | Alta | 🟩 Pasa |
| **TC-CAL-02** | Botón "Hoy" en Vista Mes (Posicionamiento con Offset) | Cuadrícula mensual activa en cualquier mes. | 1. Navegar a otro mes.<br>2. Presionar el botón `📅 Hoy`. | Regresa al mes en curso, resalta el día de hoy con borde verde brillante y la pantalla se desplaza mostrando la cabecera del día visible justo debajo de las barras fijas. | Alta | 🟩 Pasa |
| **TC-CAL-03** | Botón "Hoy" en Vista Lista (Centrado Vertical de Turno) | Pestaña Lista de Turnos activa. | 1. Presionar `📅 Hoy` o cambiar a `Lista de Turnos`. | La pantalla se desplaza y **centra verticalmente en el centro del viewport** la tarjeta del turno del día de hoy (o el turno próximo más cercano). | Alta | 🟩 Pasa |
| **TC-CAL-04** | Filtros de Odontóloga (Marie / Yani / Las dos juntas) | Turnos asignados a diferentes odontólogas. | 1. En la barra de filtros, presionar `Dra. Marie`, luego `Dra. Yani` y `Las dos juntas`.<br>2. Volver a presionar el botón activo para desmarcar. | Filtra al instante los turnos correspondientes. Al desmarcar, se vuelven a mostrar todos los turnos. | Alta | 🟩 Pasa |
| **TC-CAL-05** | Barra Fija Superior (Sticky Navigation & Filters) | Pantalla con múltiples turnos y scroll vertical. | 1. Desplazarse hacia abajo (scroll). | Tanto el menú principal como la barra de filtros y la cabecera del mes permanecen fijos arriba sin parpadear ni tapar contenido. | Alta | 🟩 Pasa |
| **TC-CAL-06** | Widget de Salto a Fecha (Selector y Escritura Libre) | Calendario abierto. | 1. En `Escribir día`, tipear `20/08`, `20-8` o `20/08/2026` y pulsar `IR`.<br>2. Probar seleccionar fecha en el selector nativo. | Navega directamente al día seleccionado y lo resalta. Si no tiene turnos, muestra pop-up flotante con opción de agendar. | Media | 🟩 Pasa |
| **TC-CAL-07** | Marcar Turno como Atendido / Pendiente (`✓`) | Turnos pendientes en el calendario. | 1. Presionar el botón de check (`✓`) en la tarjeta del turno. | El turno cambia visualmente a estado Atendido (verde) y se actualiza el cómputo en Finanzas y Liquidaciones. | Alta | 🟩 Pasa |

---

## Módulo 5: Agendamiento, Detección de Colisiones y Tratamientos

| ID | Caso de Prueba | Precondiciones | Pasos de Ejecución | Resultado Esperado | Prioridad | Estado |
|---|---|---|---|---|:---:|:---:|
| **TC-AGE-01** | Agendar Turno Completo | Paciente existente. | 1. Click en `+ Agendar Turno`.<br>2. Seleccionar paciente, fecha, horario (ej: 10:00) y odontóloga.<br>3. Elegir tratamiento de la lista (ej: *Limpieza Dental*).<br>4. Guardar. | El turno se crea con la duración prefijada (45 min), motivo y datos guardados correctamente en el calendario. | Crítica | 🟩 Pasa |
| **TC-AGE-02** | Campo de Fecha Unificado (Sin selector duplicado) | Modal de turno abierto. | 1. Inspeccionar la sección 2 ("Fecha del Turno"). | Se presenta un **único selector de fecha principal** acompañado de los botones rápidos `Hoy` y `Mañana`, sin campos repetidos. | Alta | 🟩 Pasa |
| **TC-AGE-03** | Presets de Tratamientos Odontológicos | Modal de turno abierto. | 1. Seleccionar *Endodoncia* o *Ortodoncia* en el selector de tratamientos. | Se autocompleta automáticamente la duración recomendada (ej: 60 o 90 min) y el texto del motivo de consulta. | Media | 🟩 Pasa |
| **TC-AGE-04** | Detección Inteligente de Colisiones de Horario | Turno existente a las 10:00 con Dra. Marie (45 min). | 1. Intentar agendar nuevo turno con Dra. Marie a las 10:15 en la misma fecha.<br>2. Presionar `Guardar Turno`. | El sistema detecta el solapamiento, bloquea el guardado accidental y muestra alerta clara indicando paciente y horario del turno en conflicto. | Crítica | 🟩 Pasa |
| **TC-AGE-05** | Turnos Simultáneos Permitidos para Distintas Odontólogas | Turno existente a las 10:00 con Dra. Marie. | 1. Agendar un turno a las 10:00 pero asignado a **Dra. Yani**.<br>2. Guardar. | El turno se guarda exitosamente ya que no hay conflicto de profesional. | Alta | 🟩 Pasa |
| **TC-AGE-06** | Formato Legible de Duraciones | Turno con duración de 75, 90 o 120 minutos. | 1. Visualizar tarjeta de turno en la vista mensual o lista. | La duración se formatea en formato natural: `1 h 15 min`, `1 h 30 min`, `2 h`. | Baja | 🟩 Pasa |

---

## Módulo 6: Edición y Bloqueo Seguro de Paciente en Turnos

| ID | Caso de Prueba | Precondiciones | Pasos de Ejecución | Resultado Esperado | Prioridad | Estado |
|---|---|---|---|---|:---:|:---:|
| **TC-EDI-01** | Paciente Bloqueado al Editar Turno | Turno previamente creado. | 1. Abrir un turno existente y presionar `✏️ Editar Turno`. | La sección del paciente aparece como **"1. Paciente Asignado"**, bloqueada y fija, impidiendo cambios accidentales de paciente. | Alta | 🟩 Pasa |
| **TC-EDI-02** | Visualización Limpia de Cobertura | Modal de edición abierto. | 1. Revisar la tarjeta de datos del paciente en el modal. | Se muestra de forma centrada: Nombre, Teléfono y distintivo de Cobertura **una sola vez** (Particular o Prepaga con su N° de Afiliado). | Media | 🟩 Pasa |
| **TC-EDI-03** | Modificación de Horario y Odontóloga | Turno en edición. | 1. Cambiar horario de 10:00 a 11:30 y reasignar odontóloga a *Las dos juntas*.<br>2. Guardar cambios. | El turno se reprograma y actualiza su distribución de honorarios al 50%/50%. | Alta | 🟩 Pasa |
| **TC-EDI-04** | Eliminación de Turno Individual | Modal de turno o vista de calendario. | 1. Presionar `Eliminar Turno`.<br>2. Confirmar la acción. | El turno es eliminado del calendario y se muestra notificación Toast de confirmación. | Alta | 🟩 Pasa |

---

## Módulo 7: Finanzas, Costos y Liquidaciones Marie / Yani

| ID | Caso de Prueba | Precondiciones | Pasos de Ejecución | Resultado Esperado | Prioridad | Estado |
|---|---|---|---|---|:---:|:---:|
| **TC-FIN-01** | Apertura de Modal Finanzas y Liquidaciones | Turnos atendidos con montos ingresados. | 1. En la barra superior, presionar `💰 Finanzas y Liquidaciones`. | Se abre el modal con selector de fecha (por defecto hoy) y tarjetas métricas consolidadas. | Alta | 🟩 Pasa |
| **TC-FIN-02** | Cálculo de Liquidación Individual Dra. Marie | Turno con cobro de $20.000, descartables $2.000, honorario 50%. | 1. Asignar turno a Dra. Marie.<br>2. Marcar como atendido y verificar tarjeta *Liquidación Marie*. | Calcula correctamente: (Ingreso - Costos) × % Honorario = ($20.000 - $2.000) × 50% = $9.000. | Crítica | 🟩 Pasa |
| **TC-FIN-03** | Cálculo de Liquidación Compartida (Las dos juntas) | Turno asignado a "Ambas" con cobro de $30.000. | 1. Verificar desglose en el resumen financiero. | Divide en partes iguales el 50% de la liquidación para Dra. Marie y el 50% para Dra. Yani. | Crítica | 🟩 Pasa |
| **TC-FIN-04** | Filtros de Estado en Finanzas (Todos / Atendidos / Pendientes) | Turnos con diferentes estados en la fecha seleccionada. | 1. Alternar entre `Todos`, `Atendidos` y `Pendientes`. | Filtra la tabla al instante permitiendo cargar cobros a turnos pendientes o ver los ya liquidados. | Media | 🟩 Pasa |
| **TC-FIN-05** | Botón Principal "Generar Liquidación Diaria" | Fecha con turnos seleccionada. | 1. Presionar el botón `Generar Liquidación Diaria` al pie del modal. | Genera el informe consolidado listo para exportación o impresión del cierre de jornada. | Alta | 🟩 Pasa |

---

## Módulo 8: Asistente IA (Agendamiento por Lenguaje Natural y Notas)

| ID | Caso de Prueba | Precondiciones | Pasos de Ejecución | Resultado Esperado | Prioridad | Estado |
|---|---|---|---|---|:---:|:---:|
| **TC-IA-01** | Agendamiento Inteligente por Texto/Voz | Paciente "Carlos García" registrado. | 1. Abrir Asistente IA (`✨`).<br>2. Escribir: *"Agendar a Carlos García para mañana a las 16 hs con Dra. Marie para una limpieza"*. | La IA interpreta paciente, fecha relativa, hora y odontóloga, creando el turno en el calendario y emitiendo Toast de confirmación. | Alta | 🟩 Pasa |
| **TC-IA-02** | Creación de Notas Médicas mediante IA | Paciente existente. | 1. Indicar a la IA: *"Agregar nota a Carlos García: Paciente presenta sensibilidad en molar inferior derecho"*. | La IA localiza la ficha del paciente e inserta la nota médica en su historial. | Alta | 🟩 Pasa |
| **TC-IA-03** | Consulta de Agenda y Turnos del Día | Turnos agendados en el calendario. | 1. Preguntar a la IA: *"¿Qué turnos tengo agendados para hoy?"*. | La IA lista los turnos con horarios, nombres de pacientes y tratamientos programados. | Media | 🟩 Pasa |

---

## Módulo 9: Recordatorios, Notificaciones y Envíos por WhatsApp

| ID | Caso de Prueba | Precondiciones | Pasos de Ejecución | Resultado Esperado | Prioridad | Estado |
|---|---|---|---|---|:---:|:---:|
| **TC-NOT-01** | Campana de Notificaciones en Cabecera | Recordatorios activos programados para hoy o vencidos. | 1. Observar el badge numérico en la campana (`🔔`).<br>2. Hacer click en la campana. | Se abre el modal con la lista de recordatorios pendientes ordenados por urgencia. | Alta | 🟩 Pasa |
| **TC-NOT-02** | Envío de Mensaje de WhatsApp de Turno | Turno agendado con paciente con teléfono. | 1. En la tarjeta del turno, presionar el ícono de WhatsApp.<br>2. Seleccionar *"Enviar Recordatorio de Turno"*. | Se abre WhatsApp con el mensaje prediseñado: *"Hola [Nombre], te recordamos tu turno en el Consultorio Marie - Yani el día [Fecha] a las [Hora] hs..."*. | Alta | 🟩 Pasa |
| **TC-NOT-03** | Completar Recordatorio desde Modal Central | Recordatorio pendiente en la lista. | 1. Marcar el checkbox del recordatorio. | Se marca como completado y se decrementa el contador del badge en la cabecera. | Media | 🟩 Pasa |

---

## Módulo 10: Carpeta de Obras Sociales y Nomencladores PDF

| ID | Caso de Prueba | Precondiciones | Pasos de Ejecución | Resultado Esperado | Prioridad | Estado |
|---|---|---|---|---|:---:|:---:|
| **TC-OBR-01** | Explorar Prestadoras Médicas | Modal `Carpeta Obras Sociales` abierto. | 1. Seleccionar OSDE, Swiss Medical, Galeno, PAMI, etc. | Muestra la sección organizada con normativas, requisitos y archivos adjuntos de cada prestadora. | Media | 🟩 Pasa |
| **TC-OBR-02** | Adjuntar PDF de Aranceles o Nomenclador | Archivo PDF disponible. | 1. Presionar `Subir Documento`.<br>2. Seleccionar PDF de aranceles vigentes. | El archivo se guarda en la carpeta correspondiente y queda disponible para descarga directa en cualquier momento. | Media | 🟩 Pasa |

---

## Módulo 11: Copias de Seguridad (Exportar / Importar JSON) y Reset de Agenda

| ID | Caso de Prueba | Precondiciones | Pasos de Ejecución | Resultado Esperado | Prioridad | Estado |
|---|---|---|---|---|:---:|:---:|
| **TC-BCK-01** | Exportar Copia de Seguridad JSON | Base de datos con pacientes, turnos y notas. | 1. Click en el botón de Descarga (`⬇️`) en la cabecera superior. | Se descarga un archivo `.json` completo con todos los pacientes, turnos, finanzas y recordatorios. | Crítica | 🟩 Pasa |
| **TC-BCK-02** | Importar Archivo de Respaldo | Archivo `.json` válido exportado previamente. | 1. Click en el botón de Subir (`⬆️`).<br>2. Seleccionar el archivo JSON. | El sistema valida el esquema, restaura todos los datos y notifica éxito. | Crítica | 🟩 Pasa |
| **TC-BCK-03** | Reset de Agenda (Conservando Pacientes) | Turnos y pacientes cargados. | 1. Presionar ícono de reinicio (`🔄`).<br>2. Elegir opción *"Borrar turnos del calendario (Conservar Pacientes)"*.<br>3. Confirmar. | Se eliminan únicamente los turnos agendados, manteniendo intactos todos los pacientes y sus fichas médicas. | Alta | 🟩 Pasa |
| **TC-BCK-04** | Restablecer Datos de Demostración Iniciales | Sistema en cualquier estado. | 1. En el modal de reinicio, elegir *"Restablecer datos de prueba"*. | Se cargan los pacientes y turnos de demostración preconfigurados. | Media | 🟩 Pasa |

---

## Módulo 12: Pruebas de Usabilidad, Responsive y Rendimiento

| ID | Caso de Prueba | Precondiciones | Pasos de Ejecución | Resultado Esperado | Prioridad | Estado |
|---|---|---|---|---|:---:|:---:|
| **TC-USA-01** | Diseño Adaptativo Mobile (<640px) | Dispositivo móvil o emulador responsive. | 1. Navegar por Calendario, Lista de Turnos, Ficha de Paciente y Finanzas. | La interfaz se adapta con botones táctiles de al menos 44px, tipografía legible y navegación fluida sin desbordamiento horizontal. | Alta | 🟩 Pasa |
| **TC-USA-02** | Persistencia Local Inmediata | Modificación de cualquier dato. | 1. Crear un turno o nota y recargar la página (`F5`). | Todos los datos permanecen guardados en `localStorage` sin pérdida de información. | Crítica | 🟩 Pasa |
| **TC-USA-03** | Rendimiento y Transiciones Suaves | Múltiples registros cargados. | 1. Cambiar de pestañas, filtrar pacientes y alternar meses. | Las transiciones son instantáneas (<100ms) sin bloqueos del hilo principal. | Alta | 🟩 Pasa |

---

## 📌 Checklist Final de Firma de Calidad para Producción

- [x] **Gestión de Pacientes**: Altas particulares y con obra social, edición, borrado y filtros funcionando al 100%.
- [x] **Autocompletado y Búsqueda**: Buscador en tiempo real activo en calendario, contactos y modal de turnos (con inicio vacío por defecto).
- [x] **Navegación y Estabilidad Fija**: Barras sticky, botón "Hoy" con offset superior en mes y centrado vertical en lista cronológica.
- [x] **Agendamiento y Detección de Colisiones**: Selector de fecha único y validación de turnos simultáneos por profesional.
- [x] **Finanzas y Liquidaciones**: Desglose exacto de porcentajes y costos para Dra. Marie, Dra. Yani y Las dos juntas.
- [x] **Copias de Seguridad y Reset**: Exportación / Importación JSON y borrado selectivo de turnos conservando pacientes.
- [x] **Compilación y Tipado**: 0 errores de TypeScript (`tsc --noEmit`) y build de producción optimizado.
