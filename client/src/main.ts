import { createApp } from 'vue'
import { Quasar, Notify } from 'quasar'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'

// Import Quasar css
import 'quasar/src/css/index.sass'

// Import Tailwind CSS
import './index.css'

import App from './App.vue'
import { queryClient } from './lib/queryClient'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(Quasar, {
  plugins: {
    Notify
  }
})
app.use(VueQueryPlugin, { queryClient })

app.mount('#app')