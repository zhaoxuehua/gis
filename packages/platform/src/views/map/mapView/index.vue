<template>
  <div class="map-view">
    <ag-map :config="config" v-if="config.id">
      <!-- <template #customContent>
        <div style="height: 50px">111111111111自定义</div>
      </template> -->
    </ag-map>
  </div>
</template>
<script lang="ts" setup name="mapView">
import { onMounted, reactive } from "vue";
import { useRoute } from "vue-router";
import AgMap from "@adm-gis-ui/components/src/map/index";
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
  height: calc(100vh - 119px);
  padding: 20px;
  background: var(--background-color);
}
</style>
