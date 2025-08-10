import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    VitePWA({
      // You already have a manifest file; keep it as source of truth:
      manifest: false,
      registerType: 'autoUpdate', // SW checks for updates in the background
      includeAssets: [
        'manifest.webmanifest',
        'icons/apple-icon-180.png',
        'icons/favicon-196.png',
        // any additional static assets you want copied from /public
      ],
      workbox: {
        // Precache your built assets + HTML
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        globIgnores: ['**/icons/apple-splash-*.png'],
        // Optional: add runtime caching rules (CDN fonts, APIs, etc.)
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(gstatic|googleapis)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts' },
          },
          // Add your API endpoint pattern here if you want offline/fast caching
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
