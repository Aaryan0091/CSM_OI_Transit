import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@vercel/analytics') || id.includes('@vercel/speed-insights')) {
            return 'observability'
          }

          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
            return 'react'
          }

          if (id.includes('/@firebase/firestore/') || id.includes('/firebase/firestore/')) {
            return 'firebase-firestore'
          }

          if (id.includes('/@firebase/auth/') || id.includes('/firebase/auth/')) {
            return 'firebase-auth'
          }

          if (id.includes('/@firebase/app-check/') || id.includes('/firebase/app-check/')) {
            return 'firebase-app-check'
          }

          if (id.includes('/@firebase/') || id.includes('/firebase/')) {
            return 'firebase-core'
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    exclude: ['tests/firestore.rules.test.ts', '**/node_modules/**', '**/.git/**'],
    globals: true,
  },
})
