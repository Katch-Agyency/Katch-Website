import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'firebase-firestore',
              test: /node_modules[\\/]@firebase[\\/]firestore/,
              priority: 40,
            },
            {
              name: 'firebase-auth',
              test: /node_modules[\\/]@firebase[\\/]auth/,
              priority: 40,
            },
            {
              name: 'firebase-core',
              test: /node_modules[\\/](@firebase|firebase)[\\/]/,
              priority: 20,
            },
          ],
        },
      },
    },
  },
});
