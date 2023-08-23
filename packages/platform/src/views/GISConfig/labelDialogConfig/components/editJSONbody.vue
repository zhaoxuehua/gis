<template>
  <el-dialog title="编辑" v-model="state.dialogVisible" class="el-dialog-default" :destroy-on-close="true">
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
    >
      <template #selection-header>
        <el-checkbox @change="val => handleCheck(val, state.JsonBodyData[0])"></el-checkbox>
      </template>
      <template #selection="scope">
        <el-checkbox
          v-model="scope.row.checked"
          :indeterminate="getIndeterminate(scope.row)"
          @change="val => handleCheck(val, scope.row)"
        ></el-checkbox>
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
    width: 80,
    header: "selection-header"
  },
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

const onOpen = async (id: number, index: number, checkedConfig: any[]) => {
  state.dialogVisible = true;
  state.editJSONbodyIndex = index;
  const res: any = await getAllJSONbodyApi(id);
  if (res.code === 200) {
    state.JsonBodyData = res.data;
    nextTick(() => {
      // 没选属性  根元素必选
      state.tile = checkedConfig?.[0]?.tile || true;
      const getCheckedField = (config: any[], checkedField: any[]) => {
        return config.reduce((pre, cur) => {
          pre.push(cur.field);
          if (cur.children.length) getCheckedField(cur.children, checkedField);
          return pre;
        }, checkedField);
      };
      const checkedField = getCheckedField(checkedConfig, []);
      console.log(checkedField);
      const setCheckStatus = (list: any[]) => {
        list.forEach(item => {
          if (checkedField.includes(item.field)) {
            item.checked = true;
          }
          if (item.children.length) {
            setCheckStatus(item.children);
          }
        });
      };
      setCheckStatus(state.JsonBodyData);
    });
  }
};

const handleCheck: any = (checked: boolean, row: any) => {
  row.checked = checked;
  row.children?.forEach((item: any) => {
    item.checked = checked;
    item.children?.length && handleCheck(item.checked, item);
  });
};

const getIndeterminate = (row: any) => {
  let indeterminate = false;
  let unchecked = 0;
  let checked = 0;
  let count = 0;
  const getStatus = (data: any) => {
    data.children.forEach((item: any) => {
      if (item.checked) {
        checked++;
      } else {
        unchecked++;
      }
      count++;
      item.children.length && getStatus(item);
    });
  };
  getStatus(row);
  if (count === unchecked || count === checked) {
    indeterminate = false;
  } else {
    indeterminate = true;
    row.indeterminate = true;
  }
  return indeterminate;
};

const filterTree = (tree: any[]) => {
  let filteredTree: any = [];
  let newTree = JSON.parse(JSON.stringify(tree));
  newTree.forEach((node: any) => {
    if (node.checked || node.indeterminate) {
      filteredTree.push(node);
      if (node.children && node.children.length > 0) {
        node.children = filterTree(node.children);
      }
    }
  });
  return filteredTree;
};

const onConfirm = async () => {
  const tree = filterTree(state.JsonBodyData);
  console.log(tree);
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
  height: 300px;
  margin-top: 10px;
}
.label {
  display: inline-block;
  margin-right: 10px;
}
</style>
