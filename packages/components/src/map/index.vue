<!-- 地图组件 map -->
<template>
  <div class="component-box">
    <div id="map" class="visual-map" @contextmenu.stop @click.stop ref="mapRef"></div>
    <div class="mapLevel" title="当前层级">当前层级：{{ currentLevel }}</div>

    <!-- 左侧控件 -->
    <LeftActionBox
      :map="exportMap"
      :leftBoxData="getLeftData"
      @left-box-data-change="leftBoxDataChange"
      @on-edit-label="onEditLabel"
      @is-edit-change-hidden="isEditChangeHidden"
      :deviceSearchVisible="!!controlList.includes('search')"
      :isCustomSearchDialog="props.config.isCustomSearchDialog"
      @custom-search-dialog="customSearchDialog"
    >
    </LeftActionBox>
    <!-- 标签树、导航树的编辑弹框 -->
    <EditLabel ref="editLabelRef" :map="exportMap"></EditLabel>
    <!-- 右侧控件 -->
    <RightActionBox
      :map="exportMap"
      :rightBoxData="getRightData"
      @right-box-data-change="rightBoxDataChange"
      @on-click-box-selection="onClickBoxSelection"
    >
    </RightActionBox>
    <!-- 地图点击弹框 -->
    <Popup
      :map="exportMap"
      :data="popupData"
      @on-close="onScadaClose"
      ref="popupRef"
      @scada="handlePopLink"
      @view="handlePopLink"
    >
      <template #customContent v-if="customContent">
        <component :is="customContent"></component>
      </template>
    </Popup>

    <!-- 轨迹回放列表(轨迹列表只能展示5条)-->
    <Track-back-list></Track-back-list>

    <!-- overLayer鼠标经过显示-->
    <div id="shipHoverInfo" class="popup" ref="popupDOMRef">
      <h4 class="popup-tit" ref="popupTitDOMRef"></h4>
      <div class="popup-content" ref="popupContentDOMRef"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  onMounted,
  onBeforeUnmount,
  ref,
  defineAsyncComponent,
  reactive,
  computed,
  shallowRef,
  useSlots,
  watch,
  unref
} from "vue";
import { ElMessage } from "element-plus";
import { Map, View, Feature, Overlay } from "ol";
import MapBrowserEvent from "ol/MapBrowserEvent";
import { FullScreen, ScaleLine, defaults } from "ol/control";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { XYZ, Vector as VectorSource, Cluster } from "ol/source";
import type { FeatureLike } from "ol/Feature";
import { fromLonLat } from "ol/proj";
import type { Coordinate } from "ol/coordinate";
import { getCenter } from "ol/extent";
import type { VisualMap, LabelType, LabelInfoData } from "./type";
import { getMapParamsDetail, getLabelList, getEquipAlarmList } from "../api/visconfig";
import { handleParam } from "@/utils/common.js";
import { find } from "lodash";
import { useGisStore } from "../stores/modules/gis";
import { useToolboxStore } from "../stores/modules/toolBox";

import { layerStyle, createStyle, alarmLayerStyle } from "./hooks/styleFunction.js";
import { createGeometry, getGeometryCenter } from "./hooks/createGeometry.js";
import { createdFeature } from "./hooks/createdFeature.js";
import {
  clearSelectedFeature,
  labelOnSelect,
  createLabel,
  removeLabel,
  getFeature,
  getSelectedFeature,
  getFeatureCodeByEquipCode
} from "./hooks/index";
import { createdTrackData, showHideTrackData, delTrackData } from "./hooks/createdTrackData.js";
import { getTrackDataByIdFn } from "./hooks/getTrackDataById"; // 获取单个轨迹数据
import { initAlarmLayerAndCreateFeature } from "./hooks/initAlarmLayerAndCreateFeature";
import LeftActionBox from "./components/LeftActionBox.vue";
import RightActionBox from "./components/rightActionBox.vue";
import EditLabel from "./components/editLabel.vue";
import Popup from "./components/popup/index.vue";
import TrackBackList from "./components/trackBackList.vue";

defineOptions({ name: "AgMap" });

const customContent = useSlots()?.customContent;
const gisStore = useGisStore();
const props = withDefaults(defineProps<{ config: any; outsideTreeNode?: any }>(), {
  config: () => {},
  outsideTreeNode: () => null
});

const emits = defineEmits([
  "onOpenRightMenu",
  "onCloseRightMenu",
  "getClickBoxSelection",
  "getCustomSearchContent",
  "getInitMapExportData",
  "scada",
  "view"
]);

