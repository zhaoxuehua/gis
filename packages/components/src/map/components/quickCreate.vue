<!-- 快速创建 -->
<template>
  <div class="quick-create">
    <div class="quick-create-title">
      <div class="quick-create-title-tab">
        <el-tabs v-model="state.activeName">
          <el-tab-pane label="创建点" name="1"></el-tab-pane>
          <el-tab-pane label="创建线" name="2"></el-tab-pane>
          <el-tab-pane label="创建面" name="3"></el-tab-pane>
        </el-tabs>
      </div>
      <Icon src="Close" :size="14" @click="onClose" class="icon"></Icon>
    </div>
    <div class="quick-create-content">
      <CreatePointBox v-if="state.activeName === '1'"></CreatePointBox>
      <CreateLineBox v-if="state.activeName === '2'"></CreateLineBox>
      <CreatePolygon v-if="state.activeName === '3'"></CreatePolygon>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive, onMounted } from "vue";
import CreatePointBox from "./createPointBox.vue";
import CreateLineBox from "./createLineBox.vue";
import CreatePolygon from "./createPolygon.vue";

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
    height: 60px;
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
      }
    }
    .icon {
      cursor: pointer;
    }
  }
  .quick-create-content {
    flex: 1;
    overflow: hidden;
  }
}
</style>
