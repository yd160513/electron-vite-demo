<script setup lang="ts">

</script>

<template>
  <div class="irregular-window">
    不规则窗口内容
  </div>
</template>

<style lang="scss" scoped>
.irregular-window {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 380px;
  height: 380px;
  border-radius: 50%;
  border: 1px solid green;
  pointer-events: auto;
  -webkit-app-region: drag;
}
</style>