<!-- 快速创建 -->
<template>
  <div class="quick-create">
    <div class="quick-create-title">
      <div class="quick-create-title-tab">
        <el-tabs v-model="state.activeName">
          <el-tab-pane label="按面创建点" name="1"></el-tab-pane>
          <el-tab-pane label="按点创建线" name="2"></el-tab-pane>
          <el-tab-pane label="按资产创建点" name="3"></el-tab-pane>
        </el-tabs>
      </div>
      <Icon src="Close" :size="14" @click="onClose"></Icon>
    </div>
    <div class="quick-create-content">
      <CreatePointByPolygon v-if="state.activeName === '1'"></CreatePointByPolygon>
      <CreateLineByPoint v-if="state.activeName === '2'"></CreateLineByPoint>
      <CreatePointByAssets v-if="state.activeName === '3'"></CreatePointByAssets>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive, onMounted } from "vue";
import CreatePointByPolygon from "./createPointByPolygon.vue";
import CreateLineByPoint from "./createLineByPoint.vue";
import CreatePointByAssets from "./createPointByAssets.vue";

const emits = defineEmits(["onClose"]);

// 关闭快速绘制
const onClose = () => {
  emits("onClose", 2);
};

const state = reactive({
  activeName: "1"
});

onMounted(() => {});
</script>

<style lang="scss" scoped>
.quick-create {
  display: flex;
  flex-direction: column;
  width: 1100px;
  height: 500px;
  overflow: auto;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
  .quick-create-title {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    height: 55px;
    padding: 0 20px;
    font-size: 16px;
    line-height: 55px;
    background-color: var(--el-color-primary-light-8);
    ::v-deep(.quick-create-title-tab) {
      .el-tabs {
        --el-tabs-header-height: 100%;
      }
      .el-tabs__item {
        font-size: 16px;
        font-weight: bold;
      }
    }
  }
  .quick-create-content {
    flex: 1;
    overflow: hidden;
  }
}
</style>
