<template>
  <div class="map-view">
    <ag-map :config="config" v-if="config.id" ref="mapRef"> </ag-map>
  </div>
</template>
<script lang="ts" setup name="mapView">
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { AgMap } from "@adm-gis-ui/components";
import { useUserStore } from "@/stores/modules/user";
const route = useRoute();
const mapRef = ref<InstanceType<typeof AgMap>>();

const userStore = useUserStore();

let config: { [key: string]: any } = reactive({
  navSourceCode: "Default",
  sessionId: userStore.token
});

onMounted(() => {
  config.id = route.query?.id as string | number | null;
});
</script>
<style lang="scss" scoped>
.map-view {
  width: 100%;
  height: 100%;
  padding: 20px;
  background: var(--background-color);
}
</style>
