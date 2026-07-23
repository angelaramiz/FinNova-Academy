import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // En producción (Render), el backend se despliega como servicio separado
  const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RENDER;

  return {
    envPrefix: ['VITE_', 'SUPABASE_'],
    plugins: [
      react(), 
      tailwindcss(),
      ...(!isProduction ? [(() => {
    const backendPath = '../backend/src/server.ts';
    return {
      name: 'express-api-plugin',
      async configureServer(server) {
        try {
          const mod = await import(backendPath);
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
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
