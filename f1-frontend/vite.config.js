import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ✅ Force la valeur au moment du build, indépendamment des fichiers .env
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('https://f1analytics.hostless.app')
  },
})