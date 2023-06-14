<template>
  <div class="legend-library-config">
    <div class="one-search">
      <el-form :model="query.params">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="图例名称：">
              <el-autocomplete
                class="inline-input"
                v-model="query.params.name"
                :fetch-suggestions="querySearch"
                placeholder="请输入..."
                :trigger-on-focus="false"
                @select="handleSelect"
                value-key="name"
                clearable
                @clear="query.onQuery"
              >
              </el-autocomplete>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-button class="btn-search" type="primary" @click="query.onQuery">
              <Icon src="Search"></Icon>
              搜索
            </el-button>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <div class="option">
      <div class="title">图例库</div>
      <div class="btn">
        <Auth :value="MENU_BTNS_AUTH.VISCONFIG_GISCONFIG_MAPLegendCONFIG_ADD">
          <el-button type="primary" @click="onAdd"><Icon src="Upload"></Icon>{{ "上传图例" }}</el-button>
        </Auth>
      </div>
    </div>
    <div class="rule-instance-table">
      <Card v-for="(item, index) in table.data" :key="index" :info="item" @success-add="query.onQuery"></Card>
    </div>
    <Pagination
      :total="table.total"
      v-model:page="query.params.pageNumber"
      v-model:limit="query.params.pageSize"
      @pagination="query.getPagination"
    ></Pagination>
    <CreateEditLegend ref="createEditLegend" @success-add="query.onQuery"></CreateEditLegend>
  </div>
</template>

<script setup lang="ts" name="LayerConfig">
import { onMounted, ref } from "vue";
import { MENU_BTNS_AUTH } from "@/components/auth/menuBtns";
import { getLabelTypeList } from "@/api/visconfig.js";
import { handleParam } from "@/utils/common.js";
import { ElMessage } from "element-plus";
import Card from "./component/card.vue";
import CreateEditLegend from "./component/createEditLegend.vue";
import { TableList } from "../type";

const createEditLegend = ref();
// 查询条件
const defaultParams = {
  name: "",
  orderByColumn: "",
  isAsc: "",
  pageNumber: 1,
  pageSize: 10
};
const query = ref({
  params: { ...defaultParams },
  getPagination: (obj: { [key: string]: any }) => {
    query.value.params.pageNumber = obj.page;
    query.value.params.pageSize = obj.limit;
    query.value.onQuery();
  },
  onQuery: () => {
    table.value.getTableData();
  }
});

const table = ref<TableList>({
  loading: false,
  total: 0,
  ids: [],
  data: [],
  getTableData: async () => {
    table.value.loading = true;
    const res: { [key: string]: any } = await getLabelTypeList(...(handleParam(query.value.params) as [string, object]));
    if (res?.data?.items) {
      table.value.data = res.data.items.filter((item: any) => item.labelTypeImagePath);
      table.value.total = res.data.totalNum;
    } else {
      ElMessage.error("接口异常");
    }
    table.value.loading = false;
  },
  onSelectionChange: () => {},
  onEdit: () => {}
});

const onAdd = () => {
  createEditLegend.value.openDialog();
};

const querySearch: (queryString: string, cb: (arg: any) => void) => void = async (
  queryString: string,
  cb: (arg: any) => void
) => {
  let oldPageSize = query.value.params.pageSize;
  query.value.params.name = queryString;
  query.value.params.pageSize = 10000;
  query.value.params.pageNumber = 1;
  const res: { [key: string]: any } = await getLabelTypeList(...(handleParam(query.value.params) as [string, object]));
  // 调用 callback 返回建议列表的数据
  cb(res.data.items);
  query.value.params.pageSize = oldPageSize;
};

const handleSelect = async () => {
  table.value.loading = true;
  const res: { [key: string]: any } = await getLabelTypeList(...(handleParam(query.value.params) as [string, object]));
  table.value.data = res.data.items;
  table.value.total = res.data.totalNum;
  table.value.loading = false;
};

onMounted(() => {
  table.value.getTableData();
});
</script>

<style lang="scss" scoped>
.legend-library-config {
  width: calc(100vw - 260px);
  height: calc(100vh - 109px);
  padding: 20px;
  background: var(--background-color);
}
.legend-library-config .inline-input {
  width: 100%;
}
.rule-instance-table {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  width: 100%;
  max-height: calc(100% - 140px);
  margin-bottom: 20px;
  overflow: auto;
}
</style>
