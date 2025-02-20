import React, { createContext, useContext, useState } from 'react';
import { TableRow } from '../types/dataTypes';

interface TableContextType {
  mergedData: TableRow[] | null;
  setMergedData: (data: TableRow[] | null) => void;
  headers: string[];
  setHeaders: (headers: string[]) => void;
  selectedFieldsOrder: string[];
  setSelectedFieldsOrder: (order: string[]) => void;
  saveMergedData: (data: TableRow[]) => void;
  clearData: () => void;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mergedData, setMergedData] = useState<TableRow[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [selectedFieldsOrder, setSelectedFieldsOrder] = useState<string[]>([]);

  const saveMergedData = async (data: TableRow[]) => {
    try {
      setMergedData(data);
      if (data.length > 0) {
        const originalHeaders = Object.keys(data[0]);
        setHeaders(originalHeaders);
        setSelectedFieldsOrder(originalHeaders);
      }
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  const clearData = () => {
    setMergedData(null);
    setHeaders([]);
    setSelectedFieldsOrder([]);
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