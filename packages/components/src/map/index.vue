<!-- 地图组件 map -->
<template>
  <div class="component-box">
    <div id="map" class="visual-map" @contextmenu.stop @click.stop ref="mapRef"></div>

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
    <Popup :data="popupData" @on-close="onScadaClose" ref="popupRef">
      <template #customContent v-if="customContent">
        <component :is="customContent"></component>
      </template>
    </Popup>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, defineAsyncComponent, reactive, computed, shallowRef, useSlots, watch } from "vue";
import { ElMessage } from "element-plus";
import { Map, View, Feature, Overlay } from "ol";
import MapBrowserEvent from "ol/MapBrowserEvent";
import { FullScreen, ScaleLine, defaults } from "ol/control";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { XYZ, Vector as VectorSource, Cluster } from "ol/source";
import type { FeatureLike } from "ol/Feature";
import { fromLonLat } from "ol/proj";
import { Select } from "ol/interaction";
import type { Coordinate } from "ol/coordinate";
import { getCenter } from "ol/extent";
import type { VisualMap, LabelType, LabelInfoData } from "./type";
import { getMapParamsDetail, getLabelList } from "../api/visconfig";
import { handleParam } from "@/utils/common.js";
import { find } from "lodash";
import { useGisStore } from "../stores/modules/gis";

import { layerStyle, clusterLayerStyle, createStyle } from "./hooks/styleFunction.js";
import { createGeometry, getGeometryCenter } from "./hooks/createGeometry.js";
import { createdFeature } from "./hooks/createdFeature.js";
import { createdTrackData } from "./hooks/createdTrackData.js";
import { clearSelectedFeature, labelOnSelect, createLabel, removeLabel, getFeature } from "./hooks/index";
import LeftActionBox from "./components/LeftActionBox.vue";
import RightActionBox from "./components/rightActionBox.vue";
import EditLabel from "./components/editLabel.vue";
import Popup from "./components/popup.vue";

defineOptions({ name: "AgMap" });

const customContent = useSlots()?.customContent;

const gisStore = useGisStore();
const props = withDefaults(defineProps<{ config: any; onClickFeaturePopup?: Function; outsideTreeNode?: any }>(), {
  config: () => {},
  onClickFeaturePopup: () => true,
  outsideTreeNode: () => null
});

const emits = defineEmits([
  "onOpenRightMenu",
  "onCloseRightMenu",
  "getClickBoxSelection",
  "getCustomSearchContent",
  "getInitMapExportData"
]);

const exportMap = ref<VisualMap>();
const mapRef = ref();
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
      label: "快速创建",
      isShow: false,
      visible: false,
      component: shallowRef(defineAsyncComponent(() => import("./components/quickCreate.vue")))
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
      case "快速创建":
        item.visible = !!controlList.value.includes("quickCreate");
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

