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
import { getUnBindStaticAttrApi, getUnBindMonitorAttrApi, bindAttrApi } from "../../../../api/modules/labelDialogConfig";
import { ElMessage } from "element-plus";

const emit = defineEmits(["change"]);
const props = defineProps({
  type: String,
  equipTypeId: Number
});
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
const getUnBindStaticAttr = async () => {
  const res: any = await getUnBindStaticAttrApi({
    equipTypeId: props.equipTypeId, // 设备类型id
    visitObjectTypeId: "", // 外部对象类型id
    attributeCategorys: "", //  功能类型id列表
    name: "", // 名称
    attributeCategory: "",
    attributeType: "",
    enable: ""
  });
  if (res.code === 200) {
    tableData.value = res.data;
  }
};
const getUnBindMonitorAttr = async () => {
  const res: any = await getUnBindMonitorAttrApi({
    equipTypeId: props.equipTypeId, // 设备类型id
    visitObjectTypeId: "", // 外部对象类型id
    attributeCategorys: "", //  功能类型id列表
    name: "", // 名称
    attributeCategory: "",
    attributeType: "",
    enable: ""
  });
  if (res.code === 200) {
    tableData.value = res.data;
  }
};
const getTableData = () => {
  if (props.type === "static") {
    getUnBindStaticAttr();
  } else if (props.type === "monitor") {
    getUnBindMonitorAttr();
  }
};
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
const onConfirm = async () => {
  const res: any = await bindAttrApi({
    equipTypeId: props.equipTypeId, // 设备类型Id
    visitObjectTypeId: "", // 外部对象类型Id
    attributeIds: state.ids, // 属性id列表
    isStatic: props.type === "static" ? true : false // 是否是静态属性
  });
  if (res.code === 200) {
    ElMessage.success("绑定成功");
    emit("change", state.selectedList);
    state.dislogVisible = false;
  }
};
defineExpose({
  onOpen
});
</script>
