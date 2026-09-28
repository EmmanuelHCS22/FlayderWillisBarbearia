// server.ts
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore";
dotenv.config();
var app = express();
var PORT = process.env.PORT || 3e3;
app.use(express.json());
var firebaseConfig = {
  apiKey: "AIzaSyAXFngUVn2dfw63jRpljfgM_c2LHtGYxG8",
  authDomain: "flayder-willis-barbearia.firebaseapp.com",
  projectId: "flayder-willis-barbearia",
  storageBucket: "flayder-willis-barbearia.firebasestorage.app",
  messagingSenderId: "974116690441",
  appId: "1:974116690441:web:ecf864545eaf895318f6d8"
};
var serverApp = !getApps().length ? initializeApp(firebaseConfig, "server-worker") : getApp("server-worker");
var serverDb = initializeFirestore(serverApp, {});
var TEN_MINUTES_MS = 10 * 60 * 1e3;
async function cleanupExpiredCancelledAppointments() {
  let scanned = 0;
  let deleted = 0;
  try {
    const appointmentsRef = collection(serverDb, "appointments");
    const q = query(appointmentsRef, where("status", "==", "cancelled"));
    const snapshot = await getDocs(q);
    scanned = snapshot.size;
    const now = Date.now();
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.status !== "cancelled") continue;
      let cancelledAtMillis = null;
      if (data.cancelledAt) {
        if (typeof data.cancelledAt.toMillis === "function") {
          cancelledAtMillis = data.cancelledAt.toMillis();
        } else if (typeof data.cancelledAt.seconds === "number") {
          cancelledAtMillis = data.cancelledAt.seconds * 1e3;
        } else if (typeof data.cancelledAt === "string") {
          cancelledAtMillis = new Date(data.cancelledAt).getTime();
        } else if (typeof data.cancelledAt === "number") {
          cancelledAtMillis = data.cancelledAt;
        }
      } else if (data.updatedAt) {
        cancelledAtMillis = new Date(data.updatedAt).getTime();
      }
      if (cancelledAtMillis && now - cancelledAtMillis >= TEN_MINUTES_MS) {
        try {
          await deleteDoc(doc(serverDb, "appointments", docSnap.id));
          deleted++;
          console.log(`[Auto-Cleanup] Agendamento cancelado h\xE1 mais de 10 min exclu\xEDdo: ${docSnap.id} (${data.customerName || "Cliente"})`);
        } catch (delErr) {
          console.error(`[Auto-Cleanup] Erro ao deletar agendamento ${docSnap.id}:`, delErr);
        }
      }
    }
  } catch (err) {
    console.error("[Auto-Cleanup] Erro ao executar rotina de limpeza:", err);
  }
  return { scanned, deleted };
}
app.all("/api/cleanup-cancelled", async (_req, res) => {
  const result = await cleanupExpiredCancelledAppointments();
  res.json({ success: true, ...result, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
});
setInterval(() => {
  cleanupExpiredCancelledAppointments().catch((err) => {
    console.error("[Auto-Cleanup Interval Error]:", err);
  });
}, 30 * 1e3);
async function startServer() {
  const isDev = process.env.NODE_ENV !== "production";
  cleanupExpiredCancelledAppointments().catch((err) => {
    console.error("[Auto-Cleanup Startup Error]:", err);
  });
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve("dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve("dist", "index.html"));
    });
  }
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${isDev ? "development" : "production"}]`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
