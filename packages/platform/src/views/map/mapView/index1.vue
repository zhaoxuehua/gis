<template>
  <div class="map-view">
    <ag-map :config="config" v-if="config.id" ref="mapRef" @get-init-map-export-data="getInitMapExportData"> </ag-map>
  </div>
</template>
<script lang="ts" setup name="mapView">
import { onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import { AgMap } from "@adm-gis-ui/components";
import { useUserStore } from "@/stores/modules/user";
import dayjs from "dayjs";
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

let shipLayer: any = reactive({});
const getInitMapExportData = function (map: any) {
  // 船layer
  shipLayer = map.get("layerMap")["shipLayer"];
  const shipLayerConfig = shipLayer.getProperties();

  const shipTrackData = [
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.702747,
      lat: 31.254017,
      sog: 5,
      cog: 300.6,
      positionReportTicks: 1691898744000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.702,
      lat: 31.254413,
      sog: 5,
      cog: 302.2,
      positionReportTicks: 1691898777000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.70128,
      lat: 31.254803,
      sog: 5.1,
      cog: 301.3,
      positionReportTicks: 1691898807000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.699253,
      lat: 31.25595,
      sog: 5,
      cog: 304.6,
      positionReportTicks: 1691898895000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.6986,
      lat: 31.25637,
      sog: 5,
      cog: 308.4,
      positionReportTicks: 1691898925000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.697987,
      lat: 31.256827,
      sog: 4.9,
      cog: 310.1,
      positionReportTicks: 1691898955000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.696787,
      lat: 31.25777,
      sog: 5,
      cog: 312.7,
      positionReportTicks: 1691899015000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.6962,
      lat: 31.258253,
      sog: 5.1,
      cog: 315.6,
      positionReportTicks: 1691899045000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.6956,
      lat: 31.25882,
      sog: 5.2,
      cog: 317.2,
      positionReportTicks: 1691899077000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.694587,
      lat: 31.259917,
      sog: 5,
      cog: 325.7,
      positionReportTicks: 1691899136000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.693627,
      lat: 31.26103,
      sog: 5,
      cog: 320.3,
      positionReportTicks: 1691899195000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.693053,
      lat: 31.261577,
      sog: 5,
      cog: 315.4,
      positionReportTicks: 1691899226000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.6924,
      lat: 31.262043,
      sog: 4.9,
      cog: 302.3,
      positionReportTicks: 1691899258000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.690973,
      lat: 31.262497,
      sog: 4.9,
      cog: 282.8,
      positionReportTicks: 1691899317000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.689373,
      lat: 31.262527,
      sog: 4.9,
      cog: 259.7,
      positionReportTicks: 1691899376000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.687853,
      lat: 31.262263,
      sog: 4.9,
      cog: 260.1,
      positionReportTicks: 1691899435000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.686213,
      lat: 31.262037,
      sog: 5,
      cog: 263.3,
      positionReportTicks: 1691899498000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.684587,
      lat: 31.26197,
      sog: 5,
      cog: 272.5,
      positionReportTicks: 1691899558000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.683027,
      lat: 31.262037,
      sog: 5,
      cog: 273,
      positionReportTicks: 1691899615000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.68044,
      lat: 31.2621,
      sog: 5,
      cog: 269,
      positionReportTicks: 1691899708000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.676333,
      lat: 31.262097,
      sog: 5.1,
      cog: 271.1,
      positionReportTicks: 1691899858000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.674667,
      lat: 31.262063,
      sog: 5.1,
      cog: 267.4,
      positionReportTicks: 1691899919000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.673053,
      lat: 31.26198,
      sog: 5.1,
      cog: 265.7,
      positionReportTicks: 1691899976000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.669867,
      lat: 31.26185,
      sog: 5,
      cog: 271,
      positionReportTicks: 1691900095000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.66816,
      lat: 31.261867,
      sog: 5,
      cog: 269.4,
      positionReportTicks: 1691900156000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.664853,
      lat: 31.26187,
      sog: 5,
      cog: 272.2,
      positionReportTicks: 1691900278000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.663253,
      lat: 31.261917,
      sog: 5,
      cog: 271.5,
      positionReportTicks: 1691900337000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.66152,
      lat: 31.26197,
      sog: 5.2,
      cog: 270.3,
      positionReportTicks: 1691900399000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.65832,
      lat: 31.262267,
      sog: 5,
      cog: 273.1,
      positionReportTicks: 1691900517000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.65208,
      lat: 31.260907,
      sog: 5.3,
      cog: 259.1,
      positionReportTicks: 1691900757000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.651173,
      lat: 31.260793,
      sog: 5.3,
      cog: 265.7,
      positionReportTicks: 1691900790000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.576773,
      lat: 31.283237,
      sog: 4.9,
      cog: 337,
      positionReportTicks: 1691904249000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    },
    {
      mmsi: 413787987,
      name: "浙嘉兴槽126",
      category: null,
      lon: 120.568587,
      lat: 31.30102,
      sog: 4.8,
      cog: 336.2,
      positionReportTicks: 1691905030000,
      colorIndex: null,
      attentionIndex: null,
      eventLevelCode: null,
      length: 44,
      width: 8,
      draft: 0
    }
  ];

  const transData = shipTrackData.map(val => {
    const params = {
      posInfo: {
        lat: val.lat,
        lon: val.lon,
        cog: val.cog
      },
      titleInfo: {
        name: val.positionReportTicks
      },
      labelInfo: {
        time: dayjs(val.positionReportTicks).format("YYYY-MM-DD HH:mm:ss"),
        speed: val.sog,
        unit: "节"
      },
      detailInfo: [{ 船名: val.name }, { MMSI: val.mmsi }, { 宽: val.width }, { more: "更多" }]
    };
    return params;
  });

  // 绘制船只的轨迹回放
  function start(color: string) {
    mapRef.value.createdTrackData({
      id: 132,
      layerConfig: {
        code: shipLayerConfig.code,
        name: shipLayerConfig.name,
        layerLevel: shipLayerConfig.zIndex,
        layerMaxLevel: shipLayerConfig.maxZoom,
        layerMinLevel: shipLayerConfig.minZoom,
        trackAggDistance: shipLayerConfig.trackAggDistance
      },
      color,
      data: transData
    });
  }

  start("rgba(0,0,0,1)");

  // setTimeout(() => {
  //   start("rgba(255,0,0,0.8)");
  // }, 3500);

  map.on("pointermove", function (event: any) {
    const pixel = map.getEventPixel(event.originalEvent); // 坐标
    const hit = map.hasFeatureAtPixel(pixel); // 该坐标系下是不是有物标
    if (hit) {
      map.forEachFeatureAtPixel(pixel, function (feature: any) {
        if (!feature.get("features")) {
          // 非聚合(普通船只)
        } else {
          // let targetFeature = feature.get("features")[0];
          console.log(feature);
          // let { extendsData, type, name } = targetFeature.getProperties();
          // console.log(extendsData, type, name);
        }
      });
    }
  });

  // setTimeout(() => {
  //   mapRef.value.showHideTrackData(132, false);
  //   setTimeout(() => {
  //     mapRef.value.showHideTrackData(132, true);
  //     setTimeout(() => {
  //       mapRef.value.delTrackData(132);
  //     }, 4000);
  //   }, 4000);
  // }, 4000);
};
</script>
<style lang="scss" scoped>
.map-view {
  width: 100%;
  height: 100%;
  padding: 20px;
  background: var(--background-color);
}
</style>
