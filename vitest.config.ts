import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Applied to process.env before any module in the test process loads.
    // This is the primary mechanism; tests/setup.ts is a second line of defence.
    env: {
      DATABASE_PATH: ':memory:',
    },
    setupFiles: ['./tests/setup.ts'],
    // better-sqlite3 is a native module; forked processes are the safest pool for it.
    pool: 'forks',
  },
});