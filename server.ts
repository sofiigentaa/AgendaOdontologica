import 'dotenv/config';
import express from 'express';
import { findConflictingAppointment } from './src/utils/appointmentConflicts.ts';
import { parseDentist } from './src/utils/dentist.ts';
import {
  validateAppointmentInput,
  validateContactInput,
  validateInsuranceFileInput,
} from './src/utils/recordValidation.ts';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { db, schema, isDbConfigured } from './src/db/index.ts';
import { eq, sql } from 'drizzle-orm';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_FILE_PATH = path.join(process.cwd(), 'agenda_storage.json');

app.set('trust proxy', 1);
app.disable('x-powered-by');
// 10 MB de archivo en base64 ocupan ~13,4 MB de JSON.
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

function contentSecurityPolicy(): string {
  const supabase = supabaseEnv()?.url || '';
  const supabaseWs = supabase.replace(/^http/, 'ws');
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "script-src 'self' https://apis.google.com https://www.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' ${supabase} ${supabaseWs} https://*.googleapis.com https://*.firebaseapp.com`.trim(),
    "frame-src 'self' data: blob: https://*.firebaseapp.com https://accounts.google.com",
    "worker-src 'self' blob:",
  ].join('; ');
}

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (isProduction()) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Content-Security-Policy', contentSecurityPolicy());
  }
  next();
});

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function publicError(fallback: string, error?: { message?: string }) {
  if (isProduction()) return fallback;
  return error?.message || fallback;
}

function isAdminRequest(req: express.Request): boolean {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token) {
    return !isProduction();
  }
  const given = req.get('x-admin-token') || '';
  return timingSafeStringEqual(given, token);
}

const SESSION_COOKIE = 'agenda_session';

function timingSafeStringEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    crypto.timingSafeEqual(bb, bb);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

// Links públicos de confirmación: el ID del turno va firmado, así no se puede
// adivinar el link de otro paciente (antes era appt-<milisegundos>).
function publicLinkSignature(id: string): string {
  return crypto.createHmac('sha256', sessionSecret()).update(`appt-link:${id}`).digest('base64url').slice(0, 22);
}

function publicLinkToken(id: string): string {
  return `${id}.${publicLinkSignature(id)}`;
}

// Devuelve el ID del turno si el token es válido; si no, null.
function resolvePublicToken(token: string): string | null {
  if (!sessionSecret()) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) {
    // Links viejos sin firma: solo si se habilita a propósito durante la transición.
    return process.env.ALLOW_LEGACY_PUBLIC_LINKS === 'true' ? token : null;
  }
  const id = token.slice(0, dot);
  return timingSafeStringEqual(token.slice(dot + 1), publicLinkSignature(id)) ? id : null;
}

function sessionSecret() {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (isProduction()) return '';
  return 'dev-session-secret';
}

// Instancia de demostración pública: entra sin pantalla de ingreso.
// Activar SOLO en la copia de demo (DEMO_MODE=true en Render), nunca en la del consultorio.
function isDemoMode(): boolean {
  return String(process.env.DEMO_MODE || '').trim().toLowerCase() === 'true';
}
const DEMO_EMAIL = 'demo@tecnorosario.ar';

