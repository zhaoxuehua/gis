<!-- 导入附件 -->
<template>
  <el-dialog
    :title="config?.dialogTitle"
    v-model="state.open"
    width="1140px"
    :close-on-click-modal="false"
    :before-close="onClose"
    append-to-body
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
        <el-upload :before-upload="beforeUpload" :http-request="uploadFile" :show-file-list="false" ref="uploadRef" class="ml10">
          <el-button type="primary" :disabled="state.isProcessing">选择本地文件</el-button>
        </el-upload>

        <!-- 选择导入字段需要后端返回添加 -->
      </div>
    </div>
    <div class="attachments-area" v-loading="state.loading && { text: state.loadingText }">
      <div v-for="(file, index) in state.selectedFiles" :key="index" class="attachments">
        {{ file.name }}
        <el-button type="primary" link @click="onDeleteFile(index, file)" :disabled="state.isProcessing">撤销</el-button>
      </div>
    </div>
  </el-dialog>
  <ErrorMsgDialog ref="errorMsgDialogRef" :data="state.errorDataMsg" type="attachments"></ErrorMsgDialog>
</template>

<script lang="ts" setup name="UploadAttachments">
import { reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { upLoadFileGetTableData, confirmImport, cancelImport } from "../../../api/gis";
import ErrorMsgDialog from "./errorMsgDialog.vue";
import { showProgressFun, closeLoadingProgress, beforeUploadFun } from "./uploadFun";

const config: any = {
  dialogTitle: "导入附件",
  accept: ["zip"],
  size: 100,
  tip: "1. 仅支持单个压缩包上传，格式为.zip，最大不超过100M\n2. 请确认压缩包中的文件格式为.png、.jpg\n3. 文件命名方式为【唯一值_字段名称_序号】，（如XJ00_设备标签_1,则代表XJ001的字段'设备标签'中上传的第一个附件）\n4. 当前唯一值为设备编码"
};

const props = withDefaults(defineProps<{ fileTitle: string; sceneCode: string }>(), {
  fileTitle: () => "导入文件",
  sceneCode: () => ""
});

const errorMsgDialogRef = ref<InstanceType<typeof ErrorMsgDialog>>();
const uploadRef = ref();

const state: any = reactive({
  open: false,
  fileName: "",
  disabledErrorInfoBtn: true,
  disabledConfirmBtn: true,
  errorDataMsg: [],
  isShowLoadingProgress: false, // 2秒后才显示进度条的控制
  progressCount: 0,
  loadingText: " ",
  selectedFiles: [],
  loading: false,
  isProcessing: false // 是否上传、导入过程中
});

const resetFun = () => {
  state.disabledErrorInfoBtn = true;
  state.disabledConfirmBtn = true;
  state.isShowLoadingProgress = false;
  state.progressCount = 0;
};

const openDialog = () => {
  state.open = true;
  state.loading = false;
  state.selectedFiles = [];
  state.isProcessing = false;
  resetFun();
};

const onClose = () => {
  if (state.isProcessing) {
    return ElMessage.warning(`有文件正在处理中，请先取消后再关闭！`);
  }
  state.open = false;
};

const beforeUpload = (file: any) => {
  const { accept, size } = config;
  state.fileName = file.name;
  return beforeUploadFun(file, accept, size, () => {
    state.selectedFiles = [];
    state.selectedFiles.push(file);
  });
};

// 后端返回校验信息
const uploadFile = async (content: any) => {
  // 需要将确认导入禁用
  resetFun();
  showProgressFun(state);
  let formData = createFormDataParams({
    sessionId: localStorage.getItem("sessionId") || "",
    excelFile: content.file
  });
  try {
    const res: { [key: string]: any } = await upLoadFileGetTableData(formData);
    if (res.code == 200) {
      state.progressCount = 100;
      state.errorDataMsg = (res?.data || []).map((row: any) => {
        return {
          fileName: row?.[0],
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

// 错误信息
const openErrorMsg = () => {
  errorMsgDialogRef.value?.openDialog();
};

// 导入
const confirmImportFun = async () => {
  ElMessageBox.confirm(
    "<span style='color:red'>导入对应字段附件时，如果该字段已存在文件，会清除原有文件后进行导入操作，是否继续？</span>",
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      dangerouslyUseHTMLString: true
    }
  ).then(async () => {
    const formData = createFormDataParams({
      sessionId: localStorage.getItem("sessionId") || "",
      fileName: state.fileName
    });
    showProgressFun(state);
    try {
      await confirmImport(formData).then((res: any) => {
        if (res.code == 200) {
          state.progressCount = 100;
          ElMessage.success(`${res?.msg}`);
          state.open = false;
        }
      });
    } finally {
      closeLoadingProgress(state);
    }
  });
};

const createFormDataParams = (params: any = {}) => {
  const formData = new FormData();
  formData.append("sceneCode", props?.sceneCode);
  for (const [key, value] of Object.entries(params)) {
    formData.append(key, value as any);
  }
  return formData;
};

// 取消
const onStop = () => {
  ElMessageBox.confirm("<span style='color:red'>取消会把导入的数据都丢弃！确定取消？</span>", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning",
    dangerouslyUseHTMLString: true
  }).then(async () => {
    const formData = createFormDataParams({
      sessionId: localStorage.getItem("sessionId") || "",
      fileName: state.fileName
    });
    try {
      await cancelImport(formData).then((res: any) => {
        if (res.code == 200) {
          ElMessage.success(`${res?.msg}`);
          closeLoadingProgress(state);
        }
      });
    } catch {}
  });
};

const onDeleteFile = (index: number, file: any) => {
  state.selectedFiles?.splice(index, 1);
  uploadRef.value.handleRemove(file);
  resetFun();
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
  .attachments-area {
    margin: 20px 0;
    .attachments {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px;
      background-color: #f5f7fa;
    }
  }
}
</style>
