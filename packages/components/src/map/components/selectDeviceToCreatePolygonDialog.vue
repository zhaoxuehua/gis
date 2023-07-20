<!-- 线、点缓冲生成面（后端做过滤逻辑） -->
<template>
  <div class="main-content">
    <el-form :model="query.params">
      <el-row :gutter="20">
        <el-col :span="8">
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
        </el-col>
        <el-col :span="8">
          <el-form-item label="设备类型名称：" style="float: left; margin-right: 15px">
            <el-input
              class="action-search"
              placeholder="请输入..."
              v-model="query.params.equipTypeName"
              clearable
              @keyup.enter.stop="querySearch"
              @clear="querySearch"
            ></el-input>
          </el-form-item>
        </el-col>

        <el-col :span="8" class="right-align">
          <el-button type="primary" @click="querySearch"><Icon src="Search"></Icon>搜索</el-button>
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
    <div class="pagination-container" v-if="table.data?.length">
      <el-pagination
        :background="true"
        v-model:current-page="query.params.pageNumber"
        v-model:page-size="query.params.pageSize"
        :page-sizes="[10, 20, 30, 50]"
        layout="total, prev, pager, next, sizes"
        :total="table.total"
        :small="true"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { cloneDeep } from "lodash";
import { handleParam } from "@/utils/common.js";
import { gisDeviceEquipList, getLabelInfoByEquipId } from "@/api/gis.js";
import type { TableList } from "../type";

const props = withDefaults(defineProps<{ type: string }>(), {
  type: ""
});
const emits = defineEmits(["onConfirm"]);

const query = ref({
  params: {
    name: "", // 设备名称
    equipTypeName: "", // 设备类型名称
    dataType: "", // 数据类型（点1、线2）
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

const handleSizeChange = (val: any) => {
  query.value.getPagination({ page: query.value.params.pageNumber, limit: val });
};

const handleCurrentChange = (val: any) => {
  query.value.getPagination({ page: val, limit: query.value.params.pageSize });
};

const table = ref<TableList & { chooseList: any[] }>({
  loading: false,
  total: 0,
  ids: [],
  chooseList: [],
  data: [],
  getTableData: async () => {
    table.value.loading = true;
    query.value.params.dataType = props.type;
    const [queryString, params] = handleParam(query.value.params);
    const res: { [key: string]: any } = await gisDeviceEquipList(queryString, params);
    if (res.code == 200) {
      if (res?.data?.items) {
        const equipList = cloneDeep(res.data.items); // 拿到的是对应类型的设备
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
        table.value.total = res.data?.totalNum;
      }
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
  return row.gisLabelInfo && row.gisLabelConfig && row.gisLabelConfig.dataType == `${props.type}`;
};

onMounted(() => {
  table.value.getTableData();
});
</script>

<style lang="scss" scoped>
.main-content {
  .right-align {
    display: flex;
    justify-content: flex-end;
  }
  .pagination-container {
    padding: 0;
    margin: 0;
    margin-top: 20px;
  }
}
</style>
