<!-- 单个处理 -->
<template>
  <div>
    <el-dialog
      title="单个处理"
      v-model="state.open"
      width="1150px"
      :close-on-click-modal="false"
      @close="onClose"
      :destroy-on-close="true"
      append-to-body
    >
      <el-form :inline="true" :model="form" label-width="200px" :rules="state.rulesForm" ref="refForm" v-if="props.type == 1">
        <el-form-item label="处理方式" prop="eventHandleType">
          <el-select placeholder="请选择..." v-model="form.eventHandleType" clearable>
            <el-option
              v-for="(item, index) in state.handleTypeOption"
              :key="index"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="事件性质" prop="eventNature">
          <el-select placeholder="请选择..." v-model="form.eventNature" clearable>
            <el-option
              v-for="(item, index) in state?.natureOption"
              :key="index"
              :label="item.label"
              :value="item.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="description">
          <el-input type="textarea" style="width: 610px" v-model="form.description" />
        </el-form-item>
      </el-form>

      <span class="dialog-footer single-deal-footer" v-if="props.type == 1">
        <el-button @click="onClose">取消</el-button>
        <el-button type="primary" @click="onConfirm" :loading="btnLoading">处理</el-button>
      </span>

      <div class="dialog-title">处理记录</div>

      <el-table :data="table.data" v-loading="table.loading" highlight-current-row height="200px">
        <el-table-column label="处理时间" prop="processTime"></el-table-column>
        <el-table-column label="处理方式" prop="eventHandleTypeName"></el-table-column>
        <el-table-column label="事件性质" prop="eventNatureName"></el-table-column>
        <el-table-column label="处理结果" prop="eventHandleResult"></el-table-column>
        <el-table-column label="处理人" prop="operator"></el-table-column>
        <el-table-column label="描述" prop="description"></el-table-column>
        <template #empty>
          <el-empty class="no-data" description="暂无数据" />
        </template>
      </el-table>

      <div v-if="table.data?.length">
        <paginationCom
          :total="table.total"
          v-model:page="query.params.pageNumber"
          v-model:limit="query.params.pageSize"
          @pagination="query.getPagination"
        >
        </paginationCom>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { eventProcesses, eventProcessBatch, getHandleTypeOption, getNatureOption } from "../../../../api/device";
import paginationCom from "../../paginationCom.vue";

const emits = defineEmits(["successHandle"]);
const props = withDefaults(defineProps<{ type: number }>(), {
  type: () => 1
});

const state: {
  dialogType: any;
  open: any;
  rulesForm: any;
  row: any;
  handleTypeOption: any;
  natureOption: any;
} = reactive({
  dialogType: 0,
  open: false,
  // 弹窗表单验证
  rulesForm: {
    eventHandleType: [{ required: true, message: "处理方式不能为空", trigger: ["blur", "change"] }],
    eventNature: [{ required: true, message: "事件性质不能为空", trigger: ["blur", "change"] }],
    description: [
      { required: true, message: "备注不能为空", trigger: ["blur", "change"] },
      { max: 500, message: "备注长度不能大于500", trigger: ["blur", "change"] }
    ]
  },
  row: null,
  handleTypeOption: [],
  natureOption: []
});
const refForm = ref();

let form: any = ref({});
const btnLoading = ref(false);

const defaultParams = JSON.stringify({
  pageNumber: 1,
  pageSize: 10,

  orderByColumn: "",
  isAsc: ""
});

const query = ref({
  params: JSON.parse(defaultParams),
  getPagination: (obj: any) => {
    query.value.params.pageNumber = obj.page;
    query.value.params.pageSize = obj.limit;
    query.value.onQuery();
  },
  onQuery: () => {
    table.value.getTableData();
  }
});

const table = ref({
  loading: false,
  total: 0,
  ids: [],
  data: [],
  getTableData: async () => {
    table.value.loading = true;
    const queryString = `?pageNumber=${query.value.params.pageNumber}&pageSize=${query.value.params.pageSize}`;
    try {
      const res: any = await eventProcesses(query.value.params.mid, queryString);
      if (res?.code == 200) {
        table.value.data = res.data.items;
        table.value.total = res.data.totalNum;
      }
    } finally {
      table.value.loading = false;
    }
  }
});

const openDialog = (row: any) => {
  initOption();
  if (row) {
    state.row = row;
    query.value.params.mid = row.mid;
    table.value.getTableData();
    form.value.eventHandleType = "";
    form.value.eventNature = "";
    form.value.description = "";
  }
  state.open = true;
};

const onClose = () => {
  state.open = false;
};

const onConfirm = () => {
  refForm.value.validate(async (valid: any) => {
    if (valid) {
      let param = { ...form.value };
      param.eventMids = [state.row.mid];
      btnLoading.value = true;
      try {
        const res: any = await eventProcessBatch(param);
        if (res.code == 200) {
          ElMessage.success("处理成功");
          table.value.getTableData();
          emits("successHandle");
        }
      } finally {
        btnLoading.value = false;
      }
    }
  });
};

const initOption = async () => {
  const res1: any = await getHandleTypeOption();
  if (res1.code == 200) {
    state.handleTypeOption = res1.data;
  }

  const res2: any = await getNatureOption();
  if (res2.code == 200) {
    state.natureOption = res2.data;
  }
};

defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped>
.single-deal-footer {
  margin: 2px 0 20px;
}
</style>
