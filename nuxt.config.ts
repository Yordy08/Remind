export default defineNuxtConfig({
  css: [
    'bootstrap/dist/css/bootstrap.min.css'
  ],

  app: {
    head: {
      title: 'Remind',
      meta: [
        { name: 'description', content: 'Almacenamiento privado de fotos, álbumes y notificaciones administrativas' },
        { name: 'theme-color', content: '#0d6efd' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'Remind' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/svg+xml', href: '/app-icon.svg' },
        { rel: 'apple-touch-icon', href: '/app-icon.svg' }
      ]
    }
  },

  compatibilityDate: '2026-04-24',
  devtools: { enabled: false }
})
