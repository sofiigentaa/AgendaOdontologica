import { Contact, Appointment } from '../types';
import { formatDateDDMMYYYY, formatDateWithDayName } from './time';

/**
 * Genera y descarga un archivo plano (.txt) con la agenda de turnos del día siguiente
 * (o de un día especificado) por si se cae el servidor o no hay internet.
 */
export function exportNextDayAppointmentsPlainFile(
  appointments: Appointment[],
  contacts: Contact[],
  baseDate?: Date
) {
  const target = baseDate ? new Date(baseDate) : new Date();
  // Sumar 1 día para obtener el día que le sigue
  target.setDate(target.getDate() + 1);

  const targetDateStr = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
  const dayNameFormatted = formatDateWithDayName(targetDateStr);

  const dayAppointments = appointments
    .filter((a) => a.date === targetDateStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const contactMap = new Map<string, Contact>();
  contacts.forEach((c) => contactMap.set(c.id, c));

  let content = `==============================================================\n`;
  content += `           AGENDA ODONTOLÓGICA - TURNOS DEL DÍA SIGUIENTE      \n`;
  content += `==============================================================\n`;
  content += `Fecha del listado: ${dayNameFormatted} (${formatDateDDMMYYYY(targetDateStr)})\n`;
  content += `Total de turnos programados: ${dayAppointments.length}\n`;
  content += `Generado el: ${new Date().toLocaleString('es-AR')}\n`;
  content += `==============================================================\n\n`;

  if (dayAppointments.length === 0) {
    content += `No hay turnos registrados para este día.\n`;
  } else {
    dayAppointments.forEach((appt, idx) => {
      const contact = contactMap.get(appt.contactId);
      const isCancelled = appt.whatsappStatus === 'cancelled';
      const isConfirmed = appt.whatsappStatus === 'confirmed';
      const statusStr = isCancelled
        ? '[CANCELADO - HORARIO LIBRE]'
        : isConfirmed
        ? '[CONFIRMADO POR PACIENTE]'
        : '[PENDIENTE DE CONFIRMACIÓN]';

      content += `--------------------------------------------------------------\n`;
      content += `TURNO #${idx + 1}: ${appt.time} hs  (Duración: ${appt.durationMinutes || 30} min)  ${statusStr}\n`;
      content += `--------------------------------------------------------------\n`;
      content += `Paciente: ${contact?.fullName || 'Paciente sin registrar'}\n`;
      content += `Teléfono Principal: ${contact?.primaryPhone || 'Sin teléfono'}\n`;
      if (contact?.altPhone) {
        content += `Teléfono Secundario: ${contact.altPhone}\n`;
      }
      content += `Cobertura: ${contact?.isParticular ? 'Particular' : (contact?.insuranceName || 'Sin obra social')}\n`;
      if (contact?.affiliateNumber) {
        content += `Nº de Afiliado: ${contact.affiliateNumber}\n`;
      }
      content += `Odontóloga a cargo: Dra. ${appt.dentist || 'Marie y Yani'}\n`;
      content += `Motivo de atención: ${appt.motive || 'Consulta general'}\n`;
      if (contact?.observations) {
        content += `Observaciones del paciente: ${contact.observations}\n`;
      }
      content += `\n`;
    });
  }

  content += `\n==============================================================\n`;
  content += `Archivo generado para contingencias ante corte de servicio o internet.\n`;
  content += `==============================================================\n`;

  downloadTextFile(
    content,
    `Turnos_Dia_Siguiente_${targetDateStr}.txt`
  );
}

/**
 * Genera y descarga un archivo plano (.txt o .csv) con todos los pacientes registrados.
 */
export function exportContactsPlainFile(contacts: Contact[]) {
  const sorted = [...contacts].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, 'es', { sensitivity: 'base' })
  );

  let content = `==============================================================\n`;
  content += `             LISTADO COMPLETO DE PACIENTES REGISTRADOS         \n`;
  content += `==============================================================\n`;
  content += `Total de pacientes: ${sorted.length}\n`;
  content += `Generado el: ${new Date().toLocaleString('es-AR')}\n`;
  content += `==============================================================\n\n`;

  sorted.forEach((c, idx) => {
    content += `${idx + 1}. ${c.fullName}\n`;
    content += `   • Teléfono: ${c.primaryPhone || 'No informado'}${c.altPhone ? ` / ${c.altPhone}` : ''}\n`;
    content += `   • Cobertura: ${c.isParticular ? 'PARTICULAR' : (c.insuranceName ? `${c.insuranceName} (Afiliado: ${c.affiliateNumber || 'S/N'})` : 'Sin obra social')}\n`;
    if (c.email) content += `   • Email: ${c.email}\n`;
    if (c.address) content += `   • Domicilio: ${c.address}\n`;
    if (c.observations) content += `   • Observaciones: ${c.observations}\n`;
    content += `\n`;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  downloadTextFile(content, `Directorio_Pacientes_${todayStr}.txt`);
}

/**
 * Función utilitaria para disparar la descarga de cualquier archivo de texto
 */
function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
