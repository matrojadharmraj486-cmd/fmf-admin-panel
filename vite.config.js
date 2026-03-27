import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/FMF-Admin/',
  assetsInclude: ['**/*.xlsx'],
  server: {
    port: 5173,
    open: false
  }
})
