<template>
  <div>
    <el-dialog
      title="标签信息"
      v-model="open"
      width="1150px"
      class="canvas-dialog"
      :close-on-click-modal="false"
      append-to-body
      @close="onClose"
      :destroy-on-close="true"
    >
      <el-table
        :data="table.data"
        v-loading="table.loading"
        highlight-current-row
        empty-text="暂无数据"
        :row-style="{ height: 32 + 'px' }"
        :cell-style="{ padding: '0px' }"
        max-height="320"
        stripe
        border
      >
        <el-table-column label="序号" type="index" width="60"></el-table-column>
        <el-table-column label="标签编码" prop="code" width="250"> </el-table-column>
        <el-table-column label="标签名称" prop="name"> </el-table-column>
        <el-table-column label="标签类型">
          <template #default="scope">
            {{ scope.row.labelType?.name || "" }}
          </template>
        </el-table-column>
        <el-table-column label="所属图层">
          <template #default="scope">
            {{ scope.row.refLayer?.name || "" }}
          </template>
        </el-table-column>
        <el-table-column prop="path" label="操作" width="100">
          <template #default="scope">
            <el-link class="my-el-link" type="primary" :underline="false" @click="table.panToFeature(scope.row)">
              {{ "定位" }}</el-link
            >
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container" v-if="table.data?.length">
        <el-pagination
          :background="true"
          v-model:current-page="query.params.pageNumber"
          v-model:page-size="query.params.pageSize"
          :page-sizes="[5, 10, 20, 30, 50, 100]"
          layout="total, prev, pager, next, sizes"
          :total="table.total"
          :small="true"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import type { VisualMap } from "../type";
import { labelOnSelect } from "../hooks/index";

const emits = defineEmits(["onEquipDetail"]);
let mapInstance: VisualMap;
const open = ref<boolean>(false);

const openDialog = (map: any, inputParam: any) => {
  mapInstance = map;
  open.value = true;
  query.value.params.name = inputParam;
  table.value.getTableData();
};

const onClose = () => {
  open.value = false;
};

// 查询条件
const defaultParams = {
  name: "", // 标签code||name
  pageNumber: 1,
  pageSize: 5
};

const query = ref({
  params: { ...defaultParams },
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
  query.value.getPagination({ page: 1, limit: val });
};

const handleCurrentChange = (val: any) => {
  query.value.getPagination({ page: val, limit: query.value.params.pageSize });
};

const table = ref({
  loading: false,
  total: 0,
  data: [],
  getTableData: async () => {
    table.value.loading = true;
    if (!mapInstance) {
      return;
    }
    const labelInfoMap = mapInstance?.get("labelInfoMap") || {};
    let labelInfoArr: any = Object.values(labelInfoMap) || [];
    if (!labelInfoArr || labelInfoArr.length === 0) {
      table.value.data = [];
      table.value.total = 0;
      return;
    }
    let filteredData = labelInfoArr;
    if (query.value.params.name) {
      // 根据标签name及code过滤数据
      filteredData = labelInfoArr.filter((item: { [ket: string]: any }) => {
        return item?.name.includes(query.value.params.name) || item?.code.includes(query.value.params.name);
      });
    }
    const start = (query.value.params.pageNumber - 1) * query.value.params.pageSize;
    const end = start + query.value.params.pageSize;
    table.value.data = filteredData.slice(start, end);
    table.value.total = filteredData?.length;
    table.value.loading = false;
  },
  panToFeature: (row: { [key: string]: any }) => {
    // 定位到标签位置
    labelOnSelect(mapInstance, row.code, false);
  },
  showDetails: (row: any) => {
    emits("onEquipDetail", row);
  }
});

defineExpose({
  openDialog
});
</script>

<style lang="scss" scoped>
::v-deep(.canvas-dialog) {
  position: absolute;
  bottom: 6vh;
}
.pagination-container {
  padding: 0;
  margin: 0;
  margin-top: 20px;
}
</style>
