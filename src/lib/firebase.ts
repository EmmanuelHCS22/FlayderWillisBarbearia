// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyAXFngUVn2dfw63jRpljfgM_c2LHtGYxG8",
  authDomain: "flayder-willis-barbearia.firebaseapp.com",
  databaseURL: "https://flayder-willis-barbearia-default-rtdb.firebaseio.com",
  projectId: "flayder-willis-barbearia",
  storageBucket: "flayder-willis-barbearia.firebasestorage.app",
  messagingSenderId: "974116690441",
  appId: "1:974116690441:web:ecf864545eaf895318f6d8",
  measurementId: "G-G561V88BGZ"
};

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Analytics (guarded for browser compatibility)
export const analyticsPromise = typeof window !== 'undefined'
  ? isSupported().then((yes) => (yes ? getAnalytics(app) : null)).catch(() => null)
  : Promise.resolve(null);

/**
 * Initialize Cloud Firestore with auto-detect long polling and multi-tab persistent cache.
 * Ensures robust connectivity in preview iframes and diverse network environments.
 */
export const db = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Initialize Firebase Authentication & Firebase Storage
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
