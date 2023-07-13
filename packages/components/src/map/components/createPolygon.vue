<template>
  <div class="quick-create-point">
    <div class="quick-create-point-mode">
      <span class="label-span">创建模式</span>
      <el-select placeholder="请选择..." v-model="state.createPolygonType" clearable>
        <el-option label="线缓冲" value="2"></el-option>
      </el-select>
      <span class="label-span distance">缓冲距离（米）</span>
      <el-input type="number" v-model="state.bufferDistance" style="width: 200px" />
    </div>
    <div class="quick-create-point-content">
      <CreatePolygonByLine
        v-if="state.createPolygonType == '2'"
        :type="state.createPolygonType"
        :distance="state.bufferDistance"
      ></CreatePolygonByLine>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { reactive, onMounted } from "vue";
import CreatePolygonByLine from "./createPolygonByLine.vue";

const state: {
  bufferDistance: any;
  createPolygonType: any;
} = reactive({
  createPolygonType: "2",
  bufferDistance: undefined
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
  .distance {
    padding-left: 50px;
  }
}
.quick-create-point-content {
  flex: 1;
  height: calc(100% - 70px);
  overflow: hidden;
}
</style>
