import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const PORT = Number(process.env.PORT || process.env.VITE_PORT || process.env.VITE_ADMIN_PORT || 30017);
const API_PORT = Number(process.env.TARGET_API_PORT || (process.env.API_PORT && Number(process.env.API_PORT) !== PORT ? process.env.API_PORT : null) || 30015);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@workshopsync/shared': path.resolve(__dirname, '../../packages/shared/src')
    }
  },
  server: {
    port: PORT,
    host: '0.0.0.0',
    strictPort: false,
    cors: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: true
      }
    }
  },
  preview: {
    port: PORT,
    host: '0.0.0.0',
    strictPort: false,
    cors: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: true
      }
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*'
    }
  }
});
