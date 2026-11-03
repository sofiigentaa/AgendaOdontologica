#!/usr/bin/env node
/**
 * Crea en Supabase una base cerrada por sistema y el servicio de Render que lo publica.
 * Retoma si se vuelve a correr. No imprime secretos.
 *
 *   node ops/provision.mjs
 *   node ops/provision.mjs --only agenda-odontologica
 *   node ops/provision.mjs --dry-run
 */

import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'ops', 'salida');
const statePath = path.join(outDir, 'estado.json');
const credentialsPath = path.join(outDir, 'credenciales.txt');
const lockdownSql = fs.readFileSync(path.join(root, 'ops', 'sql', 'cerrar-api-publica.sql'), 'utf8');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const onlyArg = args.find((a) => a.startsWith('--only=')) || (args.includes('--only') ? `--only=${args[args.indexOf('--only') + 1] || ''}` : '');
const only = new Set(
  (onlyArg.replace('--only=', '') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
);

const PROJECTS = [
  {
    id: 'agenda-odontologica',
    title: 'Agenda Odontológica',
    kind: 'servidor',
    repo: 'https://github.com/sofiigentaa/AgendaOdontologica',
    sql: { local: 'supabase/schema.sql' },
    render: {
      type: 'web_service',
      name: 'agenda-odontologica',
      buildCommand: 'npm ci --include=dev && npm run build',
      startCommand: 'npm start',
      healthCheckPath: '/api/health',
    },
    env(s) {
      return [
        ['NODE_VERSION', '22'],
        ['NODE_ENV', 'production'],
        ['CYPRESS_INSTALL_BINARY', '0'],
        ['DATABASE_URL', s.databaseUrl],
        ['CONSULTORIO_PASSWORD', s.appPassword],
        ['CONSULTORIO_EMAIL', s.email],
        ['SESSION_SECRET', s.sessionSecret],
        ['ADMIN_API_TOKEN', s.adminToken],
        ['ALLOW_LEGACY_PUBLIC_LINKS', 'false'],
      ];
    },
  },
  {
    id: 'agenda-medica',
    title: 'Agenda Médica',
    kind: 'servidor',
    repo: 'https://github.com/sofiigentaa/AgendaMedica',
    lockdownAfterDeploy: true,
    render: {
      type: 'web_service',
      name: 'agenda-medica',
      buildCommand: 'npm install --include=dev && npm run build',
      startCommand: 'npm start',
      healthCheckPath: '/api/health',
    },
    env(s) {
      return [
        ['NODE_VERSION', '22'],
        ['NODE_ENV', 'production'],
        ['DATABASE_URL', s.databaseUrl],
        ['SESSION_SECRET', s.sessionSecret],
        ['AUTH_PASSWORD_HASH', s.passwordHash],
      ];
    },
  },
  {
    id: 'candy-salon',
    title: 'Candy Salón de Eventos',
    kind: 'servidor',
    repo: 'https://github.com/sofiigentaa/CandySalonDeEventos',
    sql: { url: 'https://raw.githubusercontent.com/sofiigentaa/CandySalonDeEventos/main/supabase/schema.sql' },
    render: {
      type: 'web_service',
      name: 'candy-salon-eventos',
      buildCommand: 'npm ci --include=dev && npm run build',
      startCommand: 'npm start',
      healthCheckPath: '/api/health',
    },
    env(s) {
      return [
        ['NODE_VERSION', '22'],
        ['NODE_ENV', 'production'],
        ['DATABASE_URL', s.databaseUrl],
        ['SALON_PASSWORD', s.appPassword],
        ['SALON_EMAILS', s.email],
        ['SESSION_SECRET', s.sessionSecret],
        ['ALLOW_DEMO_RESET', 'false'],
        ['SEED_DEMO', 'false'],
      ];
    },
  },
  {
    id: 'sistema-kiosco',
    title: 'Sistema Kiosco',
    kind: 'estatico',
    repo: 'https://github.com/sofiigentaa/SistemaKiosco',
    sql: { url: 'https://raw.githubusercontent.com/sofiigentaa/SistemaKiosco/main/supabase/schema.sql' },
    createAuthUser: true,
    render: {
      type: 'static_site',
      name: 'sistema-kiosco',
      buildCommand: 'npm ci && npm run build',
      publishPath: 'dist',
    },
    env(s) {
      return [
        ['VITE_SUPABASE_URL', s.supabaseUrl],
        ['VITE_SUPABASE_ANON_KEY', s.anonKey],
        ['VITE_BRAND', ''],
      ];
    },
  },
  {
    id: 'ingresos-gastos',
    title: 'Ingresos y Gastos',
    kind: 'estatico',
    repo: 'https://github.com/sofiigentaa/Gestion-de-Ingresos-y-Gastos-para-Emprendedor',
    sql: { url: 'https://raw.githubusercontent.com/sofiigentaa/Gestion-de-Ingresos-y-Gastos-para-Emprendedor/main/supabase/schema.sql' },
    createAuthUser: true,
    render: {
      type: 'static_site',
      name: 'ingresos-y-gastos',
      buildCommand: 'npm ci && npm run build',
      publishPath: 'dist',
    },
    env(s) {
      return [
        ['VITE_SUPABASE_URL', s.supabaseUrl],
        ['VITE_SUPABASE_ANON_KEY', s.anonKey],
        ['VITE_BRAND', ''],
      ];
    },
  },
];

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, 'utf8').split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function secret(bytes = 24) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function loadState() {
  if (!fs.existsSync(statePath)) return { projects: {} };
  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

function saveState(state) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  fs.chmodSync(statePath, 0o600);
}

