import { draftSchema, type Draft } from "./draft";
const DB_NAME = "hogwarts-player";
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("drafts");
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Feche outras abas do aplicativo e tente novamente."));
  });
}
export async function loadDraft(): Promise<Draft | null> {
  const db = await openDB();
  try {
    const raw = await new Promise<unknown>((resolve, reject) => {
      const request = db
        .transaction("drafts")
        .objectStore("drafts")
        .get("admission");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    if (raw === undefined) return null;
    return draftSchema.parse(raw);
  } finally {
    db.close();
  }
}
async function persist(draft: Draft): Promise<void> {
  const db = await openDB();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("drafts", "readwrite");
      tx.objectStore("drafts").put(draftSchema.parse(draft), "admission");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
let queue: Promise<void> = Promise.resolve();
export function saveDraft(draft: Draft): Promise<void> {
  const next = queue.catch(() => {}).then(() => persist(draft));
  queue = next;
  return next;
}
