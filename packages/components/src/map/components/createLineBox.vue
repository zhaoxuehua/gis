<template>
  <div class="quick-create-point">
    <div class="quick-create-point-mode">
      <span class="label-span">绘制模式</span>
      <el-select placeholder="请选择..." v-model="state.createLineType" clearable>
        <el-option label="多点连接绘制" value="multiplePoint"></el-option>
      </el-select>
    </div>
    <div class="quick-create-point-content">
      <CreateLineByPoint v-if="state.createLineType == 'multiplePoint'"></CreateLineByPoint>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive, onMounted } from "vue";
import CreateLineByPoint from "./createLineByPoint.vue";

const state = reactive({
  createLineType: "multiplePoint"
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
