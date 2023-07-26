<script setup lang="ts">
import { ref } from 'vue';
import { close, maximize, unmaximize, minimize, outherMaximizeListener, outherUnmaximizeListener } from './render2main';

const isMaxSize = ref(false)

const minimizeHandle = () => {
  minimize()
}

const unmaximizeHandle = () => {
  isMaxSize.value = false
  unmaximize()
}

const maximizeHandle = () => {
  isMaxSize.value = true
  maximize()
}

const closeHandle = () => {
  close()
}

outherMaximizeListener(() => {
  isMaxSize.value = true
})

outherUnmaximizeListener(() => {
  isMaxSize.value = false
})
</script>

<template>
  <div class="title-bar">
    <div class="title">
      <div class="log">
        <img src="./../../assets/vue.svg" alt="" srcset="">
      </div>
      <div class="txt">窗口标题</div>
    </div>
    <div class="window-tool">
      <div @click="minimizeHandle" class="minimize iconfont icon-minus2"></div>
      <div @click="unmaximizeHandle" v-if="isMaxSize" class="restore iconfont icon-window-restore1"></div>
      <div @click="maximizeHandle" v-else class="maximize iconfont icon-window-maximize1"></div>
      <div @click="closeHandle" class="close iconfont icon-window_close"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title-bar {
  display: flex;
  height: 38px;
  line-height: 38px;
  background-color: #fff1f0;

  .title {
    flex: 1;
    display: flex;
    -webkit-app-region: drag;

    .logo {
      padding-left: 8px;
      padding-right: 6px;

      img {
        width: 20px;
        height: 20px;
        margin-top: 7px;
      }

      .txt {
        text-align: left;
        flex: 1;
      }
    }
  }

  .window-tool {
    div {
      color: #888;
      height: 100%;
      width: 38px;
      display: inline-block;
      cursor: pointer;

      i {
        font-size: 12px;

        &:hover {
          background-color: #ffccc7;
        }
      }
    }

    .close:hover {
      color: #fff;
      background-color: #ff4d4f;
    }
  }

  .content {
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
  }
}</style>