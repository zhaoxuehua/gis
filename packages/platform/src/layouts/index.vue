<!-- 💥 这里是一次性加载 LayoutComponents -->
<template>
  <component :is="LayoutClassic" />
  <ThemeDrawer v-if="!isSubApp" />
</template>

<script setup lang="ts" name="layout">
import { inject } from "vue";

import ThemeDrawer from "./components/ThemeDrawer/index.vue";
import LayoutClassic from "./LayoutClassic/index.vue";

const isSubApp = inject("isSubApp");
</script>

<style scoped lang="scss">
.layout {
  min-width: 730px;
}
</style>