function sessionCookieHeader(token: string, maxAgeSeconds = 12 * 60 * 60): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Strict${isProduction() ? '; Secure' : ''}`;
}

// req.ip respeta "trust proxy" (solo el proxy de Render, 1 salto): el cliente
// ya no puede elegir su IP mandando un X-Forwarded-For inventado.
function clientIp(req: express.Request): string {
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function signSession(email: string, authType: 'supabase' | 'demo' = 'supabase'): string {
  const payload = Buffer.from(JSON.stringify({
    email,
    exp: Date.now() + 12 * 60 * 60 * 1000,
    authType,
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', sessionSecret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function readSession(req: express.Request): { email: string } | null {
  if (!sessionSecret()) return null;
  const raw = (req.headers.cookie || '')
    .split(';')
    .map((p) => p.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!raw) return null;
  const token = decodeURIComponent(raw.slice(SESSION_COOKIE.length + 1));
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', sessionSecret()).update(payload).digest('hex');
  if (!timingSafeStringEqual(sig, expected)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data.exp || data.exp < Date.now()) return null;
    if (data.authType === 'demo') return isDemoMode() ? { email: DEMO_EMAIL } : null;
    if (data.authType !== 'supabase' || !isAccountEmailAllowed(data.email)) return null;
    return { email: data.email };
  } catch {
    return null;
  }
}

function requireSession(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (readSession(req)) return next();
  return res.status(401).json({ success: false, error: 'No autorizado' });
}

function assertProductionSecrets() {
  if (!isProduction()) return;
  const secret = process.env.SESSION_SECRET || '';
  if (!isDemoMode() && !supabaseAuthConfigured()) {
    console.error('Producción: configurar Supabase Auth y CONSULTORIO_EMAIL antes de iniciar el servidor.');
    process.exit(1);
  }
  if (secret.length < 32) {
    console.error('Producción: SESSION_SECRET debe tener al menos 32 caracteres aleatorios. El servidor no arranca.');
    process.exit(1);
  }
}

function supabaseEnv() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return { url, key };
}

function allowedEmailList(): string[] {
  return (process.env.CONSULTORIO_EMAIL || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function isValidAuthEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isAccountEmailAllowed(email: unknown): boolean {
  if (typeof email !== 'string' || !isValidAuthEmail(email)) return false;
  return allowedEmailList().includes(email.trim().toLowerCase());
}

function supabaseAuthConfigured(): boolean {
  return Boolean(!isDemoMode() && supabaseEnv() && allowedEmailList().length > 0);
}

function patchSupabaseAppointment(id: string, body: Record<string, unknown>) {
  const sb = supabaseEnv();
  if (!sb) return;
  fetch(`${sb.url}/rest/v1/appointments?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      apikey: sb.key,
      Authorization: `Bearer ${sb.key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(body),
  }).catch(() => {});
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, dbAvailable: isDbConfigured });
});

const registrationChecks = new Map<string, { count: number; resetAt: number }>();
// Limpieza periódica para que el Map no crezca sin límite.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of registrationChecks) {
    if (now >= entry.resetAt) registrationChecks.delete(ip);
  }
}, 5 * 60 * 1000).unref();

app.get('/api/auth/config', (_req, res) => {
  res.json({ configured: supabaseAuthConfigured(), demo: isDemoMode() });
});

app.post('/api/auth/registration-check', (req, res) => {
  if (!supabaseAuthConfigured()) {
    return res.status(503).json({ success: false, error: 'La autenticación de Supabase todavía no está configurada.' });
  }

  const ip = clientIp(req);
  const now = Date.now();
  const attempt = registrationChecks.get(ip);
  if (attempt && now < attempt.resetAt && attempt.count >= 30) {
    return res.status(429).json({ success: false, error: 'Demasiados intentos. Esperá unos minutos y volvé a probar.' });
  }
  if (!attempt || now >= attempt.resetAt) registrationChecks.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
  else attempt.count += 1;

  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!isValidAuthEmail(email)) {
    return res.status(400).json({ success: false, error: 'Ingresá un email válido.' });
  }
  // Misma respuesta para cualquier email: no se puede averiguar quién tiene
  // cuenta. El permiso real se valida al crear la sesión (/api/auth/session).
  return res.json({ success: true });
});

app.post('/api/auth/session', async (req, res) => {
  const supabase = supabaseEnv();
  if (!supabaseAuthConfigured() || !supabase) {
    return res.status(503).json({ success: false, error: 'La autenticación de Supabase todavía no está configurada.' });
  }

  const authorization = String(req.headers.authorization || '');
  const accessToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!accessToken || accessToken.length > 4096) {
    return res.status(401).json({ success: false, error: 'Sesión inválida. Volvé a ingresar.' });
  }

  try {
    const response = await fetch(`${supabase.url}/auth/v1/user`, {
      headers: { apikey: supabase.key, Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return res.status(401).json({ success: false, error: 'La sesión de Supabase venció. Volvé a ingresar.' });
    }

    const user = await response.json();
    const email = String(user?.email || '').trim().toLowerCase();
    if (!(user?.email_confirmed_at || user?.confirmed_at) || !isAccountEmailAllowed(email)) {
      return res.status(403).json({ success: false, error: 'El email no está confirmado o no está habilitado para la agenda.' });
    }

    res.setHeader('Set-Cookie', sessionCookieHeader(signSession(email)));
    return res.json({ success: true, email });
  } catch (err) {
    console.error('No se pudo validar la sesión de Supabase:', err);
    return res.status(502).json({ success: false, error: 'No se pudo validar la sesión. Probá de nuevo.' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const session = readSession(req);
  if (session) return res.json({ authenticated: true, email: session.email, demo: isDemoMode() });
  if (isDemoMode() && sessionSecret()) {
    res.setHeader('Set-Cookie', sessionCookieHeader(signSession(DEMO_EMAIL, 'demo')));
    return res.json({ authenticated: true, email: DEMO_EMAIL, demo: true });
  }
  return res.json({ authenticated: false });
});

// ---------------------------------------------------------------------------
app.post('/api/auth/logout', (_req, res) => {
  res.setHeader('Set-Cookie', sessionCookieHeader('', 0));
  res.json({ success: true });
});

// In-memory Shared Store for zero-quota sub-50ms multi-device synchronization
let sharedAgendaStore: {
  contacts?: any[];
  appointments?: any[];
  reminders?: any[];
  notes?: any[];
  attachments?: any[];
  insuranceFiles?: any[];
  // Registros borrados (id -> fecha). Un equipo desactualizado no puede
  // revivirlos: el servidor rechaza volver a guardarlos y los clientes los
  // quitan de su copia local.
  deletedIds?: { contacts?: Record<string, string>; appointments?: Record<string, string> };
  lastUpdated?: string;
  sourceDevice?: string;
} = {};

type DeletedKind = 'contacts' | 'appointments';

function isDeleted(kind: DeletedKind, id: string): boolean {
  return Boolean(sharedAgendaStore.deletedIds?.[kind]?.[id]);
}

function deletedIdList(kind: DeletedKind): string[] {
  return Object.keys(sharedAgendaStore.deletedIds?.[kind] || {});
}

async function markDeleted(kind: DeletedKind, ids: string[]) {
  if (ids.length === 0) return;
  const now = new Date().toISOString();
  const deletedIds = { ...(sharedAgendaStore.deletedIds || {}) };
  deletedIds[kind] = { ...(deletedIds[kind] || {}) };
  for (const id of ids) deletedIds[kind]![id] = now;
  sharedAgendaStore.deletedIds = deletedIds;
  if (isDbConfigured) {
    for (const id of ids) {
      try {
        await db.execute(sql`INSERT INTO deleted_records (id, kind, deleted_at) VALUES (${id}, ${kind}, NOW()) ON CONFLICT (kind, id) DO NOTHING`);
      } catch (err: any) {
        console.warn('No se pudo registrar el borrado:', err?.message);
      }
    }
  }
}

function upsertInMemory(kind: 'contacts' | 'appointments', record: any) {
  const list = sharedAgendaStore[kind] || [];
  const idx = list.findIndex((x: any) => x.id === record.id);
  sharedAgendaStore[kind] = idx >= 0 ? list.map((x: any, i: number) => (i === idx ? { ...x, ...record } : x)) : [record, ...list];
  sharedAgendaStore.lastUpdated = new Date().toISOString();
}

const sharedInsuranceFilesMap = new Map<string, any>();

function saveToDiskBackup() {
  try {
    const insuranceFiles = Array.from(sharedInsuranceFilesMap.values());
    const dataToSave = {
      ...sharedAgendaStore,
      insuranceFiles: insuranceFiles.length > 0 ? insuranceFiles : (sharedAgendaStore.insuranceFiles || []),
    };
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(dataToSave), 'utf-8');
  } catch (err: any) {
    console.warn('Could not write disk backup:', err?.message);
  }
}

function loadFromDiskBackup() {
  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        sharedAgendaStore = {
          ...parsed,
          lastUpdated: parsed.lastUpdated || new Date().toISOString(),
          sourceDevice: 'disk_restore',
        };
        if (Array.isArray(parsed.insuranceFiles)) {
          for (const f of parsed.insuranceFiles) {
            if (f && f.id) {
              sharedInsuranceFilesMap.set(f.id, f);
            }
          }
        }
        console.log(`[Storage] Loaded ${sharedAgendaStore.contacts?.length || 0} contacts and ${sharedAgendaStore.appointments?.length || 0} appointments from disk.`);
      }
    }
  } catch (err: any) {
    console.warn('Could not read disk backup:', err?.message);
  }
}

// Auto-create tables if running on a fresh PostgreSQL/Supabase database
async function ensureTablesExist() {
  if (!isDbConfigured) return;
  try {
    const tableStatements = [
      sql`CREATE TABLE IF NOT EXISTS contacts (
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
      );`,
      sql`CREATE TABLE IF NOT EXISTS appointments (
        id VARCHAR(255) PRIMARY KEY,
        contact_id VARCHAR(255) REFERENCES contacts(id) ON DELETE CASCADE,
        date VARCHAR(50) NOT NULL,
        time VARCHAR(50) NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 30,
        motive VARCHAR(255),
        dentist VARCHAR(255),
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        whatsapp_status VARCHAR(50),
        whatsapp_last_reply TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        ingresos NUMERIC(10, 2) DEFAULT 0,
        descartables NUMERIC(10, 2) DEFAULT 0,
        estampillas NUMERIC(10, 2) DEFAULT 0,
        materiales NUMERIC(10, 2) DEFAULT 0,
        mecanico_dental NUMERIC(10, 2) DEFAULT 0,
        porcentaje_honorario NUMERIC(5, 2) DEFAULT 50
      );`,
      sql`CREATE TABLE IF NOT EXISTS call_reminders (
        id VARCHAR(255) PRIMARY KEY,
        contact_id VARCHAR(255) REFERENCES contacts(id) ON DELETE CASCADE,
        date VARCHAR(50) NOT NULL,
        time VARCHAR(50) NOT NULL,
        note TEXT,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      sql`CREATE TABLE IF NOT EXISTS contact_notes (
        id VARCHAR(255) PRIMARY KEY,
        contact_id VARCHAR(255) REFERENCES contacts(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        color VARCHAR(50),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      sql`CREATE TABLE IF NOT EXISTS contact_attachments (
        id VARCHAR(255) PRIMARY KEY,
        contact_id VARCHAR(255) REFERENCES contacts(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        size INTEGER NOT NULL,
        type VARCHAR(100) NOT NULL,
        data_url TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      sql`CREATE TABLE IF NOT EXISTS insurance_files (
        id VARCHAR(255) PRIMARY KEY,
        insurance_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size INTEGER NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        data_url TEXT NOT NULL,
        notes TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );`,
      sql`CREATE TABLE IF NOT EXISTS deleted_records (
        id VARCHAR(255) NOT NULL,
        kind VARCHAR(50) NOT NULL,
        deleted_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (kind, id)
      );`,
    ];

    for (const stmt of tableStatements) {
      await db.execute(stmt);
    }

    // Ensure columns exist on existing databases
    try {
      await db.execute(sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS whatsapp_status VARCHAR(50);`);
      await db.execute(sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS whatsapp_last_reply TIMESTAMP;`);
    } catch {}
  } catch (err: any) {
    if (isDbConfigured) {
      console.warn('Table initialization note:', err?.message);
    }
  }
}

