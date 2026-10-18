import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:3000' },
    fs: { deny: ['.auth-data', '**/.auth-data/**', '**/.env', '**/.env.*', '**/*.pem', '**/*.crt', '**/.git/**'] }
  },
  build: {
    outDir: 'dist'
  }
});
