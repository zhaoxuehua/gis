<template>
  <div>
    <el-form :model="query.params">
      <el-row :gutter="20">
        <el-col :span="10">
          <el-form-item label="设备名称：" style="float: left; margin-right: 15px">
            <el-input
              class="action-search"
              placeholder="请输入..."
              v-model="query.params.name"
              clearable
              @keyup.enter.stop="querySearch"
              @clear="querySearch"
            ></el-input>
          </el-form-item>
          <el-button type="primary" @click="querySearch"><Icon src="Search"></Icon>搜索</el-button>
        </el-col>
        <el-col :span="14" class="right-align">
          <el-button type="primary" @click="onConfirm" :disabled="table.chooseList.length === 0">确认选择</el-button>
        </el-col>
      </el-row>
    </el-form>

    <el-table
      :data="table.data"
      v-loading="table.loading"
      highlight-current-row
      empty-text="暂无数据"
      :row-style="{ height: 32 + 'px' }"
      :cell-style="{ padding: '0px' }"
      @selection-change="table.onSelectionChange"
      max-height="360"
      stripe
      border
    >
      <el-table-column type="selection" :selectable="selectable"></el-table-column>
      <el-table-column label="设备编码" prop="code"> </el-table-column>
      <el-table-column label="设备名称" width="200">
        <template #default="scope">
          {{ scope.row.name }}
        </template>
      </el-table-column>
      <el-table-column label="设备类型" prop="equipTypeName"></el-table-column>
      <el-table-column label="启用状态" prop="enable" width="80">
        <template #default="scope">
          {{ scope.row.enable ? "启用" : "禁用" }}
        </template>
      </el-table-column>
      <el-table-column label="GIS标签信息" prop="gisLabelInfo" show-overflow-tooltip>
        <template #default="scope">
          {{ JSON.stringify(scope.row.gisLabelInfo) }}
        </template>
      </el-table-column>
    </el-table>

    <div v-if="table.data?.length">
      <paginationCom
        :total="table.total"
        v-model:page="query.params.pageNumber"
        v-model:limit="query.params.pageSize"
        @pagination="query.getPagination"
      >
      </paginationCom>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { cloneDeep } from "lodash";
import { handleParam } from "@/utils/common.js";
import { deviceEquipList } from "../../api/device";
import { getLabelInfoByEquipId } from "../../api/gis.js";
import type { TableList } from "../type";
import Icon from "./Icon.vue";
import paginationCom from "./paginationCom.vue";

const emits = defineEmits(["onConfirm"]);

const query = ref({
  params: {
    name: "",
    orderByColumn: "",
    isAsc: "",
    pageNumber: 1,
    pageSize: 10
  },
  getPagination: (obj: any) => {
    query.value.params.pageNumber = obj.page;
    query.value.params.pageSize = obj.limit;
    query.value.onQuery();
  },
  onQuery: () => {
    table.value.getTableData();
  }
});

const table = ref<TableList & { chooseList: any[] }>({
  loading: false,
  total: 0,
  ids: [],
  chooseList: [],
  data: [],
  getTableData: async () => {
    table.value.loading = true;
    const [queryString, params] = handleParam(query.value.params);
    const res: { [key: string]: any } = await deviceEquipList(queryString, params);
    if (res && res.items) {
      const equipList = cloneDeep(res.items);
      const chooseList = equipList.map((item: { [key: string]: any }) => item.id);
      if (chooseList && chooseList.length) {
        // 获取该设备已绘制的标签信息（根据id查是否已绘制）
        const response: { [key: string]: any } = await getLabelInfoByEquipId(chooseList);
        if (response?.data) {
          response.data?.forEach((item: any) => {
            equipList.some((equip: any) => {
              if (equip.id === item.id) {
                if (item.gisLabelConfig) {
                  equip.gisLabelConfig = item.gisLabelConfig;
                }
                equip.gisLabelInfo = item.gisLabelInfo;
                return true;
              }
              return false;
            });
          });
        }
      }
      table.value.data = equipList;
      table.value.total = res.totalNum;
    } else {
      table.value.data = [];
      table.value.total = 0;
      ElMessage.error("接口异常");
    }
    table.value.loading = false;
  },
  onSelectionChange: (selection: any) => {
    table.value.chooseList = selection;
  },
  onEdit: () => {}
});

const querySearch = () => {
  query.value.params.pageNumber = 1;
  query.value.onQuery();
};

const onConfirm = () => {
  emits("onConfirm", [...table.value.chooseList]);
};

const selectable = (row: any) => {
  return (
    row.gisLabelInfo && row.gisLabelConfig && (row.gisLabelConfig.dataType === "Point" || row.gisLabelConfig.dataType === "1")
  );
};

onMounted(() => {
  table.value.getTableData();
});
</script>

<style lang="scss" scoped>
.right-align {
  display: flex;
  justify-content: flex-end;
}
</style>
