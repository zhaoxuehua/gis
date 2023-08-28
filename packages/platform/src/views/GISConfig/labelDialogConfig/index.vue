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
        <el-button v-if="currentId && currentType && currentType !== 'EquipCategory'" type="primary" @click="editTitle"
          >保存</el-button
        >
      </div>
      <p class="title title-box">属性配置</p>
      <AttrConfig
        v-model:static="params.staticAttribute"
        v-model:monitor="params.monitorAttribute"
        ref="attrConfigRef"
        :equipTypeId="equipTypeId"
        :visitObjectTypeId="visitObjectTypeId"
        :currentType="currentType"
        :currentId="currentId"
      />
      <div class="flx-justify-between title-box">
        <p class="title">链接配置</p>
        <el-button v-if="currentId && currentType && currentType !== 'EquipCategory'" type="primary" @click="onLinkAdd"
          >添加</el-button
        >
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
const currentId = ref();
const currentType = ref(); // 设备类别 EquipCategory  设备类型 EquipType  外部设备类型 VisitObjectType
const changeTreeFilter = (id: number, data: any) => {
  currentType.value = data.currentType;
  currentId.value = id;
  // 初始化
  params.value = initParams;
  attrConfigRef.value.handleTabChange("static");

  if (!id || data.currentType === "EquipCategory") return ElMessage.warning("请在设备类型下配置");
  if (data.currentType === "VisitObjectType") {
    visitObjectTypeId.value = id;
    equipTypeId.value = undefined;
  } else {
    equipTypeId.value = id;
    visitObjectTypeId.value = undefined;
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
