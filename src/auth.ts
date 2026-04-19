import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, signOut, onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  getFirestore, collection, doc, setDoc, deleteDoc,
  onSnapshot, query, Timestamp, type Firestore,
} from 'firebase/firestore';
import { visited, type Visit } from './visited';

type AuthListener = (user: User | null) => void;
const authListeners = new Set<AuthListener>();

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let currentUser: User | null = null;
let unsubscribeSnapshot: (() => void) | null = null;
let ready = false;

function envConfig() {
  const cfg = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  };
  if (!cfg.apiKey || !cfg.projectId) return null;
  return cfg;
}

export function isFirebaseConfigured(): boolean {
  return envConfig() != null;
}

export function initAuth() {
  if (ready) return;
  const cfg = envConfig();
  if (!cfg) {
    ready = true;
    return;
  }
  app = getApps()[0] ?? initializeApp(cfg);
  db = getFirestore(app);
  const auth = getAuth(app);
  onAuthStateChanged(auth, u => {
    currentUser = u;
    authListeners.forEach(l => l(u));
    if (u) {
      void bindFirestoreSync(u);
    } else {
      unbindFirestoreSync();
    }
  });
  ready = true;
}

async function bindFirestoreSync(user: User) {
  if (!db) return;
  // 1. Fetch remote visits once, merge local (first-write-wins: local takes priority).
  const colRef = collection(db, 'users', user.uid, 'visits');
  const snap = await new Promise<any>(resolve => {
    const unsub = onSnapshot(query(colRef), s => { unsub(); resolve(s); });
  });
  const remoteVisits: Visit[] = [];
  snap.forEach((d: any) => {
    const data = d.data();
    remoteVisits.push({
      year: data.year,
      pointId: data.pointId,
      visitedAt: data.visitedAt?.toMillis?.() ?? data.visitedAt,
      source: data.source,
    });
  });

  // Local wins on conflict. But also push any local visits not yet remote.
  const localVisits = visited.all();
  const remoteKeys = new Set(remoteVisits.map(v => `${v.year}_${v.pointId}`));
  const toPush = localVisits.filter(v => !remoteKeys.has(`${v.year}_${v.pointId}`));
  visited.mergeIn(remoteVisits);
  for (const v of toPush) {
    await writeRemote(user.uid, v);
  }

  // 2. Wire continuous sync: local changes → remote.
  visited.setExternalSync(async (v, action) => {
    if (!currentUser || !db) return;
    if (action === 'upsert') await writeRemote(currentUser.uid, v);
    else await deleteRemote(currentUser.uid, v);
  });

  // 3. Live remote → local (for multi-device).
  unsubscribeSnapshot = onSnapshot(query(colRef), sn => {
    const remote: Visit[] = [];
    sn.forEach((d: any) => {
      const data = d.data();
      remote.push({
        year: data.year,
        pointId: data.pointId,
        visitedAt: data.visitedAt?.toMillis?.() ?? data.visitedAt,
        source: data.source,
      });
    });
    // Replace local with authoritative remote set (user is signed in).
    visited.replaceAll(remote);
  });
}

function unbindFirestoreSync() {
  unsubscribeSnapshot?.();
  unsubscribeSnapshot = null;
  visited.setExternalSync(null);
}

async function writeRemote(uid: string, v: Visit) {
  if (!db) return;
  const id = `${v.year}_${v.pointId}`;
  await setDoc(doc(db, 'users', uid, 'visits', id), {
    year: v.year,
    pointId: v.pointId,
    visitedAt: Timestamp.fromMillis(v.visitedAt),
    source: v.source,
  });
}

async function deleteRemote(uid: string, v: Visit) {
  if (!db) return;
  const id = `${v.year}_${v.pointId}`;
  await deleteDoc(doc(db, 'users', uid, 'visits', id));
}

export async function signInGoogle() {
  if (!app) throw new Error('Firebase not configured');
  const provider = new GoogleAuthProvider();
  await signInWithPopup(getAuth(app), provider);
}

export async function signOutUser() {
  if (!app) return;
  await signOut(getAuth(app));
}

export function getUser(): User | null {
  return currentUser;
}

export function onAuth(l: AuthListener): () => void {
  authListeners.add(l);
  l(currentUser);
  return () => authListeners.delete(l);
}
