<template>
  <div :class="{ hidden: hidden }" class="pagination-container">
    <el-pagination
      :background="background"
      v-model:current-page="state.currentPage"
      v-model:page-size="state.pageSize"
      :layout="layout"
      :page-sizes="pageSizes"
      :style="style"
      :total="total"
      v-bind="$attrs"
      :small="true"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script lang="ts" setup name="Pagination">
import { scrollTo } from "@/utils/scroll-to";
import { toRefs, reactive } from "vue";

const props = defineProps({
  total: {
    type: Number,
    required: true
  },
  page: {
    type: Number,
    default: 1
  },
  limit: {
    type: Number,
    default: 20
  },
  pageSizes: {
    type: Array as () => number[],
    default: () => [10, 20, 30, 50, 100] // 设置默认值
  },
  layout: {
    type: String,
    default: "total, prev, pager, next, sizes"
  },
  background: {
    type: Boolean,
    default: true
  },
  autoScroll: {
    type: Boolean,
    default: true
  },
  hidden: {
    type: Boolean,
    default: false
  },
  style: {
    type: [String, Object],
    default: ""
  }
});
const emit = defineEmits(["pagination"]);

const { autoScroll } = toRefs(props);
const state = reactive({
  currentPage: props.page,
  pageSize: props.limit
});
const handleSizeChange = (val: any) => {
  emit("pagination", { page: state.currentPage, limit: val });
  if (autoScroll.value) {
    scrollTo(0, 800);
  }
};
const handleCurrentChange = (val: any) => {
  emit("pagination", { page: val, limit: state.pageSize });
  if (autoScroll.value) {
    scrollTo(0, 800);
  }
};
</script>

<style scoped lang="scss">
.pagination-container {
  padding: 32px 16px;
}
.pagination-container.hidden {
  display: none;
}
::v-deep(.el-pagination .btn-next .el-icon),
::v-deep(.el-pagination .btn-prev .el-icon) {
  display: block;
  width: auto;
  font-size: 12px;
  font-weight: 700;
}
.el-pagination {
  position: absolute !important;
  right: 0;
}
</style>
