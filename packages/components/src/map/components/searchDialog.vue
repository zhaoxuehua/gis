<template>
  <div class="search-label-box">
    <el-input
      v-model="inputParam"
      :placeholder="'请输入' + placeholderText.slice(0, 6) + '...'"
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
        {{ item.label }}
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

const emits = defineEmits(["onEquipDetail", "change"]);
const props = withDefaults(defineProps<{ map: any }>(), {
  map: () => ({})
});
let mapInstance: VisualMap;
const open = ref<boolean>(false);

const inputParam = ref("");
const placeholderText = computed(() => (props.map?.defaultOptions?.displaySearch?.map((item: any) => item.name) || []).join(","));
const searchData: any = ref([]);

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
      // 根据标签name及code过滤数据  还有关联设备的code和name
      searchData.value = searchData.value.filter((item: { [ket: string]: any }) => {
        const status = [
          item?.name?.includes(inputParam.value),
          String(item?.code).includes(inputParam.value),
          item?.relationEquipName?.includes(inputParam.value),
          item?.relationEquipCode?.includes(inputParam.value)
        ];
        return status.some(item => item);
      });
    }
    table.value.data = searchData.value;
  },
  panToFeature: (item: any) => {
    let { code, isVisitObject = false } = item;
    if (item.relationEquipCode || item.relationEquipName) {
      inputParam.value = item.relationEquipName + "_" + item.relationEquipCode;
    } else {
      inputParam.value = item.name;
    }
    open.value = false;
    // 定位到标签位置
    labelOnSelect(mapInstance, code, false, isVisitObject);
  },
  showDetails: (row: any) => {
    emits("onEquipDetail", row);
  }
});

const getFilterALLData = () => {
  let mapInstance = props.map;
  const labelInfoMap = mapInstance?.get("labelInfoMap") || {};
  const trackInfoMap = mapInstance?.get("trackInfoMap") || [];
  const displaySearchIds = mapInstance?.defaultOptions?.displaySearchIds?.split(",")?.map((item: string) => Number(item));
  let labelInfoArr: any = Object.values(labelInfoMap) || [];
  const relationMap = gisStore?.relationMap;
  const labelAllData = [...labelInfoArr, ...trackInfoMap];
  if (!labelAllData || labelAllData.length === 0) {
    table.value.data = [];
    return;
  }
  let filteredData = labelAllData.filter((item: any) => {
    if (displaySearchIds.includes(item.labelTypeId)) {
      return true;
    }
    return false;
  });
  filteredData = filteredData.map(item => {
    if (relationMap[item.code]) {
      item.relationEquipCode = relationMap[item.code].code;
      item.relationEquipName = relationMap[item.code].name;
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