// Preload data from database on startup
async function initStoreFromDatabase() {
  if (!isDbConfigured) return;
  try {
    await ensureTablesExist();

    const contactsData = await db.select().from(schema.contacts);
    const appointmentsData = await db.select().from(schema.appointments);
    const remindersData = await db.select().from(schema.callReminders);
    const notesData = await db.select().from(schema.contactNotes);
    const attachmentsData = await db.select().from(schema.contactAttachments);
    const insuranceFilesData = await db.select().from(schema.insuranceFiles);
    const deletedRows: any = await db.execute(sql`SELECT id, kind, deleted_at FROM deleted_records`);
    const deletedIds: NonNullable<typeof sharedAgendaStore.deletedIds> = { contacts: {}, appointments: {} };
    for (const row of (deletedRows?.rows || deletedRows || []) as any[]) {
      if (row.kind === 'contacts' || row.kind === 'appointments') {
        deletedIds[row.kind as DeletedKind]![row.id] = new Date(row.deleted_at).toISOString();
      }
    }

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
      deletedIds,
      lastUpdated: new Date().toISOString(),
      sourceDevice: 'server_init',
    };
  } catch (err: any) {
    if (isDbConfigured) {
      console.warn('Initial load from Cloud SQL:', err?.message);
    }
  }
}

