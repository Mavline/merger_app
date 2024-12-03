import { TableRow } from '../types/dataTypes';

export interface SavedTable {
  id: string;
  name: string;
  data: TableRow[];
  fullData: TableRow[];
  date: string;
  timestamp: number;
  headers?: string[];
}

const STORAGE_KEY = 'savedTables';
const MAX_TABLES = 15;
const CACHE_LIFETIME = 1000 * 60 * 60;

export const storageService = {
  saveTable: (table: Omit<SavedTable, 'timestamp'>) => {
    try {
      storageService.cleanExpiredData();
      
      const savedTables = storageService.getAllTables();
      
      if (savedTables.length >= MAX_TABLES) {
        alert(`Maximum storage limit reached (${MAX_TABLES} tables). Please delete some tables before adding new ones.`);
        return null;
      }

      const newTable: SavedTable = {
        ...table,
        timestamp: Date.now()
      };

      const updatedTables = [...savedTables, newTable];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTables));
      return newTable;
    } catch (error) {
      console.error('Error saving table:', error);
      return null;
    }
  },

  getAllTables: (): SavedTable[] => {
    try {
      storageService.cleanExpiredData();
      
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error reading from storage:', error);
      return [];
    }
  },

  cleanExpiredData: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const tables: SavedTable[] = JSON.parse(saved);
      const now = Date.now();
      
      const validTables = tables.filter(table => {
        const isValid = (now - table.timestamp) < CACHE_LIFETIME;
        if (!isValid) {
          console.log(`Table ${table.name} expired and will be removed (created ${new Date(table.timestamp).toLocaleString()})`);
        }
        return isValid;
      });

      if (validTables.length !== tables.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(validTables));
        console.log(`Removed ${tables.length - validTables.length} expired tables`);
      }
    } catch (error) {
      console.error('Error cleaning expired data:', error);
    }
  },

  deleteTable: (tableId: string) => {
    try {
      const tables = storageService.getAllTables();
      const updatedTables = tables.filter(table => table.id !== tableId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTables));
    } catch (error) {
      console.error('Error deleting table:', error);
    }
  },

  clearAll: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('All tables cleared from storage');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}; 