const exportMap = ref<VisualMap>();
const mapRef = ref();
const currentLevel = ref(); // 当前视图层级
// 控件区域数据维护
const state = reactive({
  leftBoxData: [
    {
      icon: "iconfont icon-GIS_huaban1",
      label: "导航树",
      isShow: false, // 控制显示隐藏
      visible: false, // 控制是否展示tab(有无该项)
      component: shallowRef(defineAsyncComponent(() => import("./components/navigationTree.vue")))
    },
    {
      icon: "iconfont icon-GIS_huaban1fuben",
      label: "标签树",
      isShow: false,
      visible: false,
      component: shallowRef(defineAsyncComponent(() => import("./components/tagTree.vue")))
    },
    {
      icon: "iconfont icon-GIS-09",
      label: "快速绘制",
      isShow: false,
      visible: false,
      component: shallowRef(defineAsyncComponent(() => import("./components/quickCreate.vue")))
    },
    {
      icon: "iconfont icon-retweet1",
      label: "轨迹回放",
      isShow: false,
      visible: false,
      component: shallowRef(defineAsyncComponent(() => import("./components/trackPlayBack.vue")))
    }
  ],
  rightBoxData: [
    {
      icon: "iconfont icon-GIS-03",
      label: "框选",
      isShow: false,
      visible: false,
      component: shallowRef(defineAsyncComponent(() => import("./components/boxSelection.vue")))
    },
    {
      icon: "iconfont icon-GIS-04",
      label: "标签筛选",
      isShow: false,
      visible: false,
      component: shallowRef(defineAsyncComponent(() => import("./components/tagSelection.vue")))
    },
    {
      icon: "iconfont icon-GIS-05",
      label: "工具箱",
      isShow: false,
      visible: false,
      component: shallowRef(defineAsyncComponent(() => import("./components/toolBox.vue")))
    },
    {
      icon: "iconfont icon-GIS-06",
      label: "地图类型",
      isShow: false,
      visible: false,
      component: shallowRef(defineAsyncComponent(() => import("./components/mapType.vue")))
    },
    {
      icon: "iconfont icon-img",
      label: "图例",
      isShow: false,
      visible: false,
      component: shallowRef(defineAsyncComponent(() => import("./components/imgLegend.vue")))
    },
    {
      icon: "iconfont icon-list-ol-solid",
      label: "关注列表",
      isShow: false,
      visible: false,
      component: shallowRef(defineAsyncComponent(() => import("./components/attentionList.vue")))
    },
    {
      icon: "iconfont icon-complex-device",
      label: "白名单",
      isShow: false,
      visible: false,
      component: shallowRef(defineAsyncComponent(() => import("./components/whiteList.vue")))
    },
    {
      icon: "iconfont icon-GIS-07",
      label: "编辑",
      isShow: false,
      visible: false
    }
  ]
});

const getLeftData = computed(() => {
  state.leftBoxData.forEach((item: any) => {
    switch (item.label) {
      case "导航树":
        item.visible = !!controlList.value.includes("navigationTree");
        break;
      case "标签树":
        item.visible = !!controlList.value.includes("tagTree");
        break;
      case "快速绘制":
        item.visible = !!controlList.value.includes("quickCreate");
        break;
      case "轨迹回放":
        item.visible = !!controlList.value.includes("trackPlayBack");
        break;

      default:
        break;
    }
  });
  return state.leftBoxData;
});

const leftBoxDataChange = (index: number) => {
  state.leftBoxData.forEach((item: { [key: string]: any }, innerIndex: number) => {
    if (innerIndex == index) {
      item.isShow = !item.isShow;
    } else {
      item.isShow = false;
    }
  });
};
const controlList: string[] | any = ref([]);
const isEdit: any = ref(false);
const isEditShow = computed(() => {
  return gisStore.isEdit;
});

const getRightData = computed(() => {
  state.rightBoxData.forEach((item: any) => {
    switch (item.label) {
      case "框选":
        item.visible = !!controlList.value.includes("boxSelection");
        break;
      case "标签筛选":
        item.visible = !!controlList.value.includes("tagSelection");
        break;
      case "地图类型":
        item.visible = !!controlList.value.includes("mapTypeSwitch");
        break;
      case "工具箱":
        item.visible = !!controlList.value.includes("toolBox");
        break;
      case "图例":
        item.visible = !!controlList.value.includes("imgLegend");
        break;
      case "关注列表":
        item.visible = !!controlList.value.includes("attentionList");
        break;
      case "白名单":
        item.visible = !!controlList.value.includes("whiteList");
        break;
      case "编辑":
        item.visible = !!isEdit.value;
        break;
      default:
        break;
    }
  });
  return state.rightBoxData;
});

const rightBoxDataChange = (index: number, label: string = "") => {
  state.rightBoxData.forEach((item: { [key: string]: any }, innerIndex: number) => {
    if (innerIndex == index) {
      item.isShow = !item.isShow;
    } else {
      item.isShow = false;
    }
  });
  if (label == "编辑") {
    // 编辑控件
    gisStore.setIsEdit(!isEditShow.value);
    // 关闭当前编辑标签弹框及左击弹框
    editLabelRef.value?.onClose();
  }
};

const isEditChangeHidden = () => {
  state.leftBoxData.forEach(item => {
    item.isShow = false;
  });
  state.rightBoxData.forEach(item => {
    item.isShow = false;
  });
};

// 地图点击弹框
const popupRef = ref<InstanceType<typeof Popup>>();
let popupData: { [key: string]: any } = reactive({
  featureCode: "",
  featureName: ""
});

// 编辑标签(标签树、导航树)
const editLabelRef = ref<InstanceType<typeof EditLabel>>();
const onEditLabel = (labelCode: string) => {
  editLabelRef.value?.onOpen(labelCode);
};

