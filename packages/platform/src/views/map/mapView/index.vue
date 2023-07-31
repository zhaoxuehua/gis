<template>
  <div class="map-view">
    <ag-map
      :config="config"
      :onClickFeaturePopup="onClickFeaturePopup"
      @on-open-right-menu="onOpenRightMenu"
      @on-close-right-menu="onCloseRightMenu"
      @get-click-box-selection="getClickBoxSelection"
      v-if="config.id"
      ref="mapRef"
      @get-custom-search-content="getCustomSearchContent"
    >
      <template #customContent>
        <div>{{ option1?.featureCode }}</div>
      </template>
    </ag-map>
  </div>
</template>
<script lang="ts" setup name="mapView">
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { AgMap } from "@adm-gis-ui/components";
const route = useRoute();
const mapRef = ref<InstanceType<typeof AgMap>>();

let config: { [key: string]: any } = reactive({
  id: null,
  navSourceCode: "Default",
  sessionId: "26_65a02a1d79384aa9a9d94539c8bddfd7",
  isCustomSearchDialog: false

  // rightControl: [
  //   {
  //     label: "ceshi",
  //     isShow: false,
  //     visible: true
  //   }
  // ]
  // rightControlIndex: 0,
  // bigScreenControls: ["tagTree"],
  // bigScreenMapEdit: true
});

let option1 = ref();

const onClickFeaturePopup = async (option: { [key: string]: any }) => {
  await (option1.value = option); // 执行更新自定义组件需要的逻辑
  return true;
};

const onOpenRightMenu = async (option: { [key: string]: any }) => {
  mapRef?.value?.panToFeature("GISRing1689155066181", false);
  console.log(option, "right");
};

const onCloseRightMenu = async () => {
  console.log("close");
};

const getClickBoxSelection = (selectionFeatures: any[], relationMap: any) => {
  // 从框选的标签中筛选出设备id
  const featureList = selectionFeatures.filter((item: any) => {
    return relationMap.hasOwnProperty(item?.getId());
  });

  const deviceIds = featureList.map((item: any) => {
    return relationMap[item?.getId()].id;
  });

  console.log(selectionFeatures, relationMap, deviceIds, 7654);
};

const getCustomSearchContent = (value: string, map: any) => {
  console.log(value, map, "搜索");
};

onMounted(() => {
  config.id = route.query?.id as string | number | null;
  // setTimeout(() => {
  //   console.log(mapRef.value?.getMapElement(), 654321);
  //   initData(mapRef.value?.getMapElement());
  // }, 1000);
});

// 框选功能mock
</script>
<style lang="scss" scoped>
.map-view {
  width: 100%;
  height: calc(100vh - 138px);
  padding: 20px;
  background: var(--background-color);
}
</style>
