import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.VITE_PROXY_TARGET || 'https://165.227.85.96'

  return {
    plugins: [react()],
    server: {
      // En dev, le navigateur appelle /api sur localhost et Vite relaie vers le
      // backend. `secure: false` accepte le certificat auto-signé du serveur.
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
