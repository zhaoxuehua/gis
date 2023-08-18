<template>
  <div class="attention-list">
    <div class="title-box">
      <span>关注列表</span>
      <Icon src="Close" :size="14" @click.stop="onClose" class="icon"></Icon>
    </div>
    <div class="content-box">
      <el-form :model="form" inline>
        <el-form-item label="MMSI">
          <el-input v-model="form.objectCode" placeholder="请输入..."></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addAttention">添加</el-button>
          <el-button type="primary" @click="getTableData">搜索</el-button>
          <el-button type="primary" :disabled="!ids.length" @click="deleteAttention()">批量取消关注</el-button>
        </el-form-item>
      </el-form>
      <Table
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        class="attention-table"
        @selection-change="handleSelectionChange"
      >
        <template #action="scope">
          <span>当前定位</span>
          <span>轨迹回放</span>
          <span @click="deleteAttention([scope.row.id])">取消关注</span>
        </template>
      </Table>
    </div>
  </div>
</template>
<script setup lang="ts" name="attentionList">
import Table from "./Table/index.vue";
import { ref, reactive, computed, watch } from "vue";
import { addAttentionApi, getAttentionList, deleteAttentionApi } from "../../api/gis.js";
import { ElMessage } from "element-plus";
import type { VisualMap } from "../type";

const props = withDefaults(defineProps<{ map: VisualMap | null; index: number }>(), {
  map: () => null,
  index: () => 0
});
const emits = defineEmits(["onClose"]);

const form = ref({
  objectCode: "",
  objectTypeCode: computed(() => props.map?.defaultOptions.trackSearchCode)
});
const tableData = ref([
  {
    code: "1",
    name: "船1",
    id: 1
  }
]);
const ids = ref<number[]>([]);
const columns = [
  {
    type: "selection"
  },
  {
    label: "MMSI号",
    prop: "code"
  },
  {
    label: "船名",
    prop: "name"
  },
  {
    label: "操作",
    scope: "action"
  }
];
const pagination = reactive({
  total: 0,
  page: 1,
  pageSize: 5
});
const onClose = () => {
  emits("onClose", props.index);
};

const handleSelectionChange = (val: any) => {
  ids.value = val.map((item: any) => item.id);
};
const getTableData = async () => {
  const res: any = await getAttentionList({
    ...form.value
  });
  if (res.code === 200) {
    tableData.value = res.data;
  }
};

const addAttention = async () => {
  if (!form.value.objectCode) return ElMessage.error("MMSI号不能为空");
  const res: any = await addAttentionApi({
    objectCode: form.value.objectCode
  });
  if (res.code === 200) {
    ElMessage.success("关注成功");
    getTableData();
  }
};
const deleteAttention = async (id?: number[]) => {
  const res: any = await deleteAttentionApi((id || ids.value).join(","));
  if (res.code === 200) {
    ElMessage.success("取消关注成功");
  }
};

watch(
  () => props.map,
  () => {
    getTableData();
  }
);
</script>
<style lang="scss" scoped>
.attention-list {
  display: flex;
  flex-direction: column;
  width: 650px;
  height: 500px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);

  .title-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 60px;
    padding: 0 20px;
    background-color: #f7f7fa;
    span {
      font-size: 16px;
    }
    .icon {
      cursor: pointer;
    }
  }
  .content-box {
    flex: 1;
    padding: 20px;
    display: flex;
    flex-direction: column;
  }
  .attention-table {
    flex: 1;
  }
}
</style>
