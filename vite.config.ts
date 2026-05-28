import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env variables if needed
  // const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react(), tailwindcss()],
    // Base path for GitHub Pages in production, root in development
    base: mode === 'production' ? '/ordedrink/' : '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: 3000,
      open: true,
    },
  };
});
