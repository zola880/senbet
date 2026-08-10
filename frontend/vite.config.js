import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),

    // Progressive Web App - offline support + installable
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Meskel Birhan Sunday School',
        short_name: 'Meskel Birhan',
        description: 'Church School Management System',
        theme_color: '#6d1a28',
        background_color: '#f3f0ea',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.vercel\.app\/api\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),

    // Bundle analyzer - only runs when ANALYZE=true
    process.env.ANALYZE === 'true' &&
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),

  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 250,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const parts = id.toString().split('node_modules/');
            const packageName = parts[1]?.split('/')[0] || 'vendor';

            // Split React into its own chunk
            if (packageName.startsWith('react') || packageName === 'react-dom') {
              return 'vendor-react';
            }

            // Split router into its own chunk
            if (packageName === 'react-router-dom') {
              return 'vendor-router';
            }

            // Split icons into their own chunk
            if (packageName === 'react-icons') {
              return 'vendor-icons';
            }

            // Everything else goes to vendor
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