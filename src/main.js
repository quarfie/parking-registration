import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Registers the SW and keeps it updated
import { registerSW } from 'virtual:pwa-register'
registerSW({ immediate: true })

// Importing the runtime logger for development mode
// This will only be included in development builds
// and will help catch runtime errors in the console.
if (import.meta.env.DEV) {
  import('./dev/runtime-logger.js')
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
