<template>
  <div class="map-view">
    <Map :config="config" v-if="config.id" class="map"></Map>
  </div>
</template>
<script lang="ts" setup name="mapView">
import { onMounted, reactive } from "vue";
import { useRoute } from "vue-router";
import Map from "../index.vue";
const route = useRoute();
let config: { [key: string]: any } = reactive({
  id: null,
  navSourceCode: "Default"
});
onMounted(() => {
  config.id = route.query?.id as string | number | null;
});
</script>
<style lang="scss" scoped>
.map-view {
  width: calc(100vw - 260px);
  height: calc(100vh - 109px);
  padding: 20px;
  background: var(--background-color);
}
.map {
  width: 100%;
  height: 100%;
}
</style>
