<template>
  <el-dialog
    title="上传进度"
    v-model="state.open"
    width="560px"
    :close-on-click-modal="false"
    append-to-body
    @close="onClose"
    :destroy-on-close="true"
  >
    <div class="progress-container">
      <el-progress type="dashboard" :percentage="percentage" :color="colorFun(percentage)" />
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="onClose">取消</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup name="ProgressDialog">
import { reactive } from "vue";

interface ProgressDialogProps {
  percentage: number;
}
withDefaults(defineProps<ProgressDialogProps>(), {
  percentage: () => 0
});
const state = reactive({
  open: false
});
const openDialog = () => {
  state.open = true;
};
const onClose = () => {
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
</style>
