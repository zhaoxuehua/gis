<template>
  <div class="label-dialog">
    <TreeFilter
      class="tree-filter-select"
      label="name"
      title=""
      :data="treeFilterData"
      :defaultValue="treeDefaultValue"
      @change="changeTreeFilter"
    />
    <div class="card table-main">
      <div class="flx-align-center">
        <span>标题名称</span>
        <el-input v-model="params.label"></el-input>
        <el-button type="primary" @click="editTitle">保存</el-button>
      </div>
      <p class="title title-box">属性配置</p>
      <AttrConfig
        v-model:static="params.staticAttribute"
        v-model:monitor="params.monitorAttribute"
        ref="attrConfigRef"
        :equipTypeId="equipTypeId"
        :visitObjectTypeId="visitObjectTypeId"
        :currentType="currentType"
      />
      <div class="flx-justify-between title-box">
        <p class="title">链接配置</p>
        <el-button type="primary" @click="onLinkAdd">添加</el-button>
      </div>
      <linkConfig v-model:link="params.linkConfig" ref="linkConfigRef" :equipTypeId="equipTypeId" :currentType="currentType" />
    </div>
  </div>
</template>
<script setup lang="ts" name="labelDialog">
import { ref, onMounted } from "vue";
import TreeFilter from "@/components/TreeFilter/index.vue";
import AttrConfig from "./components/attrConfig.vue";
import linkConfig from "./components/linkConfig.vue";
import { equipTypeTreeApi, labelDetailAttr, updateLabel } from "../../../api/modules/labelDialogConfig";
import { ElMessage } from "element-plus";

const treeFilterData = ref();
const treeDefaultValue = ref();
const equipTypeId = ref();
const visitObjectTypeId = ref();
const currentType = ref(); // 设备类别 EquipCategory  设备类型 EquipType  外部设备类型 VisitObjectType
const changeTreeFilter = (id: number, data: any) => {
  if (!id || data.currentType === "EquipCategory") return;
  currentType.value = data.currentType;
  if (data.currentType === "VisitObjectType") {
    visitObjectTypeId.value = id;
  } else {
    equipTypeId.value = id;
  }
  getDetail(id);
};

const initParams: any = {
  label: "",
  staticAttribute: [],
  monitorAttribute: [],
  linkConfig: []
};
const params = ref({
  ...initParams
});

const attrConfigRef = ref();
const getDetail = async (id: number) => {
  const res: any = await labelDetailAttr(id, currentType.value);
  if (res.code === 200) {
    params.value = res.data;
    attrConfigRef.value.handleTabChange("static");
  }
};

const linkConfigRef = ref();

const onLinkAdd = () => {
  linkConfigRef.value.onOpen();
};

const getTree = async () => {
  const res: any = await equipTypeTreeApi();
  if (res.code === 200) {
    treeFilterData.value = res.data;
    let child: any;
    const findFirstChild = (node: any) => {
      if (node?.children?.length) {
        findFirstChild(node.children[0]);
      } else {
        child = node;
      }
    };
    findFirstChild(res.data[0] || []);
    treeDefaultValue.value = child?.id + "";
    changeTreeFilter(Number(treeDefaultValue.value), child);
  }
};
const editTitle = async () => {
  const res: any = await updateLabel({
    equipType: equipTypeId.value,
    currentType: currentType.value,
    label: params.value.label
  });
  if (res.code === 200) {
    ElMessage.success("修改标题成功");
  }
};
onMounted(() => {
  getTree();
});
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
  .flx-align-center {
    .el-input {
      width: 240px;
      margin: 0 10px;
    }
  }
}
</style>
