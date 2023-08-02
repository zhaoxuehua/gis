<template>
  <div class="map-view">
    <ag-map :config="config" v-if="config.id" ref="mapRef"> </ag-map>
  </div>
</template>
<script lang="ts" setup name="mapView">
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { AgMap } from "@adm-gis-ui/components";
const route = useRoute();
const mapRef = ref<InstanceType<typeof AgMap>>();

let config: { [key: string]: any } = reactive({
  navSourceCode: "Default",
  sessionId: "26_65a02a1d79384aa9a9d94539c8bddfd7"
});

onMounted(() => {
  config.id = route.query?.id as string | number | null;
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
