import Base from './base/index';
import App from './App.vue'

const app = Base.createApp({
  app: App
})

app.mount('#app').$nextTick(() => postMessage({ payload: 'removeLoading' }, '*'))
