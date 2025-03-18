<template>
  <div class="map-view">
    <ag-map :config="config" v-if="config.id" @on-open-right-menu="onOpenRightMenu" @video="onVideoClick"> </ag-map>
  </div>
</template>
<script lang="ts" setup name="mapView">
import { onMounted, reactive } from "vue";
import { useRoute } from "vue-router";
import { AgMap } from "@adm-gis-ui/components";
import { useUserStore } from "@/stores/modules/user";
const route = useRoute();

const userStore = useUserStore();

let config: { [key: string]: any } = reactive({
  sessionId: userStore.token
  // agioe_sso_token: "w1vxihaU28Rubs3Ld"
});

const onOpenRightMenu = async (option: { [key: string]: any }) => {
  let { featureCode, relationMap } = option;
  let equipId = relationMap[featureCode as string]?.id;
  if (equipId) {
    console.log(equipId, `右键选中的设备id${equipId}`);
  }
};

// 测试外部表格双击功能  props增加 :outsideTableRowData="outsideTableRowData"
// const outsideTableRowData = ref();
// setTimeout(() => {
//   outsideTableRowData.value = {
//     mid: "111111111",
//     equip: "3",
//     lon: 119.314005,
//     lat: 25.160107
//   };
// }, 9000);

// 视频模块
const onVideoClick = (info: any) => {
  console.log(info, "视频gis参数");
};

onMounted(() => {
  config.id = route.query?.id as string | number | null;
});
</script>

<style lang="scss" scoped>
.map-view {
  width: 100%;
  height: 100%;
  padding: 10px;
  background: #ffffff;
}
</style>
