import React, { createContext, useContext, useState, useEffect } from 'react';
import { TableRow } from '../types/dataTypes';
import { dbService } from '../services/db';
import { saveToStorage, getFromStorage } from '../utils/storage';

interface TableContextType {
  mergedData: TableRow[] | null;
  setMergedData: (data: TableRow[] | null) => void;
  headers: string[];
  setHeaders: (headers: string[]) => void;
  saveMergedData: (data: TableRow[]) => void;
  loadMergedData: () => Promise<void>;
  clearData: () => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mergedData, setMergedData] = useState<TableRow[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);

  // Загрузка данных при инициализации
  useEffect(() => {
    loadMergedData();
  }, []);

  const saveMergedData = async (data: TableRow[]) => {
    try {
      await dbService.saveMergedData(data);
      saveToStorage(data);
      setMergedData(data);
      
      if (data.length > 0) {
        const firstRow = data[0];
        const newHeaders = Object.keys(firstRow);
        setHeaders(newHeaders);
      }
      
      console.log('Data saved to context and storage:', data);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const loadMergedData = async () => {
    try {
      // Пробуем загрузить из IndexedDB
      let data = await dbService.getLatestMergedData();
      
      // Если нет в IndexedDB, пробуем из localStorage
      if (!data) {
        data = getFromStorage();
      }

      if (data) {
        setMergedData(data);
        if (data.length > 0) {
          const firstRow = data[0];
          const newHeaders = Object.keys(firstRow);
          setHeaders(newHeaders);
        }
        console.log('Data loaded from storage:', data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const clearData = () => {
    setMergedData(null);
    setHeaders([]);
    localStorage.removeItem('mergedTableData');
    dbService.clearData(); // Нужно добавить этот метод в DatabaseService
  };

  return (
    <TableContext.Provider 
      value={{ 
        mergedData, 
        setMergedData, 
        headers, 
        setHeaders,
        saveMergedData,
        loadMergedData,
        clearData
      }}
    >
      {children}
    </TableContext.Provider>
  );
};

export const useTableContext = () => {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTableContext must be used within a TableProvider');
  }
  return context;
}; 