import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// __dirname is not available in ES modules natively, so we must define it
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      reporter: ['text', 'lcov', 'html', 'text-summary']
    },
    alias: {
      // htmlrewriter: path.resolve(__dirname, 'node_modules/htmlrewriter/node.mjs')
    }
  }
});
