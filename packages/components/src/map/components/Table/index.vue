<template>
  <div class="table">
    <div :class="['table-main', props.type]">
      <div class="table-header" v-if="title || $slots.tableBtn">
        <div class="title">
          {{ props.title }}
        </div>
        <div class="btns">
          <slot name="tableBtn" v-if="$slots.tableBtn"></slot>
        </div>
      </div>
      <el-table
        ref="tableRef"
        border
        stripe
        highlight-current-row
        :data="props.data"
        :row-key="props.rowKey"
        :row-style="{ height: 32 + 'px' }"
        :cell-style="{ padding: '0px' }"
        v-bind="{ ...$attrs, class: '', style: {} }"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
        @cell-click="handleCellClick"
        @current-change="handleTableCurrentChange"
      >
        <template v-for="col in props.columns" :key="col.prop">
          <!-- 多选,序号,展开 -->
          <el-table-column v-if="col.type && ['selection', 'index', 'expand'].includes(col.type)" v-bind="col">
            <template v-if="col.type == 'expand'" #default="scope">
              <component :is="col.render" v-bind="scope" v-if="col.render"> </component>
              <slot v-else :name="col.type" v-bind="scope"></slot>
            </template>
          </el-table-column>
          <!-- 正常情况 -->
          <el-table-column v-if="!col.type && col.prop" v-bind="col">
            <template #default="{ row }" v-if="col.render && col.prop">
              {{ col.render(row[col.prop]) }}
            </template>
          </el-table-column>
          <!-- 自定义插槽 -->
          <el-table-column v-if="Object(col).hasOwnProperty('scope')" v-bind="col">
            <template #header="scope" v-if="col.header">
              <slot v-bind="scope" :name="col.header"></slot>
            </template>
            <template #default="scope">
              <slot v-bind="scope" :name="col.scope"></slot>
            </template>
          </el-table-column>
        </template>

        <!-- 插入表格最后一行之后的插槽 -->
        <template #append>
          <slot name="append"> </slot>
        </template>
        <!-- 无数据 -->
        <template #empty>
          <div class="table-empty">
            <slot name="empty">
              <img src="@/assets/images/notData.png" alt="notData" />
              <div>暂无数据</div>
            </slot>
          </div>
        </template>
      </el-table>
      <el-pagination
        v-if="Object.keys(props.pagination).length"
        v-bind="pagination"
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.currentPageSize"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>
  </div>
</template>
<script setup lang="ts" name="Table">
import { computed, ref } from "vue";
interface Props {
  data: any[];
  columns: any[];
  pagination?: any;
  isPageable?: boolean;
  isSearch?: boolean;
  type?: string;
  title?: string;
  rowKey?: string;
  layout?: string;
}
interface Emits {
  (e: "selectionChange", value?: any): void;
  (e: "sortChange", value?: any): void;
  (e: "pageSizeChange", value?: any): void;
  (e: "pageCurrentChange", value?: any): void;
  (e: "cellClick", row: any, column: any, cell: any, event: any): void;
  (e: "currentChange", currentRow: any, oldCurrentRow: any): void;
}
const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  columns: () => [],
  pagination: () => ({}), // 分页参数
  isPageable: true, // 是否有分页
  isSearch: true, //是否有搜索项
  type: "default", // 表格类型 是否是卡片包裹  card default
  title: "",
  rowKey: "id"
});
const emit = defineEmits<Emits>();

const defaultPagination = {
  total: 0,
  page: 1,
  pageSizes: [10, 20, 30, 50, 100],
  layout: "total, sizes, prev, pager, next",
  background: true,
  autoScroll: true,
  style: "",
  pageSize: 10
};

const pagination = computed(() => {
  return {
    ...defaultPagination,
    ...props.pagination,
    currentPage: props.pagination.page,
    currentPageSize: props.pagination.pageSize
  };
});

const tableRef = ref();

const handleSelectionChange = (val: any[]) => {
  emit("selectionChange", val);
};
const handleSortChange = (val: any) => {
  emit("sortChange", val);
};
const handleSizeChange = (val: number) => {
  emit("pageSizeChange", val);
};
const handleCurrentChange = (val: number) => {
  emit("pageCurrentChange", val);
};
const handleTableCurrentChange = (currentRow: any, oldCurrentRow: any) => {
  emit("currentChange", currentRow, oldCurrentRow);
};
const handleCellClick = (row: any, column: any, cell: any, event: any) => {
  emit("cellClick", row, column, cell, event);
};

const toggleRowSelection = (row: any, selected: any) => {
  tableRef.value.toggleRowSelection(row, selected);
};

const clearSelection = () => {
  tableRef.value.clearSelection();
};

defineExpose({
  toggleRowSelection,
  clearSelection
});
</script>
<style lang="scss" scoped>
.table {
  width: 100%;
  height: 100%;

  // overflow-y: scroll;
  overflow: hidden;
  .table-main {
    display: flex;
    flex: 1;
    flex-direction: column;
    height: 100%;
    .table-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      .btns {
        ::v-deep(.el-button) {
          margin-bottom: 0;
        }
      }
      .title {
        font-size: 16px;
        font-weight: bold;
      }
    }
  }
}
</style>
