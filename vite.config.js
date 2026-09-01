import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The Firebase Auth + Firestore SDK is a legitimately large vendor
    // chunk (~536kB minified, ~158kB gzipped — gzip is what actually
    // ships over the wire). It's already isolated into its own chunk
    // below so it doesn't bloat app code, so raise the warning threshold
    // to match reality instead of chasing it with risky code-splitting.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('firebase')) return 'firebase'
            if (id.includes('react-router')) return 'router'
            if (id.includes('react-dom') || id.includes('/react/')) return 'react'
          }
        },
      },
    },
  },
})
