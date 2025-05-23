// Google Sheets API integration utilities
export interface SheetsConfig {
  spreadsheetId: string;
  range: string;
  serviceAccountEmail: string;
  privateKey: string;
}

export interface SheetRow {
  id?: string;
  title: string;
  client?: string;
  priority: string;
  phase: string;
  dueDate: string;
  notes?: string;
  createdAt?: string;
}

// These functions will be used by the backend API routes
export const SHEET_HEADERS = [
  'ID',
  'Title', 
  'Client',
  'Priority',
  'Phase', 
  'DueDate',
  'Notes',
  'CreatedAt',
  'UpdatedAt'
];

export const BATCH_UPDATE_LIMIT = 100; // Google Sheets API limit
export const API_CALLS_PER_MINUTE = 60; // Rate limit
