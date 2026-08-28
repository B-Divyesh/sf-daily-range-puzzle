import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: { target: 'es2022', sourcemap: true },
  server: { host: '127.0.0.1' },
  test: { exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'] },
});
