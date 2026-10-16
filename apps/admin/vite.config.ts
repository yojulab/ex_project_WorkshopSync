import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const PORT = Number(process.env.PORT || process.env.VITE_PORT || process.env.VITE_ADMIN_PORT || 30017);

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
    allowedHosts: true
  },
  preview: {
    port: PORT,
    host: '0.0.0.0',
    strictPort: false,
    cors: true,
    allowedHosts: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': '*',
      'Access-Control-Allow-Headers': '*'
    }
  }
});
