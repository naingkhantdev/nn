import { defineConfig } from 'vitest/config';

// Own config so vitest does not pick up the app's ../vite.config.ts.
export default defineConfig({
  test: {
    root: __dirname,
    include: ['test/**/*.test.ts'],
    environment: 'node',
  },
});
