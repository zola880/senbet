import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 250,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const parts = id.toString().split('node_modules/');
            const packageName = parts[1]?.split('/')[0] || 'vendor';

            if (packageName.startsWith('react') || packageName === 'react-dom') {
              return 'vendor-react';
            }
            if (packageName === 'react-router-dom') {
              return 'vendor-router';
            }
            if (packageName === 'react-icons') {
              return 'vendor-icons';
            }
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});