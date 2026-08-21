import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="about-page">
      <h1>About Excel Tables Fusion</h1>
      
      <div className="about-content">
        <section className="about-section">
          <h2>What it does</h2>
          <p>
            Excel Tables Fusion provides separate workflows for horizontal merges, vertical merges, and pivot tables. Each workflow works with uploaded Excel files, provides a preview, and can export an Excel result.
          </p>
        </section>

        <section className="about-section">
          <h2>Horizontal merge</h2>
          
          <h3>1. Horizontal Merging (Main)</h3>
          <p>
            Compare two Excel files by selecting sheets, fields, and a key field for row matching.
          </p>
          <ul>
            <li>Uploading two Excel files</li>
            <li>Selecting sheets from each file</li>
            <li>Choosing columns to include in the result</li>
            <li>Defining key fields for row matching</li>
            <li>Previewing merged rows before export</li>
            <li>Exporting the merged result to Excel</li>
          </ul>

          <h2>Vertical merge</h2>
          <p>Combine rows from multiple BOM files into one table.</p>
          <ul>
            <li>Uploading multiple Excel files</li>
            <li>Vertically combining data (rows from all files are added sequentially)</li>
            <li>Adding a BOM column with the source file name</li>
            <li>Removing grouping columns (Level_*)</li>
            <li>Creating a unified table with all data</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>Pivot tables, preview, and export</h2>
          <p>
            The pivot route provides a separate table workflow. All three routes provide a preview and can export their result to Excel.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
