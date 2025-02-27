<template>
  <div class="play-container">
    <AgMap :config="config"></AgMap>
  </div>
</template>

<script setup>
import { ref } from "vue";

const config = ref({});
</script>

<style lang="scss">
html,
body {
  width: 100vw;
  height: 100vh;
  margin: 0;
  #play {
    width: 100%;
    height: 100%;
    .play-container {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }
  }
}
</style>
