import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

const rootDirectory = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(rootDirectory, 'src') } },
  test: {
    include: ['./tests/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    pool: 'threads',
    maxWorkers: 1,
    setupFiles: ['./tests/setup.ts'],
    css: true,
    coverage: { reporter: ['text', 'html'] },
  },
})
