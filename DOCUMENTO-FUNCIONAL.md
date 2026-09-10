# Documento funcional — Agenda Odontológica

**Sistema:** Consultorio Marie & Yani  
**Versión:** mi-agenda(8)  
**Demo:** https://agendaodontologica-cuvt.onrender.com  
**Alcance:** herramienta de gestión de agenda para un consultorio con dos odontólogas.

## 1. Objetivo

Permitir al equipo del consultorio:

- registrar y consultar pacientes
- agendar, editar y cancelar turnos
- ver el día y el mes de trabajo
- liquidar honorarios de Marie, Yani o ambas
- guardar copias de seguridad por si no hay internet

## 2. Actores

| Actor | Descripción |
| --- | --- |
| Odontóloga / secretaría | Usa la agenda (Marie, Yani o quien reciba turnos) |
| Paciente | Solo confirma o cancela un turno por enlace (si se comparte) |
| Visitante | No debe ver fichas clínicas (hoy el acceso de demo no es un login real) |

## 3. Módulos

| Módulo | Qué hace |
| --- | --- |
| Acceso | Pantalla de ingreso al sistema |
| Pacientes | Alta, edición, búsqueda, favoritos, vCard, WhatsApp |
| Calendario | Vista mes / lista, filtros por odontóloga, salto a fecha, marcar atendido |
| Turnos | Alta con paciente, fecha, horario 24 hs, duración, motivo, colisiones |
| Ficha | Historial de turnos, notas, recordatorios, archivos |
| Finanzas | Ingresos, gastos, % honorario, liquidación diaria Marie / Yani |
| Archivos de obras sociales | PDFs de nomencladores |
| Backup | Exportar / importar JSON y TXT |
| Opcionales | Google Calendar, Gmail, asistente IA, WhatsApp |

## 4. Datos que maneja

- Paciente: nombre, teléfonos, email, domicilio, obra social, afiliado, observaciones
- Turno: fecha, hora, duración, odontóloga, motivo, estado (pendiente / confirmado / cancelado / atendido), montos
- Nota clínica, recordatorio, archivo adjunto

## 5. Reglas de negocio principales

- Un turno requiere paciente, fecha y horario.
- Dos turnos de la **misma** odontóloga no pueden solaparse; Marie y Yani sí pueden atender a la misma hora.
- Un turno con odontóloga **Ambas** choca con Marie y con Yani.
- Turnos cancelados o ya atendidos no bloquean el horario.
- La liquidación diaria suma **solo turnos marcados como atendidos**.
- Honorario = (ingreso − gastos) × porcentaje. Si es “Ambas”, se parte 50/50.

## 6. Persistencia (estado actual)

| Capa | ¿Activa en el deploy? | Qué implica |
| --- | --- | --- |
| localStorage del navegador | Sí | Cada celular/PC ve **su** copia |
| Archivo en el servidor Render | Parcial | Se pierde si Render reinicia el servicio |
| PostgreSQL | **No** | No hay `DATABASE_URL` en el deploy |
| Supabase | Solo si hay claves en el entorno | Hoy no está garantizado |

## 7. Requisitos no funcionales

- Uso en escritorio y celular (barra inferior en mobile).
- Horarios en formato 24 horas (ej. 14:00).
- Fechas en formato argentino (DD/MM/AAAA).

## 8. Fuera de alcance (hoy)

- Historia clínica legal / consentimiento informado
- Facturación AFIP
- Usuarios con roles y contraseñas individuales seguras
- Auditoría de quién modificó un turno
- Copias de seguridad automáticas en la nube confiables


