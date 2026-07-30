/**
 * Kleine IndexedDB-wrapper — 100% offline opslag.
 * Twee stores: "inspections" (metadata + antwoorden) en "photos" (base64 foto's, apart
 * bewaard zodat de inspectielijst snel blijft laden ook bij veel foto's).
 */
const QHSE_DB = (() => {
  const DB_NAME = 'qhse_inspectie_db';
  const DB_VERSION = 1;
  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('inspections')) {
          db.createObjectStore('inspections', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('photos')) {
          db.createObjectStore('photos', { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => resolve(e.target.result);
      req.onerror = (e) => reject(e.target.error);
    });
    return dbPromise;
  }

  async function tx(storeName, mode) {
    const db = await open();
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  return {
    async saveInspection(inspection) {
      const store = await tx('inspections', 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.put(inspection);
        req.onsuccess = () => resolve(inspection);
        req.onerror = (e) => reject(e.target.error);
      });
    },
    async getInspection(id) {
      const store = await tx('inspections', 'readonly');
      return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = (e) => reject(e.target.error);
      });
    },
    async getAllInspections() {
      const store = await tx('inspections', 'readonly');
      return new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = (e) => reject(e.target.error);
      });
    },
    async deleteInspection(id) {
      const store = await tx('inspections', 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e.target.error);
      });
    },
    async savePhoto(id, dataUrl) {
      const store = await tx('photos', 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.put({ id, dataUrl });
        req.onsuccess = () => resolve(id);
        req.onerror = (e) => reject(e.target.error);
      });
    },
    async getPhoto(id) {
      const store = await tx('photos', 'readonly');
      return new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
        req.onerror = (e) => reject(e.target.error);
      });
    },
    async deletePhoto(id) {
      const store = await tx('photos', 'readwrite');
      return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => resolve(true);
        req.onerror = (e) => reject(e.target.error);
      });
    }
  };
})();
