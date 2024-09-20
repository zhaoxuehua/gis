import { ElMessage } from "element-plus";
import { Style, Icon } from "ol/style";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import { fromLonLat } from "ol/proj";
import dayjs from "dayjs";
import { getRealLabelTypeInfo, getRealDataList } from "../../api/gis";
import type { VisualMap } from "../type";
import type { shipStyCashType, shipParamsType, shipColorParams } from "./realDataType";
import { createdCanvasShip } from "./createdCanvasShip"; // 绘制船只
import { drawCanvasPerson } from "./drawCanvasPerson";
import { styleAct } from "./styleFunction.js";
import { useGisStore } from "../../stores/modules/gis";
import fishNetSounderImg from "../img/fishNetSounder.png";

/****************************************实时数据****************************************************/

export let realDataTimerObj: { [key: string]: any } = {}; // 定时器，最多有船 人

export function initRealtimeData(map: VisualMap, realtimeDataList: any[]) {
  if (!map || !realtimeDataList?.length) return;
  let gisStore = useGisStore();
  let realStyCash: shipStyCashType = {}; //  缓存样式
  let realDataInfoCash: any = {}; // 按类型存储实时数据{aisBoat:[]} 每次定时器清除该类型下的数据重新存储

  // 实时数据处理 每项代表一个实时数据( 例如船、人、车)
  realtimeDataList.forEach(async (item: { [key: string]: any }) => {
    let { code: equipTypeCode, id: equipTypeId } = item;
    // 获取标签类型信息(用到标签类型id  内置样式对象等)
    let realLabelType: { [key: string]: any } = await getRealLabelTypeInfo(equipTypeCode, {});
    if (realLabelType?.code != 200) {
      ElMessage.error("接口异常");
      return;
    }
    let {
      selectStyle, // 样式(自定义样式customStyle 内置样式builtInStyle)
      styleObject, // 内置样式对象（船、人、网位仪）样式是内置样式时才有
      labelTypeImagePath, // 标签类型图片（自定义样式使用）
      dataType = "1", // 数据类型
      code: labelTypeCode, // 标签类型code
      dataContent, // 实时查询时配置的数据内容(监测属性例如AISDATA)
      id: labelTypeId, // 标签类型id
      layerConfigVO // 图层信息
    } = realLabelType?.data; // 标签类型信息

    let layerConfigCode = layerConfigVO?.code || "seaMap"; // 图层编码

    // 图层信息
    let realDataLayer = map.get("layerMap")?.[layerConfigCode];
    let realDataSource = realDataLayer?.getSource();

    // 内置样式对象是船（船特有逻辑 船首线）
    let shipHeadLine: boolean | string | null;
    if (styleObject == "aisBoat") {
      shipHeadLine = localStorage.getItem("shipTags");
      if (shipHeadLine) {
        shipHeadLine = JSON.parse(shipHeadLine)?.[0];
      }
    }

    // 设置内置对象的layer样式
    realDataLayer?.setStyle(function (feature: any) {
      let targetFeature = feature;
      if (Array.isArray(feature.get("features"))) {
        targetFeature = feature.get("features")?.[0];
      }
      let extendsData = targetFeature?.get("extendsData") || {};
      let selected = targetFeature.get("selected");
      const { angle } = extendsData; // 要素扩展字段
      let { shipKey, realTimeDataImg, height } = createLayerStyle(selectStyle, styleObject, extendsData);

      if (!realStyCash[shipKey]) {
        // 1、内置样式
        if (selectStyle == "builtInStyle") {
          if (styleObject == "fishNetSounder") {
            // 1.1内置样式图片icon(有些icon ui不好绘制)
            realStyCash[shipKey] = new Style({
              image: new Icon({
                src: realTimeDataImg,
                offset: [0, 4]
              })
            });
          } else {
            // 1.2内置样式使用的canvas;
            realStyCash[shipKey] = new Style({
              image: new Icon({
                img: realTimeDataImg,
                imgSize: [realTimeDataImg?.width, realTimeDataImg?.height],
                height: height,
                offset: [0, true ? 4 : 8]
              })
            });
          }
        } else {
          // 2、自定义样式（图片取标签类型配置的）labelTypeImagePath
          let srcImg = labelTypeImagePath ? labelTypeImagePath.split(",") : []; // 标签类型中配置的标签类型图片
          realStyCash[shipKey] = new Style({
            image: new Icon({
              src: `/api/gis-service/equip/gisLabel/type/getAllPathByFileName/${srcImg?.[0]}`,
              offset: [0, 4]
            })
          });
        }
      }
      // 角度
      if (angle) {
        realStyCash[shipKey].getImage().setRotation((angle * Math.PI) / 180);
      }
      return selected ? [realStyCash[shipKey]].concat(styleAct.selectAct) : [realStyCash[shipKey]];
    });

    // 辅助函数( 找出AISDATA-alarm属性开头的,只要有一个属性是true,则返回true)
    function checkAlarm(obj: any): boolean {
      for (let key in obj) {
        if (key.startsWith("AISDATA-alarm") && obj[key] === true) {
          return true;
        }
      }
      return false;
    }

    /************************************************接口: 实时数据*********************************************/
    async function getShipListDataFn() {
      let shipFeatureArr: Feature[] = [];
      let res: { [key: string]: any } = await getRealDataList(equipTypeCode, {});
      if (res?.code == 200) {
        const data = res.data.realtimeData || {};
        let timeoutRange = 8 * 60 * 1000;
        if (res.data?.timeoutRange) {
          timeoutRange = res.data?.timeoutRange[dataContent + "-timeoutRange"] * 1000 || 8 * 60 * 1000; // 船只超时时间，没有值默认8分钟
        }
        realDataInfoCash[equipTypeCode] = []; // 清除该类型标签的存储数据重新存储（塞入基础引擎搜索定位等使用）
        // 经度lon 纬度lat 时间monitorTime 船4关注colorIndex  速度sog 都在监测属性中
        // 名称name 联系人person 在监测属性同级  编码code（取key值）

        Object.entries(data).forEach(([key, item]) => {
          const aisLocation = (item as any)?.[dataContent]; // 监测属性
          // const status = (item as any)?.[`${dataContent}-alarm`]; // 告警（布尔值）eg、AISDATA-alarm
          const name = (item as any)?.name || ""; // 名称（船名、人的终端名称）
          const person = (item as any)?.person || ""; // 联系人

          // 找出AISDATA-alarm属性开头的,只要有一个属性是true,认为是报警
          const status = checkAlarm(item);

          if (aisLocation) {
            const monitorTime = aisLocation.monitorTime;
            const valStr = aisLocation.value;
            let valInfo = JSON.parse(valStr);
            if (typeof valInfo == "string") {
              valInfo = JSON.parse(valInfo);
            }
            if (valInfo.category === "基站") {
              return;
            }

            const colorArr: any = realFeatureColor({
              monitorTime,
              status,
              isWhiteList: (item as any)?.isWhiteList,
              isAttention: (item as any)?.isAttention,
              timeoutRange: timeoutRange
            });

            const shipInfo = {
              lat: valInfo.lat,
              lon: valInfo.lon,
              angle: valInfo.cog,
              sog: valInfo.sog,
              monitorTime: monitorTime,
              color: colorArr,
              person,
              code: key,
              name: name,
              showHeadline: Boolean(shipHeadLine),
              type: dataType
            };
            const shipFeature = createdRealDataFeature(shipInfo, dataType, labelTypeCode);
            shipFeatureArr.push(shipFeature);

            // 基础引擎搜索（定位）、左键使用
            realDataInfoCash?.[equipTypeCode].push({
              lat: valInfo.lat,
              lon: valInfo.lon,
              code: key,
              name: name,
              isRealTimeData: true, // 是否实时标签
              dataType: dataType,
              equipType: equipTypeId, // 设备类型id
              labelTypeId: labelTypeId, // 标签类型id
              layerCode: layerConfigCode, // 图层code
              realObjectTypeCode: equipTypeCode // 实时数据对象code
            });
          }
        });

        realDataSource?.clear();
        realDataSource?.addFeatures(shipFeatureArr);
        gisStore?.updateRealtimeDataCountList(equipTypeCode, shipFeatureArr?.length || 0); // 更新存储实时数据的数量count

        map.set("trackInfoMap", Object.values(realDataInfoCash)?.flat()); // 基础引擎定位、搜索、左键弹框等处使用
      } else {
        ElMessage.error("获取数据报错");
      }
      // 不管成功还是失败10秒后重新请求接口
      if (realDataTimerObj[equipTypeCode]) {
        clearTimeout(realDataTimerObj[equipTypeCode]);
        realDataTimerObj[equipTypeCode] = null;
      }
      realDataTimerObj[equipTypeCode] = setTimeout(function () {
        getShipListDataFn();
      }, 1000 * 10);
    }
    getShipListDataFn(); // 初始化时获取一次数据
  });
}

