import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente do diretório atual
  // O cast (process as any) é necessário se os tipos do node não estiverem sendo detectados corretamente pelo editor
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    plugins: [react()],
    base: './', // Garante caminhos relativos para assets no build de produção
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true, // Garante que a pasta dist seja limpa antes do build
    },
    server: {
      host: true // Expõe na rede local se necessário
    }
  };
});