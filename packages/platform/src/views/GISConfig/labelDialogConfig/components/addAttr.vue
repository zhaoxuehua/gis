<template>
  <div class="add-attr">
    <el-dialog class="el-dialog-default" title="添加属性" v-model="state.dislogVisible" :destroy-on-close="true">
      <Table
        class="attr-table"
        title=""
        v-loading="state.loading"
        :data="tableData"
        :columns="columns"
        :pagination="pagination"
        @selection-change="handleSelectionChange"
        @page-current-change="handleCurrentChange"
        @page-size-change="handleSizeChange"
      >
      </Table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onClose">取消</el-button>
          <el-button type="primary" :disabled="!state.ids.length" @click="onConfirm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts" name="addAttr">
import { reactive, ref } from "vue";
import Table from "@/components/Table/index.vue";

const emit = defineEmits(["change"]);
const state = reactive({
  loading: false,
  dislogVisible: false,
  ids: [],
  selectedList: []
});
const tableData = ref([
  {
    attributeCode: "aaa",
    attributeName: "aaa",
    attributeCategoryName: "说明",
    attributeTypeName: "浮点型"
  },
  {
    attributeCode: "bbb",
    attributeName: "bbb",
    attributeCategoryName: "说明",
    attributeTypeName: "浮点型"
  },
  {
    attributeCode: "ccc",
    attributeName: "ccc",
    attributeCategoryName: "说明",
    attributeTypeName: "浮点型"
  },
  {
    attributeCode: "ddd",
    attributeName: "ddd",
    attributeCategoryName: "说明",
    attributeTypeName: "浮点型"
  }
]);
const columns = ref([
  {
    type: "selection"
  },
  {
    label: "属性编码",
    prop: "attributeCode"
  },
  {
    label: "属性名称",
    prop: "attributeName"
  },
  {
    label: "功能类型",
    prop: "attributeCategoryName"
  },
  {
    label: "数据类型",
    prop: "attributeTypeName"
  }
]);
const pagination = reactive({
  total: 0,
  page: 1,
  pageSize: 10
});
const getTableData = () => {};
const handleSelectionChange = (val: any) => {
  state.selectedList = val;
  state.ids = val.map((col: any) => col.id);
};
const handleCurrentChange = (val: number) => {
  pagination.page = val;
  getTableData();
};
const handleSizeChange = (val: number) => {
  pagination.pageSize = val;
  getTableData();
};
const onOpen = () => {
  state.dislogVisible = true;
  getTableData();
};
const onClose = () => {
  state.dislogVisible = false;
};
const onConfirm = () => {
  emit("change", state.selectedList);
  state.dislogVisible = false;
};
defineExpose({
  onOpen
});
</script>
