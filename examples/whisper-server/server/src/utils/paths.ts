import * as path from 'path';

// Server root is 2 levels up from utils/paths.ts
export const SERVER_ROOT = path.join(__dirname, '..', '..');

// Common paths relative to server root
export const PATHS = {
  uploads: path.join(SERVER_ROOT, 'uploads'),
  models: path.join(SERVER_ROOT, 'models'),
} as const;

// Helper to get full path for a file in a specific directory
export const getPath = (directory: keyof typeof PATHS, file?: string) => {
  const basePath = PATHS[directory];
  return file ? path.join(basePath, file) : basePath;
};