async function api(url, { method = 'GET', token, body, ok = [200, 201] } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }
  if (!ok.includes(res.status)) {
    const detail = typeof data === 'string' ? data : JSON.stringify(data);
    const err = new Error(`${method} ${url} → ${res.status}: ${detail.slice(0, 500)}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function selectedProjects() {
  if (only.size === 0) return PROJECTS;
  const unknown = [...only].filter((id) => !PROJECTS.some((p) => p.id === id));
  if (unknown.length) {
    throw new Error(`No conozco: ${unknown.join(', ')}. Ids: ${PROJECTS.map((p) => p.id).join(', ')}`);
  }
  return PROJECTS.filter((p) => only.has(p.id));
}

async function supabaseOrg(token) {
  const orgs = await api('https://api.supabase.com/v1/organizations', { token });
  const list = Array.isArray(orgs) ? orgs : [];
  const wanted = process.env.SUPABASE_ORG_SLUG;
  const org = wanted ? list.find((o) => o.slug === wanted || o.id === wanted) : list.length === 1 ? list[0] : null;
  if (!org) {
    const names = list.map((o) => `${o.name} (slug ${o.slug})`).join(', ') || 'ninguna';
    throw new Error(`No pude elegir la organización de Supabase. Encontré: ${names}. Poné SUPABASE_ORG_SLUG en .provision.env.`);
  }
  return org;
}

async function renderOwner(token) {
  const data = await api('https://api.render.com/v1/owners', { token });
  const rows = Array.isArray(data) ? data : [];
  const owners = rows.map((row) => row.owner || row).filter((o) => o && o.id);
  const wanted = process.env.RENDER_OWNER_ID;
  const owner = wanted ? owners.find((o) => o.id === wanted) : owners.length === 1 ? owners[0] : null;
  if (!owner) {
    const names = owners.map((o) => `${o.name || o.email || o.id} (${o.id})`).join(', ') || 'ninguno';
    throw new Error(`No pude elegir el workspace de Render. Encontré: ${names}. Poné RENDER_OWNER_ID en .provision.env.`);
  }
  return owner;
}

async function waitHealthy(token, ref) {
  const deadline = Date.now() + 8 * 60 * 1000;
  while (Date.now() < deadline) {
    const health = await api(`https://api.supabase.com/v1/projects/${ref}/health`, { token, ok: [200] });
    const rows = Array.isArray(health) ? health : [];
    const db = rows.find((r) => r.name === 'db' || r.service === 'db');
    const auth = rows.find((r) => r.name === 'auth' || r.service === 'auth');
    const dbOk = (db?.status || db?.healthy) === 'ACTIVE_HEALTHY' || db?.healthy === true;
    const authOk = (auth?.status || auth?.healthy) === 'ACTIVE_HEALTHY' || auth?.healthy === true;
    if (dbOk && authOk) return;
    await new Promise((r) => setTimeout(r, 10000));
  }
  throw new Error(`La base ${ref} no llegó a estar lista en 8 minutos. Volvé a correr el comando.`);
}

