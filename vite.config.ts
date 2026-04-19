import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'BIMEP 2026',
        short_name: 'BIMEP',
        description: 'BIMEP 2026 — karta punktova i automatsko bilježenje posjeta.',
        theme_color: '#0f1115',
        background_color: '#0f1115',
        display: 'standalone',
        lang: 'hr',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.host === 'tiles.openfreemap.org',
            handler: 'CacheFirst',
            options: {
              cacheName: 'ofm-tiles',
              expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) =>
              /\.(?:png|jpg|jpeg|svg|webp|pbf|json)$/.test(url.pathname) &&
              url.host !== self.location.host,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'map-assets',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
});
