import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { optionalAuth, requireAuth, AuthRequest } from './src/middleware/auth.ts';
import {
  getAllEventsFromDb,
  saveEventToDb,
  deleteEventFromDb,
  addPaymentToDb,
  getAllRemindersFromDb,
  saveReminderToDb,
  deleteReminderFromDb,
  seedInitialDataIfEmpty,
  clearAllFromDb,
  getOrCreateUser,
} from './src/db/eventsService.ts';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Seed check
  seedInitialDataIfEmpty().catch((err) => {
    console.warn('Initial seeding error:', err);
  });

  // User sync
  app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res) => {
    try {
      if (!req.user || !req.user.uid) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await getOrCreateUser(
        req.user.uid,
        req.user.email || 'user@candysalon.com',
        req.user.name
      );
      res.json({ success: true, user });
    } catch (error: any) {
      console.error('User sync error:', error);
      res.status(500).json({ error: error.message || 'Error syncing user' });
    }
  });

  // GET all events
  app.get('/api/events', optionalAuth, async (_req: AuthRequest, res) => {
    try {
      const eventsList = await getAllEventsFromDb();
      res.json(eventsList);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: error.message || 'Error fetching events' });
    }
  });

  // SAVE or update event
  app.post('/api/events', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const eventData = req.body;
      if (!eventData || !eventData.id || !eventData.title) {
        return res.status(400).json({ error: 'Missing required event fields' });
      }
      await saveEventToDb(eventData, req.user?.uid);
      res.json({ success: true, event: eventData });
    } catch (error: any) {
      console.error('Error saving event:', error);
      res.status(500).json({ error: error.message || 'Error saving event' });
    }
  });

  // DELETE event
  app.delete('/api/events/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await deleteEventFromDb(id);
      res.json({ success: true, deletedId: id });
    } catch (error: any) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: error.message || 'Error deleting event' });
    }
  });

  // ADD payment
  app.post('/api/events/:id/payments', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const payment = req.body;
      if (!payment || !payment.id || !payment.amount) {
        return res.status(400).json({ error: 'Invalid payment payload' });
      }
      await addPaymentToDb(id, payment);
      res.json({ success: true, payment });
    } catch (error: any) {
      console.error('Error adding payment:', error);
      res.status(500).json({ error: error.message || 'Error adding payment' });
    }
  });

  // GET all reminders
  app.get('/api/reminders', optionalAuth, async (_req: AuthRequest, res) => {
    try {
      const list = await getAllRemindersFromDb();
      res.json(list);
    } catch (error: any) {
      console.error('Error fetching reminders:', error);
      res.status(500).json({ error: error.message || 'Error fetching reminders' });
    }
  });

  // SAVE reminder
  app.post('/api/reminders', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const reminderData = req.body;
      if (!reminderData || !reminderData.id || !reminderData.title) {
        return res.status(400).json({ error: 'Missing required reminder fields' });
      }
      await saveReminderToDb(reminderData, req.user?.uid);
      res.json({ success: true, reminder: reminderData });
    } catch (error: any) {
      console.error('Error saving reminder:', error);
      res.status(500).json({ error: error.message || 'Error saving reminder' });
    }
  });

  // DELETE reminder
  app.delete('/api/reminders/:id', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      await deleteReminderFromDb(id);
      res.json({ success: true, deletedId: id });
    } catch (error: any) {
      console.error('Error deleting reminder:', error);
      res.status(500).json({ error: error.message || 'Error deleting reminder' });
    }
  });

  // CLEAR ALL DATA from database (Empty database for production/clean start)
  app.post('/api/clear-all', optionalAuth, async (_req: AuthRequest, res) => {
    try {
      await clearAllFromDb();
      res.json({ success: true, message: 'All database records cleared', events: [], reminders: [] });
    } catch (error: any) {
      console.error('Error clearing database:', error);
      res.status(500).json({ error: error.message || 'Error clearing database' });
    }
  });

  // RESET database to initial demo state
  app.post('/api/reset-demo', optionalAuth, async (_req: AuthRequest, res) => {
    try {
      await clearAllFromDb().catch(() => {});
      const { INITIAL_EVENTS, INITIAL_REMINDERS } = await import('./src/utils/storage.ts');
      for (const ev of INITIAL_EVENTS) {
        await saveEventToDb(ev);
      }
      for (const rem of INITIAL_REMINDERS) {
        await saveReminderToDb(rem);
      }
      const allEv = await getAllEventsFromDb();
      const allRem = await getAllRemindersFromDb();
      res.json({ success: true, events: allEv, reminders: allRem });
    } catch (error: any) {
      console.error('Error resetting demo data:', error);
      res.status(500).json({ error: error.message || 'Error resetting demo' });
    }
  });

  // Vite middleware for development vs Production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Candy Salón Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
