<template>
  <div class="attention-list">
    <div class="title-box">
      <span>关注列表</span>
      <Icon src="Close" :size="14" @click.stop="onClose" class="icon"></Icon>
    </div>
    <div class="content-box">
      <div class="operate-area">
        <div>
          <el-form :model="form" inline>
            <el-form-item label="查询对象" required>
              <el-select v-model="form.objectTypeCode" placeholder="请选择..." @change="getTableData" class="attention-input">
                <el-option v-for="(item, idx) in realtimeDataList" :key="idx" :label="item.name" :value="item.code" />
              </el-select>
            </el-form-item>
            <el-form-item :label="keywordConfig?.code || '标识'">
              <el-input
                v-model="form.objectCode"
                placeholder="请输入..."
                clearable
                @input="getTableData"
                class="attention-input"
              ></el-input>
            </el-form-item>
          </el-form>
        </div>
        <div class="right-operate">
          <el-form-item>
            <el-button type="primary" @click="addAttention">添加</el-button>
            <el-button type="primary" @click="getTableData">搜索</el-button>
            <el-button type="primary" :disabled="!ids.length" @click="deleteAttention()">批量取消关注</el-button>
          </el-form-item>
        </div>
      </div>

      <Table
        :columns="columns"
        :data="tableData"
        :pagination="pagination"
        :loading="loading"
        class="attention-table"
        @selection-change="handleSelectionChange"
        @page-size-change="handlePageSizeChange"
        @page-current-change="handlePageCurrentChange"
      >
        <template #action="scope">
          <el-link
            type="primary"
            class="my-el-link"
            title="当前定位"
            :underline="false"
            @click.stop="labelOnSelect(props.map, scope.row.objectCode, false, true)"
            ><el-icon :size="14"><Location /></el-icon
          ></el-link>
          <el-link type="primary" class="my-el-link" title="轨迹回放" :underline="false" @click.stop="onTrack(scope.row)"
            ><el-icon :size="14"><Connection /></el-icon
          ></el-link>
          <el-link
            type="primary"
            class="my-el-link"
            title="取消关注"
            :underline="false"
            @click.stop="deleteAttention([scope.row.id])"
            ><el-icon :size="14"><CircleClose /></el-icon
          ></el-link>
        </template>
      </Table>
    </div>
    <el-dialog v-model="state.dialogVisible" title="轨迹查询" width="560px" append-to-body>
      <el-date-picker
        v-model="state.dateTimes"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD HH:mm:ss"
        popper-class="canvas-date-picker"
        style="width: 400px !important"
      >
      </el-date-picker>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="trackPlayBack">查询</el-button>
          <el-button @click="onTrackClose">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts" name="attentionList">
import Table from "./Table/index.vue";
import { ref, reactive, computed, onMounted } from "vue";
import { addAttentionApi, getAttentionList, deleteAttentionApi } from "../../api/gis.js";
import { ElMessage } from "element-plus";
import type { VisualMap } from "../type";
import { labelOnSelect } from "../hooks/index";
import { getTrackDataByIdFn } from "../hooks/getTrackDataById"; // 获取单个轨迹数据
import Icon from "./Icon.vue";
import { useGisStore } from "../../stores/modules/gis";

const gisStore = useGisStore();

const props = withDefaults(defineProps<{ map: VisualMap | null; index: number }>(), {
  map: () => null,
  index: () => 0
});
const emits = defineEmits(["onClose"]);

// 实时查询对象类型列表
const realtimeDataList = computed(() => {
  return gisStore?.realtimeDataList || [];
});

// 关键词配置
const keywordConfig = computed(() => {
  return gisStore?.keywordConfig;
});

// 轨迹弹框
const state = reactive({
  dialogVisible: false,
  dateTimes: [] as any,
  row: {} as any // 轨迹回放行数据
});

const form = ref({
  objectCode: "",
  objectTypeCode: realtimeDataList.value?.length ? realtimeDataList.value[0]?.code : "" // 初始值
});
const tableData = ref([]);
const ids = ref<number[]>([]);
const loading = ref(false);
const columns = [
  {
    type: "selection"
  },
  {
    label: keywordConfig.value?.code || "对象编码",
    prop: "objectCode"
  },
  {
    label: keywordConfig.value?.name || "对象名称",
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

const handlePageSizeChange = (val: any) => {
  pagination.pageSize = val;
  getTableData();
};

const handlePageCurrentChange = (val: any) => {
  pagination.page = val;
  getTableData();
};

const getTableData = async () => {
  if (!form.value.objectTypeCode) return ElMessage.warning("请选择查询对象");
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
  if (!form.value.objectTypeCode) return ElMessage.warning("请选择查询对象");
  if (!form.value.objectCode) return ElMessage.warning(`${keywordConfig.value?.code || "标识"}不能为空`);
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

const onTrack = (row: { [key: string]: any }) => {
  state.row = row;
  state.dialogVisible = true;
};

const onTrackClose = () => {
  state.dialogVisible = false;
};

// 轨迹回放
const trackPlayBack = () => {
  getTrackDataByIdFn({
    code: state.row?.objectCode,
    name: state.row?.objectName,
    objectTypeCode: state.row?.objectTypeCode, // 实时数据对象类型
    beginTime: state.dateTimes[0],
    endTime: state.dateTimes[1]
  });
  onTrackClose();
};

onMounted(() => {
  getTableData();
});
</script>
<style lang="scss" scoped>
.attention-list {
  display: flex;
  flex-direction: column;
  width: 760px;
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
    .attention-input {
      width: 150px;
    }
    .operate-area {
      display: flex;
      flex-direction: row;
      width: 100%;
      .right-operate {
        display: flex;
        flex: 1;
        flex-direction: row;
        justify-content: flex-end;
      }
    }
  }
  .attention-table {
    height: 350px;
    .my-el-link {
      margin-right: 12px !important;
    }
  }
}
</style>
