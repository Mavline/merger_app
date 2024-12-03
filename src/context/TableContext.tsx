import React, { createContext, useContext, useState, useEffect } from 'react';
import { TableRow } from '../types/dataTypes';
import { dbService } from '../services/db';
import { storageService } from '../utils/storage';

interface TableContextType {
  mergedData: TableRow[] | null;
  setMergedData: (data: TableRow[] | null) => void;
  headers: string[];
  setHeaders: (headers: string[]) => void;
  selectedFieldsOrder: string[];
  setSelectedFieldsOrder: (order: string[]) => void;
  saveMergedData: (data: TableRow[]) => void;
  loadMergedData: () => Promise<void>;
  clearData: () => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mergedData, setMergedData] = useState<TableRow[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedFieldsOrder, setSelectedFieldsOrder] = useState<string[]>([]);

  useEffect(() => {
    loadMergedData();
  }, []);

  useEffect(() => {
    if (mergedData && mergedData.length > 0) {
      const allHeaders = Object.keys(mergedData[0]);
      setSelectedFieldsOrder(allHeaders);
    }
  }, [mergedData]);

  const saveMergedData = async (data: TableRow[]) => {
    try {
      console.log('Data before saving:', {
        sample: data[0],
        keys: Object.keys(data[0]),
        propertyNames: Object.getOwnPropertyNames(data[0])
      });
      await dbService.saveMergedData(data);
      const tableToSave = {
        id: Date.now().toString(),
        name: `Table ${data[0]['PART NUM'] || 'Unknown'}`,
        data: data,
        fullData: data,
        date: new Date().toLocaleString()
      };
      storageService.saveTable(tableToSave);
      setMergedData(data);
      
      if (data.length > 0) {
        const originalHeaders = Object.getOwnPropertyNames(data[0]);
        setHeaders(originalHeaders);
        setSelectedFieldsOrder(originalHeaders);
      }
      
      console.log('Data saved to context and storage:', data);
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const loadMergedData = async () => {
    try {
      let data = await dbService.getLatestMergedData();
      console.log('Data after loading from DB:', {
        sample: data?.[0],
        keys: data?.[0] ? Object.keys(data[0]) : [],
        propertyNames: data?.[0] ? Object.getOwnPropertyNames(data[0]) : []
      });
      
      if (!data) {
        const savedTables = storageService.getAllTables();
        if (savedTables.length > 0) {
          data = savedTables[savedTables.length - 1].fullData;
        }
      }

      if (data && data.length > 0) {
        setMergedData(data);
        const originalHeaders = Object.getOwnPropertyNames(data[0]);
        setHeaders(originalHeaders);
        setSelectedFieldsOrder(originalHeaders); // Добавляем эту строку
        console.log('Data loaded from storage:', data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
};


  const clearData = () => {
    setMergedData(null);
    setHeaders([]);
    storageService.clearAll();
    dbService.clearData();
  };

  return (
    <TableContext.Provider 
      value={{ 
        mergedData, 
        setMergedData, 
        headers, 
        setHeaders,
        selectedFieldsOrder,
        setSelectedFieldsOrder,
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