// 图层样式（1、自定义样式  2、内置样式根据不同的内置样式对象返回不同的值）
export function createLayerStyle(selectStyle: string, styleObject: string, extendsData: any = {}) {
  const { color, showHeadline } = extendsData; // 要素扩展字段
  let shipKey;
  let realTimeDataImg: any;
  let height = 44;
  // 1、内置样式
  if (selectStyle == "builtInStyle") {
    if (styleObject == "aisBoat") {
      shipKey = showHeadline + color?.join();
      realTimeDataImg = createdCanvasShip(showHeadline, color) as HTMLCanvasElement;
    } else if (styleObject == "person") {
      shipKey = color?.join();
      realTimeDataImg = drawCanvasPerson(color) as HTMLCanvasElement;
    } else if (styleObject == "fishNetSounder") {
      shipKey = color?.join();
      realTimeDataImg = fishNetSounderImg; // 图片icon
    }
  } else {
    // 2、自定义样式
    shipKey = color?.join();
  }

  return { shipKey, realTimeDataImg, height };
}

// 创建要素
export function createdRealDataFeature(params: shipParamsType, dataType: string, labelTypeCode: string) {
  const shipFeature = new Feature({
    geometry: new Point(fromLonLat([params.lon, params.lat])),
    // 图层样式根据要素属性渲染 、鼠标经过时使用
    extendsData: {
      code: params.code,
      person: params.person,
      sog: params.sog,
      monitorTime: dayjs(params.monitorTime).format("YYYY-MM-DD HH:mm:ss"),
      type: "realTimeTag", // 实时标签类型
      color: params.color,
      showHeadline: params.showHeadline,
      angle: params.angle
    },
    name: params.name, // 鼠标经过及左击使用
    code: params.code,
    type: dataType,
    labelTypeCode: labelTypeCode
  });
  // 基础引擎，左键点击使用
  shipFeature.setId(params.code);
  return shipFeature;
}

