import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import environment from 'vite-plugin-environment';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '../../.env' });

export default defineConfig({
  plugins: [
    react(),
    environment("all", { prefix: "CANISTER_" }),
    environment("all", { prefix: "DFX_" }),
  ],
  build: {
    emptyOutDir: true,
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: [
      {
        find: "@backend",
        replacement: path.resolve(__dirname, "../declarations/ethixia-mistral-chatbox-backend")
      }
    ],
    dedupe: ['@dfinity/agent']
  },
  define: {
    'process.env': {}
  }
});
