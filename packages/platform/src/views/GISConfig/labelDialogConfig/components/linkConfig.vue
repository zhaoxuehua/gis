<template>
  <div class="link-config">
    <Table class="link-table" title="" v-loading="state.loading" :data="props.link" :columns="tableColumns" :is-pageable="false">
      <template #operate="scope">
        <el-button type="primary" text @click="onDelete(scope.row.buttonType, scope.$index)">删除</el-button>
      </template>
    </Table>
    <el-dialog title="添加链接" class="el-dialog-default" v-model="state.dialogVisible" :destroy-on-close="true">
      <Table
        class="link-table"
        title=""
        :data="unBindLinkData"
        :columns="unSelectTableColumns"
        @selection-change="handleSelectionChange"
      >
      </Table>
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
import { ref, reactive, watch } from "vue";
import Table from "../../../../../../components/src/map/components/Table/index.vue";
import { getUnBindLinkApi, deleteLinkApi, bindLinkApi } from "../../../../api/modules/labelDialogConfig";
import { ElMessage, ElMessageBox } from "element-plus";

const emit = defineEmits(["update:link"]);
const props = defineProps({
  link: Array,
  equipTypeId: Number,
  currentType: String
});
const state = reactive({
  loading: false,
  dialogVisible: false,
  selectedList: [],
  ids: []
});

const unBindLinkData = ref([]);
const bindLinkData: any = ref([]);
const tableColumns = [
  // {
  //   type: "selection"
  // },
  {
    prop: "name",
    label: "按钮名称"
  },
  {
    prop: "action",
    label: "执行动作"
  },
  {
    label: "操作",
    scope: "operate"
  }
];
const unSelectTableColumns = [
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
  state.ids = val.map((item: any) => item.buttonType);
  state.selectedList = val;
};
const getUnBindLink = async () => {
  const res: any = await getUnBindLinkApi(props.equipTypeId!, props.currentType!);
  if (res.code === 200) {
    unBindLinkData.value = res.data;
  }
};
const onOpen = () => {
  state.dialogVisible = true;
  getUnBindLink();
};

const onClose = () => {
  state.dialogVisible = false;
};
const onConfirm = async () => {
  const res: any = await bindLinkApi({
    equipTypeId: props.equipTypeId,
    currentType: props.currentType,
    buttons: state.ids.join(",")
  });
  if (res.code === 200) {
    state.dialogVisible = false;
    emit("update:link", [...bindLinkData.value!, ...state.selectedList]);
  }
};
const onDelete = async (id: number, index: number) => {
  ElMessageBox.confirm("确定要删除吗", "警告", {
    type: "warning",
    confirmButtonText: "确定"
  }).then(async () => {
    const res: any = await deleteLinkApi({
      equipTypeId: props.equipTypeId,
      currentType: props.currentType,
      buttonType: id
    });
    if (res.code === 200) {
      ElMessage.success("删除成功");
      bindLinkData.value!.splice(index, 1);
      emit("update:link", bindLinkData.value);
    }
  });
};
watch(
  () => props.link,
  () => {
    bindLinkData.value = props.link;
  }
);
defineExpose({
  onOpen
});
</script>
<style lang="scss" scoped>
.link-table {
  height: 172px;
}
</style>
