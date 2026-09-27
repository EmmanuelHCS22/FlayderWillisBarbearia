import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

/**
 * Initialize Cloud Firestore with Long Polling enabled.
 * In sandboxed preview/iFrame environments or corporate proxies, WebChannel WebSockets
 * can experience transient connection drops triggering [code=unavailable].
 * experimentalAutoDetectLongPolling / experimentalForceLongPolling ensures rock-solid
 * connectivity across all network environments.
 */
const databaseId = firebaseConfig.firestoreDatabaseId || '(default)';

export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
}, databaseId);

// Initialize Firebase Authentication & Storage
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
