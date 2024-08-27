<template>
  <div class="reference-main">
    <el-dialog
      :title="'关联对象信息'"
      v-model="open"
      width="1000px"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <DynamicForm
        :formData="formData"
        ref="dynamicFormRef"
        @dynamic-change="dynamicChange"
        :labelWidth="130"
        style="margin-top: 0"
      >
      </DynamicForm>
      <div class="option">
        <div class="title">关联对象信息列表</div>
      </div>
      <el-table
        ref="referenceObjectTableRef"
        :data="table.data"
        class="reference-table"
        highlight-current-row
        empty-text="暂无数据"
        :row-style="{ height: 48 + 'px' }"
        :cell-style="{ padding: '0px' }"
        @selection-change="table.onSelectionChange"
        border
      >
        <el-table-column type="selection" v-if="table.data?.length"></el-table-column>
        <el-table-column v-for="column in table.columns" :key="column.prop" :prop="column.prop" :label="column.label">
        </el-table-column>
        <template #empty>
          <el-empty class="no-data" description="暂无数据" />
        </template>
      </el-table>
      <Pagination
        v-if="table.data?.length"
        :total="table.total"
        v-model:page="query.params.pageNumber"
        v-model:limit="query.params.pageSize"
        @pagination="query.getPagination"
      ></Pagination>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onClose">取消</el-button>
          <el-button type="primary" @click="onConfirm">确认关联</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup name="ReferenceMain">
import { ref, reactive, watch } from "vue";
import { ElMessage, ElTable } from "element-plus";
import { queryDynamicForm, dynamicTableList } from "@/api/device.js";
import DynamicForm from "@/components/dynamicForm/index.vue";
import { TableList } from "../../type";
import { handleParam } from "@/utils/common.js";

const emit = defineEmits(["referenceObjectChange"]);
const referenceObjectTableRef = ref<InstanceType<typeof ElTable>>();
const open = ref<boolean>(false);
const formData: any = ref(); // 接口获取的表单信息
const state = reactive({
  dynamicForm: {} // 动态表单绑定值
});

const defaultParams = {
  orderByColumn: "",
  isAsc: "",
  pageNumber: 1,
  pageSize: 10
};

const query = ref({
  params: { ...defaultParams },
  getPagination: (obj: { [key: string]: any }) => {
    query.value.params.pageNumber = obj.page;
    query.value.params.pageSize = obj.limit;
    query.value.onQuery();
  },
  onQuery: () => {
    table.value.getTableData();
  }
});

const table = ref<TableList>({
  loading: false,
  total: 0,
  ids: [],
  data: [], // 表格数据源
  columns: [], // 表格动态header渲染列
  getTableData: async () => {
    table.value.loading = true;
    const params = {
      ...query.value.params,
      ...state.dynamicForm
    };
    const res: { [key: string]: any } = await dynamicTableList(...(handleParam(params) as [string, object]));
    if (res?.items) {
      table.value.data = res.items;
      table.value.total = res.totalNum;
    } else {
      ElMessage.error("接口异常");
    }
    table.value.loading = false;
  },
  onSelectionChange: (selection: any[]) => {
    if (selection.length > 1) {
      let del_row = selection.shift();
      referenceObjectTableRef.value?.toggleRowSelection(del_row, false); // 用于多选表格，切换某一行的选中状态，如果使用了第二个参数，则是设置这一行选中与否（selected 为 true 则选中）
    }
    table.value.ids = selection.map((item: { [key: string]: any }) => item.id);
  },
  onEdit: () => {}
});

const openDialog = async () => {
  open.value = true;
  await getFormData(); // 获取动态表单数据
  // 获取表格列表数据
  await table.value.getTableData();
};

const onClose = () => {
  open.value = false;
};

// 确认关联(将选择的行信息关联)
const onConfirm = () => {
  if (table.value.ids.length === 0) {
    ElMessage.warning("请选择关联对象列表数据");
    return;
  }
  const selectionRow = table.value.data.find((item: any) => item.id === table.value.ids[0]);
  emit("referenceObjectChange", selectionRow);
  open.value = false;
};

// 根据动态表单选择的数据查询表单
const getFormData = async () => {
  const res: { [key: string]: any } = await queryDynamicForm([52275, true]);
  if (res.code == 200) {
    formData.value = res.data;
    formData.value.forEach((item: { [key: string]: any }) => {
      if (item.type == "checkbox") {
        if (item.extendAttributeValue == "true" || item.extendAttributeValue == true) {
          item.extendAttributeValue = true;
        } else if (item.extendAttributeValue == "false" || item.extendAttributeValue == false) {
          item.extendAttributeValue = false;
        } else {
          item.extendAttributeValue = false;
        }
      }
    });
  }
};

const dynamicChange = (val: { [key: string]: any }) => {
  // 获取动态表单选项数据，用于查询表格数据
  state.dynamicForm = val;
};

watch(
  () => state.dynamicForm,
  async newVal => {
    state.dynamicForm = newVal;
    table.value.getTableData();
  },
  {
    deep: true
  }
);

defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped>
.reference-main {
  ::v-deep(.el-overlay .el-dialog .el-dialog__body) {
    padding: 0 !important;
  }
  .reference-table {
    max-height: 500px;
    margin: 20px 0;
  }
}
.reference-main-content {
  position: relative;
  padding: 0;
  ::v-deep(.el-tabs .el-tabs__header .el-tabs__nav-wrap) {
    padding-left: 20px;
  }
  .confirm-button {
    position: absolute;
    right: 20px;
    z-index: 1;
  }
}
.reference-side-tab {
  width: 180px;
  border-right: #eeeeee solid 1px;
  .reference-side-tab-item {
    height: 40px;
    font-size: 14px;
    line-height: 40px;
    text-align: center;
    cursor: pointer;
    background-color: #f0f5f5;
    &.active {
      font-weight: bold;
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-1);
    }
  }
}
</style>
