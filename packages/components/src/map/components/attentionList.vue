<template>
  <div class="attention-list">
    <div class="title-box">
      <span>关注列表</span>
      <Icon src="Close" :size="14" @click.stop="onClose" class="icon"></Icon>
    </div>
    <div class="content-box">
      <el-form :model="form" inline>
        <el-form-item label="MMSI">
          <el-input
            class="mmsi-input"
            v-model="form.objectCode"
            placeholder="请输入..."
            clearable
            @input="getTableData"
          ></el-input>
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
        :loading="loading"
        class="attention-table"
        @selection-change="handleSelectionChange"
      >
        <template #action="scope">
          <el-button title="当前定位" type="primary" text @click="labelOnSelect(props.map, scope.row.objectCode, false, true)">
            <el-icon :size="16"><Location /></el-icon>
          </el-button>
          <el-button title="轨迹回放" type="primary" text @click="trackPlayBack">
            <el-icon :size="16"><Refresh /></el-icon>
          </el-button>
          <el-button title="取消关注" type="primary" text @click="deleteAttention([scope.row.id])">
            <el-icon :size="16"><CircleClose /></el-icon>
          </el-button>
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
import { labelOnSelect } from "../hooks/index";
import { getTrackDataByIdFn } from "../hooks/getTrackDataById"; // 获取单个轨迹数据
import moment from "moment";

const props = withDefaults(defineProps<{ map: VisualMap | null; index: number }>(), {
  map: () => null,
  index: () => 0
});
const emits = defineEmits(["onClose"]);

const form = ref({
  objectCode: "",
  objectTypeCode: computed(() => props.map?.defaultOptions.trackSearchCode)
});
const tableData = ref([]);
const ids = ref<number[]>([]);
const loading = ref(false);
const columns = [
  {
    type: "selection"
  },
  {
    label: "对象编码",
    prop: "objectCode"
  },
  {
    label: "对象名称",
    prop: "objectName"
  },
  {
    label: "操作",
    scope: "action",
    width: 120
  }
];
const pagination = reactive({
  total: 0,
  page: 1,
  pageSize: 10
});
const onClose = () => {
  emits("onClose", props.index);
};

const handleSelectionChange = (val: any) => {
  ids.value = val.map((item: any) => item.id);
};
const getTableData = async () => {
  loading.value = true;
  const res: any = await getAttentionList(
    {
      ...form.value
    },
    {
      params: {
        pageSize: pagination.pageSize,
        pageNumber: pagination.page
      }
    }
  );
  if (res.code === 200) {
    tableData.value = res.data.items;
    pagination.total = res.data.totalNum;
  }
  loading.value = false;
};

const addAttention = async () => {
  if (!form.value.objectCode) return ElMessage.error("MMSI号不能为空");
  const res: any = await addAttentionApi({
    ...form.value
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
    getTableData();
  }
};

// 轨迹回放
const trackPlayBack = (row: { [key: string]: any }) => {
  getTrackDataByIdFn({
    code: row.objectCode,
    name: row.objectName,
    beginTime: moment(row.beginTime).format("YYYY-MM-DD HH:mm:ss"),
    endTime: moment(row.endTime).format("YYYY-MM-DD HH:mm:ss")
  });
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
  width: 580px;
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
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 20px;
    .mmsi-input {
      width: 210px;
    }
  }
  .attention-table {
    flex: 1;
  }
}
</style>
