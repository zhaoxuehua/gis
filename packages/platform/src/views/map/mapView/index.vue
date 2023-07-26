<template>
  <div class="map-view">
    <ag-map
      :config="config"
      :onClickFeaturePopup="onClickFeaturePopup"
      @on-open-right-menu="onOpenRightMenu"
      @on-close-right-menu="onCloseRightMenu"
      v-if="config.id"
      ref="mapRef"
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
  sessionId: "26_c1f2d2c0dc744ea48f4b277993114125"
});

let option1 = ref();

const onClickFeaturePopup = async (option: { [key: string]: any }) => {
  await (option1.value = option); // 执行更新自定义组件需要的逻辑
  return true;
};

const onOpenRightMenu = async (option: { [key: string]: any }) => {
  console.log(option, "right");
};

const onCloseRightMenu = async () => {
  console.log("close");
};

onMounted(() => {
  config.id = route.query?.id as string | number | null;
  // setTimeout(() => {
  //   console.log(mapRef.value?.getMapElement(), 654321);
  //   initData(mapRef.value?.getMapElement());
  // }, 1000);
});
</script>
<style lang="scss" scoped>
.map-view {
  width: 100%;
  height: calc(100vh - 138px);
  padding: 20px;
  background: var(--background-color);
}
</style>
