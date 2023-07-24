import Base from './base/index';
import irregularWindowView from './components/irregularWindow/irregularWindowView.vue';

const app = Base.createApp({
  app: irregularWindowView
})

app.mount('#app').$nextTick(() => postMessage({ payload: 'removeLoading' }, '*'))
