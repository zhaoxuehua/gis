<template>
  <el-dialog
    title="错误信息"
    v-model="state.open"
    width="900px"
    :close-on-click-modal="false"
    append-to-body
    @close="onClose"
    :destroy-on-close="true"
  >
    <el-table
      :data="data"
      highlight-current-row
      empty-text="暂无数据"
      :row-style="{ height: 40 + 'px' }"
      :cell-style="{ padding: '0px', whiteSpace: 'nowrap' }"
      stripe
      border
    >
      <el-table-column
        :label="type == 'file' ? '错误行号' : '文件名称'"
        :prop="type === 'file' ? 'rn' : 'fileName'"
        width="100"
      ></el-table-column>
      <el-table-column label="错误原因" prop="errorMsg" show-overflow-tooltip></el-table-column>
    </el-table>
  </el-dialog>
</template>

<script lang="ts" setup name="DownloadImport">
import { reactive } from "vue";

withDefaults(defineProps<{ data: any; type: string }>(), {
  data: () => [],
  type: () => "file"
});

const state: any = reactive({
  open: false
});

const openDialog = () => {
  state.open = true;
};

const onClose = () => {
  state.open = false;
};

defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped></style>
