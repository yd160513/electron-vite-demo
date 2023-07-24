<script setup lang="ts">
import { createIrregularWindow } from './../irregularWindow/render2main';

</script>

<template>
  <div class="create-irregular-window" @click="createIrregularWindow">创建不规则窗口</div>
</template>

<style lang="scss" scoped>
.create-irregular-window {
  cursor: pointer;
}
</style>