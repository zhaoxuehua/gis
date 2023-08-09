<template>
  <div class="link-config">
    <Table class="link-table" title="" v-loading="state.loading" :data="props.link" :columns="tableColumns" :is-pageable="false">
      <template #operate="scope">
        <el-button type="primary" text @click="onDelete(scope.row.id)">删除</el-button>
      </template>
    </Table>
    <el-dialog title="添加链接" v-model="state.dialogVisible" :destroy-on-close="true">
      <Table title="" :data="linkData" :columns="tableColumns" @selection-change="handleSelectionChange"> </Table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="onClose">取消</el-button>
          <el-button type="primary" @click="onConfirm">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts" name="labelDialog">
import { ref, reactive } from "vue";
import Table from "@/components/Table/index.vue";

const emit = defineEmits(["update:link"]);
const props = withDefaults(defineProps<{ link: any[] }>(), {
  link: () => []
});
const state = reactive({
  loading: false,
  dialogVisible: false,
  selectedList: []
});

const linkData = ref([
  {
    name: "组态",
    action: "scada"
  },
  {
    name: "全景",
    action: "vr"
  },
  {
    name: "关注",
    action: "focus"
  },
  {
    name: "轨迹",
    action: "line"
  }
]);
const tableColumns = [
  {
    type: "selection"
  },
  {
    prop: "name",
    label: "按钮名称"
  },
  {
    prop: "action",
    label: "执行动作"
  }
];

const handleSelectionChange = (val: any) => {
  state.selectedList = val;
};
const onOpen = () => {
  state.dialogVisible = true;
};

const onClose = () => {
  state.dialogVisible = false;
};
const onConfirm = () => {
  state.dialogVisible = false;
  emit("update:link", state.selectedList);
};
const onDelete = (id: number) => {
  console.log(id);
};
defineExpose({
  onOpen
});
</script>
<style lang="scss" scoped>
.link-table {
  height: 200px;
}
</style>
