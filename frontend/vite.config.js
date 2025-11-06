import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build configuration for production (Vercel)
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@heroicons/react', 'react-hot-toast']
        }
      }
    }
  },
  
  // Development server
  server: {
    port: 5173,
    host: true,
    strictPort: false
  },
  
  // Preview server
  preview: {
    port: 4173,
    host: true
  }
})