/************************************************************************
  获取船只颜色函数（人逻辑相同）
  船只颜色
  01: colorIndex=4 表示是关注船只 => 绿色
  02: monitorTime 和当前时间 new Date()对比
      I: 延迟大于8分钟           => 灰色
      II: 延迟小于等于8分钟       => 黄色

  03: status true 告警船只   => 红色
      I: 延迟大于8分钟并且是报警  => 灰色 + 红色
  
  优先级(低=>高)
    白名单 => 白色
    关注 => 绿色
    告警 => 红色
    延迟大于8分钟  => 灰色
    告警+大于8分钟 => 灰色 + 红色
    不符合上述条件 => 黄色

************************************************************************/
// const eightMinutes = 8 * 60 * 1000;
export function realFeatureColor(arg: shipColorParams) {
  let colorArr: string[] = [];
  const nowTime = +new Date();
  let { monitorTime, status, isAttention, isWhiteList, timeoutRange: eightMinutes } = arg;

  // 白名单
  if (isWhiteList) {
    colorArr = ["#fff", "#fff"];
  }

  // 关注
  if (isAttention) {
    colorArr = ["#00ff00", "#00ff00"];
  }

  // 告警
  if (status) {
    colorArr = ["#ff0000", "#ff0000"];
  }

  // 延迟大于8分钟
  if (nowTime - monitorTime > Number(eightMinutes)) {
    colorArr = ["#c0c0c0", "#c0c0c0"];
  }

  // 告警+大于8分钟
  if (status && nowTime - monitorTime > Number(eightMinutes)) {
    colorArr = ["#c0c0c0", "#ff0000"];
  }

  // 不符合上述条件
  if (!isWhiteList && !isAttention && !status && !(nowTime - monitorTime > Number(eightMinutes))) {
    colorArr = ["#ffff00", "#ffff00"];
  }

  return colorArr;
}
