import { storySchema, type Story } from "./story";
export interface Persistence {
  read(key: string): Promise<unknown>;
  write(key: string, value: unknown): Promise<void>;
}
function openDB(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("records");
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Feche outras abas e tente novamente."));
  });
}
export function browserStore(name: string): Persistence {
  let queue: Promise<void> = Promise.resolve();
  return {
    async read(key) {
      const db = await openDB(name);
      try {
        return await new Promise((resolve, reject) => {
          const r = db.transaction("records").objectStore("records").get(key);
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => reject(r.error);
        });
      } finally {
        db.close();
      }
    },
    write(key, value) {
      const task = queue
        .catch(() => {})
        .then(async () => {
          const db = await openDB(name);
          try {
            await new Promise<void>((resolve, reject) => {
              const tx = db.transaction("records", "readwrite");
              tx.objectStore("records").put(value, key);
              tx.oncomplete = () => resolve();
              tx.onerror = () => reject(tx.error);
              tx.onabort = () => reject(tx.error);
            });
          } finally {
            db.close();
          }
        });
      queue = task;
      return task;
    },
  };
}
export const playerStore = browserStore("hogwarts-narrative");
export async function loadStory(id: string): Promise<Story | null> {
  const value = await playerStore.read(id);
  return value === undefined ? null : storySchema.parse(value);
}
export function saveStory(story: Story) {
  return playerStore.write(story.admissionId, storySchema.parse(story));
}
export const masterStore = browserStore("hogwarts-master");