let isDynamicLine = computed(() => gisStore.isDynamicLine);
let imgIndex = computed(() => gisStore.imgIndex);
const timer: any = ref(null);
const dynamicTimes: any = ref(null); // 风机、动态线、动态环的定时器
const alarmTimer: any = ref(null); // 告警列表动态请求

// overlayer
const popupDOMRef = ref();
const popupTitDOMRef = ref();
const popupContentDOMRef = ref();

const initMap = async (mapId: string | number, isId: boolean) => {
  // 获取地图配置（初始化地图参数详情）
  const res: { [key: string]: any } = await getMapParamsDetail(mapId, isId);
  if (res.code === 200 && res.data) {
    const originalData = JSON.parse(JSON.stringify(res.data));
    let controls = originalData?.displayControlIds ? originalData?.displayControlIds.split(",") : [];
    if (props?.config?.bigScreenControls) {
      let newControls = [];
      // 监控二次配置了部分控件
      // 1、拿出缩放控件、全屏控件、比例尺控件、路网叠加层
      if (controls.includes("zoom")) {
        newControls.push("zoom");
      }
      if (controls.includes("fullScreen")) {
        newControls.push("fullScreen");
      }
      if (controls.includes("scaleLine")) {
        newControls.push("scaleLine");
      }
      if (controls.includes("showOverlay")) {
        newControls.push("showOverlay");
      }
      controls = newControls.concat(props?.config?.bigScreenControls);
    }
    controlList.value = controls;

    // 编辑控件的处理逻辑
    if (props?.config?.bigScreenMapEdit != undefined) {
      isEdit.value = props?.config?.bigScreenMapEdit;
    } else {
      isEdit.value = !!originalData.isEdit;
    }

    const defaultOptions = {
      target: "map",
      center: {
        lon: originalData.defaultCenterPointLongitude, // 经度
        lat: originalData.defaultCenterPointLatitude // 纬度
      },
      defaultZoom: originalData.defaultDisplayLevel, // 视图当前层级
      minZoom: originalData.minLevel, // 视图最小层级
      maxZoom: originalData.maxLevel, // 视图最大层级

      defaultMapType: originalData.displayMode, // 当前地图类型
      normalUrl: originalData.normalUrl, // 电子底图url
      sateUrl: originalData.sateUrl, // 卫星底图url
      overlayUrl: originalData.overlayUrl, // 路网叠加层url

      labelType: originalData.displayLabelInfo, // 标签类型 object[]
      labelTypeIds: originalData.displayLabelInfoIds, // 标签类型id  string
      layers: originalData.displayLayer, // 显示图层  object[]
      layersIds: originalData.displayLayerIds, // 图层id string
      displaySearchIds: originalData.displaySearchIds, // 搜索类型id
      displaySearch: originalData.displaySearch, // 搜索类型 []

      zoom: controls.includes("zoom"), // 缩放控件
      fullScreen: controls.includes("fullScreen"), // 全屏控件
      scaleLine: controls.includes("scaleLine"), // 比例尺控件  scaleLine
      scaleLineUnit: originalData?.scaleLineUnit, // 距离单位（该配置对比例尺及测距生效）
      showOverlay: controls.includes("showOverlay"), // 路网叠加层 showOverlay
      controlIds: originalData.displayControlIds, // 控件 string
      displayLegend: originalData.displayLegend, // 图例[]
      trackSearchId: originalData.trackSearchId, // 轨迹搜索类型id
      trackSearchCode: originalData.trackSearchCode // 轨迹搜索类型code
    };

    // 全屏控件
    const fullScreen = new FullScreen({ className: "ol-full-screen", tipLabel: "全屏" });
    // 比例尺控件
    const scaleLine = new ScaleLine({
      className: "control-scaleLine",
      units: defaultOptions?.scaleLineUnit || "metric"
    });
    // 控件列表(是否显示全屏缩放控件)
    const controlsList = [];
    if (defaultOptions?.fullScreen) {
      controlsList.push(fullScreen);
    }
    if (defaultOptions?.scaleLine) {
      controlsList.push(scaleLine);
    }

    // 电子底图图层
    const normalMap = new TileLayer({
      visible: defaultOptions?.defaultMapType === 1,
      source: new XYZ({
        url: defaultOptions?.normalUrl
      })
    });
    // 卫星影像图层
    const sateMap = new TileLayer({
      visible: defaultOptions?.defaultMapType === 2,
      source: new XYZ({
        url: defaultOptions?.sateUrl
      })
    });

    // 路网叠加层（是卫星影像且显示路网叠加层）
    const overlayMap = new TileLayer({
      visible: defaultOptions?.defaultMapType === 2 && defaultOptions?.showOverlay,
      source: new XYZ({
        url: defaultOptions?.overlayUrl
      })
    });

    // 实例化地图，类型为扩展后的VisualMap
    const map = new Map({
      target: defaultOptions?.target || "map",
      controls: defaults({
        attribution: false,
        rotate: false,
        zoom: defaultOptions?.zoom,
        zoomOptions: {
          className: "ol-zoom",
          zoomInTipLabel: "放大",
          zoomOutTipLabel: "缩小"
        }
      }).extend(controlsList),
      layers: [normalMap, sateMap, overlayMap],
      view: new View({
        center: fromLonLat([defaultOptions.center.lon, defaultOptions.center.lat]),
        zoom: defaultOptions?.defaultZoom,
        minZoom: defaultOptions?.minZoom,
        maxZoom: defaultOptions?.maxZoom,
        constrainResolution: true
      })
    }) as VisualMap;

    // 监听视图的变化获取当前层级
    currentLevel.value = defaultOptions?.defaultZoom; // 视图层级初始值
    map?.getView().on("change:resolution", function () {
      let zoomLevel = Math.ceil(map?.getView()?.getZoom());
      currentLevel.value = zoomLevel;
      // 增加地图缩放层级最大时不聚合的逻辑
      let layerMap = map?.get("layerMap") || {};
      let clusterLayerArr = Object.values(layerMap).filter((layer: any) => layer?.get("isTagAgg"));
      clusterLayerArr.forEach((layer: any) => {
        // 获取layer的最大层级
        let maxZoom = layer.getMaxZoom();
        if (maxZoom == zoomLevel) {
          let clusterDataSource = layer.getSource();
          clusterDataSource.setDistance(0);
        } else {
          let clusterDataSource = layer.getSource();
          clusterDataSource.setDistance(layer?.get("tagAggDistance"));
        }
      });
    });

    // 缓存配置
    map.defaultOptions = defaultOptions;
    gisStore.setMapCase(map);

    // 根据图层配置信息创建图层
    const layerMap: { [key: string]: any } = {};
    defaultOptions?.layers?.forEach((item: { [key: string]: any }) => {
      let options: { [key: string]: any };
      options = {
        zIndex: item?.layerLevel,
        minZoom: item?.layerMinLevel - 0.000000000000005,
        maxZoom: item?.layerMaxLevel,
        name: item?.name,
        code: item?.code,
        isTagAgg: item?.isTagAgg,
        isTrackDraw: item?.isTrackDraw,
        trackAggDistance: item.trackAggDistance || 0 // 聚合图层上轨迹聚合距离
      };

      item?.code != "seaMap"
        ? (options.style = (feature: FeatureLike) => layerStyle(feature, isDynamicLine.value, imgIndex.value))
        : null;

      // 分为聚合图层还是非聚合图层(聚合图层针对点)
      if (item?.isTagAgg) {
        let sourceVector = new VectorSource();
        let clusterSource = new Cluster({
          distance: item?.tagAggDistance ? Number(item?.tagAggDistance) : 0, // 图层上标签聚合距离
          source: sourceVector
        });
        options.source = clusterSource;
        options.tagAggDistance = item?.tagAggDistance || 0;
      } else {
        options.source = new VectorSource({});
      }

      layerMap[item.code] = new VectorLayer(options);
      map.addLayer(layerMap[item.code]);
    });

    /**********************************************************************/

    map.set("layerMap", { normalMap, sateMap, overlayMap, ...layerMap }); // 存储所有的图层信息

    // 创建固定的点图层用于定位时增加定位点到点图层
    let positionPointLayer = new VectorLayer({
      source: new VectorSource()
    });
    map.addLayer(positionPointLayer);
    map.set("positionPointLayer", positionPointLayer);

    /****************************按标签类型存储******************************************/

    // 存储标签类型信息及根据标签类型分组 code => labelType
    const labelTypeMap: { [key: string]: LabelType } = {};
    let featureTypeGroup: { [key: string]: Feature[] } = {};
    const { labelType, layersIds } = defaultOptions || {};
    labelType.forEach((item: LabelType) => {
      if (layersIds.split(",").includes(String(item.layerConfigId))) {
        if (item.labelTypeImagePath || item?.labelLegendImagePath) {
          // 标签类型筛选时直接使用拼接的icon(点的肯定有，其他配置了图例labelLegendImagePath有icon)
          if (item?.labelLegendImagePath) {
            item.iconUrl = `/api/gis-service/equip/gisLabel/type/getAllPathByFileName/${item.labelLegendImagePath}`;
          } else {
            if (item?.dataType == "1") {
              let imgSrc = item.labelTypeImagePath ? item.labelTypeImagePath.split(",") : [];
              if (imgSrc?.length) {
                item.iconUrl = `/api/gis-service/equip/gisLabel/type/getAllPathByFileName/${imgSrc[0]}`;
              }
            }
          }
        }
        labelTypeMap[item.code] = { ...item };
        featureTypeGroup[item.code] = []; // 标签类型下的标签数组
      }
    });
    map.set("labelTypeMap", labelTypeMap);
    map.set("featureTypeGroup", featureTypeGroup);

    /****************************获取已绘制的标签进行渲染******************************************/
    // 初始化渲染所有已绘制的标签
    let resData: { [key: string]: any } = await getLabelList(
      ...(handleParam({ pageNumber: 1, pageSize: 100000, name: "", orderByColumn: "createdOn", isAsc: "asc" }) as [
        string,
        object
      ])
    );
    let dynamicLayerCodes: string[] = []; // 不能添加重复图层(只添加code)
    const labelInfoMap: { [key: string]: LabelInfoData } = {};
    if (resData.data?.items) {
      resData.data.items.forEach((item: LabelInfoData) => {
        // 标签有对应的图层及标签类型才进行绘制
        let labelTypeCodeArray = Object.keys(labelTypeMap) || [];
        if (layerMap.hasOwnProperty(item.refLayer?.code) && labelTypeCodeArray.includes(item?.labelType?.code)) {
          let labelData = null;
          if (typeof item.labelData == "string") {
            try {
              labelData = JSON.parse(item.labelData);
            } catch (error) {
              console.warn(error, item);
            }
          }
          if (typeof labelData != "object") {
            console.warn(`解析标签数据出错, 标签id:${item.id}`);
            return;
          }
          item.labelData = labelData; // 标签绘制信息数据

          const labelFeature = new Feature({
            name: item.name, // 标签名字
            geometry: createGeometry(item.labelData)
          });

          labelFeature.setId(item.code);
          labelFeature.set("code", item.code);
          labelFeature.set("type", item.labelData?.style?.type); // 标签类型
          labelFeature.set("labelData", item?.labelData); // 标签绘制数据
          labelFeature.set("layerCode", item.refLayer.code); // 所属图层编码
          labelFeature.set("labelTypeCode", item.labelType.code); // 所属标签类型编码

          // 点(根据图片源数量)
          if (item?.labelType?.dataType == "1") {
            let imgSrc = item?.labelType?.labelTypeImagePath ? item?.labelType?.labelTypeImagePath.split(",") : [];
            if (imgSrc?.length > 1) {
              dynamicLayerCodes.push(item.refLayer.code);
              labelFeature.set("typeStats", "dynamicPoint");
            } else {
              labelFeature.set("typeStats", "staticPoint");
            }
          }

          // 线
          if (item?.labelType?.dataType == "2") {
            if (
              item?.labelType?.lineType == "dash" &&
              item?.labelType?.animationSetting &&
              item?.labelType?.animationSetting === "animations" &&
              !item.labelType?.lineVectorPath
            ) {
              dynamicLayerCodes.push(item.refLayer.code);
              labelFeature.set("typeStats", "dynamicLine");
            } else {
              labelFeature.set("typeStats", "staticLine");
            }
          }
          // 若是环
          if (item?.labelType?.dataType == "7") {
            if (
              item?.labelType?.lineType == "dash" &&
              item?.labelType?.animationSetting &&
              item?.labelType?.animationSetting === "animations"
            ) {
              dynamicLayerCodes.push(item.refLayer.code);
              labelFeature.set("typeStats", "dynamicRing");
            } else {
              labelFeature.set("typeStats", "staticRing");
            }
          }

          // 取出该标签元素所在图层、数据源
          const layer = layerMap[item.refLayer.code]; // 标签所在图层
          let isTagAgg = layer.get("isTagAgg");
          let source: any;
          if (isTagAgg) {
            // 聚合图层
            const clusterDataSource = layer.getSource();
            source = clusterDataSource.getSource();
          } else {
            // 非聚合图层
            source = layer.getSource();
          }
          source.addFeature(labelFeature);
          labelInfoMap[item.code] = item;
          featureTypeGroup[item.labelType.code].push(labelFeature);
          map.set("featureTypeGroup", featureTypeGroup);
        }
      });

      // 动态样式(风机 动态线 动态环)
      let dynamicLayers = Array.from(new Set(dynamicLayerCodes)); // 动态图层layer的code过滤
      map.set("dynamicLayerCodes", dynamicLayers);
      if (dynamicTimes.value) {
        clearInterval(dynamicTimes.value);
        dynamicTimes.value = null;
      }
      if (map.get("dynamicLayerCodes")?.length) {
        dynamicTimes.value = setInterval(() => {
          // 风机转动及虚线闪动
          gisStore.setImgIndex(imgIndex.value + 1);
          gisStore.setIsDynamicLine(!isDynamicLine.value);
          dynamicLayers.forEach((code: string) => {
            layerMap[code].setStyle((feature: FeatureLike) => layerStyle(feature, isDynamicLine.value, imgIndex.value));
          });
        }, 200);
      }
      map.set("labelInfoMap", labelInfoMap);
    } else {
      ElMessage.error("接口异常");
    }

    /*******************************************告警标签（点线面）**********************************************/
    // 绘制报警图层信息
    let alarmLayer: any = new VectorLayer({
      source: new VectorSource(),
      zIndex: 9999,
      style: (feature: FeatureLike) => alarmLayerStyle(feature)
    });
    alarmLayer.set("code", "alarmLayer");
    alarmLayer.set("name", "报警图层");
    map.addLayer(alarmLayer);
    // 实时请求报警数据并绘制
    const updateAlarmData = async () => {
      try {
        const alarmRes: any = await getEquipAlarmList(mapId, isId);
        if (alarmRes?.code === 200) {
          initAlarmLayerAndCreateFeature(map, alarmLayer, alarmRes.data || []);
        } else {
          ElMessage.error("接口异常");
        }
      } catch (error) {}
    };
    // 初始化时获取一次数据
    updateAlarmData();
    // 每隔10秒更新数据
    alarmTimer.value = setInterval(updateAlarmData, 10000);

    /****************************鼠标经过*************************************************************/
    // 鼠标移动事件
    let hoverInfoLayer: Overlay = new Overlay({
      element: popupDOMRef.value,
      autoPan: true,
      offset: [20, 0]
    });
    map.addOverlay(hoverInfoLayer);
    map.on("pointermove", function (event: any) {
      const pixel = map.getEventPixel(event.originalEvent); // 坐标
      const hit = map.hasFeatureAtPixel(pixel); // 该坐标系下是不是有物标
      const pos = event.coordinate;
      if (hit) {
        map.getTargetElement().style.cursor = hit ? "pointer" : "";
        map.forEachFeatureAtPixel(pixel, function (feature: Feature) {
          let targetFeature = null;
          if (Array.isArray(feature.get("features"))) {
            targetFeature = feature.get("features")[0];
          } else {
            targetFeature = feature;
          }

          let { extendsData, type, name } = targetFeature.getProperties();
          if (type == "trackPoint" || type == "trackShip") {
            const { detailInfo, titleInfo } = unref(extendsData);
            let infoStr = "";
            let infoData = detailInfo as [[string, any]];
            infoData.forEach(val => {
              infoStr += `<p>${val[0]}:${val[1]}</p>`;
            });
            popupTitDOMRef.value.innerHTML = titleInfo.name;
            popupContentDOMRef.value.innerHTML = infoStr;
            hoverInfoLayer.setPosition(pos);
          } else if (extendsData?.type == "ship") {
            const { mmsi, sog, positionReportTicks } = unref(extendsData);
            popupTitDOMRef.value.innerHTML = name;
            popupContentDOMRef.value.innerHTML = `<p>MMSI : ${mmsi}</p><p>时间 : ${positionReportTicks}</p><p>航速 : ${sog?.toFixed(
              1
            )}节</p>`;
            hoverInfoLayer.setPosition(pos);
          } else {
            hoverInfoLayer.setPosition(undefined);
          }
        });
      } else {
        hoverInfoLayer.setPosition(undefined);
      }
    });

    /***********************地图点击弹框及（搜索、标签树、导航树点击对应弹框）*****************************/
    // 地图点击弹框
    // 弹窗图层
    const overlay = new Overlay({
      element: popupRef.value?.getDOMElement(), // 弹框组件
      autoPan: true
    });
    map.addOverlay(overlay);
    map.closePopup = () => {
      overlay && overlay.setPosition(undefined);
      popupData.featureCode = "";
      popupData.featureName = "";
      popupData.relationMap = null;
      // 移除选中状态
      clearSelectedFeature(map);
    };
    // 地图标签元素默认浮窗
    map.popupInfo = async (options: { featureCode: string; featureName: string; center: Coordinate }) => {
      const { featureCode, center, featureName } = options;
      // 在编辑状态下不弹框
      if (gisStore?.isEdit) {
        return;
      }
      // 获取标签关联的设备信息|| 实时数据（船、人通过isVisitObject区分）
      const trackInfoMap = map.get("trackInfoMap") || [];
      const currentTrack = trackInfoMap?.filter((item: any) => item.code == featureCode)?.[0]; // code有时字符串有时数字
      popupData.featureCode = featureCode;
      popupData.featureName = featureName;
      popupData.relationMap = gisStore?.relationMap[featureCode] || currentTrack;
      overlay.setPosition(center);
    };

    /***********************地图鼠标点击事件***************************************************************/
    // 鼠标点击事件
    map.on("click", (evt: MapBrowserEvent<any>) => {
      map.closePopup(); // 关闭点击弹框
      emits("onCloseRightMenu"); // 关闭右键菜单
      editLabelRef.value?.onClose(); // 关闭编辑标签弹框
      clearSelectedFeature(map); // 清空原来的选中状态(聚合与非聚合)
      let pixel = map.getEventPixel(evt.originalEvent);
      let hit = map.hasFeatureAtPixel(pixel, {
        hitTolerance: 5
      }); // 当前点击处是否有要素
      if (hit) {
        let currentSelectFeature = getSelectedFeature(map, pixel);
        // 对选择的要素做弹框弹出及选中样式、编辑弹框
        let featureCode = currentSelectFeature?.get("code");
        let featureName = currentSelectFeature?.get("name");
        let labelTypeCode = currentSelectFeature?.get("labelTypeCode");

        // 处理如果是告警标签则取对应的设备（弹框显示对应的设备 针对的就是基础引擎标签）
        let type = currentSelectFeature?.get("type");
        if (type == "alarmPoint") {
          let { featureLabelCode, featureLabelType } = getFeatureCodeByEquipCode(featureCode, map);
          featureCode = featureLabelCode || featureCode;
          labelTypeCode = featureLabelType;
        }
        if (featureCode) {
          let center = getCenter(currentSelectFeature.getGeometry().getExtent());
          // 获取船的数据
          const trackInfoMap = map.get("trackInfoMap") || [];
          const currentTrack = trackInfoMap?.filter((item: any) => item.code === featureCode)?.[0];
          map.popupInfo({ featureCode, featureName, center });
          // 以下是选中+编辑要素逻辑
          // 在编辑状态下且挂载在标签树的才可以操作编辑标签的功能（例如船是不可以挂载标签树） 将选中用定时器是因为编辑弹框会让选中消失
          if (labelTypeCode && labelTypeMap[labelTypeCode]?.isHang && gisStore?.isEdit) {
            if (map?.get("labelInfoMap")[featureCode]) {
              // 基础信息标签信息存在则可编辑
              editLabelRef.value?.onOpen(featureCode);
              timer.value = setTimeout(() => {
                labelOnSelect(exportMap.value, featureCode, true);
                clearTimeout(timer);
                timer.value = null;
              }, 200);
            }
          } else {
            labelOnSelect(exportMap.value, featureCode, true, currentTrack?.isVisitObject); // 选中（还需要判断是否外部对象的选中）
          }
        }
      }
    });

    /***********************地图右键（目前只有监控可用）*****************************************************/
    // 右键功能
    mapRef.value.oncontextmenu = async (evt: any) => {
      evt.preventDefault();
      let pixel = map?.getEventPixel(evt);
      let currentSelectFeature = getSelectedFeature(map, pixel);
      if (currentSelectFeature) {
        let featureCode = currentSelectFeature?.get("code");
        // 处理如果是告警标签则取对应的设备（弹框显示对应的设备 针对的就是基础引擎标签）
        let type = currentSelectFeature?.get("type");
        if (type == "alarmPoint") {
          let { featureLabelCode } = getFeatureCodeByEquipCode(featureCode, map);
          featureCode = featureLabelCode || featureCode;
        }
        emits("onOpenRightMenu", {
          featureCode,
          relationMap: gisStore?.relationMap,
          offsetX: evt.offsetX,
          offsetY: evt.offsetY
        });
      }
    };

    // 初始化完成
    exportMap.value = map;
    emits("getInitMapExportData", exportMap.value); // 应用获取初始化地图实例
    // 兼容监控外部树节点点击（首次树节点因地图没有初始化完成所以watch执行时定位不到,首次的数据手动执行）
    if (props?.outsideTreeNode) {
      let outsideTreeTimer: any = null;
      outsideTreeTimer = setTimeout(() => {
        outsideTreeNodeSelect(props.outsideTreeNode);
        clearTimeout(outsideTreeTimer);
        outsideTreeTimer = null;
      }, 3000);
    }
  } else {
    ElMessage.error("接口异常");
  }
};

