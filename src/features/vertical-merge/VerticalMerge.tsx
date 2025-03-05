import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { VerticalMergeFile, TableRow } from './types';
import { cleanFileName } from './utils';
import Input from '../../components/ui/input';
import './styles.css';

const VerticalMerge: React.FC = () => {
  const [files, setFiles] = useState<VerticalMergeFile[]>([]);
  const [mergedData, setMergedData] = useState<TableRow[] | null>(null);
  const [headerOrder, setHeaderOrder] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обработка загрузки файла
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(event.target.files || []);
    if (newFiles.length === 0) return;
    
    // Очищаем input, чтобы можно было выбрать те же файлы снова
    event.target.value = '';

    for (const file of newFiles) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Получаем данные из таблицы
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as TableRow[];
        
        // Получаем строгий порядок заголовков (из таблицы)
        // sheet_to_json не сохраняет порядок, поэтому нам нужно получить его из worksheet
        const range = XLSX.utils.decode_range(firstSheet['!ref'] || 'A1');
        const headers: string[] = [];
        
        // Проходим по первой строке и получаем заголовки в том порядке, в котором они идут в таблице
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: range.s.r, c: col });
          const cell = firstSheet[cellAddress];
          if (cell && cell.v !== undefined) {
            headers.push(String(cell.v));
          }
        }
        
        console.log('Исходный порядок заголовков из Excel:', headers);

        const newFile: VerticalMergeFile = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          name: file.name,
          originalName: file.name,
          data: jsonData,
          headers: headers
        };

        // Добавляем новый файл к существующим
        setFiles(prevFiles => [...prevFiles, newFile]);
        
        // Обновляем порядок заголовков
        setHeaderOrder(prevOrder => {
          // Объединяем существующие заголовки с новыми, сохраняя уникальность
          const uniqueHeaders = Array.from(new Set([...prevOrder, ...headers]));
          return uniqueHeaders;
        });
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Удаление файла
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  // Вертикальное слияние файлов
  const mergeFiles = () => {
    if (files.length === 0) return;
    
    console.log('Начинаем объединение файлов...');

    // Создаем список заголовков, начиная с BOM
    const allHeaders = new Set<string>();
    allHeaders.add('BOM');
    
    // Используем headers из первого файла (они уже в правильном порядке)
    if (files.length > 0) {
      console.log('Заголовки первого файла:', files[0].headers);
      
      // Добавляем заголовки из первого файла, сохраняя порядок
      files[0].headers.forEach(header => {
        if (!header.startsWith('Level_') && !allHeaders.has(header)) {
          allHeaders.add(header);
        }
      });
    }
    
    // Теперь добавляем любые дополнительные заголовки из остальных файлов
    if (files.length > 1) {
      files.slice(1).forEach(file => {
        file.headers.forEach(header => {
          if (!header.startsWith('Level_') && !allHeaders.has(header)) {
            allHeaders.add(header);
          }
        });
      });
    }
    
    // Преобразуем Set в массив для дальнейшей обработки
    const headersList = Array.from(allHeaders);
    
    // Если мы нашли PART NUM, добавим PART NUM_2 сразу после него
    const partNumIndex = headersList.indexOf('PART NUM');
    if (partNumIndex !== -1) {
      // Если PART NUM_2 не существует, добавим его после PART NUM
      if (!headersList.includes('PART NUM_2')) {
        headersList.splice(partNumIndex + 1, 0, 'PART NUM_2');
      }
    }
    
    console.log('Финальный порядок заголовков:', headersList);
    
    const mergedRows: TableRow[] = [];
    
    files.forEach(file => {
      const fileRows = file.data.map(row => {
        const newRow: TableRow = {};
        
        // Заполняем все столбцы в правильном порядке
        headersList.forEach(header => {
          if (header === 'BOM') {
            newRow[header] = file.name;
          } else if (header === 'PART NUM_2' && row['PART NUM']) {
            // Для PART NUM_2 используем значение из PART NUM
            newRow[header] = row['PART NUM'];
          } else {
            newRow[header] = row[header] || '';
          }
        });
        
        return newRow;
      });
      
      mergedRows.push(...fileRows);
    });
    
    console.log('Первая строка данных:', mergedRows.length > 0 ? mergedRows[0] : 'Нет данных');
    
    // Сохраняем порядок заголовков для использования при экспорте
    setHeaderOrder(headersList);
    setMergedData(mergedRows);
  };

  // Скачивание результата
  const downloadMergedFile = async () => {
    if (!mergedData || mergedData.length === 0) {
      alert('No data to download. Please merge files first.');
      return;
    }

    console.log('Начинаем подготовку Excel-файла...');
    
    // Используем либо сохраненный порядок заголовков, либо берем из первой строки
    const headers = headerOrder.length > 0 ? headerOrder : Object.keys(mergedData[0]);
    console.log('Используем порядок заголовков:', headers);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Merged');

    // Настраиваем колонки
    worksheet.columns = headers.map(header => ({
      header,
      key: header,
      width: header === 'Name' ? 40 : 
             (header === 'VENDOR NAME' || header === 'VENDOR PART #') ? 20 : 15
    }));

    // Добавляем данные
    worksheet.addRows(mergedData);
    
    // Стилизация
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'B1F0F0' }
      };
      cell.font = {
        bold: true,
        size: 9
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
    
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    saveAs(blob, 'vertical_merged.xlsx');
  };

  return (
    <div className="vertical-merge-container">
      <h2>Vertical Merge BOM Files</h2>
      
      <div className="file-upload-container" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="button"
          style={{
            padding: '10px 16px',
            backgroundColor: 'var(--accent-green)',
            color: 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '200px',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-yellow)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-green)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ marginRight: '8px' }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Add Excel File
        </button>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          style={{
            fontSize: '24px',
            padding: '6px 16px',
            backgroundColor: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-secondary)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          +
        </button>
        
        <div style={{ fontSize: '14px', color: 'var(--foreground)', fontWeight: 'bold', marginLeft: '10px' }}>
          {files.length > 0 ? `${files.length} file(s) added` : 'No files added yet'}
        </div>
      </div>

      <div className="files-list">
        {files.map(file => (
          <div key={file.id} className="file-item">
            <span>{file.name}</span>
            <button
              onClick={() => removeFile(file.id)}
              style={{
                backgroundColor: "var(--accent-red)",
                color: "var(--background)",
                padding: "4px 8px",
                borderRadius: "4px",
                marginLeft: "10px"
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="controls">
        <button
          onClick={mergeFiles}
          disabled={files.length === 0}
          style={{
            backgroundColor: "var(--accent-primary)",
            color: "var(--background)",
            padding: "8px 16px",
            borderRadius: "4px",
            marginRight: "10px"
          }}
        >
          Merge
        </button>
        <button
          onClick={downloadMergedFile}
          disabled={!mergedData}
          style={{
            backgroundColor: "var(--accent-green)",
            color: "var(--background)",
            padding: "8px 16px",
            borderRadius: "4px"
          }}
        >
          Download
        </button>
      </div>

      {mergedData && mergedData.length > 0 && (
        <div className="preview-container">
          <h3>Preview</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {Object.keys(mergedData[0]).map(header => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mergedData.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td key={i}>{String(value)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerticalMerge; 