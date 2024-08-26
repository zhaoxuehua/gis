<template>
  <el-dialog
    :title="config?.dialogTitle"
    v-model="state.open"
    width="1440px"
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
        <el-button
          type="primary"
          :disabled="state.disabledConfirmBtn || state.isProcessing || state.isTableDataChange"
          @click="confirmImportFun"
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
        max-height="500"
      >
        <el-table-column
          v-for="(column, index) in table?.tableColumns"
          :key="index"
          :prop="column?.[0]"
          :label="column?.[1]"
          :sortable="false"
          :min-width="column?.[0] == 'rowNum' ? 60 : 120"
        >
          <template #default="scope">
            <span v-if="column?.[0] == 'rowNum'">{{ scope.row?.[column?.[0]] }}</span>
            <input v-else v-model="scope.row[column?.[0]]" style="width: 100%; height: 40px; background: none; border: none" />
          </template>
        </el-table-column>
        <el-table-column prop="path" label="操作" width="80" fixed="right" v-if="table?.tableData?.length">
          <template #default="scope">
            <el-button type="primary" link @click="table.onDelete(scope.$index)"> 删除 </el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty class="no-data" description="暂无数据" />
        </template>
      </el-table>
      <div>
        <!-- <paginationCom
          :total="table.total"
          v-model:page="state.pageNumber"
          v-model:limit="state.pageSize"
          @pagination="getPagination"
        >
        </paginationCom> -->

        <el-pagination
          :background="true"
          v-model:current-page="state.pageNumber"
          v-model:page-size="state.pageSize"
          :page-sizes="[10, 20, 30, 50, 100]"
          layout="total, prev, pager, next, sizes, jumper"
          :total="table.total"
          :page-count="state.pageCount"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </el-dialog>
  <ErrorMsgDialog ref="errorMsgDialogRef" :data="state.errorDataMsg" type="file"></ErrorMsgDialog>
</template>

<script lang="ts" setup name="UploadMainFile">
import { reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { saveAs } from "file-saver";
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
import {
  showProgressFun,
  closeLoadingProgress,
  beforeUploadFun,
  fileNameMap,
  // useExportExcel,
  exportSuccessTipMap
} from "./uploadFun";
// import paginationCom from "../paginationCom.vue";

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
  pageSize: 20,
  pageCount: 0,
  isTableDataChange: false
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
  table.value.total = 0;
  state.isTableDataChange = false;
};

const createFormDataParams = (params: any = {}) => {
  const formData = new FormData();
  formData.append("sceneCode", props?.sceneCode);
  for (const [key, value] of Object.entries(params)) {
    formData.append(key, value as any);
  }
  return formData;
};

// 根据表头字段补齐对应的列表字段
const completeTableDataCode = (tableHeaders: any[], tableData: any[]) => {
  let data = JSON.parse(JSON.stringify(tableData || []));
  const headersCode = tableHeaders?.map((subArray: any) => subArray?.[0]) || []; // 表头字段code
  data?.forEach((item: any) => {
    headersCode?.forEach((headerCode: any) => {
      // 兼容后端返[null,null]
      if (item) {
        if (!(headerCode in item)) {
          item[headerCode] = "";
        }
      }
    });
  });
  return data;
};

// 跟新列表的数据、总条数、当前页及条数
const changeTableData = (data: any, isUpdatePageSize?: boolean, isUpdatePageCount?: boolean) => {
  isUpdatePageSize && (state.pageSize = data?.pageSize);
  state.pageNumber = data?.currentPage;
  table.value.total = data?.totalNum;
  isUpdatePageCount && (state.pageCount = data?.totalPage); // 首次导入及pageSize变化时更新
  let containAllCodeData = completeTableDataCode(table.value?.tableColumns, data?.items || []); // table数据字段补全
  table.value.tableData = containAllCodeData || [];
  table.value.originTableData = JSON.parse(JSON.stringify(containAllCodeData || []));
};

const handleSizeChange = (val: any) => {
  getPagination({ page: 1, limit: val, isSizeChange: true });
};
const handleCurrentChange = (val: any) => {
  getPagination({ page: val, limit: state.pageSize });
};

