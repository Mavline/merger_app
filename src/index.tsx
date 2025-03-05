import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import Router from './Router';
import reportWebVitals from './reportWebVitals';
import { TableProvider } from './context/TableContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <TableProvider>
      <Router />
    </TableProvider>
  </React.StrictMode>
);

reportWebVitals();
