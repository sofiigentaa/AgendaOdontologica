import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { db, schema } from './src/db/index.ts';
import { eq, sql } from 'drizzle-orm';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// In-memory Shared Store for zero-quota sub-50ms multi-device synchronization
let sharedAgendaStore: {
  contacts?: any[];
  appointments?: any[];
  reminders?: any[];
  notes?: any[];
  attachments?: any[];
  insuranceFiles?: any[];
  lastUpdated?: string;
  sourceDevice?: string;
} = {};

const sharedInsuranceFilesMap = new Map<string, any>();

// Auto-create tables if running on a fresh PostgreSQL/Supabase database
async function ensureTablesExist() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS contacts (
        id VARCHAR(255) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        is_particular BOOLEAN NOT NULL DEFAULT TRUE,
        insurance_name VARCHAR(255),
        affiliate_number VARCHAR(255),
        primary_phone VARCHAR(50) NOT NULL,
        alt_phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        observations TEXT,
        is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
        avatar_color VARCHAR(50),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(255) PRIMARY KEY,
        contact_id VARCHAR(255) REFERENCES contacts(id) ON DELETE CASCADE,
        date VARCHAR(50) NOT NULL,
        time VARCHAR(50) NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 30,
        motive VARCHAR(255),
        dentist VARCHAR(255),
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        ingresos NUMERIC(10, 2) DEFAULT 0,
        descartables NUMERIC(10, 2) DEFAULT 0,
        estampillas NUMERIC(10, 2) DEFAULT 0,
        materiales NUMERIC(10, 2) DEFAULT 0,
        mecanico_dental NUMERIC(10, 2) DEFAULT 0,
        porcentaje_honorario NUMERIC(5, 2) DEFAULT 50
      );

      CREATE TABLE IF NOT EXISTS call_reminders (
        id VARCHAR(255) PRIMARY KEY,
        contact_id VARCHAR(255) REFERENCES contacts(id) ON DELETE CASCADE,
        date VARCHAR(50) NOT NULL,
        time VARCHAR(50) NOT NULL,
        note TEXT,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS contact_notes (
        id VARCHAR(255) PRIMARY KEY,
        contact_id VARCHAR(255) REFERENCES contacts(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        color VARCHAR(50),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS contact_attachments (
        id VARCHAR(255) PRIMARY KEY,
        contact_id VARCHAR(255) REFERENCES contacts(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        size INTEGER NOT NULL,
        type VARCHAR(100) NOT NULL,
        data_url TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS insurance_files (
        id VARCHAR(255) PRIMARY KEY,
        insurance_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size INTEGER NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        data_url TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
  } catch (err: any) {
    console.warn('Table initialization note:', err?.message);
  }
}

// Preload data from database on startup
async function initStoreFromDatabase() {
  try {
    await ensureTablesExist();

    const contactsData = await db.select().from(schema.contacts);
    const appointmentsData = await db.select().from(schema.appointments);
    const remindersData = await db.select().from(schema.callReminders);
    const notesData = await db.select().from(schema.contactNotes);
    const attachmentsData = await db.select().from(schema.contactAttachments);
    const insuranceFilesData = await db.select().from(schema.insuranceFiles);

    if (insuranceFilesData && insuranceFilesData.length > 0) {
      for (const f of insuranceFilesData) {
        sharedInsuranceFilesMap.set(f.id, f);
      }
    }

    sharedAgendaStore = {
      contacts: contactsData || [],
      appointments: appointmentsData || [],
      reminders: remindersData || [],
      notes: notesData || [],
      attachments: attachmentsData || [],
      insuranceFiles: insuranceFilesData || [],
      lastUpdated: new Date().toISOString(),
      sourceDevice: 'server_init',
    };
  } catch (err: any) {
    console.warn('Initial load from Cloud SQL:', err?.message);
  }
}

// Background persist to Cloud SQL without blocking HTTP responses
async function persistToCloudSql(payload: any) {
  try {
    const { contacts, appointments, reminders, notes, insuranceFiles } = payload;

    if (Array.isArray(contacts)) {
      for (const c of contacts) {
        await db.insert(schema.contacts).values({
          id: c.id,
          fullName: c.fullName,
          isParticular: c.isParticular ?? true,
          insuranceName: c.insuranceName ?? null,
          affiliateNumber: c.affiliateNumber ?? null,
          primaryPhone: c.primaryPhone,
          altPhone: c.altPhone ?? null,
          email: c.email ?? null,
          address: c.address ?? null,
          observations: c.observations ?? null,
          isFavorite: c.isFavorite ?? false,
          avatarColor: c.avatarColor ?? null,
          createdAt: c.createdAt || new Date().toISOString(),
          updatedAt: c.updatedAt || new Date().toISOString(),
        }).onConflictDoUpdate({
          target: schema.contacts.id,
          set: {
            fullName: c.fullName,
            isParticular: c.isParticular ?? true,
            insuranceName: c.insuranceName ?? null,
            affiliateNumber: c.affiliateNumber ?? null,
            primaryPhone: c.primaryPhone,
            altPhone: c.altPhone ?? null,
            email: c.email ?? null,
            address: c.address ?? null,
            observations: c.observations ?? null,
            isFavorite: c.isFavorite ?? false,
            avatarColor: c.avatarColor ?? null,
            updatedAt: c.updatedAt || new Date().toISOString(),
          },
        });
      }
    }

    if (Array.isArray(appointments)) {
      for (const a of appointments) {
        await db.insert(schema.appointments).values({
          id: a.id,
          contactId: a.contactId,
          date: a.date,
          time: a.time,
          durationMinutes: a.durationMinutes ?? 30,
          motive: a.motive ?? null,
          dentist: a.dentist ?? null,
          completed: a.completed ?? false,
          createdAt: a.createdAt || new Date().toISOString(),
          ingresos: a.ingresos ?? 0,
          descartables: a.descartables ?? 0,
          estampillas: a.estampillas ?? 0,
          materiales: a.materiales ?? 0,
          mecanicoDental: a.mecanicoDental ?? 0,
          porcentajeHonorario: a.porcentajeHonorario ?? 50,
        }).onConflictDoUpdate({
          target: schema.appointments.id,
          set: {
            contactId: a.contactId,
            date: a.date,
            time: a.time,
            durationMinutes: a.durationMinutes ?? 30,
            motive: a.motive ?? null,
            dentist: a.dentist ?? null,
            completed: a.completed ?? false,
            ingresos: a.ingresos ?? 0,
            descartables: a.descartables ?? 0,
            estampillas: a.estampillas ?? 0,
            materiales: a.materiales ?? 0,
            mecanicoDental: a.mecanicoDental ?? 0,
            porcentajeHonorario: a.porcentajeHonorario ?? 50,
          },
        });
      }
    }

    if (Array.isArray(reminders)) {
      for (const r of reminders) {
        await db.insert(schema.callReminders).values({
          id: r.id,
          contactId: r.contactId,
          date: r.date,
          time: r.time,
          note: r.note ?? null,
          completed: r.completed ?? false,
          createdAt: r.createdAt || new Date().toISOString(),
        }).onConflictDoUpdate({
          target: schema.callReminders.id,
          set: {
            date: r.date,
            time: r.time,
            note: r.note ?? null,
            completed: r.completed ?? false,
          },
        });
      }
    }

    if (Array.isArray(notes)) {
      for (const n of notes) {
        await db.insert(schema.contactNotes).values({
          id: n.id,
          contactId: n.contactId,
          text: n.text,
          color: n.color ?? null,
          createdAt: n.createdAt || new Date().toISOString(),
        }).onConflictDoUpdate({
          target: schema.contactNotes.id,
          set: {
            text: n.text,
            color: n.color ?? null,
          },
        });
      }
    }

    if (Array.isArray(insuranceFiles)) {
      for (const f of insuranceFiles) {
        await db.insert(schema.insuranceFiles).values({
          id: f.id,
          insuranceName: f.insuranceName,
          title: f.title,
          fileName: f.fileName,
          fileSize: f.fileSize,
          fileType: f.fileType,
          dataUrl: f.dataUrl,
          notes: f.notes ?? null,
          createdAt: f.createdAt || new Date().toISOString(),
        }).onConflictDoUpdate({
          target: schema.insuranceFiles.id,
          set: {
            insuranceName: f.insuranceName,
            title: f.title,
            notes: f.notes ?? null,
          },
        });
      }
    }
  } catch (err: any) {
    console.warn('Background sync to Cloud SQL error:', err?.message);
  }
}

// Real-Time Server-Sent Events (SSE) Client Connections Pool for Sub-50ms Instant Sync
const sseClients = new Set<express.Response>();

function broadcastToSSEClients(eventData: any) {
  const payload = `data: ${JSON.stringify(eventData)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

// SSE Live Stream Endpoint (instant push to PC & mobile clients)
app.get('/api/sync/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send initial data immediately upon connection
  const insuranceFiles = Array.from(sharedInsuranceFilesMap.values());
  const initialData = {
    type: 'INITIAL_SYNC',
    data: {
      ...sharedAgendaStore,
      insuranceFiles: insuranceFiles.length > 0 ? insuranceFiles : (sharedAgendaStore.insuranceFiles || []),
    },
    timestamp: new Date().toISOString(),
  };
  res.write(`data: ${JSON.stringify(initialData)}\n\n`);

  sseClients.add(res);

  // Send periodic ping to prevent mobile connection drops
  const pingInterval = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(pingInterval);
      sseClients.delete(res);
    }
  }, 10000);

  req.on('close', () => {
    clearInterval(pingInterval);
    sseClients.delete(res);
  });
});

// Unified Cross-Device Sync API Endpoints
app.get('/api/sync/agenda', async (req, res) => {
  const insuranceFiles = Array.from(sharedInsuranceFilesMap.values());
  res.json({
    success: true,
    data: {
      ...sharedAgendaStore,
      insuranceFiles: insuranceFiles.length > 0 ? insuranceFiles : (sharedAgendaStore.insuranceFiles || []),
    },
  });
});

app.post('/api/sync/agenda', (req, res) => {
  try {
    const payload = req.body || {};
    
    if (Array.isArray(payload.insuranceFiles)) {
      for (const f of payload.insuranceFiles) {
        if (f && f.id) {
          const existing = sharedInsuranceFilesMap.get(f.id);
          if (existing && existing.dataUrl && (!f.dataUrl || f.dataUrl.length < 50)) {
            sharedInsuranceFilesMap.set(f.id, { ...existing, ...f, dataUrl: existing.dataUrl });
          } else {
            sharedInsuranceFilesMap.set(f.id, f);
          }
        }
      }
    }

    const currentFiles = Array.from(sharedInsuranceFilesMap.values());

    sharedAgendaStore = {
      ...sharedAgendaStore,
      ...(payload.contacts !== undefined ? { contacts: payload.contacts } : {}),
      ...(payload.appointments !== undefined ? { appointments: payload.appointments } : {}),
      ...(payload.reminders !== undefined ? { reminders: payload.reminders } : {}),
      ...(payload.notes !== undefined ? { notes: payload.notes } : {}),
      ...(payload.attachments !== undefined ? { attachments: payload.attachments } : {}),
      insuranceFiles: currentFiles.length > 0 ? currentFiles : (payload.insuranceFiles || []),
      lastUpdated: payload.lastUpdated || new Date().toISOString(),
      sourceDevice: payload.sourceDevice || 'unknown',
    };

    // Instant SSE Broadcast to all connected PC & mobile clients
    broadcastToSSEClients({
      type: 'AGENDA_UPDATE',
      data: sharedAgendaStore,
      sourceDevice: payload.sourceDevice,
      timestamp: sharedAgendaStore.lastUpdated,
    });

    // Save to PostgreSQL in background
    persistToCloudSql(payload).catch(() => {});

    res.json({ success: true, lastUpdated: sharedAgendaStore.lastUpdated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Error updating shared store' });
  }
});

// Dedicated endpoints for full insurance file upload & management
app.get('/api/sync/insurance-files', (req, res) => {
  const files = Array.from(sharedInsuranceFilesMap.values());
  res.json({ success: true, files });
});

app.post('/api/sync/insurance-file', (req, res) => {
  try {
    const file = req.body;
    if (file && file.id) {
      sharedInsuranceFilesMap.set(file.id, file);
      const files = Array.from(sharedInsuranceFilesMap.values());
      sharedAgendaStore.insuranceFiles = files;
      sharedAgendaStore.lastUpdated = new Date().toISOString();

      // Instant SSE Broadcast of new/updated insurance file
      broadcastToSSEClients({
        type: 'INSURANCE_FILES_UPDATE',
        files: files,
        updatedFile: file,
        timestamp: sharedAgendaStore.lastUpdated,
      });

      // Save to Cloud SQL in background
      db.insert(schema.insuranceFiles).values({
        id: file.id,
        insuranceName: file.insuranceName || 'General',
        title: file.title || file.fileName || 'Archivo',
        fileName: file.fileName || 'documento',
        fileSize: file.fileSize || 0,
        fileType: file.fileType || 'application/octet-stream',
        dataUrl: file.dataUrl || '',
        notes: file.notes || null,
        createdAt: file.createdAt || new Date().toISOString(),
      }).onConflictDoUpdate({
        target: schema.insuranceFiles.id,
        set: {
          insuranceName: file.insuranceName || 'General',
          title: file.title || file.fileName || 'Archivo',
          notes: file.notes || null,
          dataUrl: file.dataUrl || '',
        },
      }).catch((e: any) => console.warn('Save file to Cloud SQL:', e?.message));

      res.json({ success: true, lastUpdated: sharedAgendaStore.lastUpdated });
    } else {
      res.status(400).json({ success: false, error: 'Invalid file data' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

app.delete('/api/sync/insurance-file/:id', (req, res) => {
  try {
    const { id } = req.params;
    sharedInsuranceFilesMap.delete(id);
    const files = Array.from(sharedInsuranceFilesMap.values());
    sharedAgendaStore.insuranceFiles = files;
    sharedAgendaStore.lastUpdated = new Date().toISOString();

    // Instant SSE Broadcast of deleted file
    broadcastToSSEClients({
      type: 'INSURANCE_FILES_UPDATE',
      files: files,
      deletedId: id,
      timestamp: sharedAgendaStore.lastUpdated,
    });

    // Delete from Cloud SQL
    db.delete(schema.insuranceFiles).where(eq(schema.insuranceFiles.id, id)).catch(() => {});

    res.json({ success: true, lastUpdated: sharedAgendaStore.lastUpdated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

// Clear / Wipe Database API Endpoints
app.post('/api/db/clear', async (req, res) => {
  try {
    const { target } = req.body;
    
    if (target === 'appointments_only') {
      await db.delete(schema.appointments);
      sharedAgendaStore.appointments = [];
    } else {
      await db.delete(schema.appointments);
      await db.delete(schema.callReminders);
      await db.delete(schema.contactNotes);
      await db.delete(schema.contactAttachments);
      await db.delete(schema.insuranceFiles);
      await db.delete(schema.contacts);
      sharedInsuranceFilesMap.clear();
      sharedAgendaStore = {
        contacts: [],
        appointments: [],
        reminders: [],
        notes: [],
        attachments: [],
        insuranceFiles: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    broadcastToSSEClients({
      type: 'AGENDA_UPDATE',
      data: sharedAgendaStore,
      timestamp: sharedAgendaStore.lastUpdated,
    });

    return res.json({ success: true, dbAvailable: true });
  } catch (error: any) {
    console.warn('Error clearing database:', error?.message);
    return res.json({ success: true, dbAvailable: false });
  }
});

// Database API Endpoints (Cloud SQL PostgreSQL)
app.get('/api/db/all', async (req, res) => {
  try {
    const contactsData = await db.select().from(schema.contacts);
    const appointmentsData = await db.select().from(schema.appointments);
    const remindersData = await db.select().from(schema.callReminders);
    const notesData = await db.select().from(schema.contactNotes);
    const attachmentsData = await db.select().from(schema.contactAttachments);
    const insuranceFilesData = await db.select().from(schema.insuranceFiles);

    return res.json({
      dbAvailable: true,
      contacts: contactsData,
      appointments: appointmentsData,
      reminders: remindersData,
      notes: notesData,
      attachments: attachmentsData,
      insuranceFiles: insuranceFilesData,
    });
  } catch (error: any) {
    console.warn('Database not reachable or configured:', error?.message);
    return res.json({ dbAvailable: false, contacts: [], appointments: [], reminders: [], notes: [], attachments: [], insuranceFiles: [] });
  }
});

app.post('/api/db/sync', async (req, res) => {
  try {
    await persistToCloudSql(req.body);
    return res.json({ success: true, dbAvailable: true });
  } catch (error: any) {
    console.warn('Database sync failed:', error?.message);
    return res.json({ success: true, dbAvailable: false });
  }
});


// Helper to instantiate Gemini client server-side safely
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY process environment variable is not defined.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API Endpoint for Assistant Chat
app.post('/api/assistant/chat', async (req, res) => {
  try {
    const { messages, agendaContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Formato de mensajes inválido.' });
    }

    const ai = getGeminiClient();

    const todayDateStr = new Date().toISOString().split('T')[0];

    let contextText = `[FECHA DE HOY]: ${todayDateStr}\n`;
    if (agendaContext) {
      contextText += `
[CONTEXTO ACTUAL DE LA AGENDA DE LA PROFESIONAL]:
- Total de contactos registrados: ${agendaContext.totalContacts ?? 0}
- Contactos Favoritos: ${agendaContext.favoritesCount ?? 0}
- Obras Sociales/Prepagas registradas: ${agendaContext.insurances?.join(', ') || 'Ninguna registrada'}
- Recordatorios pendientes: ${agendaContext.pendingRemindersCount ?? 0}
${agendaContext.summarySample ? `- Muestra de contactos actuales: ${agendaContext.summarySample}` : ''}
`;
    }

    const systemInstruction = `Eres el Asistente IA de Recepción, Agendamiento de Turnos y Notas para el Consultorio Odontológico de las Dra. Yani y Dra. Marie.

TU ROL PRINCIPAL:
Eres la secretaria y copiloto inteligente del Consultorio Odontológico de Yani y Marie. Tu objetivo es guiar a las odontólogas o a sus pacientes paso a paso para agendar turnos odontológicos, seleccionar si el turno es con Dra. Yani o Dra. Marie, registrar datos completos de los pacientes y añadir notas u observaciones de tratamiento.

CUESTIONARIO Y PASOS DE RECOPILACIÓN PARA TURNOS:
Cuando se desee agendar un nuevo contacto/paciente o inicie la conversación, recopila:

1. 👤 **Nombre y Apellido**: Nombre completo del paciente.
2. 👩‍⚕️ **Odontóloga a cargo**: Dra. Yani o Dra. Marie.
3. ⭐ **¿Marcar como paciente favorito?**: (Sí / No).
4. 💳 **Obra Social o Particular**:
   - Si es **Obra Social / Prepaga**: Nombre de la entidad y **Número de Afiliado**.
   - Si es **Particular**: Confirmar atención particular.
5. 📞 **Teléfonos**: **Teléfono principal** y **Teléfono alternativo**.
6. 📧 **Correo electrónico**.
7. 📍 **Dirección / Ubicación**.
8. 📅 **Día y Horario del Turno**:
   - **Día / Fecha del turno** (YYYY-MM-DD o 'Lunes que viene', etc.).
   - **Horario del turno** (HH:mm).
9. 🦷 **Motivo de Consulta Odontológica / Observaciones**: (Ej. Limpieza, Caries, Ortodoncia, Conducto, Extracción, etc.).

NOTAS Y OBSERVACIONES:
Si la profesional solicita agregar una nota u observación a una ficha (ej: "agrega nota para Juan Perez: pedir analisis de laboratorio" o "anotar observacion: abonó la consulta en efectivo"), confirma la creación de la nota e incluye al final del mensaje este bloque JSON:

\`\`\`json:contact_note
{
  "text": "Contenido de la nota u observación",
  "patientName": "Nombre completo del paciente si aplica"
}
\`\`\`

REGLA FUNDAMENTAL DE AGENDAMIENTO AUTOMÁTICO AL CALENDARIO:
Al mostrar la confirmación final de un turno o cuando tengas los datos básicos (Nombre, Fecha y Horario), DEBES INCLUIR SIEMPRE al final de tu mensaje el siguiente bloque de código JSON:

\`\`\`json:contact_appointment
{
  "fullName": "Nombre completo",
  "isParticular": false,
  "insuranceName": "Nombre de obra social o vacio",
  "affiliateNumber": "Numero de afiliado o vacio",
  "primaryPhone": "Telefono principal o vacio",
  "secondaryPhone": "Telefono alt o vacio",
  "email": "Email o vacio",
  "address": "Direccion o vacio",
  "isFavorite": false,
  "notes": "Observaciones adicionales",
  "appointmentDate": "YYYY-MM-DD",
  "appointmentTime": "HH:mm",
  "appointmentMotive": "Motivo de la consulta"
}
\`\`\`

Asegúrate de calcular la fecha en formato YYYY-MM-DD considerando que hoy es ${todayDateStr}.

${contextText}`;

    // Map messages into contents format for Gemini API
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error('Error in assistant chat API:', error);
    return res.status(500).json({
      error: 'Error al procesar la respuesta con el Asistente IA.',
      details: error?.message || String(error),
    });
  }
});

async function startServer() {
  await initStoreFromDatabase();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