async function databaseUrl(token, ref, dbPassword) {
  const poolers = await api(`https://api.supabase.com/v1/projects/${ref}/config/database/pooler`, { token });
  const list = Array.isArray(poolers) ? poolers : [];
  const session = list.find((p) => p.pool_mode === 'session') || list.find((p) => Number(p.db_port) === 5432) || list[0];
  if (!session) throw new Error(`Supabase no devolvió el pooler de ${ref}.`);
  const user = session.db_user || `postgres.${ref}`;
  const host = session.db_host;
  const port = session.pool_mode === 'transaction' ? 5432 : session.db_port || 5432;
  const name = session.db_name || 'postgres';
  const url = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(dbPassword)}@${host}:${port}/${name}?sslmode=require`;
  return url;
}

function splitSql(sql) {
  const out = [];
  let buf = '';
  let dollar = null;
  let i = 0;
  while (i < sql.length) {
    if (!dollar && sql.startsWith('--', i)) {
      const nl = sql.indexOf('\n', i);
      i = nl === -1 ? sql.length : nl + 1;
      continue;
    }
    if (sql[i] === '$') {
      const match = sql.slice(i).match(/^\$[A-Za-z0-9_]*\$/);
      if (match) {
        if (!dollar) dollar = match[0];
        else if (dollar === match[0]) dollar = null;
        buf += match[0];
        i += match[0].length;
        continue;
      }
    }
    if (!dollar && sql[i] === ';') {
      if (buf.trim()) out.push(buf.trim());
      buf = '';
      i += 1;
      continue;
    }
    buf += sql[i];
    i += 1;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

async function runSql(token, ref, sql, label) {
  const statements = splitSql(sql);
  for (const query of statements) {
    try {
      await api(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
        method: 'POST',
        token,
        body: { query },
        ok: [200, 201],
      });
    } catch (err) {
      throw new Error(`SQL de ${label} falló: ${err.message}`);
    }
  }
}

async function loadSql(spec) {
  if (spec.local) return fs.readFileSync(path.join(root, spec.local), 'utf8');
  const res = await fetch(spec.url);
  if (!res.ok) throw new Error(`No pude bajar ${spec.url} (${res.status}).`);
  return res.text();
}

async function anonKey(token, ref) {
  const keys = await api(`https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`, { token });
  const list = Array.isArray(keys) ? keys : keys?.keys || [];
  const anon = list.find((k) => k.type === 'legacy' && k.name === 'anon') || list.find((k) => k.name === 'anon' || k.type === 'anon');
  const publishable = list.find((k) => k.type === 'publishable');
  const key = anon?.api_key || anon?.apiKey || publishable?.api_key || publishable?.apiKey;
  if (!key) throw new Error(`No encontré la clave pública del proyecto ${ref}.`);
  return key;
}

async function serviceRoleKey(token, ref) {
  const keys = await api(`https://api.supabase.com/v1/projects/${ref}/api-keys?reveal=true`, { token });
  const list = Array.isArray(keys) ? keys : [];
  const secret =
    list.find((k) => k.name === 'service_role') ||
    list.find((k) => k.type === 'secret') ||
    list.find((k) => String(k.type || '').includes('service'));
  return secret?.api_key || secret?.apiKey || null;
}

