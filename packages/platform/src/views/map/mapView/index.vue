<template>
  <div class="map-view">
    <ag-map :config="config" v-if="config.id" ref="mapRef" @on-open-right-menu="onOpenRightMenu"> </ag-map>
  </div>
</template>
<script lang="ts" setup name="mapView">
import { onMounted, reactive, ref } from "vue";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import { AgMap } from "@adm-gis-ui/components";
import { useUserStore } from "@/stores/modules/user";
const route = useRoute();
const mapRef = ref<InstanceType<typeof AgMap>>();

const userStore = useUserStore();

let config: { [key: string]: any } = reactive({
  sessionId: userStore.token
});

const onOpenRightMenu = async (option: { [key: string]: any }) => {
  let { featureCode, relationMap } = option;
  let equipId = relationMap[featureCode as string]?.id;
  if (equipId) {
    console.log(equipId, `右键选中的设备id${equipId}`);
  }
};

onMounted(() => {
  config.id = route.query?.id as string | number | null;
});

onBeforeRouteLeave(() => {
  mapRef.value?.clearAllTimers();
});
</script>
<style lang="scss" scoped>
.map-view {
  width: 100%;
  height: 100%;
  padding: 20px;
  background: #ffffff;
}
</style>
