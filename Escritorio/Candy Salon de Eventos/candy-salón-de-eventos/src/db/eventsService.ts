import { eq, desc } from 'drizzle-orm';
import { db, createPool } from './index.ts';
import { events, payments, reminders, users } from './schema.ts';
import { EventItem, PaymentRecord, ReminderItem } from '../types.ts';
import { INITIAL_EVENTS, INITIAL_REMINDERS } from '../utils/storage.ts';

export async function getOrCreateUser(uid: string, email: string, displayName?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName || null,
        },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('User sync failed', { cause: error });
  }
}

export async function getAllEventsFromDb(): Promise<EventItem[]> {
  try {
    const allEvents = await db.select().from(events).orderBy(desc(events.eventDate));
    const allPayments = await db.select().from(payments);

    const paymentMap = new Map<string, PaymentRecord[]>();
    for (const p of allPayments) {
      const list = paymentMap.get(p.eventId) || [];
      list.push({
        id: p.id,
        date: p.date,
        amount: p.amount,
        method: p.method as any,
        concept: p.concept as any,
        notes: p.notes || undefined,
        receiptNumber: p.receiptNumber || undefined,
      });
      paymentMap.set(p.eventId, list);
    }

    return allEvents.map((ev) => ({
      id: ev.id,
      title: ev.title,
      clientName: ev.clientName,
      clientPhone: ev.clientPhone || undefined,
      clientEmail: ev.clientEmail || undefined,
      eventType: ev.eventType as any,
      eventDate: ev.eventDate,
      eventTime: ev.eventTime || undefined,
      location: ev.location || undefined,
      guestCount: ev.guestCount || undefined,
      totalAmount: ev.totalAmount,
      depositAmount: ev.depositAmount,
      paymentHistory: paymentMap.get(ev.id) || [],
      status: ev.status as any,
      notes: ev.notes || undefined,
      createdAt: ev.createdAt ? ev.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: ev.updatedAt ? ev.updatedAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Database query failed in getAllEventsFromDb:', error);
    throw new Error('Failed to fetch events from database', { cause: error });
  }
}

export async function saveEventToDb(event: EventItem, userId?: string): Promise<void> {
  try {
    // 1. Upsert event
    await db
      .insert(events)
      .values({
        id: event.id,
        userId: userId || null,
        title: event.title,
        clientName: event.clientName,
        clientPhone: event.clientPhone || null,
        clientEmail: event.clientEmail || null,
        eventType: event.eventType,
        eventDate: event.eventDate,
        eventTime: event.eventTime || null,
        location: event.location || null,
        guestCount: event.guestCount || 0,
        totalAmount: event.totalAmount,
        depositAmount: event.depositAmount,
        status: event.status,
        notes: event.notes || null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: events.id,
        set: {
          title: event.title,
          clientName: event.clientName,
          clientPhone: event.clientPhone || null,
          clientEmail: event.clientEmail || null,
          eventType: event.eventType,
          eventDate: event.eventDate,
          eventTime: event.eventTime || null,
          location: event.location || null,
          guestCount: event.guestCount || 0,
          totalAmount: event.totalAmount,
          depositAmount: event.depositAmount,
          status: event.status,
          notes: event.notes || null,
          updatedAt: new Date(),
        },
      });

    // 2. Sync payment history
    if (event.paymentHistory && event.paymentHistory.length > 0) {
      for (const p of event.paymentHistory) {
        await db
          .insert(payments)
          .values({
            id: p.id,
            eventId: event.id,
            date: p.date,
            amount: p.amount,
            method: p.method,
            concept: p.concept,
            notes: p.notes || null,
            receiptNumber: p.receiptNumber || null,
          })
          .onConflictDoNothing();
      }
    }
  } catch (error) {
    console.error('Database query failed in saveEventToDb:', error);
    throw new Error('Failed to save event to database', { cause: error });
  }
}

export async function addPaymentToDb(eventId: string, payment: PaymentRecord): Promise<void> {
  try {
    // Insert payment
    await db.insert(payments).values({
      id: payment.id,
      eventId,
      date: payment.date,
      amount: payment.amount,
      method: payment.method,
      concept: payment.concept,
      notes: payment.notes || null,
      receiptNumber: payment.receiptNumber || null,
    }).onConflictDoNothing();

    // Check all payments for this event to recalculate status
    const allEvPayments = await db.select().from(payments).where(eq(payments.eventId, eventId));
    const totalPaid = allEvPayments.reduce((sum, p) => sum + p.amount, 0);

    const [ev] = await db.select().from(events).where(eq(events.id, eventId));
    if (ev) {
      const isPaid = totalPaid >= ev.totalAmount;
      await db
        .update(events)
        .set({
          status: isPaid ? 'fully_paid' : 'deposit_paid',
          updatedAt: new Date(),
        })
        .where(eq(events.id, eventId));
    }
  } catch (error) {
    console.error('Database query failed in addPaymentToDb:', error);
    throw new Error('Failed to add payment', { cause: error });
  }
}

export async function deleteEventFromDb(id: string): Promise<void> {
  try {
    await db.delete(events).where(eq(events.id, id));
  } catch (error) {
    console.error('Database query failed in deleteEventFromDb:', error);
    throw new Error('Failed to delete event', { cause: error });
  }
}

export async function getAllRemindersFromDb(): Promise<ReminderItem[]> {
  try {
    const list = await db.select().from(reminders).orderBy(reminders.dueDate);
    return list.map((r) => ({
      id: r.id,
      eventId: r.eventId || undefined,
      eventTitle: r.eventTitle || undefined,
      clientName: r.clientName || undefined,
      clientPhone: r.clientPhone || undefined,
      title: r.title,
      dueDate: r.dueDate,
      dueTime: r.dueTime || undefined,
      category: r.category as any,
      completed: r.completed,
      priority: r.priority as any,
      notes: r.notes || undefined,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Database query failed in getAllRemindersFromDb:', error);
    throw new Error('Failed to fetch reminders', { cause: error });
  }
}

export async function saveReminderToDb(reminder: ReminderItem, userId?: string): Promise<void> {
  try {
    await db
      .insert(reminders)
      .values({
        id: reminder.id,
        userId: userId || null,
        eventId: reminder.eventId || null,
        eventTitle: reminder.eventTitle || null,
        clientName: reminder.clientName || null,
        clientPhone: reminder.clientPhone || null,
        title: reminder.title,
        dueDate: reminder.dueDate,
        dueTime: reminder.dueTime || null,
        category: reminder.category,
        completed: reminder.completed,
        priority: reminder.priority,
        notes: reminder.notes || null,
      })
      .onConflictDoUpdate({
        target: reminders.id,
        set: {
          title: reminder.title,
          dueDate: reminder.dueDate,
          dueTime: reminder.dueTime || null,
          category: reminder.category,
          completed: reminder.completed,
          priority: reminder.priority,
          notes: reminder.notes || null,
        },
      });
  } catch (error) {
    console.error('Database query failed in saveReminderToDb:', error);
    throw new Error('Failed to save reminder', { cause: error });
  }
}

export async function deleteReminderFromDb(id: string): Promise<void> {
  try {
    await db.delete(reminders).where(eq(reminders.id, id));
  } catch (error) {
    console.error('Database query failed in deleteReminderFromDb:', error);
    throw new Error('Failed to delete reminder', { cause: error });
  }
}

export async function clearAllFromDb(): Promise<void> {
  try {
    const pool = createPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY);
      CREATE TABLE IF NOT EXISTS reminders (id TEXT PRIMARY KEY);
      TRUNCATE TABLE payments, reminders, events CASCADE;
    `);
  } catch (error) {
    console.warn('Truncate cascade failed, attempting direct table deletes:', error);
    try {
      await db.delete(payments);
      await db.delete(reminders);
      await db.delete(events);
    } catch (fallbackError) {
      console.error('Database clear failed:', fallbackError);
      throw new Error('Failed to clear database', { cause: fallbackError });
    }
  }
}

export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const pool = createPool();
    // Ensure tables exist automatically if migrations weren't run manually
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        uid TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        display_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT NOT NULL,
        client_name TEXT NOT NULL,
        client_phone TEXT,
        client_email TEXT,
        event_type TEXT NOT NULL,
        event_date TEXT NOT NULL,
        event_time TEXT,
        location TEXT,
        guest_count INTEGER DEFAULT 0,
        total_amount INTEGER NOT NULL DEFAULT 0,
        deposit_amount INTEGER NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'deposit_paid',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        date TEXT NOT NULL,
        amount INTEGER NOT NULL,
        method TEXT NOT NULL,
        concept TEXT NOT NULL,
        notes TEXT,
        receipt_number TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS reminders (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        event_id TEXT,
        event_title TEXT,
        client_name TEXT,
        client_phone TEXT,
        title TEXT NOT NULL,
        due_date TEXT NOT NULL,
        due_time TEXT,
        category TEXT NOT NULL DEFAULT 'cobro_saldo',
        completed BOOLEAN NOT NULL DEFAULT false,
        priority TEXT NOT NULL DEFAULT 'medium',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const existing = await db.select().from(events).limit(1);
    if (existing.length === 0) {
      console.log('Seeding initial demo events to PostgreSQL database...');
      for (const ev of INITIAL_EVENTS) {
        await saveEventToDb(ev);
      }
      for (const rem of INITIAL_REMINDERS) {
        await saveReminderToDb(rem);
      }
      console.log('Initial events and reminders seeded successfully.');
    }
  } catch (error) {
    console.error('Database init/seeding check error (non-fatal):', error);
  }
}