async function ensureAuthUser(ref, serviceKey, email, password) {
  const res = await fetch(`https://${ref}.supabase.co/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (res.status === 422 || res.status === 409) return;
  if (!res.ok) {
    const text = await res.text();
    if (/already|exists|registered/i.test(text)) return;
    throw new Error(`No pude crear el usuario ${email} en ${ref}: ${res.status} ${text.slice(0, 300)}`);
  }
}

async function listRenderServices(token) {
  const services = [];
  let cursor = '';
  for (let page = 0; page < 20; page += 1) {
    const url = new URL('https://api.render.com/v1/services');
    url.searchParams.set('limit', '100');
    if (cursor) url.searchParams.set('cursor', cursor);
    const data = await api(url, { token });
    const rows = Array.isArray(data) ? data : [];
    if (rows.length === 0) break;
    for (const row of rows) services.push(row.service || row);
    cursor = rows[rows.length - 1].cursor || '';
    if (!cursor) break;
  }
  return services;
}

function staticHeaders() {
  return [
    { path: '/*', name: 'X-Content-Type-Options', value: 'nosniff' },
    { path: '/*', name: 'Referrer-Policy', value: 'same-origin' },
    { path: '/*', name: 'X-Frame-Options', value: 'DENY' },
  ];
}

function renderBody(project, ownerId) {
  const common = {
    type: project.render.type,
    name: project.render.name,
    ownerId,
    repo: project.repo,
    branch: 'main',
    autoDeployTrigger: 'off',
  };
  if (project.render.type === 'static_site') {
    return {
      ...common,
      serviceDetails: {
        buildCommand: project.render.buildCommand,
        publishPath: project.render.publishPath,
        pullRequestPreviewsEnabled: 'no',
        headers: staticHeaders(),
        routes: [{ type: 'rewrite', source: '/*', destination: '/index.html' }],
      },
    };
  }
  return {
    ...common,
    serviceDetails: {
      runtime: 'node',
      plan: 'free',
      region: 'oregon',
      healthCheckPath: project.render.healthCheckPath,
      envSpecificDetails: {
        buildCommand: project.render.buildCommand,
        startCommand: project.render.startCommand,
      },
    },
  };
}

async function ensureRenderService(token, ownerId, project) {
  const existing = (await listRenderServices(token)).find((s) => s.name === project.render.name);
  if (existing) return existing;
  return api('https://api.render.com/v1/services', {
    method: 'POST',
    token,
    body: renderBody(project, ownerId),
    ok: [200, 201, 202],
  });
}

async function setEnv(token, serviceId, pairs) {
  for (const [key, value] of pairs) {
    await api(`https://api.render.com/v1/services/${serviceId}/env-vars/${encodeURIComponent(key)}`, {
      method: 'PUT',
      token,
      body: { value: String(value) },
      ok: [200, 201],
    });
  }
}

async function deploy(token, serviceId) {
  const created = await api(`https://api.render.com/v1/services/${serviceId}/deploys`, {
    method: 'POST',
    token,
    body: { clearCache: 'do_not_clear' },
    ok: [200, 201, 202],
  });
  const deployId = created?.id || created?.deploy?.id || '';
  const deadline = Date.now() + 20 * 60 * 1000;
  while (Date.now() < deadline) {
    const rows = await api(`https://api.render.com/v1/services/${serviceId}/deploys?limit=10`, { token });
    const list = (Array.isArray(rows) ? rows : []).map((row) => row.deploy || row);
    const match = list.find((item) => item.id === deployId) || list[0];
    const status = match?.status;
    if (status === 'live') return match;
    if (['build_failed', 'update_failed', 'canceled', 'pre_deploy_failed'].includes(status)) {
      throw new Error(`El deploy de ${serviceId} terminó en ${status}. El detalle está en el panel de Render.`);
    }
    await new Promise((r) => setTimeout(r, 15000));
  }
  throw new Error('El deploy sigue en curso después de 20 minutos. Render lo termina solo; volvé a correr el comando para el cierre de tablas si faltaba.');
}

