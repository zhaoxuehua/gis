// ⤵ ol库
import Feature from "ol/Feature";
import * as olProj from "ol/proj";
import { LineString, Point } from "ol/geom";
import { Vector as VectorLayer } from "ol/layer";
import BaseLayer from "ol/layer/Base.js";
import { Vector as VectorSource, Cluster } from "ol/source";
import { Style, Stroke, Fill, Circle, Icon, Text } from "ol/style.js";
import { ElMessage } from "element-plus";

// ⤵ type
import type { FeatureLike } from "ol/Feature";
import type { trackLayerParamType, cashFeatureStyleType, showHideTrackDataType, delTrackDataType } from "../type";

// ⤵ store
import { useGisStore } from "../../stores/modules/gis";
import { useTrackListStore } from "../../stores/modules/trackList";

// ⤵ 辅助函数
import { createdCanvasShip } from "./createdCanvasShip"; // 绘制船只
import { backTwoPointCenter } from "./backTwoPointCenter"; // 两点中心点
import { backCenterByFeatures } from "./backCenterByFeatures"; // 一组要素中心点
import { setToMapCenter } from "./setToMapCenter"; // 设置地图中心点
import arrow from "../img/arrow.png";

// ⤵ API
import { getRealLabelTypeInfo } from "../../api/gis";

/******************************************************************************************************/

// 轨迹样式(缓存)
const cashFeatureStyle: cashFeatureStyleType = {};

// 轨迹标签类型(缓存)
let labelTypeInfoCash: any = {};

// 轨迹动画时长
let setNumArr: any[] = []; // 定时器指针(清除动画)

// 轨迹回放的颜色
const trackColor = ["#c70a0a", "#007eb3", "#971ae8", "#cb5e01", "#00289c", "#d10087", "#5310d6", "#1d9000", "#8e7604", "#aa0a72"];

// 隐藏的图层
let hideLayer: any;

