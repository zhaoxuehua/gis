<template>
  <div class="tool-box">
    <!-- title模块 -->
    <div class="title-box">
      <span>工具箱</span>
      <Icon src="Close" :size="14" @click.stop="onClose" class="icon"></Icon>
    </div>

    <div class="content-box">
      <el-tabs v-model="state.activeIndex">
        <el-tab-pane name="1" label="测量工具"> </el-tab-pane>
        <el-tab-pane name="5" label="设置中心点"></el-tab-pane>
        <el-tab-pane name="2" label="坐标定位"></el-tab-pane>
        <el-tab-pane name="3" label="实时标签样式"></el-tab-pane>
        <el-tab-pane name="4" label="获取水深"></el-tab-pane>
      </el-tabs>

      <!-- 展示内容区 -->
      <!-- 测量工具 -->
      <div class="measuring-tools" v-show="state.activeIndex == '1'">
        <div class="measuring-title">测量模式</div>
        <div>
          <el-select v-model="state.measuringValue" placeholder="请选择..." clearable>
            <el-option v-for="item in state.measuringOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-button type="primary" @click="onClearMeasuring" v-if="isMeasure">清除</el-button>
          <el-button type="primary" @click="onMeasuring" v-else>测量</el-button>
        </div>
      </div>

      <!-- 设置中心点 -->
      <div class="measuring-tools" v-if="state.activeIndex == '5'">
        <div>
          <label> 经度 </label>
          <el-input type="number" v-model="state.centerData.lon" class="set-center-input" />
          <label style="padding-left: 20px"> 纬度 </label>
          <el-input type="number" v-model="state.centerData.lat" class="set-center-input" />
          <div class="position-btn">
            <el-button type="primary" @click="getCurrentMapPositionCenter">获取中心点</el-button>
            <el-button type="primary" @click="toSetMapCenter">设置中心点</el-button>
          </div>
        </div>
      </div>

      <!-- 坐标定位 -->
      <div class="measuring-tools" v-show="state.activeIndex == '2'">
        <div class="coordinate-position-box">
          <el-tabs v-model="state.activeTabs" type="card" @tab-click="handleTabClick">
            <el-tab-pane label="度分秒" name="first">
              <div class="lon-box">
                <label> 经度 </label>
                <el-input type="number" v-model="state.lonDegree" class="short_l" />
                <em>°</em>
                <el-input type="number" v-model="state.lonMin" class="short_l" />
                <em>'</em>
                <el-input type="number" v-model="state.lonSeconds" class="short_l" />
                <em>''</em>
                <span class="tip-unit">E</span>
              </div>
              <div class="lon-box">
                <label> 纬度 </label>
                <el-input type="number" v-model="state.latDegree" class="short_l" />
                <em>°</em>
                <el-input type="number" v-model="state.latMin" class="short_l" />
                <em>'</em>
                <el-input type="number" v-model="state.latSeconds" class="short_l" />
                <em>''</em>
                <span class="tip-unit">N</span>
              </div>
              <div class="position-btn">
                <el-button type="primary" @click="conformPosition">定位</el-button>
                <el-button type="primary" @click="toMapCenter">中心点</el-button>
              </div>
            </el-tab-pane>

            <el-tab-pane label="度分" name="second">
              <div class="lon-box">
                <label> 经度 </label>
                <el-input type="number" v-model="state.lonDegree" class="short_2" />
                <em>°</em>
                <el-input type="number" v-model="state.lonMin" class="short_2" />
                <em>'</em>
                <span class="tip-unit">E</span>
              </div>

              <div class="lon-box">
                <label> 纬度 </label>
                <el-input type="number" v-model="state.latDegree" class="short_2" />
                <em>°</em>
                <el-input type="number" v-model="state.latMin" class="short_2" />
                <em>'</em>
                <span class="tip-unit">N</span>
              </div>

              <div class="position-btn">
                <el-button type="primary" @click="conformPosition">定位</el-button>
                <el-button type="primary" @click="toMapCenter">中心点</el-button>
              </div>
            </el-tab-pane>

            <el-tab-pane label="度" name="third">
              <div class="lon-box">
                <label> 经度 </label>
                <el-input type="number" v-model="state.lonDegree" class="short_3" />
                <em>°</em>
                <span class="tip-unit">E</span>
              </div>

              <div class="lon-box">
                <label> 纬度 </label>
                <el-input type="number" v-model="state.latDegree" class="short_3" />
                <em>°</em>
                <span class="tip-unit">N</span>
              </div>
              <div class="position-btn">
                <el-button type="primary" @click="conformPosition">定位</el-button>
                <el-button type="primary" @click="toMapCenter">中心点</el-button>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 实时标签样式 -->
      <div class="measuring-tools" v-show="state.activeIndex == '3'" @click.stop>
        <div class="coordinate-position-box">
          <el-form :model="state" label-width="130">
            <el-form-item label="船首线" label-width="130">
              <el-checkbox v-model="state.shipHeadLine"></el-checkbox>
            </el-form-item>

            <el-form-item label="轨迹回放隐藏内容" label-width="130">
              <el-select v-model="state.shipShowHideByTrack" clearable>
                <el-option
                  v-for="item in state.shipShowHideByTrackOption"
                  :key="item?.name"
                  :label="item?.name"
                  :value="item?.code"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="轨迹回放动画" label-width="130">
              <el-select v-model="state.trackSpeed">
                <el-option v-for="item in trackSpeedOption" :key="item.name" :label="item.name" :value="item.value" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- 获取水深 -->
      <div class="measuring-tools" v-if="state.activeIndex == '4'">
        <div>
          <DepthWaterBox></DepthWaterBox>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { onMounted, reactive, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { Feature } from "ol";
import { fromLonLat } from "ol/proj";
import { Draw } from "ol/interaction";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { LineString, Polygon, Point } from "ol/geom";
import Overlay from "ol/Overlay";
import { unByKey } from "ol/Observable";
import { Style, Icon as IconStyle } from "ol/style";
import { measureStyle } from "../hooks/styleFunction";
import { formatLength, formatArea } from "../hooks/createMeasure";
import type { VisualMap } from "../type";
import pointImg from "../img/piont.png";
import Icon from "./Icon.vue";
import DepthWaterBox from "./depthWaterBox.vue";

// 辅助函数，回到地图中心点 获取地图中心点
import { setToMapCenter, getMapPositionCenter } from "../hooks/setToMapCenter";

// store
import { useToolboxStore } from "../../stores/modules/toolBox";

// api
import { getLayerList } from "../../api/device";

const props = withDefaults(defineProps<{ map: VisualMap | null; index: number; isShow?: boolean }>(), {
  map: () => null,
  index: () => 0,
  isShow: () => false
});
const emits = defineEmits(["onClose"]);
// 关闭地图类型
const onClose = () => {
  emits("onClose", props.index);
};

const state = reactive({
  activeIndex: "1",
  measuringValue: "length", //当前选择的测量单位
  measuringOptions: [
    // 测量下拉选项
    { value: "length", label: "长度" },
    { value: "area", label: "面积" }
  ],

  // 设置中心点经纬度
  centerData: {
    lon: "",
    lat: ""
  },

  // 坐标定位
  activeTabs: "first",
  lonDegree: "", // 经度-度
  lonMin: "", // 经度-分
  lonSeconds: "", // 经度-秒
  latDegree: "", // 纬度-度
  latMin: "", // 纬度-分
  latSeconds: "", // 纬度-秒

  // 实时标签样式
  shipHeadLine: false,
  shipShowHideByTrack: "",
  shipShowHideByTrackOption: [] as any,
  trackSpeed: ""
});

/*******************************************测距********************************************/
//测量
let isMeasure = ref(false);
const measureVectorLayer = ref(); // 测量图层
const measureSource = ref(); // 测量图层数据源
const measureOverlays = ref<Array<any>>([]); // 测量距离显示覆盖物数组
// 点击测量按钮
const onMeasuring = () => {
  isMeasure.value = !isMeasure.value;
  if (state.measuringValue) {
    onMeasuringFun(state.measuringValue);
  }
};
// 进入测量模式
const onMeasuringFun = (value: string) => {
  if (props.map?.get("measureDrawInteraction")) {
    // 测量交互器
    measureRemoveInteraction();
    return;
  }
  measureSource.value = new VectorSource();
  measureVectorLayer.value = new VectorLayer({
    source: measureSource.value,
    // 图层样式
    style: measureStyle
  });
  props.map && props.map.addLayer(measureVectorLayer.value);
  measureAddInteraction(value);
};
// 测量交互，计算线的长度，面的面积
const measureAddInteraction = (value: string) => {
  if (!props.map) return;
  let measureTooltipElement: any;
  let measureTooltip: any;
  let measureDrawInteraction = new Draw({
    source: measureSource.value, // 绘制图层的数据源
    type: value == "area" ? "Polygon" : "LineString", // 绘制类型
    style: measureStyle
  });
  props.map.addInteraction(measureDrawInteraction);
  // 存储测量交互器
  props.map?.set("measureDrawInteraction", measureDrawInteraction);
  createMeasureTooltip();

  // 计算单位
  let defaultOptions = props.map?.defaultOptions;
  let unit = defaultOptions?.scaleLineUnit; // "metric"米千米或者海里

  // 创建展示面积或者长度的弹框
  function createMeasureTooltip() {
    if (measureTooltipElement) {
      measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }
    measureTooltipElement = document.createElement("div");
    measureTooltipElement.className = "ol-tooltip ol-tooltip-measure";
    measureTooltip = new Overlay({
      element: measureTooltipElement,
      offset: [0, -15],
      positioning: "bottom-center"
    });

    if (props.map) {
      props.map.addOverlay(measureTooltip);
    }
    measureOverlays.value.push(measureTooltip);
  }

  let sketch;
  let listener: any;
  measureDrawInteraction.on("drawstart", (evt: any) => {
    sketch = evt.feature;
    let tooltipCoord = evt.coordinate;

    listener = sketch.getGeometry().on("change", function (evt: any) {
      let geom = evt.target;
      let output;
      if (geom instanceof Polygon) {
        output = formatArea(geom, unit);
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
      } else if (geom instanceof LineString) {
        output = formatLength(geom, unit);
        tooltipCoord = geom.getLastCoordinate();
      }
      measureTooltipElement.innerHTML = output;
      measureTooltip.setPosition(tooltipCoord); // 测量距离文字所在位置
    });
  });

  measureDrawInteraction.on("drawend", function () {
    measureTooltip.setOffset([0, -7]);
    sketch = null;
    measureTooltipElement = null;
    createMeasureTooltip();
    unByKey(listener);
  });
};
// 点击清楚按钮
const onClearMeasuring = () => {
  measureRemoveInteraction();
  isMeasure.value = !isMeasure.value;
};
// 清除已绘制的图形
const measureRemoveInteraction = () => {
  if (props.map && props.map?.get("measureDrawInteraction")) {
    props.map.removeInteraction(props.map?.get("measureDrawInteraction"));
    props.map?.set("measureDrawInteraction", null);
    props.map?.removeLayer(measureVectorLayer.value);
    measureOverlays.value.forEach(item => {
      props.map && props.map?.removeOverlay(item);
    });
    measureOverlays.value = [];
  }
};
/*******************************************测距结束********************************************/

/*******************************************设置中心点********************************************/
// 获取当前地图位置处的中心点
const getCurrentMapPositionCenter = () => {
  let corObj = getMapPositionCenter(props.map);
  if (corObj) {
    // 更新中中心点的显示
    state.centerData.lon = corObj?.centerX;
    state.centerData.lat = corObj?.centerY;
  }
};

// 给应用场景设置中心点(修改初始化时存储的中心点经纬度及调用接口：修改配置的经纬度)
const toSetMapCenter = () => {
  // 经纬度必须有值
  if (state.centerData.lon && state.centerData.lat) {
    // 接口成功后的操作
    let defaultOptions = props.map?.defaultOptions;
    if (defaultOptions?.center?.lon && defaultOptions?.center?.lat) {
      defaultOptions.center.lon = state.centerData.lon;
      defaultOptions.center.lat = state.centerData.lat;
    }
  } else {
    ElMessage.warning("请设置经纬度值");
  }
};

// 首次打开工具箱赋初始值经纬度
watch(
  () => props.isShow,
  isShowVal => {
    if (isShowVal) {
      getCurrentMapPositionCenter();
    }
  },
  {
    immediate: true,
    deep: true
  }
);

/*******************************************设置中心点结束********************************************/

/*******************************************坐标定位********************************************/
// 切换定位tab时清空度分秒绑定值
const handleTabClick = () => {
  state.lonDegree = ""; // 经度-度
  state.lonMin = ""; // 经度-分
  state.lonSeconds = ""; // 经度-秒
  state.latDegree = ""; // 纬度-度
  state.latMin = ""; // 纬度-分
  state.latSeconds = ""; // 纬度-秒
};

const changeToDu = (d: string = "0", f: string = "0", m: string = "0") => {
  let num = 0;
  if (d) {
    num = num + Number(d);
  }
  if (f) {
    num = num + Number(f) / 60;
  }
  if (m) {
    num = num + Number(m) / 3600;
  }
  return num;
};
const conformPosition = () => {
  const lon = changeToDu(state.lonDegree, state.lonMin, state.lonSeconds); // 根据度 分秒 转换成经度值
  const lat = changeToDu(state.latDegree, state.latMin, state.latSeconds); // 根据度 分秒 转换成纬度值
  mapCenterByPic(lon, lat); // 定位到地图中心点
};

const mapCenterByPic = (lon: any, lat: any) => {
  if (!lon || !lat || !props.map) {
    return false;
  }

  const view = props.map?.getView(); // 获取地图视图
  const centerCoArr = fromLonLat([Number(lon), Number(lat)]);
  const zoom = view?.getMaxZoom();
  props.map?.getView().animate({
    center: centerCoArr,
    zoom: zoom
  });

  let positionPointLayer = props?.map?.get("positionPointLayer");
  if (positionPointLayer) {
    let pointFeature = new Feature({
      geometry: new Point(centerCoArr)
    });
    pointFeature.setStyle(
      new Style({
        image: new IconStyle({
          src: pointImg
        })
      })
    );
    positionPointLayer?.getSource()?.addFeature(pointFeature);
    setTimeout(() => {
      positionPointLayer?.getSource()?.removeFeature(pointFeature);
    }, 3000);
  }
};
/*******************************************坐标定位结束********************************************/

/*******************************************回到地图中心点******************************************/
const toMapCenter = () => {
  // 中心点
  if (!props?.map) {
    return;
  }
  let defaultOptions = props.map?.defaultOptions;
  let zoom = defaultOptions?.defaultZoom;
  setToMapCenter({
    lon: defaultOptions?.center.lon,
    lat: defaultOptions?.center.lat,
    zoom: zoom,
    duration: 500
  });
};

/*******************************************实时标签样式******************************************/
// 轨迹隐藏图层
getLayerList({ pageNumber: 1, pageSize: 100 }).then(res => {
  if (res.data && res.data.items) {
    state.shipShowHideByTrackOption = res.data.items;
  }
});

// 轨迹回放动画
const trackSpeedOption = ref([
  {
    name: "快",
    value: "0.1"
  },
  {
    name: "慢",
    value: "1"
  },
  {
    name: "无",
    value: ""
  }
]);
// 实时标签样式:存入浏览器
const toolboxStore = useToolboxStore();
watch([() => state.shipHeadLine, () => state.shipShowHideByTrack, () => state.trackSpeed], function (n) {
  localStorage.setItem("shipTags", JSON.stringify(n));
  toolboxStore.changeData(n[0]);
});

//页面加载浏览器数据
let shipTagsData: string | null = localStorage.getItem("shipTags");
if (shipTagsData) {
  let [shipHeadLine, shipShowHideByTrack, trackSpeed] = JSON.parse(shipTagsData);
  state.shipHeadLine = shipHeadLine;
  state.shipShowHideByTrack = shipShowHideByTrack;
  state.trackSpeed = trackSpeed;
}
/*******************************************实时标签样式结束******************************************/

onMounted(() => {});
</script>

<style lang="scss" scoped>
.tool-box {
  display: flex;
  flex-direction: column;
  width: 430px;
  min-height: 320px;
  overflow: auto;
  box-shadow: 0 2px 4px rgb(0 0 0 / 20%);
}
.title-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 60px;
  padding: 0 20px;
  background-color: #f7f7fa;
  span {
    font-size: 16px;
  }
  .icon {
    cursor: pointer;
  }
}
.content-box {
  margin: 0 20px;
  .measuring-tools {
    padding: 20px 0;
  }
  .measuring-title {
    margin-bottom: 10px;
  }
  .measuring-tools .el-button {
    margin-left: 10px;
  }
  .measuring-tools .set-content {
    margin-top: 10px;
  }
  .measuring-tools .set-content div {
    margin-top: 5px;
  }
  .coordinate-position-box {
    font-size: 14px;
  }
  .lon-box {
    padding-left: 10px;
    margin-top: 15px;
  }
  .position-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 20px;
  }
  .short_l {
    width: 80px;
    margin-left: 10px;
  }
  .short_2 {
    width: 130px;
    margin-left: 10px;
  }
  .short_3 {
    width: 280px;
  }
  .set-center-input {
    width: 140px;
    margin-left: 10px;
  }
  .tip-unit {
    display: inline-block;
    width: 30px;
    margin-left: 10px;
    line-height: 28px;
    color: #ffffff;
    text-align: center;
    background: var(--el-color-primary-light-1);
  }
  ::v-deep(.el-menu--horizontal) {
    .el-menu-item {
      height: 50px;
    }
  }
}
</style>

<style>
.ol-tooltip.ol-tooltip-measure {
  padding: 5px;
  color: #ffffff;
  background-color: #ff3333;
}
</style>