async function bcryptHash(password) {
  const vendor = path.join(root, 'ops', 'vendor');
  const entry = path.join(vendor, 'node_modules', 'bcryptjs', 'index.js');
  if (!fs.existsSync(entry)) {
    await new Promise((resolve, reject) => {
      const child = spawn('npm', ['install', '--prefix', vendor, 'bcryptjs@3', '--silent'], { stdio: 'inherit' });
      child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error('No pude instalar bcryptjs para hashear la contraseña de Agenda Médica.'))));
    });
  }
  const mod = await import(pathToFileURL(entry).href);
  const bcrypt = mod.default || mod;
  return bcrypt.hashSync(password, 12);
}

function writeCredentials(state, projects) {
  const lines = [
    'Credenciales generadas por ops/provision.mjs',
    'Este archivo no se sube a GitHub. Guardalo en un lugar privado.',
    '',
  ];
  for (const project of projects) {
    const row = state.projects[project.id];
    if (!row) continue;
    lines.push(`## ${project.title}`);
    if (row.renderUrl) lines.push(`URL: ${row.renderUrl}`);
    lines.push(`Email: ${state.email}`);
    lines.push(`Contraseña de ingreso: ${row.appPassword}`);
    if (project.kind === 'servidor') lines.push(`Base (solo servidor): proyecto Supabase ${row.supabaseRef}`);
    lines.push('');
  }
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(credentialsPath, lines.join('\n'));
  fs.chmodSync(credentialsPath, 0o600);
}

function printPlan(projects) {
  console.log('Plan (no crea nada con --dry-run):\n');
  for (const project of projects) {
    const where = project.kind === 'servidor' ? 'servidor Node en Render + Postgres en Supabase, API pública cerrada' : 'sitio estático en Render + Supabase con login y RLS';
    console.log(`- ${project.title}: ${where}`);
    console.log(`  repo ${project.repo}`);
  }
}

async function provisionOne(project, ctx, state) {
  const token = ctx.supabaseToken;
  const row = state.projects[project.id] || {};
  state.projects[project.id] = row;
  if (row.done && row.renderUrl) {
    console.log(`\n${project.title}: ya estaba publicado en ${row.renderUrl}`);
    return;
  }
  row.appPassword ||= secret(18);
  row.sessionSecret ||= secret(32);
  row.adminToken ||= secret(24);
  row.dbPassword ||= secret(24);
  saveState(state);

  if (!row.supabaseRef) {
    console.log(`\n${project.title}: creando la base en Supabase…`);
    let created;
    try {
      created = await api('https://api.supabase.com/v1/projects', {
        method: 'POST',
        token,
        body: {
          name: project.render.name,
          organization_slug: ctx.org.slug,
          db_pass: row.dbPassword,
          region_selection: { type: 'smartGroup', code: 'americas' },
        },
      });
    } catch (err) {
      if (err.status === 402 || err.status === 403 || /limit|quota|exceeded|payment/i.test(err.message)) {
        throw new Error(
          `Supabase no dejó crear otra base (${project.title}). El plan gratis suele permitir dos proyectos activos. Pausá uno que no uses o subí el plan, y volvé a correr el comando. Detalle: ${err.message}`,
        );
      }
      throw err;
    }
    row.supabaseRef = created.ref || created.id;
    saveState(state);
  }

  const ref = row.supabaseRef;
  row.supabaseUrl = `https://${ref}.supabase.co`;
  console.log(`${project.title}: esperando que la base ${ref} esté lista…`);
  await waitHealthy(token, ref);
  row.databaseUrl = await databaseUrl(token, ref, row.dbPassword);
  saveState(state);

  if (project.kind === 'servidor' && !row.lockdown) {
    console.log(`${project.title}: cerrando la API pública…`);
    await runSql(token, ref, lockdownSql, project.id);
    row.lockdown = true;
    saveState(state);
  }

  if (project.sql && !row.sqlApplied) {
    console.log(`${project.title}: creando tablas…`);
    await runSql(token, ref, await loadSql(project.sql), project.id);
    row.sqlApplied = true;
    saveState(state);
  }

  if (project.createAuthUser && !row.userCreated) {
    console.log(`${project.title}: apagando el registro público y creando la cuenta…`);
    await api(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
      method: 'PATCH',
      token,
      body: { disable_signup: true },
      ok: [200, 201],
    });
    const serviceKey = await serviceRoleKey(token, ref);
    if (!serviceKey) throw new Error(`No encontré la clave de servicio de ${ref} para crear el usuario.`);
    await ensureAuthUser(ref, serviceKey, ctx.email, row.appPassword);
    row.anonKey = await anonKey(token, ref);
    row.userCreated = true;
    row.signupDisabled = true;
    saveState(state);
  }

  if (project.id === 'agenda-medica' && !row.passwordHash) {
    row.passwordHash = await bcryptHash(row.appPassword);
    saveState(state);
  }

  console.log(`${project.title}: creando el servicio en Render…`);
  let service;
  try {
    service = await ensureRenderService(ctx.renderToken, ctx.owner.id, project);
  } catch (err) {
    if (/repo|github|credential|gitlab/i.test(err.message)) {
      throw new Error(`${err.message}\nConectá la cuenta de GitHub sofiigentaa en Render (Account → GitHub). Es un solo clic, una sola vez, y después este comando sigue.`);
    }
    throw err;
  }
  row.renderServiceId = service.id;
  row.renderUrl = service.serviceDetails?.url || service.url || `https://${project.render.name}.onrender.com`;
  saveState(state);

  const pairs = project.env({ ...row, email: ctx.email });
  await setEnv(ctx.renderToken, row.renderServiceId, pairs);
  console.log(`${project.title}: publicando…`);
  await deploy(ctx.renderToken, row.renderServiceId);

  if (project.lockdownAfterDeploy) {
    console.log(`${project.title}: cerrando las tablas que creó el servidor…`);
    await runSql(token, ref, lockdownSql, project.id);
    row.lockdown = true;
  }

  await api(`https://api.render.com/v1/services/${row.renderServiceId}`, {
    method: 'PATCH',
    token: ctx.renderToken,
    body: { autoDeployTrigger: 'commit' },
    ok: [200, 202],
  });
  row.done = true;
  saveState(state);
  console.log(`${project.title}: listo en ${row.renderUrl}`);
}

