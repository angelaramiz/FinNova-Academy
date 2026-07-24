import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

  return {
    envPrefix: ['VITE_', 'SUPABASE_'],
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        manifest: {
          name: 'Simulador Laboral 3D',
          short_name: 'Simulador',
          description: 'Simulador de experiencia laboral contable en 3D',
          theme_color: '#1B2632',
          background_color: '#0a1628',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          cleanupOutdatedCaches: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/\/api\//],
          runtimeCaching: [],
        },
      }),
      ...(!isProduction ? [(() => {
        return {
          name: 'express-api-plugin',
          async configureServer(server) {
            try {
              const seg1 = '..', seg2 = 'backend', seg3 = 'src', seg4 = 'server.ts';
              const mod = await import(`${seg1}/${seg2}/${seg3}/${seg4}`);
              server.middlewares.use((req, res, next) => {
                if (req.url?.startsWith('/api') || req.url?.startsWith('/webhooks')) {
                  mod.app(req, res, next);
                } else next();
              });
            } catch { /* backend no disponible */ }
          }
        };
      })()] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