// Persiste en segundo plano las listas auxiliares (recordatorios, notas y
// archivos de obra social). Pacientes y turnos NO pasan por acá: se guardan
// solo con los endpoints por registro (/api/contacts, /api/appointments), que
// validan y no reviven registros borrados.
// Cada registro va en su propio try/catch: un error (p. ej. clave foránea de
// un paciente ya borrado) no corta el guardado del resto del lote.
async function persistToCloudSql(payload: any) {
  if (!isDbConfigured) return;
  const { reminders, notes, insuranceFiles } = payload || {};
  let failures = 0;
  const attempt = async (label: string, id: unknown, fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (err: any) {
      failures += 1;
      console.warn(`No se pudo guardar ${label} ${String(id)}:`, err?.message);
    }
  };

  if (Array.isArray(reminders)) {
    for (const r of reminders) {
      if (!r?.id || !r.contactId || isDeleted('contacts', r.contactId)) continue;
      await attempt('recordatorio', r.id, () =>
        db.insert(schema.callReminders).values({
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
        })
      );
    }
  }

  if (Array.isArray(notes)) {
    for (const n of notes) {
      if (!n?.id || !n.contactId || isDeleted('contacts', n.contactId)) continue;
      await attempt('nota', n.id, () =>
        db.insert(schema.contactNotes).values({
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
        })
      );
    }
  }

  if (Array.isArray(insuranceFiles)) {
    for (const f of insuranceFiles) {
      if (!f?.id) continue;
      await attempt('archivo', f.id, () =>
        db.insert(schema.insuranceFiles).values({
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
        })
      );
    }
  }

  if (failures > 0) console.warn(`Sincronización con la base: ${failures} registro(s) no se guardaron.`);
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
app.get('/api/sync/events', requireSession, (req, res) => {
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
app.get('/api/sync/agenda', requireSession, async (req, res) => {
  const insuranceFiles = Array.from(sharedInsuranceFilesMap.values());
  res.json({
    success: true,
    data: {
      ...sharedAgendaStore,
      insuranceFiles: insuranceFiles.length > 0 ? insuranceFiles : (sharedAgendaStore.insuranceFiles || []),
    },
  });
});

app.post('/api/sync/agenda', requireSession, (req, res) => {
  try {
    const payload = req.body || {};
    
    if (Array.isArray(payload.insuranceFiles)) {
      // Tratamos el array recibido como la lista completa y autoritativa:
      // primero borramos del mapa cualquier archivo que ya no esté presente
      // (esto es lo que faltaba: sin esto, un archivo borrado en el cliente
      // nunca se borraba del lado del servidor y volvia a aparecer).
      const incomingIds = new Set(payload.insuranceFiles.filter((f: any) => f && f.id).map((f: any) => f.id));
      for (const existingId of Array.from(sharedInsuranceFilesMap.keys())) {
        if (!incomingIds.has(existingId)) {
          sharedInsuranceFilesMap.delete(existingId);
        }
      }

      for (const f of payload.insuranceFiles) {
        if (f && f.id) {
          const existing = sharedInsuranceFilesMap.get(f.id);
          if (existing && existing.dataUrl && (!f.dataUrl || f.dataUrl.length < 50)) {
            sharedInsuranceFilesMap.set(f.id, { ...existing, ...f, dataUrl: existing.dataUrl });
          } else if (validateInsuranceFileInput(f).ok) {
            sharedInsuranceFilesMap.set(f.id, f);
          } else {
            console.warn('Archivo de obra social rechazado en sync:', f.id);
          }
        }
      }
      payload.insuranceFiles = Array.from(sharedInsuranceFilesMap.values());
    }

    const currentFiles = Array.from(sharedInsuranceFilesMap.values());

    // Pacientes y turnos ya no se aceptan como lista completa: un equipo
    // desactualizado revivía turnos borrados y se salteaba la validación de
    // superposición. Se guardan solo con /api/contacts y /api/appointments.
    const liveContactIds = new Set((sharedAgendaStore.contacts || []).map((c: any) => c.id));
    const belongsToLiveContact = (r: any) => r && r.contactId && !isDeleted('contacts', r.contactId) && (liveContactIds.size === 0 || liveContactIds.has(r.contactId));
    if (Array.isArray(payload.reminders)) payload.reminders = payload.reminders.filter(belongsToLiveContact);
    if (Array.isArray(payload.notes)) payload.notes = payload.notes.filter(belongsToLiveContact);
    if (Array.isArray(payload.attachments)) payload.attachments = payload.attachments.filter(belongsToLiveContact);

    sharedAgendaStore = {
      ...sharedAgendaStore,
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

    // Save to disk backup and cloud in background
    saveToDiskBackup();
    persistToCloudSql(payload).catch(() => {});

    res.json({ success: true, lastUpdated: sharedAgendaStore.lastUpdated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: publicError('Error al sincronizar la agenda.', err) });
  }
});

// Dedicated endpoints for full insurance file upload & management
app.get('/api/sync/insurance-files', requireSession, (req, res) => {
  const files = Array.from(sharedInsuranceFilesMap.values());
  res.json({ success: true, files });
});

app.post('/api/sync/insurance-file', requireSession, (req, res) => {
  try {
    const file = req.body;
    const validation = validateInsuranceFileInput(file);
    if (!validation.ok) {
      return res.status(400).json({ success: false, error: validation.error });
    }
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
      if (isDbConfigured) db.insert(schema.insuranceFiles).values({
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
    res.status(500).json({ success: false, error: publicError('No se pudo guardar en la base de datos.', err) });
  }
});

app.delete('/api/sync/insurance-file/:id', requireSession, (req, res) => {
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
    res.status(500).json({ success: false, error: publicError('No se pudo guardar en la base de datos.', err) });
  }
});

// -------------------------------------------------------------
// Endpoints por registro individual (Postgres = fuente de verdad)
// Evitan que un dispositivo pise los cambios de otro: cada guardado
// o borrado toca UN SOLO registro por id, no la lista completa.
// -------------------------------------------------------------

app.get('/api/contacts', requireSession, async (req, res) => {
  const deletedIds = deletedIdList('contacts');
  if (!isDbConfigured) {
    return res.json({ success: true, contacts: sharedAgendaStore.contacts || [], deletedIds });
  }
  try {
    const rows = await db.select().from(schema.contacts).orderBy(schema.contacts.createdAt);
    res.json({ success: true, contacts: rows, deletedIds });
  } catch (err: any) {
    res.status(500).json({ success: false, error: publicError('No se pudo leer la base de datos.', err) });
  }
});

function contactRecord(c: any) {
  const trimOrNull = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  return {
    id: c.id,
    fullName: String(c.fullName).trim(),
    isParticular: c.isParticular ?? true,
    insuranceName: trimOrNull(c.insuranceName),
    affiliateNumber: trimOrNull(c.affiliateNumber),
    primaryPhone: String(c.primaryPhone).trim(),
    altPhone: trimOrNull(c.altPhone),
    email: trimOrNull(c.email),
    address: trimOrNull(c.address),
    observations: typeof c.observations === 'string' ? c.observations : null,
    isFavorite: c.isFavorite ?? false,
    avatarColor: trimOrNull(c.avatarColor),
    createdAt: c.createdAt || new Date().toISOString(),
    updatedAt: c.updatedAt || new Date().toISOString(),
  };
}

app.post('/api/contacts', requireSession, async (req, res) => {
  try {
    const validation = validateContactInput(req.body);
    if (!validation.ok) return res.status(400).json({ success: false, error: validation.error });
    const c = contactRecord(req.body);
    if (isDeleted('contacts', c.id)) {
      return res.status(410).json({ success: false, error: 'Ese paciente fue eliminado.' });
    }
    if (isDbConfigured) {
      const { id, createdAt, ...updatable } = c;
      await db.insert(schema.contacts).values(c).onConflictDoUpdate({
        target: schema.contacts.id,
        set: updatable,
      });
    }
    upsertInMemory('contacts', c);
    saveToDiskBackup();
    broadcastToSSEClients({ type: 'CONTACT_UPSERT', contact: c, timestamp: new Date().toISOString() });
    res.json({ success: true, contact: c });
  } catch (err: any) {
    res.status(500).json({ success: false, error: publicError('No se pudo guardar en la base de datos.', err) });
  }
});

app.delete('/api/contacts/:id', requireSession, async (req, res) => {
  try {
    const { id } = req.params;
    // Turnos del paciente: la base los borra en cascada (ON DELETE CASCADE);
    // acá se quitan también de la memoria y se avisa a los demás equipos.
    const apptIds = new Set((sharedAgendaStore.appointments || []).filter((a: any) => a.contactId === id).map((a: any) => a.id));
    if (isDbConfigured) {
      const dbAppts = await db.select({ id: schema.appointments.id }).from(schema.appointments).where(eq(schema.appointments.contactId, id));
      dbAppts.forEach((a) => apptIds.add(a.id));
      await db.delete(schema.contacts).where(eq(schema.contacts.id, id));
    }
    sharedAgendaStore.contacts = (sharedAgendaStore.contacts || []).filter((c: any) => c.id !== id);
    sharedAgendaStore.appointments = (sharedAgendaStore.appointments || []).filter((a: any) => a.contactId !== id);
    sharedAgendaStore.reminders = (sharedAgendaStore.reminders || []).filter((r: any) => r.contactId !== id);
    sharedAgendaStore.notes = (sharedAgendaStore.notes || []).filter((n: any) => n.contactId !== id);
    sharedAgendaStore.attachments = (sharedAgendaStore.attachments || []).filter((a: any) => a.contactId !== id);
    sharedAgendaStore.lastUpdated = new Date().toISOString();
    await markDeleted('contacts', [id]);
    await markDeleted('appointments', Array.from(apptIds));
    saveToDiskBackup();

    const timestamp = new Date().toISOString();
    broadcastToSSEClients({ type: 'CONTACT_DELETE', id, appointmentIds: Array.from(apptIds), timestamp });
    for (const apptId of apptIds) broadcastToSSEClients({ type: 'APPOINTMENT_DELETE', id: apptId, timestamp });
    res.json({ success: true, deletedAppointmentIds: Array.from(apptIds) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: publicError('No se pudo borrar el paciente.', err) });
  }
});

app.get('/api/appointments', requireSession, async (req, res) => {
  const deletedIds = deletedIdList('appointments');
  if (!isDbConfigured) {
    return res.json({ success: true, appointments: sharedAgendaStore.appointments || [], deletedIds });
  }
  try {
    const rows = await db.select().from(schema.appointments).orderBy(schema.appointments.createdAt);
    res.json({ success: true, appointments: rows, deletedIds });
  } catch (err: any) {
    res.status(500).json({ success: false, error: publicError('No se pudo leer la base de datos.', err) });
  }
});

function appointmentRecord(a: any) {
  const num = (v: unknown, fallback: number) => (v === undefined || v === null || v === '' ? fallback : Number(v));
  return {
    id: a.id,
    contactId: a.contactId,
    date: a.date,
    time: a.time,
    durationMinutes: num(a.durationMinutes, 30),
    motive: typeof a.motive === 'string' ? a.motive : null,
    dentist: a.dentist,
    completed: Boolean(a.completed),
    whatsappStatus: a.whatsappStatus ?? null,
    whatsappLastReply: a.whatsappLastReply ?? null,
    createdAt: a.createdAt || new Date().toISOString(),
    ingresos: num(a.ingresos, 0),
    descartables: num(a.descartables, 0),
    estampillas: num(a.estampillas, 0),
    materiales: num(a.materiales, 0),
    mecanicoDental: num(a.mecanicoDental, 0),
    porcentajeHonorario: num(a.porcentajeHonorario, 50),
  };
}

async function contactExists(contactId: string): Promise<boolean> {
  if (isDeleted('contacts', contactId)) return false;
  if ((sharedAgendaStore.contacts || []).some((c: any) => c.id === contactId)) return true;
  if (!isDbConfigured) return false;
  const rows = await db.select({ id: schema.contacts.id }).from(schema.contacts).where(eq(schema.contacts.id, contactId)).limit(1);
  return rows.length > 0;
}

app.post('/api/appointments', requireSession, async (req, res) => {
  try {
    const body = req.body || {};
    // "force" solo vale para este pedido (el usuario eligió "Agendar de todos
    // modos"); no se guarda en el turno.
    const force = body.force === true;
    const input = { ...body };
    delete input.force;
    // "Dra. Yani" → "Yani"; un nombre desconocido queda tal cual y la validación lo rechaza.
    if (input.dentist) input.dentist = parseDentist(input.dentist) ?? input.dentist;

    const validation = validateAppointmentInput(input);
    if (!validation.ok) return res.status(400).json({ success: false, error: validation.error });
    const a = appointmentRecord(input);

    if (isDeleted('appointments', a.id)) {
      return res.status(410).json({ success: false, error: 'Ese turno fue eliminado.' });
    }
    if (!(await contactExists(a.contactId))) {
      return res.status(400).json({ success: false, error: 'El paciente del turno no existe (¿fue eliminado?).' });
    }

    // Control de superposición también en el servidor (dos equipos al mismo tiempo).
    if (!force && !a.completed && a.whatsappStatus !== 'cancelled') {
      let nearby: any[] = sharedAgendaStore.appointments || [];
      if (isDbConfigured) {
        try {
          nearby = await db.select().from(schema.appointments);
        } catch {
          // si la base no responde, se usa lo que hay en memoria
        }
      }
      const clash = findConflictingAppointment(nearby, a);
      if (clash) {
        return res.status(409).json({
          success: false,
          conflict: { id: clash.id, date: clash.date, time: clash.time, dentist: clash.dentist },
          error: `Ese horario se superpone con otro turno (${clash.time} hs).`,
        });
      }
    }
    if (isDbConfigured) {
      const { id, createdAt, ...updatable } = a;
      await db.insert(schema.appointments).values(a).onConflictDoUpdate({
        target: schema.appointments.id,
        set: updatable,
      });
    }
    upsertInMemory('appointments', a);
    saveToDiskBackup();
    broadcastToSSEClients({ type: 'APPOINTMENT_UPSERT', appointment: a, timestamp: new Date().toISOString() });
    res.json({ success: true, appointment: a });
  } catch (err: any) {
    res.status(500).json({ success: false, error: publicError('No se pudo guardar en la base de datos.', err) });
  }
});

async function deleteAppointmentEverywhere(id: string) {
  if (isDbConfigured) {
    await db.delete(schema.appointments).where(eq(schema.appointments.id, id));
  }
  sharedAgendaStore.appointments = (sharedAgendaStore.appointments || []).filter((a: any) => a.id !== id);
  sharedAgendaStore.lastUpdated = new Date().toISOString();
  await markDeleted('appointments', [id]);
  saveToDiskBackup();
  broadcastToSSEClients({ type: 'APPOINTMENT_DELETE', id, timestamp: new Date().toISOString() });
}

app.delete('/api/appointments/:id', requireSession, async (req, res) => {
  try {
    await deleteAppointmentEverywhere(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: publicError('No se pudo borrar el turno.', err) });
  }
});

// Clear / Wipe Database API Endpoints
const CLEAR_TARGETS = ['all', 'appointments_only', 'reminders_only'] as const;
const CLEAR_CONFIRMATION = 'BORRAR';

app.post('/api/db/clear', requireSession, async (req, res) => {
  if (isDemoMode()) {
    return res.status(403).json({ success: false, error: 'En la demo no se puede borrar la base.' });
  }
  const target = (req.body?.target || 'all') as (typeof CLEAR_TARGETS)[number];
  if (!CLEAR_TARGETS.includes(target)) {
    return res.status(400).json({ success: false, error: 'Destino de borrado inválido.' });
  }
  if (req.body?.confirm !== CLEAR_CONFIRMATION) {
    return res.status(400).json({ success: false, error: `Para borrar hay que confirmar escribiendo ${CLEAR_CONFIRMATION}.` });
  }

  // Backup automático previo (en disco) por si el borrado fue un error.
  try {
    const backupPath = path.join(process.cwd(), `agenda_backup_before_clear_${Date.now()}.json`);
    let snapshot: any = { ...sharedAgendaStore, insuranceFiles: Array.from(sharedInsuranceFilesMap.values()) };
    if (isDbConfigured) {
      snapshot = {
        contacts: await db.select().from(schema.contacts),
        appointments: await db.select().from(schema.appointments),
        reminders: await db.select().from(schema.callReminders),
        notes: await db.select().from(schema.contactNotes),
        attachments: await db.select().from(schema.contactAttachments),
        insuranceFiles: await db.select().from(schema.insuranceFiles),
      };
    }
    fs.writeFileSync(backupPath, JSON.stringify(snapshot), 'utf-8');
    console.log(`[db/clear] Backup previo guardado en ${backupPath} por ${readSession(req)?.email}`);
  } catch (err: any) {
    console.error('No se pudo hacer el backup previo al borrado:', err?.message);
    return res.status(500).json({ success: false, error: 'No se pudo hacer el backup previo. No se borró nada.' });
  }

  try {
    if (isDbConfigured) {
      if (target === 'appointments_only') {
        await db.delete(schema.appointments);
      } else if (target === 'reminders_only') {
        await db.delete(schema.callReminders);
      } else {
        await db.delete(schema.appointments);
        await db.delete(schema.callReminders);
        await db.delete(schema.contactNotes);
        await db.delete(schema.contactAttachments);
        await db.delete(schema.insuranceFiles);
        await db.delete(schema.contacts);
      }
    }
  } catch (error: any) {
    console.warn('Error clearing database:', error?.message);
    return res.status(500).json({ success: false, error: publicError('No se pudo borrar la base de datos.', error) });
  }

  if (target === 'appointments_only') {
    await markDeleted('appointments', (sharedAgendaStore.appointments || []).map((a: any) => a.id));
    sharedAgendaStore.appointments = [];
  } else if (target === 'reminders_only') {
    sharedAgendaStore.reminders = [];
  } else {
    await markDeleted('contacts', (sharedAgendaStore.contacts || []).map((c: any) => c.id));
    await markDeleted('appointments', (sharedAgendaStore.appointments || []).map((a: any) => a.id));
    sharedInsuranceFilesMap.clear();
    sharedAgendaStore = {
      contacts: [],
      appointments: [],
      reminders: [],
      notes: [],
      attachments: [],
      insuranceFiles: [],
      deletedIds: sharedAgendaStore.deletedIds,
      lastUpdated: new Date().toISOString(),
    };
  }
  sharedAgendaStore.lastUpdated = new Date().toISOString();
  saveToDiskBackup();

  broadcastToSSEClients({
    type: 'AGENDA_UPDATE',
    data: sharedAgendaStore,
    timestamp: sharedAgendaStore.lastUpdated,
  });

  return res.json({ success: true, dbAvailable: isDbConfigured });
});

// Database API Endpoints (Cloud SQL PostgreSQL)
app.get('/api/db/all', async (req, res) => {
  if (!isAdminRequest(req)) {
    return res.status(403).json({ success: false, error: 'No autorizado' });
  }
  if (!isDbConfigured) {
    return res.json({ dbAvailable: false, contacts: [], appointments: [], reminders: [], notes: [], attachments: [], insuranceFiles: [] });
  }
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
    if (isDbConfigured) {
      console.warn('Database not reachable:', error?.message);
    }
    return res.json({ dbAvailable: false, contacts: [], appointments: [], reminders: [], notes: [], attachments: [], insuranceFiles: [] });
  }
});

app.post('/api/db/sync', requireSession, async (req, res) => {
  try {
    await persistToCloudSql(req.body);
    return res.json({ success: true, dbAvailable: true });
  } catch (error: any) {
    console.warn('Database sync failed:', error?.message);
    return res.json({ success: true, dbAvailable: false });
  }
});


// -------------------------------------------------------------
// 1-Click Patient Confirmation & WhatsApp Reminder Endpoints
// (100% Privacy - No QR code, no WhatsApp account connection)
// -------------------------------------------------------------
const APP_TIMEZONE = process.env.APP_TIMEZONE || 'America/Argentina/Buenos_Aires';

// Fecha y hora actuales del consultorio ("YYYY-MM-DD", "HH:mm"), sin depender
// de la zona horaria del servidor (Render corre en UTC).
function nowInClinic(): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || '00';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}

type PublicApptState = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'past';

function publicAppointmentState(appt: any): PublicApptState {
  if (appt.completed) return 'completed';
  if (appt.whatsappStatus === 'cancelled') return 'cancelled';
  const now = nowInClinic();
  const startsAt = `${appt.date} ${appt.time}`;
  if (!appt.date || !appt.time || startsAt <= `${now.date} ${now.time}`) return 'past';
  return appt.whatsappStatus === 'confirmed' ? 'confirmed' : 'pending';
}

const PUBLIC_STATE_MESSAGES: Record<Exclude<PublicApptState, 'pending' | 'confirmed'>, string> = {
  completed: 'Este turno ya fue atendido.',
  past: 'Este turno ya pasó. Si necesitás uno nuevo, comunicate con el consultorio.',
  cancelled: 'Este turno ya fue cancelado. Si querés reprogramarlo, comunicate con el consultorio.',
};

async function findAppointmentForPublicLink(id: string): Promise<{ appt: any; contact: any } | null> {
  if (isDeleted('appointments', id)) return null;
  let appt = (sharedAgendaStore.appointments || []).find((a: any) => a.id === id);
  let contact = appt ? (sharedAgendaStore.contacts || []).find((c: any) => c.id === appt.contactId) : null;

  if (!appt && isDbConfigured) {
    try {
      const dbAppts = await db.select().from(schema.appointments).where(eq(schema.appointments.id, id)).limit(1);
      if (dbAppts.length > 0) {
        appt = dbAppts[0];
        const dbContacts = await db.select().from(schema.contacts).where(eq(schema.contacts.id, appt.contactId)).limit(1);
        if (dbContacts.length > 0) contact = dbContacts[0];
      }
    } catch (dbErr) {
      console.warn('Fallback DB lookup error for public appointment:', dbErr);
    }
  }
  return appt ? { appt, contact } : null;
}

function publicAppointmentView(appt: any, contact: any) {
  const state = publicAppointmentState(appt);
  // Solo el nombre de pila: el link puede quedar abierto en otro dispositivo.
  const firstName = String(contact?.fullName || '').trim().split(/\s+/)[0] || 'Paciente';
  return {
    id: appt.id,
    patientName: firstName,
    date: appt.date,
    time: appt.time,
    dentist: appt.dentist || 'Marie',
    treatment: appt.motive || '',
    whatsappStatus: appt.whatsappStatus || 'pending',
    state,
    canRespond: state === 'pending' || state === 'confirmed',
    canConfirm: state === 'pending',
    canCancel: state === 'pending' || state === 'confirmed',
    message: state in PUBLIC_STATE_MESSAGES ? PUBLIC_STATE_MESSAGES[state as keyof typeof PUBLIC_STATE_MESSAGES] : null,
    lastUpdated: appt.whatsappLastReply || null,
  };
}

const NOT_FOUND_PUBLIC = { error: 'El link no es válido o el turno ya no existe.', code: 'not_found' };

app.get('/api/public/appointment/:id', async (req, res) => {
  try {
    const id = resolvePublicToken(req.params.id);
    if (!id) return res.status(404).json(NOT_FOUND_PUBLIC);
    const found = await findAppointmentForPublicLink(id);
    if (!found) return res.status(404).json(NOT_FOUND_PUBLIC);
    return res.json(publicAppointmentView(found.appt, found.contact));
  } catch (error: any) {
    return res.status(500).json({ error: publicError('Error al obtener datos del turno', error) });
  }
});

app.post('/api/public/appointment/:id/respond', async (req, res) => {
  try {
    const id = resolvePublicToken(req.params.id);
    if (!id) return res.status(404).json(NOT_FOUND_PUBLIC);
    const { action } = req.body || {}; // 'confirm' | 'cancel'
    if (action !== 'confirm' && action !== 'cancel') {
      return res.status(400).json({ error: 'Acción inválida. Debe ser "confirm" o "cancel".' });
    }

    const found = await findAppointmentForPublicLink(id);
    if (!found) return res.status(404).json(NOT_FOUND_PUBLIC);
    const { appt, contact } = found;

    // Transiciones permitidas: pendiente → confirmado/cancelado,
    // confirmado → cancelado. Cancelado, atendido o pasado son finales.
    const state = publicAppointmentState(appt);
    if (state === 'completed' || state === 'past' || state === 'cancelled') {
      return res.status(409).json({ error: PUBLIC_STATE_MESSAGES[state], code: state, ...publicAppointmentView(appt, contact) });
    }
    if (action === 'confirm' && state === 'confirmed') {
      return res.json({ ...publicAppointmentView(appt, contact), success: true, status: 'confirmed', message: 'El turno ya estaba confirmado.' });
    }

    const newStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
    const nowIso = new Date().toISOString();

    if (isDbConfigured) {
      // Si la base falla, se informa el error (antes se mostraba éxito igual).
      await db.update(schema.appointments)
        .set({ whatsappStatus: newStatus, whatsappLastReply: nowIso })
        .where(eq(schema.appointments.id, id));
    }
    const updated = { ...appt, whatsappStatus: newStatus, whatsappLastReply: nowIso };
    upsertInMemory('appointments', updated);
    saveToDiskBackup();

    broadcastToSSEClients({
      type: newStatus === 'confirmed' ? 'APPOINTMENT_CONFIRMED' : 'APPOINTMENT_CANCELLED',
      data: {
        appointmentId: id,
        patientName: contact?.fullName || 'Paciente',
        date: appt.date || '',
        time: appt.time || '',
        dentist: appt.dentist || 'Marie',
      },
      appointment: updated,
      timestamp: nowIso,
    });

    patchSupabaseAppointment(id, {
      status: newStatus,
      color: newStatus === 'confirmed' ? '#10b981' : '#ef4444',
      whatsapp_status: newStatus,
      whatsapp_last_reply: nowIso,
    });

    return res.json({
      ...publicAppointmentView(updated, contact),
      success: true,
      status: newStatus,
      message: newStatus === 'confirmed' ? 'Turno confirmado con éxito' : 'Turno marcado como cancelado',
    });
  } catch (error: any) {
    return res.status(500).json({ error: publicError('Error al procesar respuesta', error) });
  }
});

app.post('/api/appointment/:id/mark-reminder-sent', requireSession, async (req, res) => {
  try {
    const { id } = req.params;
    let exists = (sharedAgendaStore.appointments || []).some((a: any) => a.id === id);
    if (!exists && isDbConfigured) {
      const rows = await db.select({ id: schema.appointments.id }).from(schema.appointments).where(eq(schema.appointments.id, id)).limit(1);
      exists = rows.length > 0;
    }
    if (!exists || isDeleted('appointments', id)) {
      return res.status(404).json({ success: false, error: 'Turno no encontrado.' });
    }
    if (sharedAgendaStore.appointments) {
      sharedAgendaStore.appointments = sharedAgendaStore.appointments.map((a: any) => {
        if (a.id === id && !a.whatsappStatus) {
          // No pisa un turno ya confirmado o cancelado.
          return {
            ...a,
            whatsappStatus: 'pending',
          };
        }
        return a;
      });
      sharedAgendaStore.lastUpdated = new Date().toISOString();
      broadcastToSSEClients({
        type: 'AGENDA_UPDATE',
        data: sharedAgendaStore,
        timestamp: sharedAgendaStore.lastUpdated,
      });
    }
    return res.json({ success: true, publicToken: publicLinkToken(id) });
  } catch (error: any) {
    return res.status(500).json({ error: publicError('Error al procesar el turno.', error) });
  }
});

// Ruta vieja: se mantiene por compatibilidad, hace lo mismo que DELETE /api/appointments/:id.
app.delete('/api/appointment/:id', requireSession, async (req, res) => {
  try {
    await deleteAppointmentEverywhere(req.params.id);
    return res.json({ success: true, message: 'Turno eliminado correctamente' });
  } catch (error: any) {
    return res.status(500).json({ error: publicError('Error al procesar el turno.', error) });
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
app.post('/api/assistant/chat', requireSession, async (req, res) => {
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
    });
  }
});

async function startServer() {
  assertProductionSecrets();
  loadFromDiskBackup();
  await initStoreFromDatabase();

  // Rutas /api inexistentes: 404 en JSON (antes devolvían index.html con 200).
  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, error: 'No encontrado' });
  });

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
