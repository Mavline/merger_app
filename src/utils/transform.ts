import { TableRow } from '../types/dataTypes';

interface TransformedData {
  data: TableRow[];
  headers: string[];
}

interface GroupedData {
  [partNum: string]: {
    mainRow: TableRow;
    relatedRows: TableRow[];
    quantities: {
      [tableId: string]: string;
    };
    sourceTableIndex: number;
  };
}

export const transformMergedData = (tables: TableRow[][], tableNames: string[]): TransformedData => {
  const groupedData: GroupedData = {};
  const qtyHeaders = tableNames.map(name => `QTY Table ${name}`);

  // Обрабатываем каждую таблицу отдельно
  tables.forEach((table, tableIndex) => {
    const tableName = tableNames[tableIndex];
    let currentPartNum: string | null = null;
    let currentGroup: TableRow[] = [];

    // Проходим по строкам текущей таблицы
    for (let i = 0; i < table.length; i++) {
      const row = table[i];
      const partNum = row['PART NUM'];

      if (partNum) {
        // Если начинается новая группа
        if (currentPartNum && currentPartNum !== partNum) {
          // Сохраняем предыдущую группу
          processGroup(currentPartNum, currentGroup, tableName, tableIndex);
          // Начинаем новую группу
          currentPartNum = partNum;
          currentGroup = [row];
        } else if (!currentPartNum) {
          // Первая группа
          currentPartNum = partNum;
          currentGroup = [row];
        } else {
          // Тот же PART NUM
          currentGroup.push(row);
        }
      } else if (currentGroup.length > 0) {
        // Пустая строка - добавляем к текущей группе
        currentGroup.push(row);
      }
    }

    // Обрабатываем последнюю группу
    if (currentPartNum && currentGroup.length > 0) {
      processGroup(currentPartNum, currentGroup, tableName, tableIndex);
    }
  });

  function processGroup(partNum: string, group: TableRow[], tableName: string, tableIndex: number) {
    if (!groupedData[partNum]) {
      // Создаем новую группу
      groupedData[partNum] = {
        mainRow: { ...group[0] },
        relatedRows: group.slice(1),
        quantities: {},
        sourceTableIndex: tableIndex
      };
    } else {
      // Для последующих таблиц берем только QTY, игнорируем зависимые строки
      // НЕ добавляем relatedRows, так как они уже есть из первой таблицы
    }

    // Сохраняем QTY
    if (group[0]['QTY']) {
      groupedData[partNum].quantities[tableName] = group[0]['QTY'];
    }
  }

  // Формируем результирующий массив
  const transformedData: TableRow[] = [];

  Object.entries(groupedData).forEach(([partNum, data]) => {
    // Создаем основную строку и фильтруем ненужные поля
    const mainRow = Object.entries({ ...data.mainRow })
      .filter(([key]) => !key.startsWith('Level_') && key !== 'Note' && key !== 'QTY')
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as TableRow);

    // Добавляем QTY колонки
    qtyHeaders.forEach(header => {
      const tableName = header.replace('QTY Table ', '');
      mainRow[header] = data.quantities[tableName] || '';
    });

    // Добавляем основную строку
    transformedData.push(mainRow);

    // Добавляем связанные строки только из первой таблицы где встретился этот PART NUM
    if (data.relatedRows.length > 0) {
      data.relatedRows.forEach(relatedRow => {
        // Фильтруем ненужные поля в связанных строках
        const row = Object.entries({ ...relatedRow })
          .filter(([key]) => !key.startsWith('Level_') && key !== 'Note' && key !== 'QTY')
          .reduce((acc, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {} as TableRow);

        qtyHeaders.forEach(header => {
          row[header] = '';
        });
        transformedData.push(row);
      });
    }
  });

  // Формируем заголовки, исключая ненужные поля
  const baseHeaders = Object.keys(tables[0][0])
    .filter(header => !header.startsWith('Level_') && header !== 'Note' && header !== 'QTY');
  const headers = [...baseHeaders, ...qtyHeaders];

  return {
    data: transformedData,
    headers
  };
}; 