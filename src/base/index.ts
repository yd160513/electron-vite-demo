import { createApp } from 'vue';
import app from './app'
import './../assets/icon/iconfont.css'
import './../style.css'

export default {
  createApp(options) {
    const ins = createApp(options.app || app)

    return ins
  }
}