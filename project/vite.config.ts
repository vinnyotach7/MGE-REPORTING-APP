import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  root: '/home/project',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: '/home/project/index.html',
      },
    },
  },
});