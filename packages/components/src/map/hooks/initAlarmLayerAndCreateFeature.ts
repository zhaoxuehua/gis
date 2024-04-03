import { Feature } from "ol";
import { fromLonLat } from "ol/proj";
import { Point } from "ol/geom";
import { useGisStore } from "../../stores/modules/gis";
import { createGeometry } from "./createGeometry.js";
import type { VisualMap } from "../type";

// 告警
export function initAlarmLayerAndCreateFeature(map: VisualMap, layer: any, data: any = []) {
  let gisStore = useGisStore();
  if (!map || !data?.length) {
    // 空数据时需要清空图层数据源及样式定时器，与有数据分开是因为减少中间空白
    layer?.getSource()?.clear();
    if (gisStore?.simulateAlarmTimer) {
      clearInterval(gisStore?.simulateAlarmTimer);
      gisStore?.setSimulateAlarmTimer(null);
    }
  }

  const relationMapKeyIsEquipCode = gisStore?.relationMapKeyIsEquipCode; // 设备code与标签code关联map
  let labelInfoMap = map?.get("labelInfoMap") || {};
  let alarmFeatures: any = []; // 报警图层要素
  let alarmPointFeatureInfoArr: any = []; // 报警中点报警要素信息（用于labelOnSelect中报警点要素选中逻辑）

  data?.forEach((item: { [key: string]: any }) => {
    let { equip, equipName, lon, lat } = item;
    let id = lat + "_" + lon;
    // 如果有经纬度则说明是点，直接绘制报警点，没有则在abelInfoMap中匹配去标签进行绘制新的报警标签
    if (lon && lat) {
      const alarmPointFeature = new Feature({
        name: equipName,
        code: equip,
        typeStats: "alarmPoint",
        type: "1",
        max: 1,
        color: item.eventSubTypeColor || "red",
        extendsData: item,
        geometry: new Point(fromLonLat([lon, lat]))
      });
      alarmPointFeature.setId(id);
      alarmFeatures.push(alarmPointFeature);
      alarmPointFeatureInfoArr.push({
        name: equipName,
        code: equip,
        lon,
        lat,
        layerCode: "alarmLayer", // 所属图层
        dataType: "1",
        id
      });
    } else {
      // 点、文本 线、面、圆、矩形、环(匹配基础引擎标签）, 报警点也可能走这里
      const matchedKey = relationMapKeyIsEquipCode?.[equip]; // 根据设备code找标签code
      if (matchedKey) {
        const labelInfo = labelInfoMap[matchedKey];
        if (labelInfo) {
          const type = labelInfo?.labelData?.style?.type;
          // 绘制要素
          const labelFeature = new Feature({
            name: equipName, // 设备名称
            code: equip,
            typeStats: "alarmPoint",
            type,
            color: item.eventSubTypeColor || "red",
            extendsData: item,
            geometry: createGeometry(labelInfo?.labelData)
          });
          if (["1", "6"].includes(type)) {
            labelFeature.set("max", 1);
            labelFeature.setId(id);
            alarmFeatures.push(labelFeature);
            alarmPointFeatureInfoArr.push({
              name: equipName,
              code: equip,
              lon,
              lat,
              layerCode: "alarmLayer", // 所属图层
              dataType: "1",
              id
            });
          } else {
            labelFeature.set("visible", true);
          }
          alarmFeatures.push(labelFeature);
        }
      }
    }
  });

  // 存储是点报警的信息
  map.set("alarmPointFeatureInfoArr", alarmPointFeatureInfoArr);

  // 先清空数据源
  layer?.getSource()?.clear();
  layer?.getSource()?.addFeatures(alarmFeatures);
  if (gisStore?.simulateAlarmTimer) {
    clearInterval(gisStore?.simulateAlarmTimer);
    gisStore.simulateAlarmTimer = null;
  }

  gisStore.simulateAlarmTimer = setInterval(() => {
    layer?.getSource().forEachFeature((feature: any) => {
      let type = feature.get("type");
      if (type == "1" || type == "6") {
        // 点报警要素
        let max = feature.get("max") || 1;
        max = max < 3 ? max + 1 : 1;
        feature.set("max", max);
      } else {
        // 线面报警要素
        let visible = feature.get("visible");
        feature.set("visible", !visible);
      }
    });
  }, 800);
}
