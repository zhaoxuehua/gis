<template>
  <el-dialog
    :title="config?.dialogTitle"
    v-model="state.open"
    width="1140px"
    :close-on-click-modal="false"
    append-to-body
    :before-close="onClose"
    :destroy-on-close="true"
    class="import-config"
  >
    <div class="option-area">
      <div class="tip-area">
        <div class="tip-title">{{ fileTitle }}</div>
        <div style="white-space: pre-wrap">
          {{ config?.tip }}
        </div>
      </div>
      <div class="btn-area">
        <el-button type="primary" class="ml10" @click="onStop" :disabled="!state.isProcessing">取消</el-button>
        <el-button type="primary" :disabled="state.disabledConfirmBtn || state.isProcessing" @click="confirmImportFun"
          >确认导入</el-button
        >
        <el-button type="primary" :disabled="state.disabledErrorInfoBtn || state.isProcessing" @click="openErrorMsg"
          >错误信息</el-button
        >
        <el-button type="primary" :disabled="state.disabledCheckBtn || state.isProcessing" @click="checkFileFun">校验</el-button>
        <el-upload :before-upload="beforeUpload" :http-request="uploadFile" :show-file-list="false" class="ml10">
          <el-button type="primary" :disabled="state.isProcessing">选择本地文件</el-button>
        </el-upload>
        <el-button @click="downloadTemplate">下载文件模板</el-button>
      </div>
    </div>
    <div>
      <div class="table-title">表格文件</div>
      <el-table
        v-loading="state.loading && { text: state.loadingText }"
        :data="table?.tableData"
        class="import-data-table"
        highlight-current-row
        empty-text="暂无数据"
        :row-style="{ height: 40 + 'px' }"
        :cell-style="{ padding: '0px', whiteSpace: 'nowrap' }"
        stripe
        border
      >
        <el-table-column
          v-for="column in table?.tableColumns"
          :key="column.fieldCode"
          :prop="column.fieldCode"
          :label="column.fieldName"
          :sortable="false"
          :min-width="120"
        >
          <template #default="scope">
            <template v-if="scope.row?.errorField?.[column?.fieldCode]">
              <el-input
                v-model="scope.row[column.fieldCode]"
                :class="{ 'error-field': scope.row.errorField[column.fieldCode] }"
              />
            </template>
            <template v-else>
              <el-input v-model="scope.row[column.fieldCode]" />
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="操作" width="80" fixed="right" v-if="table?.tableData?.length">
          <template #default="scope">
            <el-button type="primary" link @click="table.onDelete(scope.row)"> 删除 </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="table.tableData?.length">
        <paginationCom
          :total="table.total"
          v-model:page="state.pageNumber"
          v-model:limit="state.pageSize"
          @pagination="getPagination"
        >
        </paginationCom>
      </div>
    </div>
  </el-dialog>
  <ErrorMsgDialog ref="errorMsgDialogRef" :data="state.errorDataMsg" type="file"></ErrorMsgDialog>
</template>

