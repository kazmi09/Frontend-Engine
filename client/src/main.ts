import { createApp } from 'vue'
import { Quasar, Notify, Dialog, Loading } from 'quasar'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { createPinia } from 'pinia'
import router from './router'

// Import icon libraries
import '@quasar/extras/material-icons/material-icons.css'

// Import Quasar css
import 'quasar/src/css/index.sass'

// Import Tailwind CSS
import './index.css'

import App from './App.vue'
import { queryClient } from './lib/queryClient'
import { useCustomizationStore } from './stores/customization'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Quasar, {
  plugins: {
    Notify,
    Dialog,
    Loading
  }
})
app.use(VueQueryPlugin, { queryClient })

// Initialize customization store
const customizationStore = useCustomizationStore()
customizationStore.initialize()

app.mount('#app')