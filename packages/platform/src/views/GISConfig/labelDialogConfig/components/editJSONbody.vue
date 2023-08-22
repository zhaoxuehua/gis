<template>
  <el-dialog title="编辑" v-model="state.dialogVisible" class="el-dialog-default">
    <span class="label">展示方式</span>
    <el-select v-model="state.tile">
      <el-option label="平铺展示" :value="true" key="flat"></el-option>
      <el-option label="表格展示" :value="false" key="table"></el-option>
    </el-select>
    <Table
      ref="jsonTableRef"
      class="json-table"
      row-key="tempId"
      :data="state.JsonBodyData"
      :columns="jsonBodyColumns"
      default-expand-all
      @selection-change="handleSelectionChange"
    >
      <template #header>
        <el-checkbox></el-checkbox>
      </template>
      <template #selection>
        <el-checkbox></el-checkbox>
      </template>
    </Table>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="onClose">取消</el-button>
        <el-button type="primary" @click="onConfirm">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script setup lang="ts" name="editJSONbody">
import { ElMessage } from "element-plus";
import { reactive, ref, nextTick } from "vue";
import Table from "../../../../../../components/src/map/components/Table/index.vue";
import { updateJSONBody, getAllJSONbodyApi } from "../../../../api/modules/labelDialogConfig";

const emit = defineEmits(["success"]);

const jsonTableRef = ref();
const state = reactive({
  dialogVisible: false,
  selectJSONBody: [],
  JsonBodyData: [],
  editJSONbodyIndex: 0,
  tile: true
});
const jsonBodyColumns = [
  {
    scope: "selection",
    width: 100
  },
  // {
  //   type: "selection"
  // },
  {
    label: "key",
    prop: "field"
  },
  {
    label: "类型",
    prop: "fieldType"
  },
  {
    label: "名称",
    prop: "remark"
  }
];

const handleSelectionChange = (val: any) => {
  state.selectJSONBody = val;
};

const onOpen = async (id: number, index: number, checkedConfig: any[]) => {
  state.dialogVisible = true;
  state.editJSONbodyIndex = index;
  const res: any = await getAllJSONbodyApi(id);
  if (res.code === 200) {
    state.JsonBodyData = res.data;
    nextTick(() => {
      // 没选属性  根元素必选
      state.tile = checkedConfig?.[0].tile || true;
      const root: any = state.JsonBodyData.filter((item: any) => item.field === "root")?.[0] || {};
      jsonTableRef.value?.toggleRowSelection(root, true);
      root.children?.forEach((item: any) => {
        jsonTableRef.value?.toggleRowSelection(item, false);
      });
      const checkedroot: any = checkedConfig?.filter((item: any) => item.field === "root")?.[0] || {};
      checkedroot.children?.forEach((item: any) => {
        const sameChild = root.children.find((rchild: any) => rchild.tempId === item.tempId);
        sameChild && jsonTableRef.value?.toggleRowSelection(sameChild, true);
      });
    });
  }
};

const getTree: any = (list: any[], parent: any) => {
  let children = list.filter(item => (item.parent || null) === parent);
  return children.map((item: any) => {
    return {
      ...item,
      tile: state.tile,
      children: getTree(list, item.tempId)
    };
  });
};

const onConfirm = async () => {
  const tree = getTree(state.selectJSONBody, null);
  const res: any = await updateJSONBody(tree);
  if (res.code === 200) {
    state.dialogVisible = false;
    ElMessage.success("结构体配置成功");
    emit("success", tree, state.editJSONbodyIndex);
  }
};

const onClose = () => {
  state.dialogVisible = false;
};

defineExpose({
  onOpen
});
</script>
<style lang="scss" scoped>
.json-table {
  margin-top: 10px;
  height: 300px;
}
.label {
  display: inline-block;
  margin-right: 10px;
}
</style>
