<template>
  <div class="attr-tabs">
    <el-tabs type="card" v-model="state.activeAttr" @tab-change="handleTabChange">
      <el-tab-pane label="静态属性" name="static"></el-tab-pane>
      <el-tab-pane label="监测属性" name="monitor"></el-tab-pane>
    </el-tabs>
    <el-button
      v-if="props.currentId && props.currentType && props.currentType !== 'EquipCategory'"
      class="add-btn"
      type="primary"
      @click="onAttrConfigAdd"
      >添加</el-button
    >
  </div>
  <addAttr
    ref="addAttrRef"
    :type="state.activeAttr"
    :equipTypeId="props.equipTypeId"
    :visitObjectTypeId="props.visitObjectTypeId"
    @change="handleAddAttr"
  />
  <div class="attr-config">
    <Table class="attr-table" title="" v-loading="state.loading" :data="tableData" :columns="tableColumns" :is-pageable="false">
      <template #action="scope">
        <el-button
          v-if="scope.row.attributeType === 10"
          type="primary"
          text
          @click="onJsonEdit(scope.row.attributeId, scope.$index)"
        >
          编辑
        </el-button>
        <el-button type="primary" text @click="onDelete(scope.row.attributeId, scope.$index)">删除</el-button>
      </template>
    </Table>
  </div>
  <EditJSONbody ref="editJSONbodyRef" @success="onEditJSONbodySuccess"></EditJSONbody>
</template>
<script setup lang="ts" name="labelDialog">
import { reactive, ref, nextTick } from "vue";
import Table from "../../../../../../components/src/map/components/Table/index.vue";
import addAttr from "./addAttr.vue";
import { deleteBindAttrApi } from "@/api/modules/labelDialogConfig";
import { ElMessage, ElMessageBox } from "element-plus";
import EditJSONbody from "./editJSONbody.vue";

const props = defineProps({
  static: Array,
  monitor: Array,
  equipTypeId: Number,
  currentType: String,
  visitObjectTypeId: Number,
  currentId: Number
});
const emit = defineEmits(["update:static", "update:monitor"]);

const state = reactive({
  loading: false,
  activeAttr: "static",
  editJSONbodyIndex: 0
});

const editJSONbodyRef = ref();

const tableData: any = ref([]);
const tableColumns = [
  {
    prop: "attributeName",
    label: "属性"
  },
  {
    prop: "attributeTypeName",
    label: "数据类型"
  },
  {
    label: "操作",
    scope: "action",
    width: 100
  }
];

const handleTabChange: any = (val: string) => {
  state.activeAttr = val;
  nextTick(() => {
    if (val === "static") {
      tableData.value = props.static;
    } else if (val === "monitor") {
      tableData.value = props.monitor;
    }
  });
};

const addAttrRef = ref();
const handleAddAttr = (list: any) => {
  tableData.value = tableData.value.concat(list);
  if (state.activeAttr === "static") {
    emit("update:static", tableData.value);
  } else if (state.activeAttr === "monitor") {
    emit("update:monitor", tableData.value);
  }
};
const onAttrConfigAdd = () => {
  addAttrRef.value.onOpen();
};

const onJsonEdit = async (id: number, index: number) => {
  const checkedConfig = tableData.value[index]?.attributeJsonConfig;
  editJSONbodyRef.value.onOpen(id, index, checkedConfig);
};

const onDelete = (id: number, index: number) => {
  ElMessageBox.confirm("确定要删除吗", "警告", {
    type: "warning",
    confirmButtonText: "确定"
  }).then(async () => {
    const res: any = await deleteBindAttrApi({
      equipTypeId: props.equipTypeId || props.visitObjectTypeId,
      currentType: props.currentType,
      attributeId: id
    });
    if (res.code === 200) {
      ElMessage.success("删除成功");
      tableData.value.splice(index, 1);
    }
  });
};

const onEditJSONbodySuccess = (tree: any, index: number) => {
  tableData.value[index].attributeJsonConfig = tree;
};
defineExpose({
  handleTabChange
});
</script>
<style lang="scss" scoped>
.attr-tabs {
  position: relative;
  .add-btn {
    position: absolute;
    top: 50%;
    right: 0;
    transform: translateY(-50%);
  }
}
.attr-table {
  height: 370px;
  margin-top: 10px;
}
</style>
