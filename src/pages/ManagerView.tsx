import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTableContext } from '../context/TableContext';
import { TableRow } from '../types/dataTypes';
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import '../styles/ManagerView.css';
import { storageService, SavedTable } from '../utils/storage';

const ManagerView: React.FC = () => {
  const { mergedData, selectedFieldsOrder } = useTableContext();
  const [processedData, setProcessedData] = useState<TableRow[] | null>(null);
  const [fullData, setFullData] = useState<TableRow[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [savedTables, setSavedTables] = useState<SavedTable[]>([]);
  const [selectedTable, setSelectedTable] = useState<SavedTable | null>(null);
  const [nextAction, setNextAction] = useState<() => void>(() => {});
  const navigate = useNavigate();

  useEffect(() => {
    const savedTables = storageService.getAllTables();
    setSavedTables(savedTables);

    if (mergedData) {
      setFullData(mergedData);
      setProcessedData(mergedData);
      setHeaders(selectedFieldsOrder);
    }
  }, [mergedData, selectedFieldsOrder]);

  const handleSave = () => {
    if (processedData && fullData) {
      const newTable = storageService.saveTable({
        id: Date.now().toString(),
        name: `Table ${fullData[0]['PART NUM'] || 'Unknown'}`,
        data: processedData,
        fullData: fullData,
        date: new Date().toLocaleString()
      });
      setSavedTables(storageService.getAllTables());
      setShowSaveModal(false);
      nextAction();
    }
  };

  const handleAction = (action: () => void) => {
    if (processedData && fullData && !savedTables.some(table => 
      JSON.stringify(table.fullData) === JSON.stringify(fullData)
    )) {
      setNextAction(() => action);
      setShowSaveModal(true);
    } else {
      action();
    }
  };
  const handleViewSavedTable = (table: SavedTable) => {
    handleAction(() => {
      setSelectedTable(table);
      setProcessedData(table.fullData);
      setFullData(table.fullData);
      setHeaders(selectedFieldsOrder);
    });
  };

  const handleDownloadTable = async (table: SavedTable) => {
    try {
      if (!table.fullData) {
        alert('No data to download');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Merged');

      worksheet.columns = selectedFieldsOrder.map(header => ({
        header,
        key: header,
        width: header.startsWith('Level_') ? 8.43 : 
               header === 'LevelValue' ? 8.43 : 
               header === 'Note' ? 8.43 : 
               12
      }));

      worksheet.addRows(table.fullData);

      worksheet.getRow(1).eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'B1F0F0' }
        };
        cell.font = {
          bold: true,
          size: 9,
          color: { argb: '000000' }
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;

        row.eachCell({ includeEmpty: true }, cell => {
          cell.font = {
            size: 9
          };
          cell.border = {
            left: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        const rowData = table.fullData[rowNumber - 2];
        if (rowData && rowData['LevelValue']) {
          row.eachCell({ includeEmpty: true }, cell => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFC5' }
            };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              right: { style: 'thin' }
            };
          });
        }
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      const fileName = table.name ? 
        `${table.name}_${new Date().toISOString().split('T')[0]}.xlsx` : 
        'merged_table.xlsx';
      
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error downloading table:', error);
      alert('Error downloading table. Please try again.');
    }
  };

  const handleDeleteTable = (tableId: string) => {
    storageService.deleteTable(tableId);
    setSavedTables(storageService.getAllTables());
    
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
      setProcessedData(null);
      setFullData(null);
    }
  };

  return (
    <div className="manager-view">
      <header className="manager-header">
        <h1>Manager View</h1>
        <div className="button-group">
          <button 
            onClick={() => handleAction(() => navigate('/'))} 
            className="button button-primary"
          >
            Back to Main Page
          </button>
          {processedData && !selectedTable && (
            <button 
              onClick={() => handleAction(() => {})} 
              className="button button-secondary"
            >
              Save Table
            </button>
          )}
        </div>
      </header>

      {savedTables.length > 0 && (
        <div className="saved-tables">
          <h2>Saved Tables</h2>
          {savedTables.map(table => (
            <div key={table.id} className="saved-table-item">
              <span>{table.name} - {table.date}</span>
              <div className="button-group">
                <button 
                  onClick={() => handleViewSavedTable(table)}
                  className="button button-primary"
                >
                  View
                </button>
                <button 
                  onClick={() => handleDownloadTable(table)}
                  className="button button-secondary"
                >
                  Download
                </button>
                <button 
                  onClick={() => handleDeleteTable(table.id)}
                  className="button button-warning"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {processedData && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>#</th>
                {headers.map(header => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processedData.map((row, index) => (
                <tr key={index}>
                  <td className="row-number">{index + 1}</td>
                  {headers.map(header => (
                    <td key={`${index}-${header}`}>
                      {row[header] !== undefined ? String(row[header]) : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showSaveModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Do you want to save this table?</h2>
            <div className="modal-buttons">
              <button 
                onClick={handleSave}
                className="button button-secondary"
              >
                Yes, Save
              </button>
              <button 
                onClick={() => {
                  setShowSaveModal(false);
                  nextAction();
                }}
                className="button button-primary"
              >
                No, Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerView; 