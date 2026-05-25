import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vitest/config';

const assetRegistryPlugin = () => ({
  name: 'asset-registry-persistence',
  configureServer(server: any) {
    server.middlewares.use((req: any, res: any, next: any) => {
      if (req.url === '/api/save-registry' && req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const targetPath = path.resolve(__dirname, 'docs/sprite-mappings.json');
            fs.writeFileSync(targetPath, JSON.stringify(data, null, 2));
            res.statusCode = 200;
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
          }
        });
      } else {
        next();
      }
    });
  }
});

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), assetRegistryPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
    },
    server: {
      allowedHosts: true as true,
      headers: process.env.PLAYWRIGHT
        ? {}
        : {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
          },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './vitest.setup.ts',
      exclude: ['tests/e2e/**', 'node_modules', 'dist'],
      coverage: {
        provider: 'v8',
        include: [
          'src/engine/simulation.ts',
          'src/engine/ecs.ts',
          'src/engine/gods_data.ts',
          'src/engine/audio.ts',
          'src/engine/fractal.ts',
          'src/engine/shaders.ts'
        ]
      }
    },
  };
});
