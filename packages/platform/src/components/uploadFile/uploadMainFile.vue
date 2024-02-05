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
        <el-button type="primary" class="ml10" @click="onStop">取消</el-button>
        <el-button type="primary" :disabled="state.disabledConfirmBtn" @click="confirmImportFun">确认导入</el-button>
        <el-button type="primary" :disabled="state.disabledErrorInfoBtn" @click="openErrorMsg">错误信息</el-button>
        <el-button type="primary" :disabled="state.disabledCheckBtn" @click="checkFileFun">校验</el-button>
        <el-upload :before-upload="beforeUpload" :http-request="uploadFile" :show-file-list="false" class="ml10">
          <el-button type="primary">选择本地文件</el-button>
        </el-upload>
        <el-button @click="downloadTemplate">下载文件模板</el-button>
      </div>
    </div>
    <div>
      <div class="table-title">表格文件</div>

      <el-table
        v-loading="table.loading && { text: loadingText }"
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
    </div>
  </el-dialog>
  <ErrorMsgDialog ref="errorMsgDialogRef" :data="state.errorDataMsg"></ErrorMsgDialog>
</template>

<script lang="ts" setup name="DownloadImport">
import { reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { upLoadFile, checkFile, confirmImport, cancelImport } from "@/api/device.js";
import { downloadFun } from "@/hooks/useDownload";
import ErrorMsgDialog from "./errorMsgDialog.vue";

const config: any = {
  dialogTitle: "导入",
  accept: ["xlsx"],
  size: 50,
  tip: "1. 如果没有导入文件模板，请先点击下载模板\n2. 请选择xlsx格式文件进行上传，单个文件最大支持50M\n3. 支持在窗口内直接编辑表格内容或删除行"
};

withDefaults(defineProps<{ fileTitle: string }>(), {
  fileTitle: () => "导入文件" // 具体业务文件名
});

const errorMsgDialogRef = ref<InstanceType<typeof ErrorMsgDialog>>();

const state: any = reactive({
  open: false,
  errorDataMsg: [],
  disabledCheckBtn: true,
  disabledErrorInfoBtn: true,
  disabledConfirmBtn: true,
  isShowLoadingProgress: false,
  progressCount: 0,
  canClickClose: true // 上传、校验、导入过程中不可点击
});

const resetFun = () => {
  state.disabledCheckBtn = true;
  state.disabledErrorInfoBtn = true;
  state.disabledConfirmBtn = true;
  state.isShowLoadingProgress = false;

  state.progressCount = 0;
  table.value.tableColumns = [];
  table.value.tableData = [];
};

const table: any = ref({
  loading: false,
  total: 0,
  tableColumns: [], // 表头
  tableData: [], // 列表数据
  getTableData: async () => {
    table.value.loading = true;
    // 获取表格数据
    table.value.loading = false;
  },
  onDelete: (row: { [key: string]: any }) => {
    console.log(row);
  }
});

const openDialog = () => {
  state.open = true;
  table.value.loading = false;
  state.canClickClose = true;
  resetFun();
};

const onClose = () => {
  // 导入中是不能关，只能取消后才能关闭
  if (!state.canClickClose) {
    return ElMessage.warning(`有文件正在处理中，请先取消后再关闭！`);
  }
  state.open = false;
};

// 下载
const downloadTemplate = () => {
  downloadFun("url", "模板.xlsx");
};

// 上传前验证
const beforeUpload = (file: any) => {
  let arr = file?.name?.split(".");
  const { accept, size } = config;
  if (!accept?.includes(arr[arr?.length - 1])) {
    ElMessage.warning(`只能上传${accept?.[0]}格式!`);
    return false;
  } else if (file.size / 1024 / 1024 > size) {
    ElMessage.warning(`单个文件大小不能超过${size}M!`);
    return false;
  }
  return true;
};

// 后端返回表头及excel表格数据
const uploadFile = async (content: any) => {
  let formData = new FormData();
  formData.append("uploadFile", content.file);
  // 需要将校验确认导入禁用
  resetFun();
  showProgressFun();
  table.value.loading = true;
  try {
    const res: { [key: string]: any } = await upLoadFile(formData);
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
      state.disabledCheckBtn = false;
    }
  } finally {
    closeLoadingProgress();
  }
};

// 校验
const checkFileFun = async () => {
  // 校验信息及新列表数据
  try {
    const params: any = {
      data: table.value.tableData
    };
    showProgressFun();
    table.value.loading = true;
    const res: any = await checkFile(params);
    if (res.code == 200) {
      state.progressCount = 100;
      // 表头数据+列表赋值
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
      // 需要判断校验通过与否
      if (!state.errorDataMsg?.length) {
        state.disabledConfirmBtn = false;
      }
      errorMsgDialogRef.value?.openDialog();
      state.disabledCheckBtn = false;
    }
  } finally {
    closeLoadingProgress();
  }
};

// 错误信息
const openErrorMsg = () => {
  errorMsgDialogRef.value?.openDialog();
};

// 导入（问题：校验通过后还可以修改，那最终导入的会不会有问题）
const confirmImportFun = async () => {
  const params: any = {
    data: table.value.tableData
  };
  showProgressFun();
  table.value.loading = true;
  try {
    await confirmImport(params).then((res: any) => {
      if (res.code == 200) {
        state.progressCount = 100;
        ElMessage.success(`${res?.msg}`);
      }
    });
  } finally {
    closeLoadingProgress();
  }
};

// 取消(会停止上传、校验、导入并将导入数据丢掉)
const onStop = () => {
  ElMessageBox.confirm("取消会把导入的数据都丢弃！确定取消？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        await cancelImport({}).then((res: any) => {
          if (res.code == 200) {
            ElMessage.success(`${res?.msg}`);
          }
        });
      } catch {}
    })
    .catch(() => {});
};

// 进度实现要求：导入时间超过2秒出现进度条，显示进度给一个假的，进度先按一定的速率更新，比如10秒从0-80%，如果时间更久则从80%-99降低进度条的更新速率
const loadingText = ref(" ");
const timer1: any = ref(null);
const timer2: any = ref(null);

const showProgressFun = () => {
  state.canClickClose = false;
  clearTimer();
  timer1.value = setTimeout(() => {
    processCountFun();
  }, 2000);
};

const clearTimer = () => {
  if (timer1.value) {
    clearTimeout(timer1.value);
  }
  if (timer2.value) {
    clearInterval(timer2.value);
  }
};

const processCountFun = () => {
  state.isShowLoadingProgress = true;
  let progressCount = 0;
  state.progressCount = progressCount;
  clearTimer();
  timer2.value = setInterval(() => {
    progressCount += 10;
    if (progressCount < 80) {
      state.progressCount = progressCount;
    } else {
      state.progressCount = 80 + (progressCount - 80) / 2; // 降低速率
    }

    if (progressCount >= 99) {
      state.progressCount = 99;
      clearTimer();
    }
  }, 1000);
};

const closeLoadingProgress = () => {
  clearTimer();
  state.progressCount = 0;
  table.value.loading = false;
  state.isShowLoadingProgress = false;
  state.canClickClose = true;
};

defineExpose({
  openDialog
});

watch(
  () => [state.progressCount, state.isShowLoadingProgress],
  async ([progressCount, isShowLoadingProgress]) => {
    if (isShowLoadingProgress) {
      loadingText.value = `加载${progressCount}%`;
    } else {
      loadingText.value = " ";
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
