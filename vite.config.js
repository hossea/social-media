import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/v1': {
        target: 'http://cloud.appwrite.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/v1/, '')
      }
    }
  }
});
