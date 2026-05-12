
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env.GEMINI_API_KEY': JSON.stringify('AIzaSy...COLE_SUA_CHAVE_AQUI'),
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify('AIzaSy...COLE_SUA_CHAVE_AQUI'),
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
