// ol库
import { Vector as VectorSource, Cluster } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import * as olProj from "ol/proj";
import { LineString, Point } from "ol/geom";
import Feature from "ol/Feature";
import { Style, Stroke, Fill, Circle, Icon, Text } from "ol/style.js";

// type
import type { FeatureLike } from "ol/Feature";
import type { trackLayerParamType } from "../type";
import type { cashFeatureStyleType } from "../type";

// store
import { useGisStore } from "../../stores/modules/gis";

// 辅助函数
import { createdCanvasShip } from "./createdCanvasShip"; // 绘制船只
import { backTwoPointCenter } from "./backTwoPointCenter"; // 两点中心点
import arrow from "../img/arrow.png";

// 缓存样式
const cashFeatureStyle: cashFeatureStyleType = {};

// 创建轨迹回放
const createdTrackData = function (param: trackLayerParamType) {
  const { data, id, color } = param;
  const { code, name, layerLevel, layerMaxLevel, layerMinLevel, trackAggDistance } = param.layerConfig;

  // mapCase地图实例 : 轨迹回放layer映射
  const gisStore = useGisStore();
  const mapCase = gisStore.mapCase;
  const mapTackListMap = mapCase.get("tackListMap");
  mapTackListMap[id] = {};

  /********************************************************************************************
    图层名字 (轨迹回放(01:绘制线layer, 02:绘制线上圆圈(聚合)layer,03:绘制显示的文字(聚合)layer)) 
  *****************************************************************************************/
  const layerManageData = {
    trackLine: {
      name: name + "_轨迹线",
      code: code + "TrackLine",
      isCluster: false,
      distance: trackAggDistance,
      vector: new VectorSource(),
      styleFunction: function (feature: FeatureLike) {
        const type = feature.get("type");
        const { color, dotted } = feature.get("extendsData");
        const styles: Style[] = [];

        // 设置线
        const lineKey = color + dotted;
        let trackLineSty = cashFeatureStyle[lineKey]
          ? cashFeatureStyle[lineKey]
          : new Style({
              stroke: new Stroke({
                color: color,
                width: 2,
                lineDash: type === "trackLine" && dotted ? [2, 4] : [0, 0] //  绘制实线虚线
              })
            });
        styles.push(trackLineSty);

        // 设置箭头
        if (type === "trackLine") {
          let width = 20;
          const zoom = mapCase.getView().getZoom();
          const maxZoom = mapCase.getView().getMaxZoom();
          const disZoom = maxZoom - zoom;
          width = disZoom < 2 ? (zoom / maxZoom) * width : 0;
          const geometry = feature.getGeometry();
          (geometry as any).forEachSegment(function (start: number[], end: number[]) {
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
          const angle = feature.get("extendsData").posInfo.cog;
          const shipName = feature.get("name");
          const canvasShip = createdCanvasShip(false, [color, color]) as any;
          const shipSty = new Style({
            image: new Icon({
              img: canvasShip,
              imgSize: [canvasShip.width, canvasShip.height],
              rotation: (angle * Math.PI) / 180,
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
        const targetFeature = feature.get("features")[0];
        const { color } = targetFeature.get("extendsData");
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
        const targetFeature = feature.get("features")[0];
        const speed = targetFeature.get("speed");
        const { color, labelInfo } = targetFeature.get("extendsData");
        let chart = "";
        switch (speed) {
          case "faster":
            chart = "▲"; // 向上箭头
            break;
          case "slow":
            chart = "▼";
            break;
        }
        let text = labelInfo.time + "  " + labelInfo?.speed ?? "";
        text += labelInfo?.unit ?? "";
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

  // 生成图层
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
    mapCase.addLayer(layer);
    mapTackListMap[id][code] = layer;
  });

  // 创建绘制要素
  // const setNumArr = []; // 定时器指针(清除动画)
  const strategyTime = 10 * 60 * 1000; //分钟(策略时间，用于是否绘制虚线)
  const trackLineFeatureArr = [];
  const trackLineCircleFeatureArr = [];
  const trackLineLabelFeatureArr = [];
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

    const dotted = nextDataTime - currDataTime >= strategyTime; // 是否大于策略时间
    const currDataLonLat = olProj.fromLonLat([Number(currDataLon), Number(currDataLat)]);
    const nextDataLonLat = olProj.fromLonLat([Number(nextDataLon), Number(nextDataLat)]);
    const extendsData = {
      labelInfo: currData.labelInfo,
      detailInfo: currDataDetailInfo,
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

  // 绘制船(绘制在轨迹线图层)
  const shipData = data[data.length - 1];
  const {
    name: shipName,
    posInfo: { lon: shipLon, lat: shipLat }
  } = shipData;
  const shipLonLat = olProj.fromLonLat([Number(shipLon), Number(shipLat)]);
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

  // 要素添加到layer
  layerManageData.trackLine.vector.addFeatures(trackLineFeatureArr);
  layerManageData.trackLineLabel.vector.addFeatures(trackLineLabelFeatureArr);
  layerManageData.trackLineCircle.vector.addFeatures(trackLineCircleFeatureArr);
};

export { createdTrackData };
