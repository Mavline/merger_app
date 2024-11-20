import { TableRow } from '../types/dataTypes';

const DB_NAME = 'MergerDB';
const STORE_NAME = 'mergedTables';
const DB_VERSION = 1;

export class DatabaseService {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async saveMergedData(data: TableRow[]): Promise<void> {
    try {
      if (!this.db) await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        
        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
          reject(transaction.error);
        };

        const store = transaction.objectStore(STORE_NAME);

        // Сохраняем только последний результат
        store.clear();
        const request = store.add({ data, timestamp: Date.now() });

        request.onerror = () => {
          console.error('Request error:', request.error);
          reject(request.error);
        };
        request.onsuccess = () => {
          console.log('Data saved successfully');
          resolve();
        };
      });
    } catch (error) {
      console.error('Error in saveMergedData:', error);
      throw error;
    }
  }

  async getLatestMergedData(): Promise<TableRow[] | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const results = request.result;
        if (results.length > 0) {
          // Возвращаем самые свежие данные
          const latest = results.reduce((prev, current) => 
            current.timestamp > prev.timestamp ? current : prev
          );
          resolve(latest.data);
        } else {
          resolve(null);
        }
      };
    });
  }

  async clearData(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.clear();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        console.log('IndexedDB data cleared');
        resolve();
      };
    });
  }
}

export const dbService = new DatabaseService(); 