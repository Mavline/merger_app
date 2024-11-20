import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ManagerView from './pages/ManagerView';
import { TableProvider } from './context/TableContext';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <TableProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/manager" element={<ManagerView />} />
        </Routes>
      </BrowserRouter>
    </TableProvider>
  </React.StrictMode>
);

reportWebVitals();
