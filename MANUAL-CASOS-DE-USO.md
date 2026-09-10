# Manual de casos de uso — Agenda Odontológica

Actor principal: personal del consultorio (Marie, Yani o recepción).  
Precondición común: haber ingresado al sistema (email + contraseña de demo).

---

## CU-01 Ingresar al sistema

**Objetivo:** entrar a la agenda.  
**Pasos:**

1. Abrir la URL o `http://localhost:3000`
2. Completar email
3. Completar contraseña (`admin123` en demo)
4. Pulsar **Ingresar**

**Resultado:** se ve el calendario o el listado de pacientes.

---

## CU-02 Registrar un paciente

**Pasos:**

1. Ir a **Pacientes**
2. Pulsar **+ Nuevo Paciente**
3. Completar nombre y teléfono (obligatorios)
4. Indicar particular u obra social
5. Pulsar **Registrar Contacto**

**Resultado:** el paciente aparece en el listado. Mensaje de confirmación.

---

## CU-03 Buscar un paciente

**Pasos:**

1. En la barra de búsqueda escribir nombre, teléfono, obra social o n° de afiliado
2. Usar chips: favoritos, particular, recordatorios, notas

**Resultado:** la lista se filtra.

---

## CU-04 Agendar un turno

**Precondición:** existe el paciente (o se crea desde el modal).  

**Pasos:**

1. Ir a **Turnos y Agenda**
2. Pulsar **+ Turno** en el día (o **Agendar**)
3. Elegir paciente
4. Elegir odontóloga (Marie / Yani / Ambas)
5. Fecha y horario 24 hs
6. Motivo (puede usarse un preset: Consulta, Limpieza, etc.)
7. Pulsar **Agendar Turno**
8. Si el horario está ocupado: cambiar hora o **Agendar de todos modos**

**Resultado:** el turno aparece en el calendario y en la lista.

---

## CU-05 Ver el calendario

**Pasos:**

1. **Vista Mes** para ver el mes
2. **Lista de Turnos** para ver el orden del día
3. **Hoy** para volver al día actual
4. Filtrar por Marie, Yani o ambas

**Resultado:** se visualizan los turnos del período.

---

## CU-06 Editar o eliminar un turno

**Pasos:**

1. Abrir el turno desde el calendario o la ficha
2. Cambiar horario, odontóloga o motivo y guardar  
   **o** eliminarlo con confirmación

**Resultado:** el calendario se actualiza.

---

## CU-07 Marcar turno como atendido

**Pasos:**

1. En el calendario, marcar el turno como atendido

**Resultado:** entra en la liquidación del día. Un cancelado no muestra “marcar atendido”.

---

## CU-08 Ver ficha del paciente

**Pasos:**

1. Buscar y abrir el paciente
2. Ver historial de turnos, notas, recordatorios y archivos
3. Agregar nota o recordatorio si hace falta

**Resultado:** queda registrada la observación en la ficha.

---

## CU-09 Liquidar el día (finanzas)

**Pasos:**

1. Pulsar **Finanzas**
2. Elegir la fecha (no posterior a hoy)
3. Completar ingresos y gastos del turno atendido
4. Ver totales Marie / Yani
5. Generar o copiar la liquidación diaria si se necesita

**Resultado:** se ven honorarios del día solo de turnos atendidos.

---

## CU-10 Exportar / importar copia de seguridad

**Pasos:**

1. Exportar JSON (backup completo) o TXT (turnos del día siguiente / listado de pacientes)
2. En otra PC, importar el archivo

**Resultado:** se recuperan pacientes y/o turnos. Sirve si no hay nube.

---

## CU-11 Contactar por WhatsApp

**Pasos:**

1. Desde la ficha o el turno, abrir WhatsApp
2. Enviar el mensaje (el teléfono del paciente debe estar cargado)

**Resultado:** se abre wa.me con el número. El envío real lo hace WhatsApp, no el sistema.

---

## CU-12 Confirmar o cancelar turno (paciente)

**Pasos:**

1. El paciente abre el enlace de confirmación
2. Confirma o cancela

**Resultado:** el turno queda confirmado o el horario libre (si el enlace y el servidor están disponibles).

---


