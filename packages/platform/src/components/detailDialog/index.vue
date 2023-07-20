<template>
  <div>
    <el-dialog
      :title="title"
      v-model="state.open"
      :width="`${width}px`"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <el-descriptions :column="2" border class="menu-detail-common" :key="state.key" v-if="state.open">
        <template v-for="item in state.info" :key="item.name">
          <!-- 带有optional属性的，有值的时候才会显示 -->
          <el-descriptions-item :label="item.label" v-if="!(item.optional && !item.value)" width="100px">
            <span v-if="!item.slot">
              <Popover :info="item.value" :len="20" placement="right"></Popover>
            </span>
            <slot v-else :name="item.name" :row="rowOption"></slot>
          </el-descriptions-item>
        </template>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="DetailDialog">
import { reactive, ref, nextTick } from "vue";
import * as detailLabel from "@/constant/detailLabel";
import { LabelOption, Label } from "./typing";
interface DeatilDialogProps {
  constant: any;
  title: string;
  width?: number;
}
const props = withDefaults(defineProps<DeatilDialogProps>(), {
  constant: "",
  title: "",
  width: 560
});
const state = reactive({
  open: false,
  options: [],
  key: 0,
  info: [] as LabelOption[]
});
let rowOption = ref();
const openDialog = (row: object) => {
  nextTick(() => {
    initRowOption(row);
    state.open = true;
  });
};
const initRowOption = (row: object) => {
  rowOption.value = JSON.parse(JSON.stringify(row));
  let labelOption = (detailLabel as Label)[props.constant];
  labelOption.forEach((item: LabelOption) => {
    item.value = rowOption["value"][item.name];
  });
  state.info = JSON.parse(JSON.stringify(labelOption));
};
const onClose = () => {
  state.open = false;
};
defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped>
.my-label {
  width: 120px;
}
</style>
