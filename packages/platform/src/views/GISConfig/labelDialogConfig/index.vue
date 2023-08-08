<template>
  <div class="label-dialog">
    <TreeFilter class="tree-filter-select" label="name" title="" :data="treeFilterData" @change="changeTreeFilter" />
    <div class="card table-main">
      <el-row class="flx-align-center">
        <el-col :span="2">标题名称</el-col>
        <el-col :span="10">
          <el-input v-model="params.title"></el-input>
        </el-col>
      </el-row>
      <p class="title title-box">属性配置</p>
      <AttrConfig v-model:static="params.static" v-model:monitor="params.monitor" ref="attrConfigRef" />
      <div class="flx-justify-between title-box">
        <p class="title">链接配置</p>
        <el-button type="primary" @click="onLinkAdd">添加</el-button>
      </div>
      <linkConfig v-model:link="params.link" ref="linkConfigRef" />
      <el-row class="flx-align-center title-box">
        <el-col :span="2">是否启用</el-col>
        <el-col :span="10">
          <el-checkbox v-model="params.status"></el-checkbox>
        </el-col>
      </el-row>
    </div>
  </div>
</template>
<script setup lang="ts" name="labelDialog">
import { ref } from "vue";
import TreeFilter from "@/components/TreeFilter/index.vue";
import AttrConfig from "./components/attrConfig.vue";
import linkConfig from "./components/linkConfig.vue";
import { TreeData } from "./components/mock";

const treeFilterData = ref(TreeData);
const changeTreeFilter = (id: number) => {
  getDetail(id);
};

const initParams: any = {
  title: "",
  status: true,
  static: [],
  monitor: []
};
const params = ref({
  ...initParams
});
const attrConfigRef = ref();
const getDetail = (id: number) => {
  params.value = {
    title: `测试名称${id}`,
    status: true,
    static: [],
    monitor: [
      {
        attributeName: "船长",
        attributeTypeName: "浮点",
        isJSONBody: false
      },
      {
        attributeName: "船长",
        attributeTypeName: "浮点",
        isJSONBody: true
      }
    ],
    link: []
  };
  attrConfigRef.value.handleTabChange("static");
};

const linkConfigRef = ref();
const onLinkAdd = () => {
  linkConfigRef.value.onOpen();
};
</script>
<style lang="scss" scoped>
.label-dialog {
  display: flex;
  height: 100%;
  overflow: hidden;
  .title-box {
    margin: 10px 0;
  }
  .title {
    font-size: 14px;
    font-weight: bold;
  }
}
</style>
