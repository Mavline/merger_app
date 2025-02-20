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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Обработка загрузки файла
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet) as TableRow[];

      // Получаем заголовки и фильтруем уровни
      const headers = Object.keys(jsonData[0] || {}).filter(
        header => !header.startsWith('Level_') && header !== 'LevelValue'
      );

      const newFile: VerticalMergeFile = {
        id: Date.now().toString(),
        name: cleanFileName(file.name),
        originalName: file.name,
        data: jsonData,
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

    // Собираем все уникальные заголовки, сохраняя порядок их появления
    const allHeaders = new Set<string>();
    
    // Сначала добавляем BOM как первый столбец
    allHeaders.add('BOM');
    
    // Затем собираем все заголовки из всех файлов, сохраняя порядок
    files.forEach(file => {
      file.data.forEach(row => {
        Object.keys(row).forEach(key => {
          if (!key.startsWith('Level_') && key !== 'LevelValue' && !allHeaders.has(key)) {
            allHeaders.add(key);
          }
        });
      });
    });

    const headersList = Array.from(allHeaders);

    const mergedRows: TableRow[] = [];
    
    files.forEach(file => {
      const fileRows = file.data.map(row => {
        const newRow: TableRow = {};
        
        // Заполняем все столбцы в правильном порядке
        headersList.forEach(header => {
          if (header === 'BOM') {
            newRow[header] = file.name;
          } else {
            newRow[header] = row[header] || '';
          }
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

    // Получаем заголовки в правильном порядке
    const headers = Object.keys(mergedData[0]);
    
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