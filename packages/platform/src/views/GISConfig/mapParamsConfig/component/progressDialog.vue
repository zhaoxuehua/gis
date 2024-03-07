<template>
  <el-dialog
    :title="progressDialogTitle[state.type]"
    v-model="state.open"
    width="560px"
    :close-on-click-modal="false"
    append-to-body
    @close="onClose"
    :destroy-on-close="true"
  >
    <div class="progress-container">
      <el-progress type="dashboard" :percentage="state.percentage" :color="colorFun(state.percentage)" :width="160">
        <template #default="{ percentage: currentPercentage }">
          <div class="percentage-div">
            <span>{{ currentPercentage }}%</span>
            <span class="last-span">{{ state.currentProgressStatus }}</span>
          </div>
        </template>
      </el-progress>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <!-- <el-button @click="onClose">取消</el-button> -->
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup name="ProgressDialog">
import { onBeforeUnmount, reactive, watch, ref } from "vue";
import { getChunkFileUrl } from "@/api/visconfig.js";
import { progressDialogTitle } from "@/utils/fileChunk";

interface ProgressDialogProps {
  data: any;
}
interface stateType {
  open: boolean;
  type: string;
  percentage: number;
  currentProgressStatus: string;
}

const props = withDefaults(defineProps<ProgressDialogProps>(), {
  data: () => {}
});
const emits = defineEmits(["updateProgressStatus"]);
const state: stateType = reactive({
  open: false,
  type: "",
  percentage: 0,
  currentProgressStatus: ""
});

let timer = ref<any>(null);
const openDialog = (type: string) => {
  state.type = type;
  state.open = true;
};
const onClose = () => {
  clearTimer();
  state.open = false;
};
const colorFun = (percentage: number) => {
  if (percentage == 0) {
    return "#909399";
  } else if (percentage > 0 && percentage < 20) {
    return "#F56C6C";
  } else if (percentage >= 20 && percentage < 40) {
    return "#e6a23c";
  } else if (percentage >= 40 && percentage < 60) {
    return "#1989fa";
  } else if (percentage >= 60 && percentage < 80) {
    return "#3cabe7";
  } else if (percentage >= 80 && percentage < 100) {
    return "#a0d468";
  } else {
    return "#67C23A";
  }
};

// 清除定时器
const clearTimer = () => {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
};

// 刷新解压状态
const refreshProgressStatus = () => {
  clearTimer();
  timer.value = setInterval(async () => {
    if (!props.data?.[state.type]?.fileHash) return;
    await getChunkFileUrl(props.data?.[state.type]?.fileHash).then((res: any) => {
      if (res?.code == 200) {
        emits("updateProgressStatus", state.type, res?.data?.status || "");
      }
    });
  }, 2000);
};

watch(
  () => {
    const uploadTypeObj = props.data?.[state.type];
    return [
      uploadTypeObj?.currentProgressStatus,
      uploadTypeObj?.completedUploadCount,
      uploadTypeObj?.allChunksFile?.length,
      uploadTypeObj?.isNeedRefresh
    ];
  },
  ([currentProgressStatus, completedUploadCount, allChunksFileLength, isNeedRefresh]) => {
    state.currentProgressStatus = currentProgressStatus;
    state.percentage = allChunksFileLength ? Math.floor((completedUploadCount / allChunksFileLength) * 100) || 0 : 0;
    if (isNeedRefresh && ["解压完成"]?.includes(currentProgressStatus)) {
      state.open = false;
    }
    if (isNeedRefresh && ["解压中"]?.includes(currentProgressStatus)) {
      refreshProgressStatus();
    } else {
      clearTimer();
    }
  }
);

onBeforeUnmount(() => {
  clearTimer();
});

defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped>
.progress-container {
  display: flex;
  align-items: center;
  justify-content: center;
}
.percentage-div {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  span {
    display: inline-block;
    font-size: 15px;
  }
  .last-span {
    margin-top: 10px;
  }
}
</style>
