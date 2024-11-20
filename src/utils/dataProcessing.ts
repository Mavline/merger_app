import { TableRow } from '../types/dataTypes';

export const filterUniquePartNumbers = (data: TableRow[]): TableRow[] => {
  const uniquePartNumbers = new Map<string, TableRow>();
  
  data.forEach(row => {
    const partNumber = row['PART NUMBER'] || row['Part Number'] || '';
    if (partNumber && !uniquePartNumbers.has(partNumber)) {
      // Создаем новую строку без Level_ полей
      const filteredRow = Object.entries(row).reduce((acc, [key, value]) => {
        if (!key.startsWith('Level_')) {
          acc[key] = value;
        }
        return acc;
      }, {} as TableRow);
      
      uniquePartNumbers.set(partNumber, filteredRow);
    }
  });

  return Array.from(uniquePartNumbers.values());
};

export const removeGroupingColumns = (data: TableRow[]): TableRow[] => {
  return data.map(row => {
    return Object.entries(row).reduce((acc, [key, value]) => {
      if (!key.startsWith('Level_')) {
        acc[key] = value;
      }
      return acc;
    }, {} as TableRow);
  });
}; 