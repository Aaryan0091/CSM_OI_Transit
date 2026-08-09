import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    exclude: ['tests/firestore.rules.test.ts', '**/node_modules/**', '**/.git/**'],
    globals: true,
  },
})
