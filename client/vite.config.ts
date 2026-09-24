import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'https://prestock-ai.onrender.com' } },
  define: { global: 'globalThis' },
  build: { chunkSizeWarningLimit: 1500 },
});
