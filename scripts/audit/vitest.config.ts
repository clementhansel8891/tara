import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Vitest configuration for audit scripts.
 * Uses Node environment since these are server-side utilities.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    root: path.resolve(__dirname, '../..'), // repo root so file paths resolve correctly
    include: [
      'scripts/audit/**/__tests__/**/*.{test,spec}.{ts,tsx}',
      'scripts/audit/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
    },
  },
});
