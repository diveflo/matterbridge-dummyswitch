// vite.config.ts

// This Vitest configuration is designed for a TypeScript project.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['vitest/**/*.{spec,test}.{ts,mts,cts}'],
    exclude: ['dist', 'node_modules'],
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    environment: 'node',
    maxWorkers: 100,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/module.ts'],
      exclude: ['src/**/*.test.{ts,tsx,js,jsx}', 'src/**/*.spec.{ts,tsx,js,jsx}', 'src/**/*.d.ts'],
      thresholds: {
        statements: 90,
        branches: 85,
        functions: 90,
        lines: 90,
      },
    },
  },
});
