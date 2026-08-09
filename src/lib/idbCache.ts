// Minimal IndexedDB layer for caching streamed document page chunks.
// Keeps large binary data off the JS heap (blueprint: avoid heap exhaustion).

const DB_NAME = 'abc-claims-docs';
const STORE = 'pageChunks';
const DB_VERSION = 1;

export interface CachedChunk {
  key: string;
  claimId: string;
  page: number;
  bytes: ArrayBuffer;
  start: number;
  end: number;
  chunkSize: number;
  totalSize: number;
  contentRange: string | null;
  cachedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

export function chunkKey(claimId: string, page: number): string {
  return `${claimId}:${page}`;
}

export async function getCachedChunk(
  key: string,
): Promise<CachedChunk | undefined> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
    req.onsuccess = () => resolve(req.result as CachedChunk | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function putCachedChunk(chunk: CachedChunk): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(chunk);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