const onScadaClose = () => {
  exportMap.value?.closePopup();
};

onMounted(() => {
  // 存储sessionId
  localStorage.setItem("sessionId", props?.config?.sessionId);
  // 存储导航树应用id
  const sourceCode = props?.config?.navSourceCode;
  gisStore.setSourceCode(sourceCode);
  // 设置并请求导航树、关联关系
  gisStore.setNavTreeAndRelation(); // 清空导航树数据
  gisStore.fetchNavigationTree(); // 获取导航树数据
  // 拼接控件扩展 是数组[]
  if (props?.config?.leftControl) {
    if (props?.config?.leftControlIndex || props?.config?.leftControlIndex == 0) {
      state.leftBoxData.splice(props?.config?.leftControlIndex, 0, ...props?.config?.leftControl);
    } else {
      state.leftBoxData = state.leftBoxData.concat(props.config?.leftControl);
    }
  }
  if (props?.config?.rightControl) {
    if (props?.config?.rightControlIndex || props?.config?.rightControlIndex == 0) {
      state.rightBoxData.splice(props?.config?.rightControlIndex, 0, ...props?.config?.rightControl);
    } else {
      state.rightBoxData = state.rightBoxData.concat(props.config?.rightControl);
    }
  }
  gisStore.setIsEdit(false);
  const mapParams = props?.config?.id || props?.config?.code;
  if (!mapParams) return;
  initMap(mapParams, !!props?.config?.id);
});

