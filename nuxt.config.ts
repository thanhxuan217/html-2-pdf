export default defineNuxtConfig({
 devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt'
  ],
  css: [
    '~/assets/css/main.css'
  ],
  typescript: {
    typeCheck: true,
    strict: true
  },
  runtimeConfig: {
    public: {
      apiBase: '/api'
    }
  },
  nitro: {
    experimental: {
      wasm: true
    }
  },
  app: {
    head: {
      title: 'URL Tree Manager',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Manage and organize URLs in a tree structure' }
      ]
    }
  }
})
