import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@ir': '/src/ir',
      '@compiler': '/src/compiler',
      '@shared': '/src/shared',
    },
  },
});