const initMap = async (mapId: string | number) => {
  // 获取地图配置（初始化地图参数详情）
  const res: { [key: string]: any } = await getMapParamsDetail(mapId);
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

      zoom: controls.includes("zoom"), // 缩放控件
      fullScreen: controls.includes("fullScreen"), // 全屏控件
      scaleLine: controls.includes("scaleLine"), // 比例尺控件  scaleLine
      showOverlay: controls.includes("showOverlay"), // 路网叠加层 showOverlay
      controlIds: originalData.displayControlIds, // 控件 string
      displayLegend: originalData.displayLegend // 图例[]
    };

    // 全屏控件
    const fullScreen = new FullScreen({ className: "ol-full-screen", tipLabel: "全屏" });
    // 比例尺控件
    const scaleLine = new ScaleLine({ className: "control-scaleLine" });
    // 控件列表(是否显示全屏缩放控件)
    const controlsList = [];
    if (defaultOptions.fullScreen) {
      controlsList.push(fullScreen);
    }
    if (defaultOptions.scaleLine) {
      controlsList.push(scaleLine);
    }

    // 电子底图图层
    const normalMap = new TileLayer({
      visible: defaultOptions.defaultMapType === 1,
      source: new XYZ({
        url: defaultOptions.normalUrl
      })
    });
    // 卫星影像图层
    const sateMap = new TileLayer({
      visible: defaultOptions.defaultMapType === 2,
      source: new XYZ({
        url: defaultOptions.sateUrl
      })
    });

    // 路网叠加层（是卫星影像且显示路网叠加层）
    const overlayMap = new TileLayer({
      visible: defaultOptions.defaultMapType === 2 && defaultOptions.showOverlay,
      source: new XYZ({
        url: defaultOptions.overlayUrl
      })
    });

    // 实例化地图，类型为扩展后的VisualMap
    const map = new Map({
      target: defaultOptions.target || "",
      controls: defaults({
        attribution: false,
        rotate: false,
        zoom: defaultOptions.zoom,
        zoomOptions: {
          className: "ol-zoom",
          zoomInTipLabel: "放大",
          zoomOutTipLabel: "缩小"
        }
      }).extend(controlsList),
      layers: [normalMap, sateMap, overlayMap],
      view: new View({
        center: fromLonLat([defaultOptions.center.lon, defaultOptions.center.lat]),
        zoom: defaultOptions.defaultZoom,
        minZoom: defaultOptions.minZoom,
        maxZoom: defaultOptions.maxZoom,
        constrainResolution: true
      })
    }) as VisualMap;

    gisStore.setMapCase(map);

    // 缓存配置
    map.defaultOptions = defaultOptions;

    // 根据图层配置信息创建图层
    const layerMap: { [key: string]: any } = {};
    let clusterLayerCodes: any = [];

    defaultOptions.layers.forEach((item: { [key: string]: any }) => {
      let options: { [key: string]: any };

      // 分为聚合图层还是非聚合图层(聚合图层针对点)
      if (item?.isTagAgg) {
        let sourceVector = new VectorSource();
        let clusterSource = new Cluster({
          distance: item?.tagAggDistance ? Number(item?.tagAggDistance) : 0, // 图层上标签聚合距离
          source: sourceVector
        });
        options = {
          source: clusterSource,
          zIndex: item?.layerLevel,
          minZoom: item?.layerMinLevel - 0.000000000000005,
          maxZoom: item?.layerMaxLevel,
          trackAggDistance: item.trackAggDistance || 0, // 聚合图层上轨迹聚合距离
          name: item?.name,
          code: item?.code,
          isTagAgg: item?.isTagAgg,
          isTrackDraw: item?.isTrackDraw,
          style: (feature: FeatureLike) => clusterLayerStyle(feature, isDynamicLine.value, imgIndex.value, false) // 是否选中（因为聚合图层的选中单独处理）
        };
      } else {
        options = {
          source: new VectorSource({ wrapX: false }),
          zIndex: item?.layerLevel,
          minZoom: item?.layerMinLevel - 0.000000000000005,
          maxZoom: item?.layerMaxLevel,
          trackAggDistance: item.trackAggDistance || 0, // 聚合图层上轨迹聚合距离
          name: item.name,
          code: item?.code,
          isTagAgg: item?.isTagAgg,
          isTrackDraw: item?.isTrackDraw,
          style: (feature: FeatureLike) => layerStyle(feature, isDynamicLine.value, imgIndex.value)
        };
      }

      layerMap[item.code] = new VectorLayer(options);
      if (item?.isTagAgg) {
        clusterLayerCodes.push(item.code);
      }
      map.addLayer(layerMap[item.code]);
    });

    /**********************************************************************/

    map.set("layerMap", { normalMap, sateMap, overlayMap, ...layerMap }); // 存储所有的图层信息
    map.set("clusterLayerCodes", clusterLayerCodes); // 存储所有的图层信息

    // 创建固定的点图层用于定位时增加定位点到点图层
    let positionPointLayer = new VectorLayer({
      source: new VectorSource()
    });
    map.addLayer(positionPointLayer);
    map.set("positionPointLayer", positionPointLayer);

    // 存储标签类型信息及根据标签类型分组 code => labelType
    const labelTypeMap: { [key: string]: LabelType } = {};
    let featureTypeGroup: { [key: string]: Feature[] } = {};
    const { labelType, layersIds } = defaultOptions;
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
    // 初始化渲染所有已绘制的标签
    let resData: { [key: string]: any } = await getLabelList(
      ...(handleParam({ pageNumber: 1, pageSize: 100000, name: "", orderByColumn: "", isAsc: "" }) as [string, object])
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

          labelFeature.set("layerCode", item.refLayer.code); // 所属图层编码
          labelFeature.set("labelTypeCode", item.labelType.code); // 所属标签类型编码
          labelFeature.setId(item.code); // 是否显示标签
          labelFeature.set("code", item.code); // 是否显示标签
          labelFeature.set("type", item.labelData?.style?.type); // 旧数据Point  新数据 1
          labelFeature.set("isShow", true); // 是否显示标签
          labelFeature.set("labelData", item?.labelData); // 标签绘制数据

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

      // 动态样式
      let dynamicLayers = Array.from(new Set(dynamicLayerCodes));
      map.set("dynamicLayerCodes", dynamicLayers);
      if (map.get("dynamicLayerCodes")?.length) {
        setInterval(() => {
          // 风机转动及虚线闪动
          gisStore.setImgIndex(imgIndex.value + 1);
          gisStore.setIsDynamicLine(!isDynamicLine.value);
          dynamicLayers.forEach((code: string) => {
            // 判断是聚合图层还是非聚合图层
            if (clusterLayerCodes.includes(code)) {
              layerMap[code].setStyle((feature: FeatureLike) =>
                clusterLayerStyle(feature, isDynamicLine.value, imgIndex.value, false)
              );
            } else {
              layerMap[code].setStyle((feature: FeatureLike) => layerStyle(feature, isDynamicLine.value, imgIndex.value));
            }
          });
        }, 200);
      }
      map.set("labelInfoMap", labelInfoMap);
    } else {
      ElMessage.error("接口异常");
    }

    // 鼠标移动事件
    map.on("pointermove", function (e: MapBrowserEvent<any>) {
      const pixel = map.getEventPixel(e.originalEvent);
      const hit = map.hasFeatureAtPixel(pixel, { hitTolerance: 5 });
      map.getTargetElement().style.cursor = hit ? "pointer" : "";
    });

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
      // 移除选中状态
      clearSelectedFeature(map);
    };
    // 地图标签元素默认浮窗
    map.popupInfo = async (options: { featureCode: string; featureName: string; center: Coordinate }) => {
      // 不是编辑状态下才会有弹框
      if (gisStore?.isEdit) {
        // map.closePopup();
        return;
      }
      const { featureCode, center, featureName } = options;
      const result: any = await props?.onClickFeaturePopup({ featureCode, featureName, relationMap: gisStore?.relationMap });
      if (result) {
        popupData.featureCode = featureCode;
        popupData.featureName = featureName;
        overlay.setPosition(center);
      }
    };

    // 鼠标点击事件
    map.on("click", (evt: MapBrowserEvent<any>) => {
      map.closePopup(); // 关闭点击弹框
      emits("onCloseRightMenu"); // 关闭右键菜单
      let featureSelect = map.get("featureSelect");
      clearSelectedFeature(map);
      const feature = map.forEachFeatureAtPixel(
        evt.pixel,
        function (feature: FeatureLike) {
          return feature;
        },
        { hitTolerance: 5 } // 设置捏合度为 5 像素
      );
      if (feature) {
        // 点击地图上的要素
        const featureCode = feature.get("code");
        const featureName = feature.get("name");
        if (featureCode) {
          featureSelect = feature; // 更新当前选中要素

          if (featureSelect) {
            featureSelect.set("selected", true); // 将当前选中要素的 selected 属性设置为 true
            featureSelect.changed(); // 触发要素样式的变化
            map.set("featureSelect", feature);
          }
          // 弹框逻辑
          let center = getCenter(feature.getGeometry().getExtent());
          map.popupInfo({ featureCode, featureName, center });
        }
      }
    });

    // 聚合图层选中事件（通过交互控件实现）
    if (clusterLayerCodes?.length) {
      let selectInteraction = new Select({
        condition: function (event) {
          return event.type == "click" || event.type == "singleclick";
        },
        layers: clusterLayerCodes.map((code: string) => layerMap[code])
      });
      map.addInteraction(selectInteraction);
      selectInteraction.on("select", function (e) {
        emits("onCloseRightMenu");
        if (e.selected?.length > 0) {
          let originalFeatureList: any = [];
          // let propertiesList=[]
          e.selected.forEach(function (clusterFeature) {
            // 根据选中状态切换要素的样式
            clusterFeature.setStyle(feature => clusterLayerStyle(feature, isDynamicLine.value, imgIndex.value, true));
            clusterFeature.get("features").forEach(function (originalFeature: FeatureLike) {
              // propertiesList.push(originalFeature.getProperties()); // 原始要素的属性
              originalFeatureList.push(originalFeature);
            });
          });
          // 实现业务是获取到选中要素的唯一标识进行以后的逻辑
          let orgFeature;
          if (originalFeatureList && originalFeatureList?.length) {
            orgFeature = originalFeatureList[0];
            const featureCode = orgFeature.get("code");
            const featureName = orgFeature.get("name");
            let center = getCenter(orgFeature?.getGeometry()?.getExtent());
            map.popupInfo({ featureCode, featureName, center });
          }
        }
        if (e.deselected?.length > 0) {
          e.deselected.forEach(function (clusterFeature) {
            // 取消选中
            clusterFeature.setStyle(feature => clusterLayerStyle(feature, isDynamicLine.value, imgIndex.value, false));
          });
        }
      });
      map.set("selectInteraction", selectInteraction);
    }

    // 右键功能
    mapRef.value.oncontextmenu = async (evt: any) => {
      evt.preventDefault();
      let pixel = map.getEventPixel(evt);
      const features = map.getFeaturesAtPixel(pixel, { hitTolerance: 5 });
      if (features && features.length > 0) {
        let feature: any = null;
        let clickedFeature = features[0];
        // 判断是否聚合要素
        if (clickedFeature?.get("features")) {
          const originalFeatures = clickedFeature.get("features");
          feature = originalFeatures[0];
        } else if (clickedFeature instanceof Feature) {
          feature = clickedFeature;
        }
        if (feature) {
          const featureCode = feature?.getId();
          console.log(evt.offsetX, evt.offsetY);
          emits("onOpenRightMenu", {
            featureCode,
            relationMap: gisStore?.relationMap,
            offsetX: evt.offsetX,
            offsetY: evt.offsetY
          });
        }
      }
    };

    exportMap.value = map;
    emits("getInitMapExportData", exportMap.value); // 应用获取初始化地图实例
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
  const mapParams = props?.config?.id;
  if (!mapParams) return;
  initMap(mapParams);
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

defineExpose({
  getMapElement,
  panToFeature,
  getRelationMap,
  createdFeature,
  createGeometry,
  createdTrackData,
  createLabel,
  removeLabel,
  getFeature,
  clearSelectedFeature,
  createStyle,
  getGeometryCenter
});

// 监听外部树节点点击
watch(
  () => props.outsideTreeNode,
  node => {
    if (node) {
      const { tupleList, equipNodeFlag } = node;
      const equipId = Number(tupleList[0]);

      if (equipNodeFlag) {
        const res = find(gisStore?.relationMap, (item: any) => {
          return item.id === equipId;
        });
        if (res && res.associationInfo && exportMap.value) {
          labelOnSelect(exportMap.value, res.associationInfo.associationObjectCode, false);
        }
      }
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
}
</style>
