import React from 'react';
import VerticalMerge from '../features/vertical-merge/VerticalMerge';

const VerticalMergePage: React.FC = () => {
  return (
    <div className="vertical-merge-page">
      <h1>EXCEL TABLES FUSION - SPREADSHEETS VERTICAL MERGER</h1>
      
      <div className="page-description">
        <p>
          Upload multiple BOM files to combine them vertically.
          All level columns will be removed, and file names will be added as identifiers.
        </p>
      </div>
      
      <div className="quick-start">
        <h2>Quick Start Guide:</h2>
        <ul className="quick-start-list">
          <li>Upload multiple Excel files you want to merge vertically</li>
          <li>Each file will be stacked one below the other</li>
          <li>A "BOM" column will be added to identify the source file</li>
          <li>Click "Merge" to see preview, then "Download" for full report</li>
        </ul>
      </div>
      
      <div className="vertical-merge-container">
        <VerticalMerge />
      </div>
    </div>
  );
};

export default VerticalMergePage;
