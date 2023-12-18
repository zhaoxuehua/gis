<template>
  <el-pagination
    :background="background"
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    :layout="layout"
    :page-sizes="pageSizes"
    :style="style"
    :total="total"
    v-bind="$attrs"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
  />
</template>

<script lang="ts" setup name="Pagination">
import { scrollTo } from "@/utils/scroll-to";
import { toRefs, ref, watch } from "vue";

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
    default: "total, prev, pager, next, sizes, jumper"
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
const currentPage = ref(props.page);
const pageSize = ref(props.limit);
const handleSizeChange = (val: any) => {
  emit("pagination", { page: currentPage.value, limit: val });
  if (autoScroll.value) {
    scrollTo(0, 800);
  }
};
const handleCurrentChange = (val: any) => {
  emit("pagination", { page: val, limit: pageSize.value });
  if (autoScroll.value) {
    scrollTo(0, 800);
  }
};
watch(
  () => props.page,
  () => {
    currentPage.value = props.page;
  }
);
</script>

<style scoped lang="scss">
:deep(.el-pagination) {
  padding: 0;
  .el-pagination__sizes {
    margin-right: 0 !important;
    margin-left: 16px !important;
  }
}
</style>
