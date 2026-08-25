import { pgTable, text, boolean, integer, timestamp, doublePrecision } from 'drizzle-orm/pg-core';

export const contacts = pgTable('contacts', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  isParticular: boolean('is_particular').notNull().default(true),
  insuranceName: text('insurance_name'),
  affiliateNumber: text('affiliate_number'),
  primaryPhone: text('primary_phone').notNull(),
  altPhone: text('alt_phone'),
  email: text('email'),
  address: text('address'),
  observations: text('observations'),
  isFavorite: boolean('is_favorite').notNull().default(false),
  avatarColor: text('avatar_color'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const appointments = pgTable('appointments', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD
  time: text('time').notNull(), // HH:mm
  durationMinutes: integer('duration_minutes').default(30),
  motive: text('motive'),
  dentist: text('dentist'),
  completed: boolean('completed').notNull().default(false),
  createdAt: text('created_at').notNull(),
  ingresos: doublePrecision('ingresos').default(0),
  descartables: doublePrecision('descartables').default(0),
  estampillas: doublePrecision('estampillas').default(0),
  materiales: doublePrecision('materiales').default(0),
  mecanicoDental: doublePrecision('mecanico_dental').default(0),
  porcentajeHonorario: doublePrecision('porcentaje_honorario').default(50),
});

export const callReminders = pgTable('call_reminders', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  time: text('time').notNull(),
  note: text('note'),
  completed: boolean('completed').notNull().default(false),
  createdAt: text('created_at').notNull(),
});

export const contactNotes = pgTable('contact_notes', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  color: text('color'),
  createdAt: text('created_at').notNull(),
});

export const contactAttachments = pgTable('contact_attachments', {
  id: text('id').primaryKey(),
  contactId: text('contact_id').notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  size: integer('size').notNull(),
  type: text('type').notNull(),
  dataUrl: text('data_url').notNull(),
  createdAt: text('created_at').notNull(),
});

export const insuranceFiles = pgTable('insurance_files', {
  id: text('id').primaryKey(),
  insuranceName: text('insurance_name').notNull(),
  title: text('title').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  fileType: text('file_type').notNull(),
  dataUrl: text('data_url').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
});
