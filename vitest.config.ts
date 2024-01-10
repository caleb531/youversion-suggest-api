import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    reporters: ['basic'],
    environment: 'node',
    coverage: {
      reporter: ['text', 'lcov', 'html', 'text-summary']
    }
  }
});
