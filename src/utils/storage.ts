import { TableRow } from '../types/dataTypes';

export const storageKeys = {
  MERGED_DATA: 'mergedTableData',
};

export const saveToStorage = (data: TableRow[]) => {
  try {
    localStorage.setItem(storageKeys.MERGED_DATA, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

export const getFromStorage = (): TableRow[] | null => {
  try {
    const data = localStorage.getItem(storageKeys.MERGED_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
}; 