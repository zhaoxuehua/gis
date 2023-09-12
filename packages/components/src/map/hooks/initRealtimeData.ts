import { ElMessage } from "element-plus";
import { Style, Icon } from "ol/style";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import * as olProj from "ol/proj";
import dayjs from "dayjs";
import { getRealLabelTypeInfo, getRealEquipTypeInfo, getRealDataList } from "../../api/gis";
import type { VisualMap } from "../type";
import type { shipStyCashType, shipParamsType, shipColorParams, searchShipDataType } from "./realDataType";
import { createdCanvasShip } from "./createdCanvasShip"; // 绘制船只
import { drawCanvasPerson } from "./drawCanvasPerson";

export let realDataTimerObj: { [key: string]: any } = {}; // 定时器，最多有船 人

export function initRealtimeData(map: VisualMap, realtimeDataList: any[]) {
  if (!map || !realtimeDataList?.length) return;

  let realStyCash: shipStyCashType = {}; //  缓存样式
  // 实时数据处理// 每项代表一个实时数据 例如船、人、车
  realtimeDataList.forEach(async (item: { [key: string]: any }) => {
    let { code } = item;
    // 获取标签类型信息(用到标签类型id  内置样式对象等)
    let realLabelType: { [key: string]: any } = await getRealLabelTypeInfo(code, {});
    // 获取设备类型信息
    let realEquipType: { [key: string]: any } = await getRealEquipTypeInfo(code, {});
    if (realLabelType?.code != 200 || realEquipType?.code != 200) {
      ElMessage.error("接口异常");
      return;
    }
    let { layerConfigCode, styleObject, dataType, code: labelTypeCode, displayContent, id: labelTypeId } = realLabelType.data; // 标签类型信息
    let { id: equipTypeId } = realEquipType.data; // 设备类型信息

    // 图层信息
    let realLayer = map.get("layerMap")[layerConfigCode];
    const shipSource = realLayer.getSource();

    // 内置样式对象是船（船特有逻辑）
    let shipHeadLine: boolean | string | null;
    if (styleObject == "aisBoat") {
      // 船:首线
      shipHeadLine = localStorage.getItem("shipTags");
      if (shipHeadLine) {
        shipHeadLine = JSON.parse(shipHeadLine)[0];
      }
    }

    // 设置内置对象的layer样式
    realLayer.setStyle(function (feature: any) {
      let targetFeature = feature;
      if (Array.isArray(feature.get("features"))) {
        targetFeature = feature.get("features")[0];
      }
      let extendsData = targetFeature.get("extendsData");
      const { angle } = extendsData; // 要素扩展字段
      let { shipKey, canvasImg, height } = createLayerStyle(styleObject, extendsData);

      if (!realStyCash[shipKey]) {
        realStyCash[shipKey] = new Style({
          image: new Icon({
            img: canvasImg,
            imgSize: [canvasImg?.width, canvasImg?.height],
            height: height,
            offset: [0, true ? 4 : 8]
          })
        });
      }
      // 如果是船有角度
      if (styleObject == "aisBoat") {
        realStyCash[shipKey].getImage().setRotation((angle * Math.PI) / 180);
      }
      return [realStyCash[shipKey]];
    });

    /************************************************接口: 实时数据*********************************************/

    function getShipListDataFn() {
      let shipFeatureArr: Feature[] = [];
      let res: { [key: string]: any } = getRealDataList(code, {});
      if (res?.code == 200) {
        const { data } = res;
        // 塞入基础引擎(搜索使用)
        let searchShipData: searchShipDataType = [];
        Object.values(data).forEach(item => {
          const aisLocation = (item as any)[displayContent];
          const status = (item as any)?.["AISDATA-status"] || "";
          const staticAttr = (item as any)?.staticAttr || "";
          if (aisLocation) {
            const valStr = aisLocation.value;
            const monitorTime = aisLocation.monitorTime;
            let valInfo = JSON.parse(valStr);
            if (typeof valInfo == "string") {
              valInfo = JSON.parse(valInfo);
            }
            if (valInfo.category === "基站") {
              return;
            }
            let name: string = "";
            if (staticAttr) {
              name = JSON.parse(staticAttr?.value).name || "";
            }
            // 需要明确后端数据结构及取值字段
            const colorArr: any = shipColor({
              monitorTime,
              colorIndex: valInfo.colorIndex,
              status,
              styleObject
            });

            const shipInfo = {
              lat: valInfo.lat,
              lon: valInfo.lon,
              name: name,
              type: dataType,

              color: colorArr,
              showHeadline: Boolean(shipHeadLine),
              angle: valInfo.cog,
              mmsi: valInfo.mmsi,
              sog: valInfo.sog,
              positionReportTicks: monitorTime
            };
            const shipFeature = createdShipFeature(shipInfo, dataType, labelTypeCode);
            shipFeatureArr.push(shipFeature);

            // 基础引擎搜索使用
            searchShipData.push({
              code: valInfo.mmsi,
              lat: valInfo.lat,
              lon: valInfo.lon,
              name: name,
              dataType: dataType,
              isVisitObject: true,
              equipType: equipTypeId, // 设备类型id
              labelTypeId: labelTypeId, // 标签类型id
              layerCode: layerConfigCode // 图层code
            });
          }
        });

        shipSource.clear();
        shipSource.addFeatures(shipFeatureArr);

        map.set("trackInfoMap", searchShipData);
        if (realDataTimerObj[code]) {
          clearTimeout(realDataTimerObj[code]);
          realDataTimerObj[code] = null;
        }
        realDataTimerObj[code] = setTimeout(function () {
          getShipListDataFn();
        }, 1000 * 10);
      } else {
        ElMessage.error("获取数据报错");
      }
    }
    getShipListDataFn(); // 初始化时获取一次数据
  });
}

