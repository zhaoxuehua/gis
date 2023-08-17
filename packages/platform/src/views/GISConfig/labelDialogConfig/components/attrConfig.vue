<template>
  <div class="attr-tabs">
    <el-tabs type="card" v-model="state.activeAttr" @tab-change="handleTabChange">
      <el-tab-pane label="静态属性" name="static"></el-tab-pane>
      <el-tab-pane label="监测属性" name="monitor"></el-tab-pane>
    </el-tabs>
    <el-button class="add-btn" type="primary" @click="onAttrConfigAdd">添加</el-button>
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
        <el-button v-if="scope.row.attributeType === 10" type="primary" text @click="onJsonEdit(scope.row.attributeId)"
          >编辑</el-button
        >
        <el-button type="primary" text @click="onDelete(scope.row.attributeId, scope.$index)">删除</el-button>
      </template>
    </Table>
  </div>
  <el-dialog title="编辑" v-model="state.dialogVisible" class="el-dialog-default">
    <Table
      ref="jsonTableRef"
      class="json-table"
      :data="state.JsonBodyData"
      :columns="jsonBodyColumns"
      default-expand-all
      @selection-change="handleSelectionChange"
    >
    </Table>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="onClose">取消</el-button>
        <el-button type="primary" @click="onConfirm">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup lang="ts" name="labelDialog">
import { reactive, ref, nextTick } from "vue";
import Table from "../../../../components/Table/index.vue";
import addAttr from "./addAttr.vue";
import { deleteBindAttrApi, updateJSONBody, getAllJSONbodyApi } from "../../../../api/modules/labelDialogConfig";
import { ElMessage, ElMessageBox } from "element-plus";

const props = defineProps({
  static: Array,
  monitor: Array,
  equipTypeId: Number,
  currentType: String,
  visitObjectTypeId: Number
});
const emit = defineEmits(["update:static", "update:monitor"]);

const state = reactive({
  loading: false,
  activeAttr: "static",
  dialogVisible: false,
  selectJSONBody: [],
  JsonBodyData: []
});

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

const jsonTableRef = ref();
const jsonBodyColumns = [
  {
    type: "selection"
  },
  {
    label: "key",
    prop: "field"
  },
  {
    label: "类型",
    prop: "fieldType"
  },
  {
    label: "名称",
    prop: "remark"
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

const onJsonEdit = async (id: number) => {
  state.dialogVisible = true;

  const res: any = await getAllJSONbodyApi(id);
  if (res.code === 200) {
    state.JsonBodyData = res.data;
    jsonTableRef.value?.toggleRowSelection(state.JsonBodyData[0], true);
  }
};

const onDelete = (id: number, index: number) => {
  ElMessageBox.confirm("确定要删除吗", "警告", {
    type: "warning",
    confirmButtonText: "确定"
  }).then(async () => {
    const res: any = await deleteBindAttrApi({
      equipTypeId: props.equipTypeId,
      currentType: props.currentType,
      attributeId: id
    });
    if (res.code === 200) {
      ElMessage.success("删除成功");
      tableData.value.splice(index, 1);
    }
  });
};
const handleSelectionChange = (val: any) => {
  console.log(val);
  state.selectJSONBody = val;
};
const onClose = () => {
  state.dialogVisible = false;
};
const onConfirm = async () => {
  return;
  const res: any = await updateJSONBody(state.selectJSONBody);
  if (res.code === 200) {
    state.dialogVisible = false;
  }
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
.json-table {
  height: 300px;
}
</style>
