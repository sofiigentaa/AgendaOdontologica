import { Contact, Appointment } from '../types';

export interface ParsedImportData {
  contacts?: Contact[];
  appointments?: Appointment[];
  reminders?: any[];
  notes?: any[];
  attachments?: any[];
  insuranceFiles?: any[];
  summaryMessage: string;
}

/**
 * Normaliza y crea un objeto Contact válido con campos por defecto
 */
function createContact(partial: any, index: number = 0): Contact {
  const isPart = partial.isParticular ?? (partial.insuranceName ? partial.insuranceName.toLowerCase() === 'particular' || !partial.insuranceName : true);
  return {
    id: partial.id || `contact-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    fullName: (partial.fullName || partial.name || partial.full_name || 'Paciente Sin Nombre').trim(),
    primaryPhone: (partial.primaryPhone || partial.phone || partial.primary_phone || partial.celular || '').trim(),
    altPhone: (partial.altPhone || partial.secondaryPhone || partial.secondary_phone || '').trim(),
    email: (partial.email || '').trim(),
    address: (partial.address || partial.domicilio || '').trim(),
    insuranceName: isPart ? 'Particular' : (partial.insuranceName || partial.insurance_name || partial.obraSocial || partial.obra_social || 'Particular').trim(),
    affiliateNumber: (partial.affiliateNumber || partial.insuranceNumber || partial.insurance_number || partial.afiliado || partial.dni || '').trim(),
    isParticular: isPart,
    avatarColor: partial.avatarColor || partial.avatar_color || 'bg-emerald-100 text-emerald-700',
    observations: (partial.observations || partial.notas || partial.observacion || '').trim(),
    isFavorite: Boolean(partial.isFavorite),
    createdAt: partial.createdAt || partial.created_at || new Date().toISOString(),
    updatedAt: partial.updatedAt || partial.updated_at || new Date().toISOString(),
  };
}

/**
 * Parsea contenido de archivo .txt o .json de forma universal
 */
export function parseImportFileContent(rawContent: string, fileName: string = ''): ParsedImportData {
  if (!rawContent || !rawContent.trim()) {
    throw new Error('El archivo seleccionado está completamente vacío.');
  }

  const trimmed = rawContent.trim();

  // 1. Intentar parsear como JSON (incluso si la extensión es .txt)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);

      // Si es un Array directo
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          throw new Error('El archivo contiene una lista vacía.');
        }

        // ¿Son turnos o contactos?
        if ('date' in parsed[0] || 'time' in parsed[0] || 'motive' in parsed[0]) {
          const appts: Appointment[] = parsed.map((a: any, idx: number) => ({
            id: a.id || `appt-${Date.now()}-${idx}`,
            contactId: a.contactId || a.patientId || '',
            date: a.date || new Date().toISOString().split('T')[0],
            time: a.time || '09:00',
            durationMinutes: a.durationMinutes || 30,
            motive: a.motive || a.treatment || 'Consulta general',
            dentist: a.dentist || 'Yani',
            completed: Boolean(a.completed),
            whatsappStatus: a.whatsappStatus || 'pending',
            whatsappLastReply: a.whatsappLastReply,
            observations: a.observations || '',
            createdAt: a.createdAt || new Date().toISOString(),
          }));
          return {
            appointments: appts,
            summaryMessage: `✅ Se importaron ${appts.length} turnos del archivo.`,
          };
        } else {
          // Son contactos
          const contacts: Contact[] = parsed.map((c: any, idx: number) => createContact(c, idx));
          return {
            contacts,
            summaryMessage: `✅ Se importaron ${contacts.length} pacientes del archivo.`,
          };
        }
      }

      // Si es un objeto de Copia de Seguridad completa
      if (typeof parsed === 'object' && parsed !== null) {
        const result: ParsedImportData = {
          summaryMessage: '',
        };

        const counts: string[] = [];

        if (Array.isArray(parsed.contacts) && parsed.contacts.length > 0) {
          result.contacts = parsed.contacts.map((c: any, idx: number) => createContact(c, idx));
          counts.push(`${result.contacts.length} pacientes`);
        }
        if (Array.isArray(parsed.appointments) && parsed.appointments.length > 0) {
          result.appointments = parsed.appointments;
          counts.push(`${result.appointments.length} turnos`);
        }
        if (Array.isArray(parsed.reminders)) result.reminders = parsed.reminders;
        if (Array.isArray(parsed.notes)) result.notes = parsed.notes;
        if (Array.isArray(parsed.attachments)) result.attachments = parsed.attachments;
        if (Array.isArray(parsed.insuranceFiles)) result.insuranceFiles = parsed.insuranceFiles;

        if (counts.length > 0) {
          result.summaryMessage = `✅ Copia de seguridad importada con éxito: ${counts.join(', ')}.`;
        } else {
          result.summaryMessage = '✅ Archivo importado correctamente.';
        }

        return result;
      }
    } catch (e: any) {
      // Si falla JSON.parse, continuar con los analizadores de texto plano abajo
      if (trimmed.startsWith('{') && fileName.toLowerCase().endsWith('.json')) {
        throw new Error(`Error en la estructura JSON: ${e?.message || 'Formato no válido'}`);
      }
    }
  }

  // 2. Analizadores de Texto Plano (.txt)

  // CASO A: Exportación de Turnos (AGENDA ODONTOLÓGICA - TURNOS DEL DÍA SIGUIENTE)
  if (trimmed.includes('AGENDA ODONTOLÓGICA - TURNOS') || trimmed.includes('TURNO #')) {
    const parsedAppts: Appointment[] = [];
    const parsedContacts: Contact[] = [];
    
    // Extraer fecha global si existe
    let detectedDate = new Date().toISOString().split('T')[0];
    const dateMatch = trimmed.match(/\((\d{2})\/(\d{2})\/(\d{4})\)/) || trimmed.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
      if (dateMatch[3]) {
        // DD/MM/YYYY
        detectedDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
      } else if (dateMatch[1]?.length === 4) {
        // YYYY-MM-DD
        detectedDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
      }
    }

    const blocks = trimmed.split(/TURNO\s*#\d+:/i);
    blocks.slice(1).forEach((block, idx) => {
      const timeMatch = block.match(/(\d{1,2}:\d{2})\s*hs/i);
      const time = timeMatch ? timeMatch[1].padStart(5, '0') : '09:00';
      
      const durMatch = block.match(/Duración:\s*(\d+)\s*min/i);
      const durationMinutes = durMatch ? parseInt(durMatch[1], 10) : 30;

      const patientMatch = block.match(/Paciente:\s*([^\n\r]+)/i);
      const patientName = patientMatch ? patientMatch[1].trim() : `Paciente ${idx + 1}`;

      const phoneMatch = block.match(/Teléfono Principal:\s*([^\n\r]+)/i);
      const phone = phoneMatch ? phoneMatch[1].replace(/Sin teléfono|No informado/gi, '').trim() : '';

      const altPhoneMatch = block.match(/Teléfono Secundario:\s*([^\n\r]+)/i);
      const altPhone = altPhoneMatch ? altPhoneMatch[1].trim() : '';

      const coverageMatch = block.match(/Cobertura:\s*([^\n\r]+)/i);
      const coverage = coverageMatch ? coverageMatch[1].trim() : 'Particular';

      const dentistMatch = block.match(/Odontóloga a cargo:\s*(?:Dra\.\s*)?([^\n\r]+)/i);
      const dentistRaw = dentistMatch ? dentistMatch[1].trim() : 'Yani';
      const dentist = dentistRaw.toLowerCase().includes('marie') ? 'Marie' : dentistRaw.toLowerCase().includes('ambas') ? 'Ambas' : 'Yani';

      const motiveMatch = block.match(/Motivo de atención:\s*([^\n\r]+)/i);
      const motive = motiveMatch ? motiveMatch[1].trim() : 'Consulta general';

      const obsMatch = block.match(/Observaciones(?: del paciente)?:\s*([^\n\r]+)/i);
      const observations = obsMatch ? obsMatch[1].trim() : '';

      const isCancelled = block.includes('[CANCELADO');
      const isConfirmed = block.includes('[CONFIRMADO');

      const contact = createContact({
        fullName: patientName,
        primaryPhone: phone,
        altPhone: altPhone,
        insuranceName: coverage.toUpperCase() === 'PARTICULAR' ? 'Particular' : coverage,
        isParticular: coverage.toUpperCase() === 'PARTICULAR',
        observations: observations,
      }, idx);

      parsedContacts.push(contact);

      parsedAppts.push({
        id: `appt-txt-${Date.now()}-${idx}`,
        contactId: contact.id,
        date: detectedDate,
        time: time,
        durationMinutes: durationMinutes,
        motive: motive,
        dentist: dentist as any,
        completed: false,
        whatsappStatus: isCancelled ? 'cancelled' : isConfirmed ? 'confirmed' : 'pending',
        createdAt: new Date().toISOString(),
      });
    });

    if (parsedAppts.length > 0) {
      return {
        contacts: parsedContacts,
        appointments: parsedAppts,
        summaryMessage: `✅ Se importaron ${parsedAppts.length} turnos y ${parsedContacts.length} pacientes del archivo .txt.`,
      };
    }
  }

  // CASO B: Exportación de Listado de Pacientes (LISTADO COMPLETO DE PACIENTES REGISTRADOS / 1. Nombre...)
  if (trimmed.includes('LISTADO COMPLETO DE PACIENTES') || trimmed.includes('• Teléfono:') || /^\d+\.\s+[A-Z]/m.test(trimmed)) {
    const contacts: Contact[] = [];
    const patientBlocks = trimmed.split(/(?=\n\s*\d+\.\s+)/);

    patientBlocks.forEach((block, idx) => {
      const nameMatch = block.match(/(?:\d+\.\s*)([^\n\r•]+)/);
      if (!nameMatch) return;
      const fullName = nameMatch[1].trim();
      if (!fullName || fullName.includes('LISTADO') || fullName.includes('====')) return;

      const phoneMatch = block.match(/•\s*Teléfono:\s*([^\n\r•]+)/i);
      let primaryPhone = '';
      let altPhone = '';
      if (phoneMatch) {
        const rawPhones = phoneMatch[1].replace(/No informado|Sin teléfono/gi, '').trim();
        const splitP = rawPhones.split(/[\/\-–]/);
        primaryPhone = splitP[0]?.trim() || '';
        altPhone = splitP[1]?.trim() || '';
      }

      const covMatch = block.match(/•\s*Cobertura:\s*([^\n\r•]+)/i);
      let isPart = true;
      let insuranceName = 'Particular';
      let affiliateNumber = '';
      if (covMatch) {
        const covText = covMatch[1].trim();
        if (covText.toUpperCase().includes('PARTICULAR')) {
          isPart = true;
          insuranceName = 'Particular';
        } else {
          isPart = false;
          insuranceName = covText.replace(/\(Afiliado:.*?\)/gi, '').trim() || 'Particular';
          const afilMatch = covText.match(/Afiliado:\s*([^)]+)/i);
          if (afilMatch) affiliateNumber = afilMatch[1].trim();
        }
      }

      const emailMatch = block.match(/•\s*Email:\s*([^\n\r•]+)/i);
      const email = emailMatch ? emailMatch[1].trim() : '';

      const addrMatch = block.match(/•\s*Domicilio:\s*([^\n\r•]+)/i);
      const address = addrMatch ? addrMatch[1].trim() : '';

      const obsMatch = block.match(/•\s*Observaciones:\s*([^\n\r•]+)/i);
      const observations = obsMatch ? obsMatch[1].trim() : '';

      contacts.push(createContact({
        fullName,
        primaryPhone,
        altPhone,
        email,
        address,
        isParticular: isPart,
        insuranceName,
        affiliateNumber,
        observations,
      }, idx));
    });

    if (contacts.length > 0) {
      return {
        contacts,
        summaryMessage: `✅ Se importaron ${contacts.length} pacientes del archivo .txt.`,
      };
    }
  }

  // CASO C: CSV / TSV o Lista Separada por Delimitadores (, ; o Tab)
  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('===') && !l.startsWith('---'));
  if (lines.length > 0) {
    const contacts: Contact[] = [];
    
    // Revisar si la primera línea es un encabezado
    let startIndex = 0;
    const headerLine = lines[0].toLowerCase();
    const hasHeader = headerLine.includes('nombre') || headerLine.includes('paciente') || headerLine.includes('telefono') || headerLine.includes('celular') || headerLine.includes('dni');
    if (hasHeader) {
      startIndex = 1;
    }

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Intentar delimitar por coma, punto y coma, tabulador o guión
      let parts: string[] = [];
      if (line.includes(';')) {
        parts = line.split(';').map(p => p.trim());
      } else if (line.includes('\t')) {
        parts = line.split('\t').map(p => p.trim());
      } else if (line.includes(',')) {
        parts = line.split(',').map(p => p.trim());
      } else if (line.includes(' - ')) {
        parts = line.split(' - ').map(p => p.trim());
      } else {
        parts = [line];
      }

      if (parts.length > 0 && parts[0]) {
        const rawName = parts[0].replace(/^\d+[\.\-\)]\s*/, '').trim();
        if (rawName) {
          const rawPhone = parts[1] || '';
          const rawDniOrInsurance = parts[2] || '';
          const rawExtra = parts[3] || '';

          const isNumberOnly = /^\d+$/.test(rawDniOrInsurance.replace(/\./g, ''));
          const dni = isNumberOnly ? rawDniOrInsurance : '';
          const insurance = !isNumberOnly ? rawDniOrInsurance : rawExtra;

          contacts.push(createContact({
            fullName: rawName,
            primaryPhone: rawPhone,
            affiliateNumber: dni,
            insuranceName: insurance || 'Particular',
            isParticular: !insurance || insurance.toLowerCase() === 'particular',
            observations: parts.slice(4).join(' - '),
          }, i));
        }
      }
    }

    if (contacts.length > 0) {
      return {
        contacts,
        summaryMessage: `✅ Se importaron con éxito ${contacts.length} pacientes del archivo de texto.`,
      };
    }
  }

  throw new Error('No se pudo reconocer el formato de los datos en el archivo .txt.');
}
