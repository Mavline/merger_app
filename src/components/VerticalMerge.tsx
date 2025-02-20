import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import { TableRow } from '../types/dataTypes';
import Input from './ui/input';
import '../styles/VerticalMerge.css';

interface VerticalMergeFile {
  id: string;
  name: string;
  originalName: string;
  data: TableRow[];
  headers: string[];
}

const VerticalMerge: React.FC = () => {
  const [files, setFiles] = useState<VerticalMergeFile[]>([]);
  const [mergedData, setMergedData] = useState<TableRow[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Очистка имени файла от суффиксов и расширения
  const cleanFileName = (fileName: string): string => {
    return fileName
      .replace(/\.[^/.]+$/, '') // удаляем расширение
      .replace(/_merged(?:\s*\(\d+\))?/g, '') // удаляем _merged и (N)
      .trim();
  };

  // Обработка загрузки файла
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

      // Получаем заголовки из первой строки и данные как есть
      const headers = jsonData[0] as string[];
      const rowData = jsonData.slice(1).map(row => {
        const obj: TableRow = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });

      const newFile: VerticalMergeFile = {
        id: Date.now().toString(),
        name: cleanFileName(file.name),
        originalName: file.name,
        data: rowData,
        headers
      };

      setFiles(prev => [...prev, newFile]);
    };
    reader.readAsArrayBuffer(file);
  };

  // Удаление файла
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  // Вертикальное слияние файлов
  const mergeFiles = () => {
    if (files.length === 0) return;

    // Собираем все уникальные заголовки из всех таблиц
    const allHeaders = new Set<string>();
    files.forEach(file => {
      file.headers.forEach(header => {
        if (!header.startsWith('Level_') || header === 'LevelValue') {
          allHeaders.add(header);
        }
      });
    });

    // Удаляем служебные столбцы из набора
    allHeaders.delete('BOM');
    allHeaders.delete('LevelValue');
    
    // Формируем финальный порядок заголовков
    const baseHeaders = Array.from(allHeaders);
    const mergedRows: TableRow[] = [];
    
    files.forEach(file => {
      const fileRows = file.data.map(row => {
        const newRow: TableRow = {
          BOM: file.name,
          LevelValue: row['LevelValue'] || ''
        };
        
        // Копируем все возможные поля, если поля нет - ставим пустую строку
        baseHeaders.forEach(header => {
          newRow[header] = row[header] || '';
        });
        
        return newRow;
      });
      
      mergedRows.push(...fileRows);
    });

    setMergedData(mergedRows);
  };

  // Скачивание результата
  const downloadMergedFile = async () => {
    if (!mergedData || mergedData.length === 0) {
      alert('No data to download. Please merge files first.');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Merged');

    // Собираем все уникальные заголовки из всех таблиц
    const allHeaders = new Set<string>();
    files.forEach(file => {
      file.headers.forEach(header => {
        if (!header.startsWith('Level_') || header === 'LevelValue') {
          allHeaders.add(header);
        }
      });
    });

    // Удаляем служебные столбцы из набора
    allHeaders.delete('BOM');
    allHeaders.delete('LevelValue');
    
    // Формируем финальный порядок заголовков
    const headers = ['BOM', 'LevelValue', ...Array.from(allHeaders)];
    
    // Настраиваем колонки
    worksheet.columns = headers.map(header => ({
      header,
      key: header,
      width: header === 'Name' ? 40 : 
             (header === 'VENDOR NAME' || header === 'VENDOR PART #') ? 20 : 15
    }));

    // Добавляем данные
    worksheet.addRows(mergedData);

    // Стилизация заголовков
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

    // Стилизация данных
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      row.eachCell((cell) => {
        cell.font = { size: 9 };
        cell.border = {
          left: { style: 'thin' },
          right: { style: 'thin' },
          top: { style: 'thin' },
          bottom: { style: 'thin' }
        };
      });
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
      
      <div className="file-upload-container">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          style={{
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
            borderColor: "var(--border-color)"
          }}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          style={{
            backgroundColor: "var(--accent-primary)",
            color: "var(--background)",
            padding: "8px 16px",
            borderRadius: "4px",
            marginLeft: "10px"
          }}
        >
          +
        </button>
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
                  {['BOM', 'LevelValue', ...Array.from(new Set(files.flatMap(f => 
                    f.headers.filter(h => !h.startsWith('Level_') || h === 'LevelValue')
                  ))).filter(h => h !== 'BOM' && h !== 'LevelValue')].map(header => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mergedData.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    {['BOM', 'LevelValue', ...Array.from(new Set(files.flatMap(f => 
                      f.headers.filter(h => !h.startsWith('Level_') || h === 'LevelValue')
                    ))).filter(h => h !== 'BOM' && h !== 'LevelValue')].map(header => (
                      <td key={header}>{String(row[header] || '')}</td>
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