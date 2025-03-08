import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import './styles.css';

// Types of data
type TableRow = Record<string, any>;

interface PivotFile {
  id: string;
  name: string;
  originalName: string;
  data: TableRow[];
  headers: string[];
  headerOriginalOrder: string[]; // Store original header order
  selectedSheet?: string;
  sheets?: string[];
}

interface FieldCard {
  id: string;
  name: string;
  fileId: string;
  originalIndex?: number; // Store original index for sorting
}

interface DragArea {
  id: string;
  title: string;
  description: string;
  fields: FieldCard[];
}

const Pivot: React.FC = () => {
  // State
  const [files, setFiles] = useState<PivotFile[]>([]);
  const [uploadedExcelFiles, setUploadedExcelFiles] = useState<(File | null)[]>([null, null]);
  const [dragAreas, setDragAreas] = useState<{
    rows: DragArea;
    columns: DragArea;
    values: DragArea;
  }>({
    rows: {
      id: 'rows',
      title: 'Rows',
      description: 'Drag fields here to use as row headers',
      fields: [],
    },
    columns: {
      id: 'columns',
      title: 'Columns',
      description: 'Drag BOM field here to transform into column headers',
      fields: [],
    },
    values: {
      id: 'values',
      title: 'Values',
      description: 'Drag QTY field here to use as values',
      fields: [],
    },
  });
  const [pivotTable, setPivotTable] = useState<TableRow[]>([]);
  
  // Refs for input elements
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, fileIndex: number) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    try {
      // Save file for further processing
      setUploadedExcelFiles(prev => {
        const newFiles = [...prev];
        newFiles[fileIndex] = uploadedFile;
        return newFiles;
      });

      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      const sheetNames = workbook.SheetNames;
      
      if (sheetNames.length === 0) {
        alert('No sheets found in the Excel file');
        return;
      }

      // Create a new file object
      const newFile: PivotFile = {
        id: `file-${fileIndex}-${Date.now()}`,
        name: `File ${fileIndex + 1}`,
        originalName: uploadedFile.name,
        data: [],
        headers: [],
        headerOriginalOrder: [], // Initialize empty order
        sheets: sheetNames,
      };

      // Add the file to state
      setFiles(prevFiles => {
        // Replace file if index exists, otherwise add
        const newFiles = [...prevFiles];
          newFiles[fileIndex] = newFile;
        return newFiles;
      });
      
      // If there's only one sheet, select it automatically
      if (sheetNames.length === 1) {
        // Process the first sheet
        const firstSheet = sheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          alert('The sheet does not contain enough data');
          return;
        }

        // Extract headers (first row)
        const headers = jsonData[0] as string[];
        
        // Extract data (remaining rows)
        const rows = jsonData.slice(1).map(row => {
          const rowData: TableRow = {};
          (row as any[]).forEach((cell, index) => {
            if (index < headers.length) {
              rowData[headers[index]] = cell;
            }
          });
          return rowData;
        });

        // Update file with processed data, preserving header order
        setFiles(prevFiles => {
          return prevFiles.map(f => {
            if (f.id === newFile.id) {
              return { 
                ...f, 
                data: rows, 
                headers, 
                headerOriginalOrder: [...headers], // Save original order
                selectedSheet: firstSheet 
              };
            }
            return f;
          });
        });
      }
    } catch (error) {
      console.error('Error reading Excel file:', error);
      alert('Error reading Excel file. Please try again.');
    }
  };

  // Sheet selection handler
  const handleSheetSelection = (fileId: string, sheetName: string) => {
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex === -1 || fileIndex >= uploadedExcelFiles.length) return;
    
    const excelFile = uploadedExcelFiles[fileIndex];
    if (!excelFile) return;
    
    // Update selected sheet
    setFiles(prevFiles => {
      return prevFiles.map(file => {
        if (file.id === fileId) {
          return { ...file, selectedSheet: sheetName };
        }
        return file;
      });
    });
    
    // Process sheet data
    processSheet(fileId, sheetName, excelFile);
  };

  // Process sheet data
  const processSheet = async (fileId: string, sheetName: string, file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        alert('The sheet does not contain enough data');
        return;
      }

      // Extract headers (first row)
      const headers = jsonData[0] as string[];
      
      // Extract data (remaining rows)
      const rows = jsonData.slice(1).map(row => {
        const rowData: TableRow = {};
        (row as any[]).forEach((cell, index) => {
          if (index < headers.length) {
            rowData[headers[index]] = cell;
          }
        });
        return rowData;
      });

      // Update file with processed data and preserve header order
      setFiles(prevFiles => {
        return prevFiles.map(f => {
          if (f.id === fileId) {
            return { 
              ...f, 
              data: rows, 
              headers,
              headerOriginalOrder: [...headers] // Save original order
            };
          }
          return f;
        });
      });
      
      console.log('Data processed:', rows);
    } catch (error) {
      console.error('Error processing sheet:', error);
      alert('Error processing sheet. Please try again.');
    }
  };
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, field: FieldCard) => {
    e.dataTransfer.setData('field', JSON.stringify(field));
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent, areaType: 'rows' | 'columns' | 'values') => {
    e.preventDefault();
    
    const fieldData = e.dataTransfer.getData('field');
    if (!fieldData) return;
    
    const field = JSON.parse(fieldData) as FieldCard;
    
    // Find the file to get the original index
    const file = files.find(f => f.id === field.fileId);
    if (file) {
      const originalIndex = file.headerOriginalOrder.indexOf(field.name);
      if (originalIndex !== -1) {
        field.originalIndex = originalIndex;
      }
    }
    
    // Remove field from any area it might be in
    setDragAreas(prev => {
      const newAreas = { ...prev };
      
      // Remove from all areas
      Object.keys(newAreas).forEach(key => {
        const area = newAreas[key as keyof typeof newAreas];
        area.fields = area.fields.filter(f => !(f.id === field.id && f.fileId === field.fileId));
      });
      
      // Add to the target area
      // For columns and values areas, allow only one field
      if (areaType === 'columns' || areaType === 'values') {
        newAreas[areaType].fields = [field];
      } else {
        // For rows area, maintain original order
        const currentFields = [...newAreas[areaType].fields];
        currentFields.push(field);
        
        // Sort fields based on original order if available
        if (currentFields.every(f => f.originalIndex !== undefined)) {
          currentFields.sort((a, b) => {
            return (a.originalIndex || 0) - (b.originalIndex || 0);
          });
        }
        
        newAreas[areaType].fields = currentFields;
      }
      
      return newAreas;
    });
  };

  // Auto-detection and setup of BOM and QTY fields
  const autoDetectAndSetupPivot = () => {
    if (!files || files.length === 0 || !files[0] || !files[0].headers || 
        !Array.isArray(files[0].headers) || files[0].headers.length === 0) {
      console.log("No files or headers found for auto-detection");
      return;
    }
    
    const file = files[0];
    console.log("Auto-detecting fields from file:", file.originalName);
    
    // Find BOM and QTY fields
    const bomField = file.headers.find(h => 
      h?.toLowerCase() === 'bom' || 
      h?.toLowerCase().includes('bom') || 
      h?.toLowerCase().includes('number')
    );
    
    const qtyField = file.headers.find(h => 
      h?.toLowerCase() === 'qty' || 
      h?.toLowerCase() === 'quantity' || 
      h?.toLowerCase().includes('kol') || 
      h?.toLowerCase().includes('amount')
    );
    
    console.log("Detected BOM field:", bomField);
    console.log("Detected QTY field:", qtyField);
    
    if (bomField && qtyField) {
      // Create field cards
      const bomCard: FieldCard = {
        id: bomField,
        name: bomField,
        fileId: file.id,
        originalIndex: file.headerOriginalOrder.indexOf(bomField)
      };
      
      const qtyCard: FieldCard = {
        id: qtyField,
        name: qtyField,
        fileId: file.id,
        originalIndex: file.headerOriginalOrder.indexOf(qtyField)
      };
      
      // Get all other fields for rows with original indices
      const rowFields: FieldCard[] = file.headers
        .filter(header => header !== bomField && header !== qtyField)
        .map(header => ({
          id: header,
          name: header,
          fileId: file.id,
          originalIndex: file.headerOriginalOrder.indexOf(header)
        }));
      
      // Sort row fields by original order
      rowFields.sort((a, b) => (a.originalIndex || 0) - (b.originalIndex || 0));
      
      console.log("Row fields to add (sorted by original order):", rowFields);
      
      // Set fields in corresponding areas
      setDragAreas(prev => {
        const newAreas = {
          ...prev,
          columns: {
            ...prev.columns,
            fields: [bomCard]
          },
          values: {
            ...prev.values,
            fields: [qtyCard]
          },
          rows: {
            ...prev.rows,
            fields: rowFields
          }
        };
        
        console.log("Updated drag areas:", newAreas);
        return newAreas;
      });
    } else {
      console.log("Could not detect BOM or QTY fields");
      alert("Could not automatically detect BOM and QTY fields. Please drag fields manually.");
    }
  };

  // Calculate pivot table based on drag areas
  const calculatePivotTable = () => {
    console.log("Calculating pivot table with:", { 
      columns: dragAreas.columns.fields, 
      values: dragAreas.values.fields,
      rows: dragAreas.rows.fields 
    });
    
    // Check if we have necessary fields
    if (!dragAreas.columns.fields || dragAreas.columns.fields.length === 0 || 
        !dragAreas.values.fields || dragAreas.values.fields.length === 0) {
      console.log("Missing required fields for pivot table calculation");
      setPivotTable([]);
      return;
    }

    // Get the file that contains the column field (BOM)
    const columnField = dragAreas.columns.fields[0];
    const valueField = dragAreas.values.fields[0];
    
    const file = files.find(f => f.id === columnField.fileId);
    if (!file || !file.data || !Array.isArray(file.data) || file.data.length === 0) {
      console.log("File or data not found:", columnField.fileId);
      setPivotTable([]);
      return;
    }
    
    console.log("Found file with data:", file.originalName, "Rows:", file.data.length);

    // Get unique values for the column field to create new column headers (BOM values)
    const uniqueColumnValues = Array.from(
      new Set(file.data.map(row => row[columnField.name]))
    ).filter(Boolean);
    
    console.log("Unique column values (BOM):", uniqueColumnValues);

    // Find PART NUM_2 field in row fields
    const partNumField = dragAreas.rows.fields.find(field => field.name === "PART NUM_2");
    
    if (!partNumField) {
      console.log("PART NUM_2 field not found in row fields");
      // Fallback to original pivot table logic
      createRegularPivotTable(file, columnField, valueField, uniqueColumnValues);
      return;
    }
    
    console.log("Found PART NUM_2 field:", partNumField);
    
    // 1. Identify row groups (parent + children)
    // Each group starts with a row containing PART NUM_2 and continues until the next such row
    const rowGroups: number[][] = [];
    let currentGroup: number[] = [];
    let inGroup = false;
    
    // Process rows sequentially to maintain exact original structure
    for (let i = 0; i < file.data.length; i++) {
      const row = file.data[i];
      const partNum = row[partNumField.name];
      
      // If we find a row with PART NUM_2, it's the start of a new group
      if (partNum) {
        // If we were already in a group, save it before starting a new one
        if (currentGroup.length > 0) {
          rowGroups.push([...currentGroup]);
          currentGroup = [];
        }
        inGroup = true;
      }
      
      // Add current row to the current group if we're in a group
      if (inGroup) {
        currentGroup.push(i);
      }
      
      // If we're at the last row or the next row has a PART NUM_2 value, end the current group
      const nextRow = i < file.data.length - 1 ? file.data[i+1] : null;
      if (nextRow && nextRow[partNumField.name] && currentGroup.length > 0) {
        rowGroups.push([...currentGroup]);
        currentGroup = [];
        inGroup = false;
      }
    }
    
    // Add the last group if it exists
    if (currentGroup.length > 0) {
      rowGroups.push(currentGroup);
    }
    
    console.log(`Identified ${rowGroups.length} row groups`);
    
    // 2. Create map of PART NUM_2 values to their row groups
    const partNumToGroups: Map<string, number[][]> = new Map();
    
    rowGroups.forEach(group => {
      // Find the first row with a PART NUM_2 value in this group (should be the first row)
      const parentRowIndex = group.find(idx => {
        const row = file.data[idx];
        return row && row[partNumField.name];
      });
      
      if (parentRowIndex === undefined) return; // Skip groups without a parent row
      
      const parentRow = file.data[parentRowIndex];
      const partNum = String(parentRow[partNumField.name]);
      
      if (!partNum) return; // Skip if somehow there's no PART NUM_2 value
      
      // Add this group to the list for this PART NUM_2
      if (!partNumToGroups.has(partNum)) {
        partNumToGroups.set(partNum, []);
      }
      
      partNumToGroups.get(partNum)!.push(group);
    });
    
    // 3. For each unique PART NUM_2, select the group with the most rows
    // Keep track of original order via lowest row index in each group
    const selectedGroupsMap: Map<string, { group: number[], minIndex: number }> = new Map();
    
    partNumToGroups.forEach((groups, partNum) => {
      // Sort groups by length (descending) to select the one with most rows
      groups.sort((a, b) => b.length - a.length);
      
      // Store the largest group and its minimum index (to preserve original order)
      const largestGroup = groups[0];
      const minIndex = Math.min(...largestGroup);
      
      selectedGroupsMap.set(partNum, {
        group: largestGroup,
        minIndex
      });
      
      console.log(`PART NUM_2 "${partNum}": Selected group with ${largestGroup.length} rows (from ${groups.length} groups)`);
    });
    
    // 4. Create BOM data mapping (PART NUM_2 -> BOM -> QTY)
    const partNumToBomData: Map<string, Map<string, any>> = new Map();
    
    file.data.forEach(row => {
      const partNum = row[partNumField.name];
      const bom = row[columnField.name];
      const qty = row[valueField.name];
      
      if (!partNum || !bom || qty === undefined || qty === null) return;
      
      // Initialize maps if needed
      if (!partNumToBomData.has(String(partNum))) {
        partNumToBomData.set(String(partNum), new Map());
      }
      
      // Store QTY for this PART NUM_2 and BOM
      partNumToBomData.get(String(partNum))!.set(String(bom), qty);
    });
    
    // 5. Sort selected groups by their original position in the file
    // to maintain the original order
    const sortedSelectedGroups = Array.from(selectedGroupsMap.entries())
      .sort((a, b) => a[1].minIndex - b[1].minIndex)
      .map(([partNum, { group }]) => ({ partNum, group }));
    
    // 6. Create pivot table, preserving exact group structure
    const newPivotTable: TableRow[] = [];
    
    // Process each selected group in original order
    sortedSelectedGroups.forEach(({ partNum, group }) => {
      const bomData = partNumToBomData.get(partNum);
      
      // Process each row in the group, maintaining order
      group.forEach(rowIndex => {
        const originalRow = file.data[rowIndex];
        const pivotRow: TableRow = {};
        
        // Copy all original fields
        dragAreas.rows.fields.forEach(field => {
          pivotRow[field.name] = originalRow[field.name];
        });
        
        // Add BOM columns with QTY values
        uniqueColumnValues.forEach(bomValue => {
          if (originalRow[partNumField.name] === partNum) {
            // This is a parent row, add QTY values
            pivotRow[String(bomValue)] = bomData?.get(String(bomValue)) || null;
          } else {
            // This is a child/empty row, add null values
            pivotRow[String(bomValue)] = null;
          }
        });
        
        newPivotTable.push(pivotRow);
      });
    });
    
    setPivotTable(newPivotTable);
    console.log("Pivot table created with", newPivotTable.length, "rows, preserving original group order");
  };
  
  // Helper function for original pivot table logic (fallback)
  const createRegularPivotTable = (
    file: PivotFile, 
    columnField: FieldCard, 
    valueField: FieldCard, 
    uniqueColumnValues: any[]
  ) => {
    const newPivotTable: TableRow[] = [];
    
    // If we have row fields, group by them
    if (dragAreas.rows.fields.length > 0) {
      // Group data by row fields
      const rowFields = dragAreas.rows.fields;
      
      // Create a map of row values to their data
      const rowGroups: Record<string, TableRow[]> = {};
      
      file.data.forEach(row => {
        // Create a key based on row field values
        const rowKey = rowFields.map(field => row[field.name] ?? '').join('|');
        
        if (!rowGroups[rowKey]) {
          rowGroups[rowKey] = [];
        }
        
        rowGroups[rowKey].push(row);
      });
      
      // Create pivot rows
      Object.entries(rowGroups).forEach(([rowKey, rows]) => {
        const pivotRow: TableRow = {};
        
        // Add row field values in original order
        rowFields.forEach((field) => {
          pivotRow[field.name] = rows[0][field.name];
        });
        
        // Add column values
        uniqueColumnValues.forEach(columnValue => {
          const matchingRows = rows.filter(row => row[columnField.name] === columnValue);
          
          // Sum or count values
          if (matchingRows.length > 0) {
            // Use QTY value from the first matching row
            pivotRow[String(columnValue)] = matchingRows[0][valueField.name] ?? null;
          } else {
            pivotRow[String(columnValue)] = null;
          }
        });
        
        newPivotTable.push(pivotRow);
      });
    } else {
      // Without row fields, just create a single row with column values
      const pivotRow: TableRow = {};
      
      uniqueColumnValues.forEach(columnValue => {
        const matchingRows = file.data.filter(row => row[columnField.name] === columnValue);
        
        if (matchingRows.length > 0) {
          // Sum values for this column
          pivotRow[String(columnValue)] = matchingRows.reduce((sum, row) => {
            const value = row[valueField.name];
            return sum + (typeof value === 'number' ? value : 0);
          }, 0);
        } else {
          pivotRow[String(columnValue)] = 0;
        }
      });
      
      newPivotTable.push(pivotRow);
    }
    
    setPivotTable(newPivotTable);
    console.log("Regular pivot table created with", newPivotTable.length, "rows");
  };

  // Download pivot table as Excel file
  const downloadPivotTable = () => {
    if (!pivotTable || pivotTable.length === 0) {
      alert('No data to download. Please create a pivot table first.');
      return;
    }

    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
      
      // Get column headers
      const columnFields = dragAreas.columns.fields;
      if (!columnFields || columnFields.length === 0) return;
      
      const columnField = columnFields[0];
      const fileWithData = files.find(f => f?.id === columnField?.fileId);
      const fileData = fileWithData?.data;
      
      if (!fileData || !Array.isArray(fileData)) return;
      
      const uniqueColumnValues = Array.from(
        new Set(fileData.map(row => row?.[columnField?.name]))
      ).filter(Boolean);
      
      // Create headers array preserving original order of row fields
      const headers = [
        ...dragAreas.rows.fields.map(field => field.name),
        ...uniqueColumnValues.map(val => String(val))
      ];
      
      // Create data array with headers
      const excelData = [
        headers,
        ...pivotTable.map(row => {
          const rowData: any[] = [];
          
          // Add row field values in their order in the drag area
          dragAreas.rows.fields.forEach(field => {
            rowData.push(row[field.name]);
          });
          
          // Add column values
          uniqueColumnValues.forEach(columnValue => {
            rowData.push(row[String(columnValue)]);
          });
          
          return rowData;
        })
      ];
      
      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Pivot Table');
      
      // Generate Excel file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      
      // Create Blob and download
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'pivot_table.xlsx';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
    } catch (error) {
      console.error('Error downloading pivot table:', error);
      alert('Error downloading pivot table. Please try again.');
    }
  };
  
  return (
    <div className="pivot-container">
      <div className="file-upload-section">
        {[0, 1].map((index) => (
          <div key={index} className="file-container">
            <h2>File {index + 1}</h2>
            
            <div className="mb-4">
              <input
                ref={fileInputRefs[index]}
                id={`pivot-file-input-${index}`}
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => handleFileUpload(e, index)}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => fileInputRefs[index]?.current?.click()}
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
                  width: '100%',
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
                Choose File
              </button>
            </div>
            
            {files[index] && (
              <>
                <div className="mb-2">
                  <p>Selected: {files[index].originalName}</p>
                </div>
                
                {(() => {
                  const sheetsArray = files[index]?.sheets;
                  return sheetsArray && Array.isArray(sheetsArray) && sheetsArray.length > 1 && (
                    <div className="mb-4">
                      <label htmlFor={`sheet-select-${index}`}>Select Sheet:</label>
                <select 
                        id={`sheet-select-${index}`}
                  onChange={(e) => handleSheetSelection(files[index].id, e.target.value)}
                        value={files[index].selectedSheet || ''}
                        className="select"
                      >
                        <option value="">-- Select Sheet --</option>
                        {sheetsArray.map((sheet) => (
                          <option key={sheet} value={sheet}>
                            {sheet}
                          </option>
                  ))}
                </select>
              </div>
                  );
                })()}
                
                {(() => {
                  const headersArray = files[index]?.headers;
                  return headersArray && Array.isArray(headersArray) && headersArray.length > 0 && (
                    <div className="fields-list">
                      <h3>Available Fields:</h3>
                      <div className="fields-container">
                        {headersArray.map((header) => (
                          <div
                            key={`${files[index].id}-${header}`}
                            className="field-card"
                            draggable
                            onDragStart={(e) => handleDragStart(e, {
                              id: header,
                              name: header,
                              fileId: files[index].id,
                              originalIndex: files[index].headerOriginalOrder.indexOf(header)
                            })}
                          >
                            {header}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                
                {(() => {
                  const file0Headers = files[0]?.headers;
                  return index === 0 && file0Headers && Array.isArray(file0Headers) && file0Headers.length > 0 && (
                    <div className="mb-4" style={{ marginTop: '20px' }}>
                      <button
                        onClick={autoDetectAndSetupPivot}
                        className="button"
                        style={{
                          padding: '10px 16px',
                          backgroundColor: 'var(--accent-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
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
                        Auto-detect BOM and QTY
                      </button>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        ))}
      </div>
      
      <div className="pivot-builder">
        <h2>Pivot Table Builder</h2>
        
          <div className="pivot-areas">
          {Object.entries(dragAreas).map(([key, area]) => (
            <div 
              key={key}
              className={`drop-area ${key}-area`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, key as 'rows' | 'columns' | 'values')}
            >
              <h3>{area.title}</h3>
              <p>{area.description}</p>
              
              <div className="dropped-fields">
                {area.fields.map((field) => (
                  <div
                    key={`${field.fileId}-${field.id}`}
                    className="field-card"
                    draggable
                    onDragStart={(e) => handleDragStart(e, field)}
                  >
                    {field.name}
                  </div>
                ))}
              </div>
                  </div>
                ))}
          </div>

        <div className="action-buttons">
          <button 
            onClick={calculatePivotTable} 
            className="button build-table-button"
            style={{
              padding: '12px 20px',
              backgroundColor: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              maxWidth: '300px',
              margin: '20px auto 0',
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
            disabled={!dragAreas.columns.fields?.length || !dragAreas.values.fields?.length}
          >
            Build Pivot Table
          </button>
        </div>
      </div>

        <div className="pivot-preview">
        <h2>Pivot Table Preview</h2>
        
        {pivotTable && Array.isArray(pivotTable) && pivotTable.length > 0 ? (
          <>
          <div className="preview-container">
            <table>
              <thead>
                <tr>
                    {/* Row headers */}
                    {dragAreas.rows.fields.map((field) => (
                      <th key={`header-${field.id}`}>{field.name}</th>
                    ))}
                    
                    {/* Column headers from the column field's unique values */}
                    {(() => {
                      const columnsFields = dragAreas.columns.fields;
                      if (!columnsFields || columnsFields.length === 0) return null;
                      
                      const columnField = columnsFields[0];
                      const fileWithData = files.find(f => f?.id === columnField?.fileId);
                      const fileData = fileWithData?.data;
                      
                      if (!fileData || !Array.isArray(fileData)) return null;
                      
                      const uniqueValues = Array.from(
                        new Set(
                          fileData.map(row => row?.[columnField?.name])
                        ) || []
                      ).filter(Boolean);
                      
                      return uniqueValues.map((columnValue) => (
                        <th key={`column-${columnValue}`}>{columnValue}</th>
                      ));
                    })()}
                </tr>
              </thead>
              <tbody>
                  {pivotTable.slice(0, 10).map((row, rowIndex) => (
                    <tr key={`row-${rowIndex}`}>
                      {/* Row field values */}
                      {dragAreas.rows.fields.map((field) => (
                        <td key={`cell-${rowIndex}-${field.id}`}>{row[field.name]}</td>
                      ))}
                      
                      {/* Column values */}
                      {(() => {
                        const columnsFields = dragAreas.columns.fields;
                        if (!columnsFields || columnsFields.length === 0) return null;
                        
                        const columnField = columnsFields[0];
                        const fileWithData = files.find(f => f?.id === columnField?.fileId);
                        const fileData = fileWithData?.data;
                        
                        if (!fileData || !Array.isArray(fileData)) return null;
                        
                        const uniqueValues = Array.from(
                          new Set(
                            fileData.map(row => row?.[columnField?.name])
                          ) || []
                        ).filter(Boolean);
                        
                        return uniqueValues.map((columnValue) => (
                          <td key={`cell-${rowIndex}-${columnValue}`}>{row[String(columnValue)]}</td>
                        ));
                      })()}
                  </tr>
                ))}
              </tbody>
            </table>
              {pivotTable.length > 10 && (
                <p className="preview-note">Showing first 10 rows of {pivotTable.length} total rows</p>
              )}
          </div>
            
            <div className="download-container">
              <button
                onClick={downloadPivotTable}
                className="button download-button"
                style={{
                  padding: '12px 20px',
                  backgroundColor: 'var(--accent-green)',
                  color: 'black',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxWidth: '300px',
                  margin: '20px auto 0',
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
                Download Excel File
              </button>
        </div>
          </>
        ) : (
          <p>Drag fields to the areas above to create a pivot table</p>
      )}
      </div>
    </div>
  );
};

export default Pivot;