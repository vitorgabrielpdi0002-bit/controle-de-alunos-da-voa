import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0', // Permite acesso via rede local (Wi-Fi) por qualquer celular ou computador
    port: 5173
  }
});
