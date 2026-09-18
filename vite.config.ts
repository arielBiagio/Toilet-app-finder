import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  },
  plugins: [
    react(),
    ...VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Baño Radar DC',
        short_name: 'Baño Radar',
        description: 'Encuentra baños públicos revisados en National Mall y downtown Washington, DC.',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        background_color: '#080d18',
        theme_color: '#080d18',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        runtimeCaching: [],
      },
    }),
  ],
})
