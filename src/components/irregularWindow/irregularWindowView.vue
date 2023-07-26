<script setup lang="ts">
import { onMounted } from 'vue';
import { eventPenetration } from './render2main';

onMounted(() => {
  eventPenetration()
})

</script>

<template>
  <div class="irregular-window">
    不规则窗口内容
    
  </div>
</template>

<style lang="scss" scoped>
.irregular-window {}
</style>