const getPagination = async (obj: any) => {
  const oldPageNumber = state.pageNumber;

  state.pageNumber = obj.page;
  state.pageSize = obj.limit;
  obj?.isSizeChange && (state.pageNumber = 1);

  const fetchData = async () => {
    let formData = createFormDataParams({
      sessionId: localStorage.getItem("sessionId") || "",
      fileName: state.fileName
    });
    if (obj?.isSizeChange) {
      formData.append("pageSize", state.pageSize);
      await getTableDataByChangePageSize(formData).then((res: any) => {
        if (res?.code == 200) {
          changeTableData(res?.data || {}, false, true);
        }
      });
    } else {
      formData.append("pageNum", state.pageNumber);
      await getTableDataByChangePageNumber(formData).then((res: any) => {
        if (res?.code == 200) {
          changeTableData(res?.data || {}, false, false);
        }
      });
    }
  };

  // 判断数据有无变化有的话更新接口，更新成功再翻页
  if (state.isTableDataChange) {
    let formData = createFormDataParams({
      sessionId: localStorage.getItem("sessionId") || "",
      fileName: state.fileName,
      pageIndex: oldPageNumber,
      data: JSON.stringify(table.value?.tableData)
    });
    await editFileExcelTableData(formData).then(async (res: any) => {
      if (res?.code == 200) {
        fetchData();
      }
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
    const updatedTableData = table.value.tableData.filter((item: any, i: number) => i !== index); // 过滤删除项

    const formData = createFormDataParams({
      sessionId: localStorage.getItem("sessionId") || "",
      fileName: state.fileName,
      pageIndex: state.pageNumber,
      data: JSON.stringify(updatedTableData)
    });
    const isCurrentDataChange = state.isTableDataChange; // 存储表格是否变更过

    await editFileExcelTableData(formData).then(async (res: any) => {
      if (res?.code == 200) {
        table.value.total = table.value.total - 1 || 0;
        table.value.tableData?.splice(index, 1); // 将删除项移除
        table.value.originTableData = JSON.parse(JSON.stringify(table.value.tableData || []));
        isCurrentDataChange && (state.disabledConfirmBtn = true); // 删除后如果之前表格有变更则需要重新点击校验后再导入
        ElMessage.success(`删除成功`);
        if (table.value.tableData?.length == 0) {
          // 若当页删除完则请求重新排序
          let formData1 = createFormDataParams({
            sessionId: localStorage.getItem("sessionId") || "",
            fileName: state.fileName,
            pageSize: state.pageSize
          });
          await getTableDataByChangePageSize(formData1).then((res: any) => {
            if (res?.code == 200) {
              changeTableData(res?.data || {}, false, true);
            }
          });
        }
      }
    });
  }
});

const openDialog = () => {
  state.open = true;
  state.loading = false;
  state.isProcessing = false;
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
    const res: any = await downloadTemplate(createFormDataParams());
    const reader: any = new FileReader();
    reader.onload = function () {
      try {
        const resData = JSON.parse(reader.result); // 尝试将 Blob 数据转换后的内容解析为对象
        if (resData?.code) {
          if (resData.code !== 200) {
            ElMessage.error(resData.msg || "接口异常");
          }
        } else {
          saveAs(new Blob([res]), `${fileNameMap?.[props.sceneCode]}`);
        }
      } catch (error) {
        // 返回文件流时
        saveAs(new Blob([res]), `${fileNameMap?.[props.sceneCode]}`);
      }
    };
    reader.readAsText(res);
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
  let formDataTableColumn = createFormDataParams();
  let formDataTableData = createFormDataParams({
    sessionId: localStorage.getItem("sessionId") || "",
    excelFile: content.file
  });

  // 再次传文件时需要将校验、错误信息、确认导入禁用
  resetFun();
  showProgressFun(state);
  // 获取表头数据及列表数据
  Promise.all([upLoadFileGetTableColumnData(formDataTableColumn), upLoadFileGetTableData(formDataTableData)])
    .then(([tableColumns, tableData]: [any, any]) => {
      state.progressCount = 100;
      table.value.tableColumns = [["rowNum", "行号"]]?.concat(tableColumns?.data || []); // 表头
      changeTableData(tableData?.data || {}, true, true); // 首次根据后端的分页数据展示页面
      closeLoadingProgress(state);
      state.disabledCheckBtn = false;
    })
    .catch(() => {
      closeLoadingProgress(state);
    });
};

// 校验（返回校验信息针对整个excel）
const checkFileFun = async () => {
  try {
    let formData = createFormDataParams({
      sessionId: localStorage.getItem("sessionId") || "",
      fileName: state.fileName
    });

    showProgressFun(state);
    const res: any = await checkFile(formData);
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
        state.disabledConfirmBtn = true;
        errorMsgDialogRef.value?.openDialog();
      } else {
        state.disabledErrorInfoBtn = true;
        state.disabledConfirmBtn = false;
        ElMessage.success("校验通过");
      }
    }
  } finally {
    closeLoadingProgress(state);
  }
};

const onCheckFile = async () => {
  // 判断数据有无变化有的话更新接口，更新成功再校验
  if (state.isTableDataChange) {
    const formData = createFormDataParams({
      sessionId: localStorage.getItem("sessionId") || "",
      fileName: state.fileName,
      pageIndex: state.pageNumber,
      data: JSON.stringify(table.value?.tableData)
    });

    await editFileExcelTableData(formData).then((res: any) => {
      if (res?.code == 200) {
        table.value.originTableData = JSON.parse(JSON.stringify(table.value.tableData || []));
        state.isTableDataChange = false;
        checkFileFun();
      }
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
  const formData = createFormDataParams({
    sessionId: localStorage.getItem("sessionId") || "",
    fileName: state.fileName
  });
  showProgressFun(state);
  try {
    await confirmImport(formData).then((res: any) => {
      if (res.code == 200) {
        state.progressCount = 100;
        ElMessage.success(`成功向${exportSuccessTipMap?.[props.sceneCode]}导入${res?.data || 0}条数据 `);
        state.open = false;
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
      const formData = createFormDataParams({
        sessionId: localStorage.getItem("sessionId") || "",
        fileName: state.fileName
      });
      try {
        await cancelImport(formData).then((res: any) => {
          if (res.code == 200) {
            ElMessage.success("取消成功");
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
watch(
  () => table.value.tableData,
  () => {
    state.isTableDataChange = JSON.stringify(table.value?.tableData) !== JSON.stringify(table.value?.originTableData); // 数据变更确认导入禁用
  },
  {
    deep: true,
    flush: "post"
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
    .error-field {
      border: 1px solid red;
      border-radius: 5px;
    }
  }
}
</style>
