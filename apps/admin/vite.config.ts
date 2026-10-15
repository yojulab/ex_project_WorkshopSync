import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@workshopsync/shared': path.resolve(__dirname, '../../packages/shared/src')
    }
  },
  server: {
    port: 30017,
    host: '0.0.0.0',
    strictPort: true
  },
  preview: {
    port: 30017,
    host: '0.0.0.0',
    strictPort: true
  }
});
