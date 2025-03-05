import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      <h1>About EXCEL TABLES FUSION - SPREADSHEETS MERGER</h1>
      
      <div className="about-content">
        <section className="about-section">
          <h2>Project Overview</h2>
          <p>
            TableFusion Elite is a comprehensive React application designed for processing and merging data from various sources, 
            primarily Excel files. This premium tool offers sophisticated data manipulation capabilities for enterprise-level data management.
          </p>
        </section>

        <section className="about-section">
          <h2>Key Features</h2>
          
          <h3>1. Horizontal Merging (Main)</h3>
          <p>
            The core functionality allows comparing and merging two Excel files based on key fields (such as part numbers). The process includes:
          </p>
          <ul>
            <li>Uploading two Excel files</li>
            <li>Selecting sheets from each file</li>
            <li>Choosing columns to include in the result</li>
            <li>Defining key fields for row matching</li>
            <li>Merging data while preserving Excel grouping structure</li>
            <li>Highlighting non-matching rows with markers in the "Note" column</li>
            <li>Expanding ranges in selected columns (e.g., "A1-A5" → "A1,A2,A3,A4,A5")</li>
          </ul>

          <h3>2. Vertical Merging</h3>
          <p>
            Additional functionality for vertical concatenation of multiple BOM (Bill of Materials) files:
          </p>
          <ul>
            <li>Uploading multiple Excel files</li>
            <li>Vertically combining data (rows from all files are added sequentially)</li>
            <li>Adding a "BOM" column with the source file name to track data origin</li>
            <li>Removing grouping columns (Level_*)</li>
            <li>Creating a unified table with all data</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Data Processing Features</h2>
          <ul>
            <li><strong>Grouping Structure Processing</strong> - preserves hierarchical data structure from Excel, including grouping levels</li>
            <li><strong>Range Processing</strong> - ability to expand ranges in "A1-A5" format into individual values</li>
            <li><strong>Intelligent Header Detection</strong> - automatic identification of header rows in Excel files</li>
            <li><strong>Duplicate Handling</strong> - removal of duplicate rows during merging</li>
            <li><strong>Discrepancy Marking</strong> - highlighting rows that have no matches in the second file</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Data Export</h2>
          <p>
            The application allows exporting merged results to a new Excel file with preserved formatting:
          </p>
          <ul>
            <li>Header styling (background color, bold font)</li>
            <li>Column width adjustment based on content</li>
            <li>Cell border addition</li>
            <li>Preservation of grouping structure in the output file</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Summary</h2>
          <p>
            TableFusion Elite provides a comprehensive solution for working with Excel data, including both horizontal merging 
            (combining based on key fields) and vertical merging (sequential addition of data from different files). 
            This premium tool is designed for enterprise-level data management and integration with ERP systems.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
