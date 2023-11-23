<template>
  <div class="add-attr">
    <el-dialog class="el-dialog-default" title="添加属性" v-model="state.dislogVisible" :destroy-on-close="true">
      <el-form :model="searchForm" class="flx-align-center">
        <el-form-item label="属性名称">
          <el-input v-model="searchForm.name" placeholder="请输入..." clearable @input="getTableData"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getTableData">搜索</el-button>
        </el-form-item>
      </el-form>
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
          <el-button type="primary" :disabled="!state.ids.length" @click="onConfirm" :loading="btnLoading">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts" name="addAttr">
import { reactive, ref } from "vue";
import Table from "../../../../../../components/src/map/components/Table/index.vue";
import { getUnBindStaticAttrApi, getUnBindMonitorAttrApi, bindAttrApi } from "@/api/modules/labelDialogConfig";
import { ElMessage } from "element-plus";

const emit = defineEmits(["change"]);
const props = defineProps({
  type: String,
  equipTypeId: Number,
  visitObjectTypeId: Number
});
const state = reactive({
  loading: false,
  dislogVisible: false,
  ids: [],
  selectedList: [],
  funTypeOption: [
    {
      label: "说明",
      value: "6"
    },
    {
      label: "遥测",
      value: "1"
    },
    {
      label: "遥信",
      value: "2"
    }
  ]
});
const searchForm = reactive({
  name: ""
});

const tableData = ref([]);
const btnLoading = ref(false);
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
    prop: "attributeCategory",
    render(val: number) {
      return state.funTypeOption.find(item => Number(item.value) === val)?.label || "";
    }
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
  state.loading = true;
  const res: any = await getUnBindStaticAttrApi(
    {
      equipTypeId: props.equipTypeId, // 设备类型id
      visitObjectTypeId: props.visitObjectTypeId,
      ...searchForm
    },
    {
      params: {
        pageSize: pagination.pageSize,
        pageNumber: pagination.page
      }
    }
  );
  pagination.total = res.totalNum;
  tableData.value = res.items;
  state.loading = false;
};
const getUnBindMonitorAttr = async () => {
  state.loading = true;
  const res: any = await getUnBindMonitorAttrApi(
    {
      equipTypeId: props.equipTypeId, // 设备类型id
      visitObjectTypeId: props.visitObjectTypeId,
      ...searchForm
    },
    {
      params: {
        pageSize: pagination.pageSize,
        pageNumber: pagination.page
      }
    }
  );
  pagination.total = res.totalNum;
  tableData.value = res.items;
  state.loading = false;
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
  state.ids = val.map((col: any) => {
    return {
      attribute: col.attributeId
    };
  });
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
  btnLoading.value = true;
  try {
    const res: any = await bindAttrApi({
      equipTypeId: props.equipTypeId, // 设备类型Id
      visitObjectTypeId: props.visitObjectTypeId, // 外部对象类型Id
      attributeIds: state.ids, // 属性id列表
      isStatic: props.type === "static" ? true : false // 是否是静态属性
    });
    if (res.code === 200) {
      ElMessage.success("绑定成功");
      emit("change", state.selectedList);
      state.dislogVisible = false;
    }
  } finally {
    btnLoading.value = false;
  }
};
defineExpose({
  onOpen
});
</script>
<style lang="scss" scoped>
.attr-table {
  height: 400px;
}
.flx-align-center {
  .el-button {
    margin-left: 10px;
  }
}
</style>
