import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // For local network sharing
    port: 5173,
    allowedHosts: [
      'a7d22391-4deb-4de2-9130-b7e0acf0d394-00-30t0nogvt78vz.picard.replit.dev'
    ]
  },
})