onBeforeUnmount(() => {
  if (dynamicTimes.value) {
    clearInterval(dynamicTimes.value);
    dynamicTimes.value = null;
  }
  if (alarmTimer.value) {
    clearInterval(alarmTimer.value);
    alarmTimer.value = null;
  }
  if (gisStore?.simulateAlarmTimer) {
    clearInterval(gisStore?.simulateAlarmTimer);
    gisStore?.setSimulateAlarmTimer(null);
  }
});

// 自定义框选弹框
const onClickBoxSelection = (selectionFeatures: any[]) => {
  emits("getClickBoxSelection", selectionFeatures, gisStore?.relationMap);
};

// 自定义搜素
const customSearchDialog = (inputValue: string) => {
  emits("getCustomSearchContent", inputValue, gisStore?.relationMap);
};

// 导出事件
const getMapElement = () => {
  return exportMap.value;
};

const panToFeature = (featureCode: string | number, isFeatureClick: boolean) => {
  labelOnSelect(exportMap.value, featureCode, isFeatureClick);
};

const getRelationMap = () => {
  return gisStore?.relationMap;
};

const handlePopLink = (type: any, option: any) => {
  emits(type, option);
};

// 实时标签样式
let toolboxCallBack: (arg: boolean) => void;
const toolboxStore = useToolboxStore();
watch(
  () => toolboxStore.data,
  n => {
    typeof toolboxCallBack == "function" && toolboxCallBack(n);
  }
);
const toolBoxSetChange = (fn: () => void) => {
  toolboxCallBack = fn;
};

