# Excel Table Merging Workflow

## What this project demonstrates

This project demonstrates a React-based workflow for merging Excel tables into a cleaner combined dataset. It focuses on spreadsheet preparation, sheet selection, field selection, workbook structure handling, preview, and export.

The project is useful as proof of work for data preparation tools, spreadsheet automation, reporting support, and internal business software where teams need repeatable handling of Excel inputs.

## Use case

A team receives related Excel files or tables and needs to combine selected columns into one reviewable dataset. The workflow helps users load files, select sheets, choose fields, inspect previews, and export merged results for reporting or downstream processing.

## Features

- Upload Excel workbooks.
- Select sheets from uploaded files.
- Select fields to include in the output.
- Preserve and inspect useful workbook structure where available.
- Preview merged data in the browser.
- Export merged results.
- Keep the workflow client-side for fast prototyping.

## Technical stack

- Frontend: React and TypeScript.
- Spreadsheet parsing and output: xlsx and ExcelJS.
- Workbook structure handling: JSZip, fast-xml-parser, xml2js.
- File export: file-saver.
- UI dependencies: Radix primitives, lucide-react, local CSS/Tailwind utilities.
- Build tooling: react-app-rewired and Create React App tooling.

## Architecture

The application accepts Excel files in the browser, extracts sheets and fields, stores selected file/table state in React context, builds a merged preview, and exports the final dataset. The project shows how a spreadsheet-heavy manual process can be turned into a repeatable browser workflow.

## How to run locally

Prerequisites:

- Node.js.
- npm.

Commands:

```bash
npm install
npm start
```

Build:

```bash
npm run build
```

## Portfolio notes

This repository is a portfolio/proof-of-work project. It does not include private client data, production credentials, internal datasets, or confidential business logic.

Related acty.dev proof page: `/examples/excel-table-merging/`.