<script lang="ts" setup name="UploadMainFile">
import { reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { handleParam } from "@/utils/common";
import {
  upLoadFile,
  checkFile,
  confirmImport,
  cancelImport,
  getFileExcelList,
  deleteFileExcelRowData
} from "../../../api/device";
import ErrorMsgDialog from "./errorMsgDialog.vue";
import { showProgressFun, closeLoadingProgress, beforeUploadFun, downloadFun } from "./uploadFun";
import paginationCom from "../paginationCom.vue";

const config: any = {
  dialogTitle: "导入",
  accept: ["xlsx"],
  size: 50,
  tip: "1. 如果没有导入文件模板，请先点击下载模板\n2. 请选择xlsx格式文件进行上传，单个文件最大支持50M\n3. 支持在窗口内直接编辑表格内容或删除行"
};

withDefaults(defineProps<{ fileTitle: string }>(), {
  fileTitle: () => "导入文件"
});

const errorMsgDialogRef = ref<InstanceType<typeof ErrorMsgDialog>>();

const state: any = reactive({
  open: false,
  loading: false,
  disabledCheckBtn: true,
  disabledErrorInfoBtn: true,
  disabledConfirmBtn: true,
  errorDataMsg: [],
  isShowLoadingProgress: false,
  progressCount: 0,
  loadingText: " ",
  isProcessing: false, // 是否上传、校验、导入过程中
  pageNumber: 1,
  pageSize: 20
});

// 弹框打开及重新传文件
const resetFun = () => {
  state.disabledCheckBtn = true;
  state.disabledErrorInfoBtn = true;
  state.disabledConfirmBtn = true;
  state.isShowLoadingProgress = false;
  state.progressCount = 0;
  table.value.tableColumns = [];
  table.value.tableData = [];
  state.pageNumber = 1;
  state.pageSize = 20;
};

const getPagination = (obj: any) => {
  if (obj?.isSizeChange) {
    state.pageNumber = 1;
  } else {
    state.pageNumber = obj.page;
  }
  state.pageSize = obj.limit;
  table.value.getTableData();
};

const table: any = ref({
  tableColumns: [], // 表头
  tableData: [], // 列表数据
  total: 0,
  getTableData: async () => {
    // 获取表头+表格数据
    try {
      state.loading = true;
      const params = {
        pageNumber: state.pageNumber,
        pageSize: state.pageSize
      };
      const res: { [key: string]: any } = await getFileExcelList(...(handleParam(params) as [string, object]));
      table.value.loading = true;
      if (res.code == 200) {
        state.progressCount = 100;
        // 表头数据+列表赋值
        table.value.tableColumns = [
          {
            isRequired: true,
            fieldName: "设备编码",
            fieldCode: "code",
            isBase: true
          },
          {
            isRequired: true,
            fieldName: "设备名称",
            fieldCode: "name",
            isBase: true
          },
          {
            isRequired: true,
            fieldName: "设备类别",
            fieldCode: "equip_category",
            isBase: true
          },
          {
            isRequired: true,
            fieldName: "设备类型",
            fieldCode: "equip_type",
            isBase: true
          },
          {
            isRequired: true,
            fieldName: "所属公司",
            fieldCode: "company_by",
            isBase: true
          },
          {
            isRequired: false,
            fieldName: "所属部门",
            fieldCode: "department_by",
            isBase: true
          },
          {
            isRequired: false,
            fieldName: "所属通道",
            fieldCode: "SBSXSM0052",
            isBase: false
          },
          {
            isRequired: false,
            fieldName: "所属分区",
            fieldCode: "BTPART",
            isBase: false
          }
        ];
        table.value.tableData = [
          {
            company_by: "44",
            equip_category: "22",
            BTPART: "44",
            code: "11",
            name: "22",
            department_by: "44",
            SBSXSM0052: "44",
            id: 172704,
            rn: 5,
            equip_type: "44"
          },
          {
            company_by: "我",
            equip_category: "我",
            BTPART: "我",
            code: "风骨色鬼",
            name: "4如法网",
            department_by: "我",
            SBSXSM0052: "我",
            id: 172703,
            rn: 4,
            equip_type: "我"
          },
          {
            company_by: "我",
            equip_category: "我",
            BTPART: "我",
            code: "风骨色鬼",
            name: "4如法网",
            department_by: "我",
            SBSXSM0052: "我",
            id: 172703,
            rn: 4,
            equip_type: "我"
          }
        ];
        table.value.total = table.value.tableData?.length;
        state.disabledCheckBtn = false;
      }
    } finally {
      closeLoadingProgress(state);
    }
  },
  onDelete: async (row: { [key: string]: any }) => {
    await deleteFileExcelRowData(row.id).then(() => {
      table.value.getTableData();
    });
  }
});

const openDialog = () => {
  state.open = true;
  state.loading = false;
  state.canClickClose = false;
  resetFun();
};

const onClose = () => {
  if (state.isProcessing) {
    return ElMessage.warning(`有文件正在处理中，请先取消后再关闭！`);
  }
  state.open = false;
};

const downloadTemplate = () => {
  downloadFun("url", "模板.xlsx");
};

const beforeUpload = (file: any) => {
  const { accept, size } = config;
  return beforeUploadFun(file, accept, size);
};

const uploadFile = async (content: any) => {
  let formData = new FormData();
  formData.append("uploadFile", content.file);
  // 需要将校验、错误信息、确认导入禁用
  resetFun();
  showProgressFun(state);
  try {
    const res: { [key: string]: any } = await upLoadFile(formData);
    if (res.code == 200) {
      table.value?.getTableData();
    }
  } catch {
    closeLoadingProgress(state);
  }
};

// 校验
const checkFileFun = async () => {
  // 校验信息及新列表数据
  try {
    const params: any = {
      data: table.value.tableData
    };
    showProgressFun(state);
    const res: any = await checkFile(params);
    if (res.code == 200) {
      state.progressCount = 100;
      // 列表及校验信息
      table.value.tableData = [
        {
          company_by: "44",
          equip_category: "22",
          BTPART: "44",
          errorField: {
            company_by: true,
            equip_category: true,
            BTPART: true,
            department_by: true,
            SBSXSM0052: true,
            equip_type: true
          },
          code: "11",
          name: "22",
          department_by: "44",
          SBSXSM0052: "44",
          id: 172704,
          rn: 5,
          equip_type: "44"
        },
        {
          company_by: "我",
          equip_category: "我",
          BTPART: "我",
          errorField: {
            company_by: true,
            equip_category: true,
            BTPART: true,
            department_by: true,
            SBSXSM0052: true,
            equip_type: true
          },
          code: "风骨色鬼",
          name: "4如法网",
          department_by: "我",
          SBSXSM0052: "我",
          id: 172703,
          rn: 4,
          equip_type: "我"
        },
        {
          company_by: "我",
          equip_category: "我",
          BTPART: "我",
          errorField: {
            company_by: true,
            equip_category: true,
            BTPART: true,
            department_by: true,
            SBSXSM0052: true,
            equip_type: true
          },
          code: "风骨色鬼",
          name: "4如法网",
          department_by: "我",
          SBSXSM0052: "我",
          id: 172703,
          rn: 4,
          equip_type: "我"
        }
      ];

      state.errorDataMsg = [
        {
          equipType: 1022,
          id: 172711,
          rn: 4,
          equipTypeName: "浮球",
          errorMsg:
            "字段【所属公司】为关联表型，值【我】不合法；设备类别【我】不一致；字段【所属分区】为关联表型，值【我】不合法；字段【所属部门】为关联表型，值【我】不合法；字段【所属通道】为关联表型，值【我】不合法；设备类型【我】不一致；"
        },
        {
          equipType: 1022,
          id: 172712,
          rn: 5,
          equipTypeName: "浮球",
          errorMsg:
            "字段【所属公司】为关联表型，值【44】不合法；设备类别【22】不一致；字段【所属分区】为关联表型，值【44】不合法；字段【所属部门】为关联表型，值【44】不合法；字段【所属通道】为关联表型，值【44】不合法；设备类型【44】不一致；"
        }
      ];
      if (state.errorDataMsg?.length) {
        state.disabledErrorInfoBtn = false;
        errorMsgDialogRef.value?.openDialog();
      } else {
        state.disabledConfirmBtn = false;
      }
    }
  } finally {
    closeLoadingProgress(state);
  }
};

// 错误信息
const openErrorMsg = () => {
  errorMsgDialogRef.value?.openDialog();
};

// 导入
const confirmImportFun = async () => {
  const params: any = {
    data: table.value.tableData
  };
  showProgressFun(state);
  try {
    await confirmImport(params).then((res: any) => {
      if (res.code == 200) {
        state.progressCount = 100;
        ElMessage.success(`${res?.msg}`);
      }
    });
  } finally {
    closeLoadingProgress(state);
  }
};

// 取消(会停止上传、校验、导入并将导入数据丢掉)
const onStop = () => {
  ElMessageBox.confirm("<span style='color:red'>取消会把导入的数据都丢弃！确定取消？</span>", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    dangerouslyUseHTMLString: true
  })
    .then(async () => {
      try {
        await cancelImport({}).then((res: any) => {
          if (res.code == 200) {
            ElMessage.success(`${res?.msg}`);
            closeLoadingProgress(state);
          }
        });
      } catch {}
    })
    .catch(() => {});
};

defineExpose({
  openDialog
});

watch(
  () => [state.progressCount, state.isShowLoadingProgress],
  async ([progressCount, isShowLoadingProgress]) => {
    if (isShowLoadingProgress) {
      state.loadingText = `加载${progressCount}%`;
    } else {
      state.loadingText = " ";
    }
  }
);
</script>

<style lang="scss" scoped>
.import-config {
  .option-area {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid #dcdfe6;
    .tip-area {
      max-width: 50%;
      color: #909399;
      .tip-title {
        margin-bottom: 10px;
        font-size: 14px;
        font-weight: bold;
        color: #000000;
      }
    }
    .btn-area {
      display: flex;
      flex-direction: row-reverse;
      align-items: flex-end;
    }
  }
  .table-title {
    margin: 10px 0;
    font-size: 14px;
    font-weight: bold;
    color: #000000;
  }
  .import-data-table {
    max-height: 300px;
    overflow: auto;
    .error-field {
      border: 1px solid red;
      border-radius: 5px;

      // :deep(.el-input) {
      //   border-color: red !important;
      // }
    }
  }
}
</style>
