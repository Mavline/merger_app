import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { TableProvider } from './context/TableContext';

test('renders merger heading', () => {
  render(
    <TableProvider>
      <App />
    </TableProvider>
  );
  expect(
    screen.getByRole('heading', {
      name: 'EXCEL TABLES FUSION - SPREADSHEETS HORIZONTAL MERGER',
    })
  ).toBeInTheDocument();
});
