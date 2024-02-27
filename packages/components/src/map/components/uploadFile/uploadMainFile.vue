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
        <el-button type="primary" :disabled="state.disabledCheckBtn || state.isProcessing" @click="onCheckFile">校验</el-button>
        <el-upload :before-upload="beforeUpload" :http-request="uploadFile" :show-file-list="false" class="ml10">
          <el-button type="primary" :disabled="state.isProcessing">选择本地文件</el-button>
        </el-upload>
        <el-button @click="onDownloadTemplate">下载文件模板</el-button>
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
          v-for="(column, index) in table?.tableColumns"
          :key="index"
          :prop="column?.[0]"
          :label="column?.[1]"
          :sortable="false"
          :min-width="120"
        >
          <template #default="scope">
            <template v-if="scope.row?.errorField?.[column?.[0]]">
              <el-input v-model="scope.row[column?.[0]]" :class="{ 'error-field': scope.row.errorField[column?.[0]] }" />
            </template>
            <template v-else>
              <el-input v-model="scope.row[column?.[0]]" />
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="操作" width="80" fixed="right" v-if="table?.tableData?.length">
          <template #default="scope">
            <el-button type="primary" link @click="table.onDelete(scope.$index)"> 删除 </el-button>
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
import {
  downloadTemplate,
  upLoadFileGetTableData,
  upLoadFileGetTableColumnData,
  getTableDataByChangePageSize,
  getTableDataByChangePageNumber,
  checkFile,
  confirmImport,
  cancelImport,
  editFileExcelTableData
} from "../../../api/gis";
import ErrorMsgDialog from "./errorMsgDialog.vue";
import { showProgressFun, closeLoadingProgress, beforeUploadFun, downloadFun, fileNameMap } from "./uploadFun";
import paginationCom from "../paginationCom.vue";

const config: any = {
  dialogTitle: "导入",
  accept: ["xlsx"],
  size: 50,
  tip: "1. 如果没有导入文件模板，请先点击下载模板\n2. 请选择xlsx格式文件进行上传，单个文件最大支持50M\n3. 支持在窗口内直接编辑表格内容或删除行"
};

const props = withDefaults(defineProps<{ fileTitle: string; sceneCode: string }>(), {
  fileTitle: () => "导入文件",
  sceneCode: () => ""
});

const errorMsgDialogRef = ref<InstanceType<typeof ErrorMsgDialog>>();