// 轨迹回放
const createdTrackData = async function (param: trackLayerParamType) {
  /*****************************************************
      这里有个逻辑
      01: 轨迹数据需要在那个layer上绘制
      02: layer的数据，先从地图配置上读取轨迹的标签类型
      03: 在用该标签类型，获取layer的基本信息
  ****************************************************/

  // mapCase地图实例 => 获取指定做轨迹回放的标签类型
  const gisStore = useGisStore();
  const mapCase = gisStore.mapCase;

  // 轨迹的标签类型
  if (!labelTypeInfoCash?.success) {
    labelTypeInfoCash = await getRealLabelTypeInfo(param?.objectTypeCode, {});
    if (Number(labelTypeInfoCash.code) !== 200) {
      ElMessage.error("接口报错");
      return;
    }
  }

  /*****************************************************
   设置颜色(根据trackList个数取索引)
  ****************************************************/
  const trackListStore = useTrackListStore();
  const trackListLength = trackListStore.data.length;
  const color = trackColor[trackListLength];

  /*****************************************************
   创建要素
  ****************************************************/
  const { data, id } = param;
  const { code, name, layerLevel, layerMaxLevel, layerMinLevel, trackAggDistance } = labelTypeInfoCash?.data?.layerConfigVO; // 图层信息
  const strategyTime = 10 * 60 * 1000; //分钟(策略时间，用于是否绘制虚线)
  const trackLineFeatureArr: Feature[] = [];
  const trackLineCircleFeatureArr: Feature[] = [];
  const trackLineLabelFeatureArr: Feature[] = [];
  if (!data.length) {
    return ElMessage.warning("暂无轨迹数");
  }
  for (let i = 0; i < data.length; i++) {
    if (!data[i + 1]) {
      break; // 下一个数据
    }
    const currData = data[i];
    const nextData = data[i + 1];
    const {
      labelInfo: { time: currDataTime, speed: currDataSpeed },
      posInfo: { lon: currDataLon, lat: currDataLat },
      detailInfo: currDataDetailInfo
    } = currData;
    const {
      labelInfo: { time: nextDataTime, speed: nextDataSpeed },
      posInfo: { lon: nextDataLon, lat: nextDataLat }
    } = nextData;

    const dotted = +new Date(nextDataTime) - +new Date(currDataTime) >= strategyTime; // 是否大于策略时间
    const currDataLonLat = olProj?.fromLonLat([Number(currDataLon), Number(currDataLat)]);
    const nextDataLonLat = olProj?.fromLonLat([Number(nextDataLon), Number(nextDataLat)]);
    const extendsData = {
      labelInfo: currData.labelInfo,
      detailInfo: currDataDetailInfo,
      titleInfo: currData.titleInfo,
      lineWidth: labelTypeInfoCash.data.lineWidth,
      unit: labelTypeInfoCash.data.speedUnit || "",
      color,
      dotted // true:虚线  false:实线
    };

    // 加速 || 减速
    if (currDataSpeed > nextDataSpeed) {
      nextData._speed = "slow"; // 下个的速度,小于当前的,则下一个是减速
    } else if (currDataSpeed == nextDataSpeed) {
      nextData._speed = "normal";
    } else {
      nextData._speed = "faster";
    }

    // ☆ 第一个点
    i === 0 && (currData._speed = "normal");

    // ☆ 虚线第二个点
    dotted && (nextData._speed = "normal");

    // 绘制线
    const lineFeature = new Feature({
      geometry: new LineString([currDataLonLat, nextDataLonLat]),
      extendsData,
      type: "trackLine"
    });
    trackLineFeatureArr.push(lineFeature);

    // 绘制圆圈
    const circleFeature = new Feature({
      geometry: new Point(currDataLonLat),
      extendsData,
      type: "trackPoint"
    });
    trackLineCircleFeatureArr.push(circleFeature);

    // 绘制Label
    const labelFeature = new Feature({
      geometry: new Point(currDataLonLat),
      extendsData,
      speed: currData._speed,
      type: "trackLabel"
    });
    trackLineLabelFeatureArr.push(labelFeature);
  }

  // 创建船(绘制在轨迹线图层)
  const shipData = data[data.length - 1];
  const {
    name: shipName,
    posInfo: { lon: shipLon, lat: shipLat }
  } = shipData;
  const shipLonLat = olProj?.fromLonLat([Number(shipLon), Number(shipLat)]);
  const shipFeature = new Feature({
    name: shipName,
    geometry: new Point(shipLonLat),
    type: "trackShip",
    extendsData: {
      ...shipData,
      color
    }
  });
  trackLineFeatureArr.push(shipFeature);

  // 移动地图中心点(线取平均值)
  const zoom = Math.floor((layerMinLevel + 1 + layerMaxLevel) / 2);
  const center = backCenterByFeatures(trackLineLabelFeatureArr);
  setToMapCenter({
    lon: center?.[0],
    lat: center?.[1],
    zoom: zoom,
    duration: 50,
    callBack: function () {
      if (mapTackListMap?.[id]) {
        // 已存在,移除layer,在重新创建
        setNumArr.forEach(setId => {
          clearTimeout(setId);
        });
        removerLayer();
        createdLayer();
        drawFeature();
      } else {
        createdLayer();
        drawFeature();
      }
    }
  });

  /********************************************************************************************
    读取localStorage => 隐藏图层 + 轨迹动画时长
  *****************************************************************************************/
  const shipTags = localStorage.getItem("shipTags");
  const animationTime = shipTags && JSON.parse(shipTags)[2]; // 动画
  const hideLayerCode = shipTags && JSON.parse(shipTags)[1]; // 隐藏layer
  hideLayer = mapCase.get("layerMap")[hideLayerCode];
  showHideLayer(false);

  /********************************************************************************************
    图层名字 (轨迹回放(01:绘制线layer, 02:绘制线上圆圈(聚合)layer,03:绘制显示的文字(聚合)layer)) 
  *****************************************************************************************/
  const mapTackListMap = mapCase.get("tackListMap");
  const layerManageData = {
    trackLine: {
      name: name + "_轨迹线",
      code: code + "TrackLine",
      isCluster: false,
      distance: trackAggDistance,
      vector: new VectorSource(),
      styleFunction: function (feature: FeatureLike) {
        const type = feature?.get("type");
        let { color, dotted, lineWidth = 2 } = feature?.get("extendsData");
        const styles: Style[] = [];

        // 设置线
        const lineKey = color + dotted;
        let trackLineSty = cashFeatureStyle[lineKey]
          ? cashFeatureStyle[lineKey]
          : new Style({
              stroke: new Stroke({
                color: color,
                width: lineWidth,
                lineDash: type === "trackLine" && dotted ? [lineWidth, lineWidth * 2] : [0, 0] //  绘制实线虚线
              })
            });
        styles.push(trackLineSty);

        // 设置箭头
        if (type === "trackLine") {
          let width = 20;
          const zoom = mapCase?.getView()?.getZoom();
          const maxZoom = mapCase?.getView()?.getMaxZoom();
          const disZoom = maxZoom - zoom;
          width = disZoom < 2 ? (zoom / maxZoom) * width : 0;
          const geometry = feature?.getGeometry();
          (geometry as any)?.forEachSegment(function (start: number[], end: number[]) {
            const dx = end[0] - start[0];
            const dy = end[1] - start[1];
            const rotation = Math.atan2(dy, dx);
            const center = backTwoPointCenter([start, end]);
            rotation &&
              styles.push(
                new Style({
                  geometry: new Point(center),
                  image: new Icon({
                    src: arrow,
                    width: ~~width,
                    rotateWithView: true,
                    rotation: -rotation,
                    color: color
                  })
                })
              );
          });
        }

        // 设置船只
        if (type == "trackShip") {
          const angle = feature?.get("extendsData").posInfo.cog;
          const shipName = feature?.get("name");
          const canvasShip = createdCanvasShip(false, [color, color]) as any;
          const shipSty = new Style({
            image: new Icon({
              img: canvasShip,
              imgSize: [canvasShip.width, canvasShip.height],
              rotation: angle ? (angle * Math.PI) / 180 : undefined,
              height: 40,
              offset: [0, 20]
            }),
            text: new Text({
              text: shipName,
              fill: new Fill({
                color: "#fff"
              }),
              font: "11px Calibri,sans-serif",
              backgroundFill: new Fill({
                color: color
              }),
              backgroundStroke: new Stroke({
                color: "#222",
                width: 1
              }),
              padding: [3, 3, 3, 3],
              textAlign: "center",
              textBaseline: "bottom",
              offsetY: -20
            })
          });
          return shipSty;
        }

        return styles;
      }
    },

    trackLineCircle: {
      name: name + "_轨迹圈",
      code: code + "TrackCircle",
      isCluster: true,
      distance: trackAggDistance,
      vector: new VectorSource(),
      styleFunction: function (feature: FeatureLike) {
        const targetFeature = feature?.get("features")[0];
        const { color } = targetFeature?.get("extendsData");
        return new Style({
          image: new Circle({
            radius: 5,
            fill: new Fill({ color: "#fff" }),
            stroke: new Stroke({ color, width: 2 })
          })
        });
      }
    },

    trackLineLabel: {
      name: name + "_轨迹信息",
      code: code + "TrackLabel",
      isCluster: true,
      distance: trackAggDistance * 3,
      vector: new VectorSource(),
      styleFunction: function (feature: FeatureLike) {
        const targetFeature = feature?.get("features")[0];
        const speed = targetFeature?.get("speed");
        const { color, labelInfo, unit } = targetFeature.get("extendsData");
        let chart = "";
        switch (speed) {
          case "faster":
            chart = "▲"; // 向上箭头
            break;
          case "slow":
            chart = "▼";
            break;
        }
        let text = labelInfo.time + "  ";
        text += labelInfo?.speed ?? "";
        text += unit ?? "";
        text += chart;
        let txtSty = new Style({
          text: new Text({
            text,
            fill: new Fill({
              color: color
            }),
            font: "10px Calibri,sans-serif",
            backgroundFill: new Fill({
              color: "rgba(255,255,255,0.8)"
            }),
            backgroundStroke: new Stroke({
              color: "#333",
              width: 1,
              lineDash: [1, 2]
            }),
            padding: [3, 3, 3, 3],
            textAlign: "center",
            textBaseline: "bottom",
            offsetY: -20
          })
        });
        return [txtSty];
      }
    }
  };

  // 删除layer
  function removerLayer() {
    Object.values(mapTackListMap[id]).forEach(layer => {
      mapCase?.removeLayer(layer);
    });
    delete mapTackListMap[id];
  }

  //创建layer
  function createdLayer() {
    // 清空映射,重新创建layer
    mapTackListMap[id] = {}; // 轨迹回放layer映射
    Object.values(layerManageData).forEach(info => {
      const { name, code, isCluster, vector, distance, styleFunction } = info;
      let source = null;
      switch (isCluster) {
        case false: // 非聚合
          source = vector;
          break;
        case true: // 聚合
          source = new Cluster({
            distance,
            source: vector
          });
          break;
      }
      let LayerOption = {
        source: source,
        zIndex: layerLevel,
        minZoom: layerMinLevel - 0.000000000000005,
        maxZoom: layerMaxLevel,
        name: name,
        code: code,
        style: styleFunction
      };
      let layer = new VectorLayer(LayerOption);
      mapCase?.addLayer(layer);
      mapTackListMap[id][code] = layer;
    });
  }

  //绘制要素
  function drawFeature() {
    // 线
    trackLineFeatureArr.forEach((val, index) => {
      drawAnimation(val, index, "trackLine");
    });

    // label
    trackLineLabelFeatureArr.forEach((val, index) => {
      drawAnimation(val, index, "trackLineLabel");
    });

    // circle
    trackLineCircleFeatureArr.forEach((val, index) => {
      drawAnimation(val, index, "trackLineCircle");
    });
  }

  // 动画
  function drawAnimation(val: Feature, index: number, type: "trackLine" | "trackLineLabel" | "trackLineCircle") {
    if (!animationTime) {
      // 无动画
      layerManageData[type].vector?.addFeature(val);
    } else {
      const timerId = setTimeout(() => {
        layerManageData[type].vector?.addFeature(val);
      }, Number(animationTime) * 1000 * index);
      setNumArr.push(timerId);
    }
  }

  return color;
};