async function main() {
  loadEnvFile(path.join(root, '.provision.env'));
  const projects = selectedProjects();
  if (dryRun && (!process.env.RENDER_API_KEY || !process.env.SUPABASE_ACCESS_TOKEN)) {
    printPlan(projects);
    console.log('\nFalta .provision.env para crearlos. Mirá ops/README.md.');
    return;
  }
  const renderToken = process.env.RENDER_API_KEY;
  const supabaseToken = process.env.SUPABASE_ACCESS_TOKEN;
  const email = (process.env.PROVISION_EMAIL || '').trim().toLowerCase();
  if (!renderToken || !supabaseToken || !email.includes('@')) {
    console.error('Faltan RENDER_API_KEY, SUPABASE_ACCESS_TOKEN o PROVISION_EMAIL.');
    console.error('Copiá ops/provision.env.example a .provision.env. Los pasos están en ops/README.md.');
    process.exit(1);
  }

  const org = await supabaseOrg(supabaseToken);
  const owner = await renderOwner(renderToken);
  if (dryRun) {
    printPlan(projects);
    console.log(`\nSupabase: ${org.name} (${org.slug})`);
    console.log(`Render: ${owner.name || owner.email || owner.id} (${owner.id})`);
    console.log('Dry-run: no creé nada.');
    return;
  }

  const state = loadState();
  state.email = email;
  saveState(state);
  console.log(`Organización Supabase: ${org.name}`);
  console.log(`Workspace Render: ${owner.name || owner.id}`);

  for (const project of projects) {
    await provisionOne(project, { supabaseToken, renderToken, org, owner, email }, state);
    writeCredentials(state, PROJECTS);
  }
  writeCredentials(state, PROJECTS);
  console.log(`\nListo. Las contraseñas quedaron en ops/salida/credenciales.txt`);
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  process.exit(1);
});