const state: any = reactive({
  open: false,
  loading: false,
  fileName: "",
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

// 跟新列表的数据、总条数、当前页及条数
const changeTableData = (data: any) => {
  state.pageNumber = data?.currentPage;
  state.pageSize = data?.pageSize;
  table.value.total = data?.totalNum;
  table.value.tableData = data?.items || [];
  table.value.originTableData = JSON.parse(JSON.stringify(data?.items || []));
};

const getPagination = async (obj: any) => {
  state.pageNumber = obj.page;
  state.pageSize = obj.limit;
  obj?.isSizeChange && (state.pageNumber = 1);

  const fetchData = async () => {
    const params: any = {
      sceneCode: props.sceneCode,
      sessionId: localStorage.getItem("sessionId"),
      fileName: state.fileName
    };
    if (obj?.isSizeChange) {
      params.pageSize = state.pageSize;
      await getTableDataByChangePageSize(params).then((res: any) => {
        changeTableData(res?.data || {});
      });
    } else {
      params.pageNum = state.pageNumber;
      await getTableDataByChangePageNumber(params).then((res: any) => {
        changeTableData(res?.data || {});
      });
    }
  };

  // 判断数据有无变化有的话更新接口，更新成功再翻页
  if (isTableDataChange()) {
    const params = {
      sceneCode: props.sceneCode,
      sessionId: localStorage.getItem("sessionId"),
      fileName: state.fileName,
      pageIndex: state.pageNumber,
      data: table.value?.tableData
    };
    await editFileExcelTableData(params).then(async () => {
      fetchData();
    });
  } else {
    fetchData();
  }
};

const table: any = ref({
  tableColumns: [], // 表头
  originTableData: [], // 列表原始数据
  tableData: [], // 列表数据
  total: 0,
  onDelete: async (index: number) => {
    table.value.tableData?.splice(index, 1);
    const params = {
      sceneCode: props.sceneCode,
      sessionId: localStorage.getItem("sessionId"),
      fileName: state.fileName,
      pageIndex: state.pageNumber,
      data: table.value?.tableData
    };
    await editFileExcelTableData(params).then((res: any) => {
      changeTableData(res?.data || {});
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

const onDownloadTemplate = async () => {
  try {
    const res: any = await downloadTemplate({ sceneCode: props?.sceneCode });
    const url = window.URL.createObjectURL(new Blob([res]));
    downloadFun(url, `${fileNameMap?.[props.sceneCode]}`);
  } catch (error) {
    console.log(error);
  }
};

const beforeUpload = (file: any) => {
  const { accept, size } = config;
  state.fileName = file.name;
  return beforeUploadFun(file, accept, size);
};

const uploadFile = async (content: any) => {
  let formData = new FormData();
  formData.append("file", content.file);
  const params = {
    sceneCode: props.sceneCode,
    sessionId: localStorage.getItem("sessionId"),
    excelFile: formData
  };

  // mock 数据
  // let tableColumns: any = {
  //   data: [
  //     ["name", "姓名"],
  //     ["age", "年纪(必填)"]
  //   ]
  // };
  // let tableData: any = {
  //   data: {
  //     currentPage: 1,
  //     pageSize: 10,
  //     totalNum: 3,
  //     items: [
  //       {
  //         name: "名字1",
  //         age: 11
  //       },
  //       {
  //         name: "名字2",
  //         age: 22
  //       }
  //     ]
  //   }
  // };
  // state.progressCount = 100;
  // table.value.tableColumns = tableColumns?.data || []; // 表头
  // changeTableData(tableData?.data || {});
  // closeLoadingProgress(state);
  // state.disabledCheckBtn = false;
  // mock数据结束

  // 再次传文件时需要将校验、错误信息、确认导入禁用
  resetFun();
  showProgressFun(state);
  // 获取表头数据及列表数据
  Promise.all([upLoadFileGetTableColumnData({ sceneCode: props.sceneCode }), upLoadFileGetTableData(params)])
    .then(([tableColumns, tableData]: [any, any]) => {
      state.progressCount = 100;
      table.value.tableColumns = tableColumns?.data || []; // 表头
      changeTableData(tableData?.data || {});
      closeLoadingProgress(state);
      state.disabledCheckBtn = false;
    })
    .catch(() => {
      closeLoadingProgress(state);
    });
};

const isTableDataChange = () => {
  if (JSON.stringify(table.value?.tableData) !== JSON.stringify(table.value?.originTableData)) {
    return true;
  } else {
    return false;
  }
};

// 校验（返回校验信息针对整个excel）
const checkFileFun = async () => {
  try {
    const params = {
      sceneCode: props.sceneCode,
      fileName: state.fileName,
      sessionId: localStorage.getItem("sessionId")
    };
    showProgressFun(state);
    const res: any = await checkFile(params);
    if (res.code == 200) {
      state.progressCount = 100;
      state.errorDataMsg = (res?.data || []).map((row: any) => {
        return {
          rn: row?.[0],
          errorMsg: row?.[1]
        };
      });
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

const onCheckFile = async () => {
  // 判断数据有无变化有的话更新接口，更新成功再校验
  if (isTableDataChange()) {
    const params = {
      sceneCode: props.sceneCode,
      sessionId: localStorage.getItem("sessionId"),
      fileName: state.fileName,
      pageIndex: state.pageNumber,
      data: table.value?.tableData
    };
    await editFileExcelTableData(params).then((res: any) => {
      changeTableData(res?.data || {});
      checkFileFun();
    });
  } else {
    checkFileFun();
  }
};

// 错误信息
const openErrorMsg = () => {
  errorMsgDialogRef.value?.openDialog();
};

// 导入
const confirmImportFun = async () => {
  const params: any = {
    sceneCode: props.sceneCode,
    sessionId: localStorage.getItem("sessionId"),
    fileName: state.fileName
  };
  showProgressFun(state);
  try {
    await confirmImport(params).then((res: any) => {
      if (res.code == 200) {
        state.progressCount = 100;
        ElMessage.success(`${res?.data}`);
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
      const params: any = {
        sceneCode: props.sceneCode,
        sessionId: localStorage.getItem("sessionId"),
        fileName: state.fileName
      };
      try {
        await cancelImport(params).then((res: any) => {
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
    }
  }
}
</style>
