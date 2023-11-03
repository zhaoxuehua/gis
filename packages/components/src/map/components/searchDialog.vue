<template>
  <div class="search-label-box">
    <el-input
      v-model="inputParam"
      :placeholder="keywordConfig?.searchPlaceholder || '请输入' + placeholderText.slice(0, 6) + '...'"
      clearable
      :title="placeholderText + '搜索'"
      @input="search"
      @focus="search"
    >
      <template #append>
        <el-button @click.stop="search"><Icon src="Search"></Icon></el-button>
      </template>
    </el-input>
    <ul class="label-select" v-if="open && table.data.length">
      <li class="label-select-item" v-for="item in table.data" :key="item" @click="table.panToFeature(item)">
        <template v-if="item.isRealTimeData">
          {{ item.name ? item.code + "_" + item.name : item.code }}
        </template>
        <template v-else>
          {{ item.filterName || item.filterCode }}
        </template>
      </li>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from "vue";
import type { VisualMap } from "../type";
import { labelOnSelect } from "../hooks/index";
import Icon from "./Icon.vue";
import { useGisStore } from "../../stores/modules/gis";

const gisStore = useGisStore();

const props = withDefaults(defineProps<{ map: any }>(), {
  map: () => ({})
});
let mapInstance: VisualMap;
const open = ref<boolean>(false);

// 关键词配置
const keywordConfig = computed(() => {
  return gisStore?.keywordConfig;
});

const inputParam = ref("");
const placeholderText = computed(() => (props.map?.defaultOptions?.displaySearch?.map((item: any) => item.name) || []).join(","));
const searchData: any = ref([]); // 搜索数据源

const search = () => {
  if (!inputParam.value) return (table.value.data = []);
  openDialog(props.map);
};

const openDialog = (map: any) => {
  mapInstance = map;
  open.value = true;
  table.value.getTableData();
};

const table: any = ref({
  data: [],
  getTableData: async () => {
    if (!mapInstance) {
      return;
    }
    getFilterALLData();
    if (inputParam.value) {
      // 根据标签name及code过滤数据  还有关联设备的code和name（标签name及关联关系的name一致）
      searchData.value = searchData.value.filter((item: { [key: string]: any }) => {
        return item?.filterName?.includes(inputParam.value) || String(item?.filterCode).includes(inputParam.value);
      });
      table.value.data = searchData.value;
    }
  },
  panToFeature: (item: any) => {
    let { code, isRealTimeData = false } = item;
    inputParam.value = item.filterName ? item.filterCode + "_" + item.filterName : item.filterCode;
    open.value = false;
    // 定位到标签位置
    labelOnSelect(mapInstance, code, false, isRealTimeData);
  }
});

const getFilterALLData = () => {
  let mapInstance = props.map;
  const labelInfoMap = mapInstance?.get("labelInfoMap") || {}; // 绘制的标签信息{labelCode1：{}，labelCode2：{}}
  const trackInfoMap = mapInstance?.get("trackInfoMap") || []; // 实时数据信息[{}]
  const displaySearchIds = mapInstance?.defaultOptions?.displaySearchIds?.split(",")?.map((item: string) => Number(item)); // 配置的搜索标签类型id [id1,id2]
  let labelInfoArr: any = Object.values(labelInfoMap) || []; // [{}] 标签详细信息
  const relationMap = gisStore?.relationMap;
  const labelAllData = [...labelInfoArr, ...trackInfoMap]; // 绘制标签+实时标签
  if (!labelAllData || labelAllData.length === 0) {
    table.value.data = [];
    return;
  }
  // 所有标签中过滤出可搜索的标签类型的标签
  let filteredData = labelAllData.filter((item: any) => {
    if (displaySearchIds.includes(item.labelTypeId)) {
      return true;
    }
    return false;
  });
  filteredData = filteredData.map(item => {
    // 绘制的标签有关联关系（展示设备的code name）
    if (relationMap[item.code]) {
      item.filterCode = relationMap[item.code].code;
      item.filterName = relationMap[item.code].name;
    } else {
      // 纯标签或实时数据标签
      item.filterCode = item.code;
      item.filterName = item.name;
    }
    return item;
  });
  searchData.value = filteredData;
};

watch(
  () => gisStore.relationMap,
  () => {
    getFilterALLData();
  }
);
</script>

<style lang="scss" scoped>
.label-select {
  max-height: 260px;
  padding: 0;
  margin: 0;
  margin-top: 4px;
  overflow: scroll;
  list-style: none;
  background: #ffffff;
  border: 1px solid var(--el-border-color-light);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
  .label-select-item {
    height: 34px;
    padding: 0 32px 0 20px;
    overflow: hidden;
    font-size: var(--el-font-size-base);
    line-height: 34px;
    color: var(--el-text-color-regular);
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: pointer;
    &:hover {
      background-color: #f5f7fa;
    }
  }
}
</style>
