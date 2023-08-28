<template>
  <div class="quick-create-point">
    <div class="quick-create-point-mode">
      <span class="label-span">绘制模式</span>
      <el-select placeholder="请选择..." v-model="state.createPointType" clearable>
        <el-option label="按面绘制" value="polygon"></el-option>
        <el-option label="按资产绘制" value="assets"></el-option>
      </el-select>
    </div>
    <div class="quick-create-point-content">
      <CreatePointByPolygon v-if="state.createPointType == 'polygon'"></CreatePointByPolygon>
      <CreatePointByAssets v-if="state.createPointType == 'assets'"></CreatePointByAssets>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive, onMounted } from "vue";
import CreatePointByPolygon from "./createPointByPolygon.vue";
import CreatePointByAssets from "./createPointByAssets.vue";

const state = reactive({
  createPointType: "polygon"
});

onMounted(() => {});
</script>

<style lang="scss" scoped>
.quick-create-point {
  flex-direction: column;
  height: 100%;
}
.quick-create-point-mode {
  height: 70px;
  padding: 20px;
  border-bottom: #dadee5 solid 1px;
  .label-span {
    padding-right: 10px;
    color: #606266;
  }
}
.quick-create-point-content {
  flex: 1;
  height: calc(100% - 70px);
  overflow: hidden;
}
</style>
