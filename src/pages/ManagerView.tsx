import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ManagerView.css';
import { useTableContext } from '../context/TableContext';

const ManagerView: React.FC = () => {
  const { mergedData, headers } = useTableContext();
  const navigate = useNavigate();

  if (!mergedData) {
    return (
      <div className="manager-view">
        <header className="manager-header">
          <h1>Manager View</h1>
          <button onClick={() => navigate('/')} className="back-button">
            Back to Main Page
          </button>
        </header>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          No data available. Please return to the main page and merge tables first.
        </div>
      </div>
    );
  }

  return (
    <div className="manager-view">
      <header className="manager-header">
        <h1>Manager View</h1>
        <button 
          onClick={() => navigate('/')}
          className="back-button"
        >
          Back to Main Page
        </button>
      </header>
      
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
            {mergedData.map((row, index) => (
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
    </div>
  );
};

export default ManagerView; 