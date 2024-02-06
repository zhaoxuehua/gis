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
        <el-button type="primary" class="ml10" @click="onStop">取消</el-button>
        <el-button type="primary" :disabled="state.disabledConfirmBtn" @click="confirmImportFun">确认导入</el-button>
        <el-button type="primary" :disabled="state.disabledErrorInfoBtn" @click="openErrorMsg">错误信息</el-button>
        <el-upload :before-upload="beforeUpload" :http-request="uploadFile" :show-file-list="false" ref="uploadRef" class="ml10">
          <el-button type="primary">选择本地文件</el-button>
        </el-upload>
      </div>
    </div>
    <div class="attachments-area" v-loading="state.loading && { text: state.loadingText }">
      <div v-for="(file, index) in state.selectedFiles" :key="index" class="attachments">
        {{ file.name }}
        <el-button type="primary" link @click="onDeleteFile(index, file)">撤销</el-button>
      </div>
    </div>
  </el-dialog>
  <ErrorMsgDialog ref="errorMsgDialogRef" :data="state.errorDataMsg"></ErrorMsgDialog>
</template>

<script lang="ts" setup name="DownloadImport">
import { reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { upLoadFile, confirmImport, cancelImport } from "../../../api/device";
import ErrorMsgDialog from "./errorMsgDialog.vue";
import { showProgressFun, closeLoadingProgress, beforeUploadFun } from "./uploadFun";

const config: any = {
  dialogTitle: "导入附件",
  accept: ["zip"],
  size: 100,
  tip: "1. 仅支持单个压缩包上传，格式为.zip，最大不超过100M\n2. 请确认压缩包中的文件格式为.png、.jpg\n3. 文件命名方式为【唯一值_字段名称_序号】，（如XJ00_设备标签_1,则代表XJ001的字段'设备标签'中上传的第一个附件）\n4. 当前唯一值为设备编码\n5. 序号按所填字段需要的附件数量填写，如需要3个附件，则序号为1、2、3"
};

withDefaults(defineProps<{ fileTitle: string }>(), {
  fileTitle: () => "导入文件"
});

const errorMsgDialogRef = ref<InstanceType<typeof ErrorMsgDialog>>();
const uploadRef = ref();

const state: any = reactive({
  open: false,
  disabledErrorInfoBtn: true,
  disabledConfirmBtn: true,
  errorDataMsg: [],
  isShowLoadingProgress: false, // 2秒后才显示进度条的控制
  progressCount: 0,
  loadingText: " ",
  selectedFiles: [],
  loading: false,
  canClickClose: true // 上传、导入过程中不可点击
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
  state.canClickClose = true;
  resetFun();
};

const onClose = () => {
  if (!state.canClickClose) {
    return ElMessage.warning(`有文件正在处理中，请先取消后再关闭！`);
  }
  state.open = false;
};

const beforeUpload = (file: any) => {
  const { accept, size } = config;
  return beforeUploadFun(file, accept, size, () => {
    state.selectedFiles = [];
    state.selectedFiles.push(file);
  });
};

// 后端返回校验信息
const uploadFile = async (content: any) => {
  let formData = new FormData();
  formData.append("uploadFile", content.file);
  // 需要确认导入禁用
  resetFun();
  showProgressFun(state);
  try {
    const res: { [key: string]: any } = await upLoadFile(formData);
    if (res.code == 200) {
      state.progressCount = 100;
      // 错误信息处理（看有无错误信息，确认导入是否可点击）
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
      if (!state.errorDataMsg?.length) {
        state.disabledConfirmBtn = false;
      }

      state.disabledErrorInfoBtn = false;
    }
  } finally {
    closeLoadingProgress(state);
  }
};

// 错误信息
const openErrorMsg = () => {
  errorMsgDialogRef.value?.openDialog();
};

// 导入（问题：校验通过后还可以修改，那最终导入的会不会有问题,是后端根据上次导入的入库吗）
const confirmImportFun = async () => {
  showProgressFun(state);
  try {
    await confirmImport({}).then((res: any) => {
      if (res.code == 200) {
        state.progressCount = 100;
        ElMessage.success(`${res?.msg}`);
      }
    });
  } finally {
    closeLoadingProgress(state);
  }
};

// 取消(会停止上传、校验、导入并将导入数据丢掉)  是后端把正在处理的接口处理返回还是前端根据此接口将进度及关闭可点击自己维护（即调用closeLoadingProgress）
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
