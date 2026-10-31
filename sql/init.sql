BEGIN;

CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    is_particular BOOLEAN NOT NULL DEFAULT TRUE,
    insurance_name TEXT,
    affiliate_number TEXT,
    primary_phone TEXT NOT NULL,
    alt_phone TEXT,
    email TEXT,
    address TEXT,
    observations TEXT,
    is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_color TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    motive TEXT,
    dentist TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    whatsapp_status TEXT,
    whatsapp_last_reply TEXT,
    created_at TEXT NOT NULL,
    ingresos DOUBLE PRECISION DEFAULT 0,
    descartables DOUBLE PRECISION DEFAULT 0,
    estampillas DOUBLE PRECISION DEFAULT 0,
    materiales DOUBLE PRECISION DEFAULT 0,
    mecanico_dental DOUBLE PRECISION DEFAULT 0,
    porcentaje_honorario DOUBLE PRECISION DEFAULT 50
);

CREATE TABLE IF NOT EXISTS call_reminders (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    note TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_notes (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    color TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_attachments (
    id TEXT PRIMARY KEY,
    contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    size INTEGER NOT NULL,
    type TEXT NOT NULL,
    data_url TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS insurance_files (
    id TEXT PRIMARY KEY,
    insurance_name TEXT NOT NULL,
    title TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL,
    data_url TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL
);

COMMIT;