defineExpose({
  getMapElement,
  panToFeature,
  getRelationMap,
  createdFeature,
  createGeometry,

  createdTrackData,
  getTrackDataByIdFn,
  showHideTrackData,
  delTrackData,

  createLabel,
  removeLabel,
  getFeature,
  clearSelectedFeature,
  createStyle,
  getGeometryCenter,
  toolBoxSetChange
});

/***********************监听外部树节点点击(监控在可视化配置的树)***************************************************************/
const outsideTreeNodeSelect = (node: any) => {
  const { tupleList = [], model } = node;
  const equipId = Number(tupleList[0]);
  if (model.toLocaleLowerCase() === "eam_eqp_equip") {
    const res = find(gisStore?.relationMap, (item: any) => {
      return item.id === equipId;
    });
    if (res && res.associationInfo && exportMap.value) {
      labelOnSelect(exportMap.value, res.associationInfo.associationObjectCode, false);
    }
  }
};
watch(
  () => props.outsideTreeNode,
  node => {
    if (node) {
      outsideTreeNodeSelect(node);
    }
  },
  {
    deep: true
  }
);
</script>

<style lang="scss" scoped>
.component-box {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>

<style lang="scss">
.popup {
  min-width: 200px;
  overflow: hidden;
  background: #ffffff;
  border-radius: 3px;
  box-shadow: 0 1px 4px #00000033;
  .popup-tit {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 40px;
    padding: 0 20px;
    color: #ffffff;
    background: var(--el-color-primary);
  }
  .popup-content {
    padding: 10px 20px;
    overflow: hidden;
    font-size: 14px;
    line-height: 22px;
  }
}
.component-box {
  .visual-map {
    width: 100%;
    height: 100%;

    /* Full Screen 控件的容器样式 */
    .ol-full-screen {
      position: absolute;
      right: 6px;
      bottom: 6px;
      z-index: 10000;
      transform: scale(0.8);
    }

    /* Full Screen 按钮的样式 */
    .ol-full-screen button {
      padding: 5px 10px;
      font-size: 14px;
      color: #333333;
      cursor: pointer;
      background-color: #ffffff;
      border: 1px solid #cccccc;
    }

    /* Full Screen 按钮悬停时的样式 */
    .ol-full-screen button:hover {
      background-color: #f5f5f5;
      border: 1px solid #aaaaaa;
    }

    /* Full Screen 按钮按下时的样式 */
    .ol-full-screen button:active {
      background-color: #ebebeb;
      border-color: #adadad;
      box-shadow: inset 0 1px 2px rgb(0 0 0 / 20%);
    }

    /* Zoom 控件的容器样式 */
    .ol-zoom {
      position: absolute;
      right: 36px;
      bottom: 6px;
      z-index: 10000;
      transform: scale(0.8);
    }

    /* Zoom 按钮的样式 */
    .ol-zoom button {
      padding: 5px 10px;

      // margin-bottom: 1px;
      font-size: 14px;
      color: #333333;
      cursor: pointer;
      background-color: #ffffff;
      border: 1px solid #cccccc;
    }

    /* Zoom 按钮悬停时的样式 */
    .ol-zoom button:hover {
      background-color: #f5f5f5;
      border: 1px solid #aaaaaa;
    }

    /* Zoom 按钮按下时的样式 */
    .ol-zoom button:active {
      background-color: #ebebeb;
      border-color: #adadad;
      box-shadow: inset 0 1px 2px rgb(0 0 0 / 20%);
    }

    /* Zoom 按钮禁用时的样式 */
    .ol-zoom button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    /* ScaleLine 控件的容器样式 */
    .control-scaleLine {
      position: absolute;
      bottom: 6px;
      left: 10px;
      padding: 4px 8px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 0.5;
      color: #000000;
      text-align: center;
      text-shadow: -1px -1px 0 #ffffff, 1px -1px 0 #ffffff, -1px 1px 0 #ffffff, 1px 1px 0 #ffffff;
      border-right: 1px solid #333333;
      border-bottom: 4px solid #333333;
      border-left: 1px solid #333333;
    }

    /* ScaleLine 控件的单位样式 control-scaleLine-inner */
    .control-scaleLine span {
      white-space: nowrap;
    }
  }

  /* 当前等级 */
  .mapLevel {
    position: absolute;
    right: 88px;
    bottom: 6px;
    z-index: 10000;
    padding: 5px 10px;
    font-size: 14px;
    color: #333333;
    cursor: pointer;
    background-color: #ffffff;
    border: 1px solid #cccccc;
    transform: scale(0.8);
  }
}
</style>
