import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

export default defineConfig(async () => {
  // PWA: solo en producción
  const pwaPlugin = isProduction
    ? [(await import('vite-plugin-pwa')).VitePWA({
        registerType: 'prompt',
        includeAssets: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        manifest: { name: 'Simulador Laboral 3D', short_name: 'Simulador', theme_color: '#1B2632', background_color: '#0a1628', display: 'standalone', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }] },
        workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'], cleanupOutdatedCaches: true, navigateFallback: '/index.html', navigateFallbackDenylist: [/\/api\//], runtimeCaching: [] },
      })]
    : [];

  return {
    envPrefix: ['VITE_', 'SUPABASE_'],
    plugins: [
      react(),
      tailwindcss(),
      // Backend middleware: solo en desarrollo local
      !isProduction && {
        name: 'express-api',
        configureServer(server: any) {
          server.middlewares.use(async (req: any, res: any, next: any) => {
            if (req.url?.startsWith('/api') || req.url?.startsWith('/webhooks')) {
              try {
                const mod = await import('../backend/src/server.ts');
                mod.app(req, res, next);
              } catch(e) { console.error('[api] Backend no disponible'); next(); }
            } else next();
          });
        }
      },
      ...pwaPlugin,
    ].filter(Boolean),
    resolve: { alias: { '@': path.resolve(__dirname, '.') } },
    server: { hmr: process.env.DISABLE_HMR !== 'true', watch: process.env.DISABLE_HMR === 'true' ? null : {} },
  };
});