// 显示隐藏轨迹
const showHideTrackData: showHideTrackDataType = function (id, isTrue) {
  // mapCase地图实例
  const gisStore = useGisStore();
  const mapCase = gisStore.mapCase;
  const mapTackListMap = mapCase?.get("tackListMap");
  if (!mapTackListMap[id]) {
    console.info(id + "映射不存在！");
    return;
  }
  Object.values(mapTackListMap[id]).forEach(layer => {
    (layer as BaseLayer)?.setVisible(isTrue);
  });
};

// 删除轨迹
const delTrackData: delTrackDataType = function (id) {
  // mapCase地图实例
  const gisStore = useGisStore();
  const mapCase = gisStore.mapCase;
  const mapTackListMap = mapCase?.get("tackListMap");
  if (!mapTackListMap[id]) {
    return;
  }
  Object.values(mapTackListMap[id]).forEach(layer => {
    mapCase?.removeLayer(layer);
  });
  delete mapTackListMap[id];
};

/********************************************************************************************
  轨迹回放隐藏的图层
  读取localStorage 中需要隐藏的船只
*****************************************************************************************/
const showHideLayer = function (flag: boolean) {
  hideLayer && hideLayer?.setVisible(flag);
};

export { createdTrackData, showHideTrackData, delTrackData, showHideLayer };
