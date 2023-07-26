import Base from './base/index';
import IrregularWindowView from './components/irregularWindow/irregularWindowView.vue';

const app = Base.createApp({
  app: IrregularWindowView
})

app.mount('#app').$nextTick(() => postMessage({ payload: 'removeLoading' }, '*'))
