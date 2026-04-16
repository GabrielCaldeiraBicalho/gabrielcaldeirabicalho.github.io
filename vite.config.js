// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5180,
    hmr: false  // Desabilita WebSocket
  }
});