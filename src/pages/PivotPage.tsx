import React from 'react';
import Pivot from '../features/pivot/Pivot';

const PivotPage: React.FC = () => {
  return (
    <div className="pivot-page">
      <h1>EXCEL PIVOT TABLES GENERATOR</h1>
      <p className="page-description">
        Create pivot tables from your Excel data. Upload files, select sheets, and drag a field to the "To Columns" area to 
        transform its values into separate columns. Each unique value in that field will become a new column in the table.
      </p>
      
      <Pivot />
    </div>
  );
};

export default PivotPage; 