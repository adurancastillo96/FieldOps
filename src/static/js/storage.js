/**
 * IndexedDB storage service for FieldOps PWA (Offline-First).
 */
const FieldOpsStorage = (function() {
    let db = null;
    const DB_NAME = 'FieldOpsDB';
    const DB_VERSION = 1;

    function initDB() {
        return new Promise((resolve, reject) => {
            if (db) return resolve(db);

            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error("Database error: ", event.target.errorCode);
                reject(event.target.errorCode);
            };

            request.onsuccess = (event) => {
                db = event.target.result;
                console.log("Database initialized successfully");
                resolve(db);
            };

            request.onupgradeneeded = (event) => {
                const activeDb = event.target.result;
                
                // Create work_orders store
                if (!activeDb.objectStoreNames.contains('work_orders')) {
                    activeDb.createObjectStore('work_orders', { keyPath: 'id' });
                }
                
                // Create inspections store
                if (!activeDb.objectStoreNames.contains('inspections')) {
                    activeDb.createObjectStore('inspections', { keyPath: 'id' });
                }
                
                // Create steps store (keyed by inspection_id + "_" + step_id)
                if (!activeDb.objectStoreNames.contains('steps')) {
                    activeDb.createObjectStore('steps', { keyPath: 'id' });
                }
                
                // Create sync_queue store for background syncing
                if (!activeDb.objectStoreNames.contains('sync_queue')) {
                    activeDb.createObjectStore('sync_queue', { keyPath: 'id' });
                }
            };
        });
    }

    // Generic helper for transaction execution
    defTransaction = (storeName, mode, callback) => {
        return initDB().then((activeDb) => {
            return new Promise((resolve, reject) => {
                const transaction = activeDb.transaction([storeName], mode);
                const store = transaction.objectStore(storeName);
                
                let requestResult = null;
                
                transaction.oncomplete = () => {
                    resolve(requestResult);
                };
                
                transaction.onerror = (e) => {
                    reject(e.target.error);
                };
                
                callback(store, (result) => {
                    requestResult = result;
                });
            });
        });
    };

    return {
        init: initDB,
        
        // Work Orders Operations
        saveWorkOrders: function(workOrders) {
            return defTransaction('work_orders', 'readwrite', (store) => {
                workOrders.forEach(wo => store.put(wo));
            });
        },
        
        getWorkOrders: function() {
            return defTransaction('work_orders', 'readonly', (store, setResults) => {
                const request = store.getAll();
                request.onsuccess = (e) => setResults(e.target.result);
            });
        },
        
        getWorkOrder: function(id) {
            return defTransaction('work_orders', 'readonly', (store, setResult) => {
                const request = store.get(id);
                request.onsuccess = (e) => setResult(e.target.result);
            });
        },
        
        // Inspections Operations
        saveInspection: function(inspection) {
            return defTransaction('inspections', 'readwrite', (store) => {
                store.put(inspection);
            });
        },
        
        getInspection: function(id) {
            return defTransaction('inspections', 'readonly', (store, setResult) => {
                const request = store.get(id);
                request.onsuccess = (e) => setResult(e.target.result);
            });
        },
        
        // Step Evidence Operations
        saveStep: function(step) {
            // step object must have id (e.g. "inspectionId_stepId"), inspection_id, step_id, and data
            return defTransaction('steps', 'readwrite', (store) => {
                store.put(step);
            });
        },
        
        getSteps: function(inspectionId) {
            return defTransaction('steps', 'readonly', (store, setResults) => {
                const request = store.getAll();
                request.onsuccess = (e) => {
                    const allSteps = e.target.result;
                    const filtered = allSteps.filter(s => s.inspection_id === inspectionId);
                    setResults(filtered);
                };
            });
        },

        getStep: function(inspectionId, stepId) {
            return defTransaction('steps', 'readonly', (store, setResult) => {
                const request = store.get(`${inspectionId}_${stepId}`);
                request.onsuccess = (e) => setResult(e.target.result);
            });
        },
        
        // Sync Queue Operations
        queuePayload: function(payload) {
            return defTransaction('sync_queue', 'readwrite', (store) => {
                store.put(payload);
            });
        },
        
        getSyncQueue: function() {
            return defTransaction('sync_queue', 'readonly', (store, setResults) => {
                const request = store.getAll();
                request.onsuccess = (e) => setResults(e.target.result);
            });
        },
        
        removeSyncQueue: function(id) {
            return defTransaction('sync_queue', 'readwrite', (store) => {
                store.delete(id);
            });
        }
    };
})();
