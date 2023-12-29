<template>
  <div class="collapsed-box" @click="changeCollapse">
    <el-icon class="collapse-icon">
      <component :is="globalStore.isCollapse ? 'arrowRight' : 'arrowLeft'"></component>
    </el-icon>
  </div>
</template>

<script setup lang="ts">
import { useGlobalStore } from "@/stores/modules/global";

const globalStore = useGlobalStore();
const changeCollapse = () => globalStore.setGlobalState("isCollapse", !globalStore.isCollapse);
</script>

<style scoped lang="scss">
.collapsed-box {
  position: absolute;
  z-index: 101;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background-color: #ffffff;
  border-radius: 40px;
  box-shadow: 0 2px 8px -2px rgb(0 0 0 / 35%), 0 1px 4px -1px rgb(25 15 15 / 35%), 0 0 1px 0 rgb(0 0 0 / 35%);
  transition: transform 0.3s;
  inset-block-start: 25px;
  inset-inline-end: -13px;
  .collapse-icon {
    font-size: 14px;
    cursor: pointer;
  }
}
</style>
