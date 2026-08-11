import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core/src'),
      '@main': resolve(__dirname, 'src/main')
    }
  },
  test: {
    environment: 'node',
    include: ['src/core/src/**/*.test.ts', 'src/main/**/*.test.ts'],
    testTimeout: 20000
  }
})
