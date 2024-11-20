import React from 'react';
import { TableRow } from '../types/dataTypes';

interface MainViewProps {
  mergedPreview: TableRow[] | null;
  selectedFieldsOrder: string[];
}

const MainView: React.FC<MainViewProps> = ({ mergedPreview, selectedFieldsOrder }) => {
  if (!mergedPreview || mergedPreview.length === 0) {
    return null;
  }

  return (
    <div className="merged-preview">
      <h2>Merged Data Preview</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {selectedFieldsOrder.map((field: string) => (
                <th
                  key={field}
                  style={{
                    backgroundColor: field === 'Note' ? '#f8d7da' : 'transparent',
                    color: field === 'Note' ? '#721c24' : 'inherit',
                  }}
                >
                  {field}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mergedPreview.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {selectedFieldsOrder.map((field: string) => (
                  <td
                    key={`${rowIndex}-${field}`}
                    style={{
                      backgroundColor: field === 'Note' && row['Note'] ? '#f8d7da' : 'transparent',
                      color: field === 'Note' && row['Note'] ? '#721c24' : 'inherit',
                    }}
                  >
                    {row[field] !== undefined ? String(row[field]) : ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MainView; 