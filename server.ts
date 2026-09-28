import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Firebase configuration for server-side maintenance
const firebaseConfig = {
  apiKey: "AIzaSyAXFngUVn2dfw63jRpljfgM_c2LHtGYxG8",
  authDomain: "flayder-willis-barbearia.firebaseapp.com",
  projectId: "flayder-willis-barbearia",
  storageBucket: "flayder-willis-barbearia.firebasestorage.app",
  messagingSenderId: "974116690441",
  appId: "1:974116690441:web:ecf864545eaf895318f6d8"
};

const serverApp = !getApps().length ? initializeApp(firebaseConfig, 'server-worker') : getApp('server-worker');
const serverDb = initializeFirestore(serverApp, {});

const TEN_MINUTES_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Routine: Scans Firestore for appointments with status === 'cancelled'
 * where cancelledAt <= now - 10 minutes and permanently deletes them from Firestore.
 */
async function cleanupExpiredCancelledAppointments(): Promise<{ scanned: number; deleted: number }> {
  let scanned = 0;
  let deleted = 0;
  try {
    const appointmentsRef = collection(serverDb, 'appointments');
    const q = query(appointmentsRef, where('status', '==', 'cancelled'));
    const snapshot = await getDocs(q);
    scanned = snapshot.size;

    const now = Date.now();

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.status !== 'cancelled') continue;

      let cancelledAtMillis: number | null = null;

      if (data.cancelledAt) {
        if (typeof data.cancelledAt.toMillis === 'function') {
          cancelledAtMillis = data.cancelledAt.toMillis();
        } else if (typeof data.cancelledAt.seconds === 'number') {
          cancelledAtMillis = data.cancelledAt.seconds * 1000;
        } else if (typeof data.cancelledAt === 'string') {
          cancelledAtMillis = new Date(data.cancelledAt).getTime();
        } else if (typeof data.cancelledAt === 'number') {
          cancelledAtMillis = data.cancelledAt;
        }
      } else if (data.updatedAt) {
        cancelledAtMillis = new Date(data.updatedAt).getTime();
      }

      if (cancelledAtMillis && (now - cancelledAtMillis >= TEN_MINUTES_MS)) {
        try {
          await deleteDoc(doc(serverDb, 'appointments', docSnap.id));
          deleted++;
          console.log(`[Auto-Cleanup] Agendamento cancelado há mais de 10 min excluído: ${docSnap.id} (${data.customerName || 'Cliente'})`);
        } catch (delErr) {
          console.error(`[Auto-Cleanup] Erro ao deletar agendamento ${docSnap.id}:`, delErr);
        }
      }
    }
  } catch (err) {
    console.error('[Auto-Cleanup] Erro ao executar rotina de limpeza:', err);
  }
  return { scanned, deleted };
}

// Endpoint for manual or health check invocation
app.all('/api/cleanup-cancelled', async (_req: Request, res: Response) => {
  const result = await cleanupExpiredCancelledAppointments();
  res.json({ success: true, ...result, timestamp: new Date().toISOString() });
});

// Periodic background execution every 30 seconds
setInterval(() => {
  cleanupExpiredCancelledAppointments().catch(err => {
    console.error('[Auto-Cleanup Interval Error]:', err);
  });
}, 30 * 1000);

// ======================== STATIC & VITE MIDDLEWARES ========================

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  // Run cleanup once on server start
  cleanupExpiredCancelledAppointments().catch(err => {
    console.error('[Auto-Cleanup Startup Error]:', err);
  });

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${isDev ? 'development' : 'production'}]`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

