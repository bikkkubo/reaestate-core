export const GOOGLE_SHEETS_CONFIG = {
  SPREADSHEET_ID: process.env.GOOGLE_SHEET_ID || '',
  RANGE: 'A1:I1000', // Adjust range as needed
  BATCH_SIZE: 50, // For batch operations
};

export const API_ENDPOINTS = {
  DEALS: '/api/deals',
  SYNC: '/api/sync',
  METADATA: '/api/metadata',
} as const;

export const JAPANESE_DATE_FORMAT = 'yyyy年MM月dd日';

export const STORAGE_KEYS = {
  LAST_SYNC: 'lastSyncTime',
  OFFLINE_CHANGES: 'offlineChanges',
} as const;
