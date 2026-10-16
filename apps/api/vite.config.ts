import { defineConfig } from 'vite';
import path from 'path';
import { handleApiRequest } from './src/index';

const PORT = Number(process.env.PORT || process.env.API_PORT || 30015);

export default defineConfig({
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
  },
  plugins: [
    {
      name: 'workshopsync-api-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          handleApiRequest(req, res, next);
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use((req, res, next) => {
          handleApiRequest(req, res, next);
        });
      }
    }
  ]
});
