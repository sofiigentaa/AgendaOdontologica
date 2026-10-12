-- Agenda Odontológica — estructura para Supabase
-- Pegar en Supabase → SQL Editor → Run (una sola vez).
-- Son datos de salud (Ley 25.326): este script activa RLS sin políticas para
-- que la API pública de Supabase no pueda leer nada. Solo entra el servidor
-- de Render con DATABASE_URL.

CREATE TABLE IF NOT EXISTS "appointments" (
	"id" text PRIMARY KEY NOT NULL,
	"contact_id" text NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"duration_minutes" integer DEFAULT 30,
	"motive" text,
	"dentist" text,
	"completed" boolean DEFAULT false NOT NULL,
	"whatsapp_status" text,
	"whatsapp_last_reply" text,
	"created_at" text NOT NULL,
	"ingresos" double precision DEFAULT 0,
	"descartables" double precision DEFAULT 0,
	"estampillas" double precision DEFAULT 0,
	"materiales" double precision DEFAULT 0,
	"mecanico_dental" double precision DEFAULT 0,
	"porcentaje_honorario" double precision DEFAULT 50
);

CREATE TABLE IF NOT EXISTS "auth_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"password_hash" text NOT NULL,
	"updated_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "call_reminders" (
	"id" text PRIMARY KEY NOT NULL,
	"contact_id" text NOT NULL,
	"date" text NOT NULL,
	"time" text NOT NULL,
	"note" text,
	"completed" boolean DEFAULT false NOT NULL,
	"created_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "contact_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"contact_id" text NOT NULL,
	"name" text NOT NULL,
	"size" integer NOT NULL,
	"type" text NOT NULL,
	"data_url" text NOT NULL,
	"created_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "contact_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"contact_id" text NOT NULL,
	"text" text NOT NULL,
	"color" text,
	"created_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "contacts" (
	"id" text PRIMARY KEY NOT NULL,
	"full_name" text NOT NULL,
	"is_particular" boolean DEFAULT true NOT NULL,
	"insurance_name" text,
	"affiliate_number" text,
	"primary_phone" text NOT NULL,
	"alt_phone" text,
	"email" text,
	"address" text,
	"observations" text,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"avatar_color" text,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "insurance_files" (
	"id" text PRIMARY KEY NOT NULL,
	"insurance_name" text NOT NULL,
	"title" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_type" text NOT NULL,
	"data_url" text NOT NULL,
	"notes" text,
	"created_at" text NOT NULL
);

ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_contact_id_contacts_id_fk";
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "call_reminders" DROP CONSTRAINT IF EXISTS "call_reminders_contact_id_contacts_id_fk";
ALTER TABLE "call_reminders" ADD CONSTRAINT "call_reminders_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "contact_attachments" DROP CONSTRAINT IF EXISTS "contact_attachments_contact_id_contacts_id_fk";
ALTER TABLE "contact_attachments" ADD CONSTRAINT "contact_attachments_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "contact_notes" DROP CONSTRAINT IF EXISTS "contact_notes_contact_id_contacts_id_fk";
ALTER TABLE "contact_notes" ADD CONSTRAINT "contact_notes_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;

-- Seguridad: RLS activado y sin políticas; sin permisos para anon/authenticated.
ALTER TABLE "appointments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "auth_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "call_reminders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contact_attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contact_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "contacts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "insurance_files" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
