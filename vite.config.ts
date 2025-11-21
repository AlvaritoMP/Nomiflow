import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      host: true // Permite acceso externo (0.0.0.0)
    },
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill para evitar errores si alguna librería accede a process.env
      'process.env': JSON.stringify(env)
    }
  };
});