// 图层样式（根据不同的内置样式对象返回不同的值）
export function createLayerStyle(styleObject: string, extendsData: any) {
  const { color, showHeadline } = extendsData; // 要素扩展字段
  let shipKey;
  let canvasImg: any;
  let height;
  if (styleObject == "aisBoat") {
    shipKey = showHeadline + color.join();
    canvasImg = createdCanvasShip(showHeadline, color) as HTMLCanvasElement;
    height = 44;
  } else if (styleObject == "person") {
    shipKey = color.join();
    canvasImg = drawCanvasPerson(color) as HTMLCanvasElement;
    height = 100;
  }
  return { shipKey, canvasImg, height };
}

// 创建要素
export function createdShipFeature(params: shipParamsType, dataType: string, labelTypeCode: string) {
  const shipFeature = new Feature({
    name: params.name,
    geometry: new Point(olProj.fromLonLat([params.lon, params.lat])),
    // 图层样式根据要素属性渲染 、鼠标经过时使用
    extendsData: {
      color: params.color,
      showHeadline: params.showHeadline,
      angle: params.angle,
      type: "ship", // 实时标签类型
      mmsi: params.mmsi,
      sog: params.sog,
      positionReportTicks: dayjs(params.positionReportTicks).format("YYYY-MM-DD HH:mm:ss")
    }
  });
  // 基础引擎，左键点击使用
  shipFeature.setId(params.mmsi);
  shipFeature.set("type", dataType);
  shipFeature.set("code", params.mmsi);
  shipFeature.set("labelTypeCode", labelTypeCode);
  return shipFeature;
}

/************************************************************************
  获取船只颜色函数
  船只颜色
  01: colorIndex=4 表示是关注船只 => 绿色
  02: monitorTime 和当前时间 new Date()对比
      I: 延迟大于8分钟           => 灰色
      II: 延迟小于等于8分钟       => 黄色

  03: status = alarm 告警船只   => 红色
      I: 延迟大于8分钟并且是报警  => 灰色 + 红色
************************************************************************/
const eightMinutes = 8 * 60 * 1000;
export function shipColor(arg: shipColorParams) {
  let colorArr: string[] = [];
  const nowTime = +new Date();
  const { monitorTime, colorIndex, status, styleObject } = arg;
  if (styleObject == "aisBoat") {
    if (Number(colorIndex) === 4) {
      // 关注船只
      colorArr = ["#00ff00", "#00ff00"];
    } else {
      if (monitorTime - nowTime > eightMinutes) {
        // 延迟大于8分钟
        colorArr = ["#c0c0c0", "#c0c0c0"];
      } else {
        // 延迟小于等于8分钟
        colorArr = ["#ffff00", "#ffff00"];
      }
    }
    if (status === "alarm") {
      // 告警船只
      if (monitorTime - nowTime > eightMinutes) {
        // 延迟大于8分钟
        colorArr = ["#c0c0c0", "#ff0000"];
      } else {
        colorArr = ["#ff0000", "#ff0000"];
      }
    }
    return colorArr;
  } else if (styleObject == "person") {
    return ["red"];
  }
}
