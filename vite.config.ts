import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // The archive is deployed from the domain root (including on Vercel).
  base: '/',
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
})
