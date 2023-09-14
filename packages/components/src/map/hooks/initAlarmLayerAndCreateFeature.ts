import { Feature } from "ol";
import { fromLonLat } from "ol/proj";
import { Point } from "ol/geom";
import { useGisStore } from "../../stores/modules/gis";
import { createGeometry } from "./createGeometry.js";
import type { VisualMap } from "../type";

// 告警

export function initAlarmLayerAndCreateFeature(map: VisualMap, layer: any, data: any = []) {
  if (!map || !data?.length) return;
  let gisStore = useGisStore();
  const relationMap = gisStore?.relationMap;
  let labelInfoMap = map?.get("labelInfoMap") || {};
  let alarmFeatures: any = []; // 报警图层要素
  data?.forEach((item: { [key: string]: any }) => {
    let { equip, equipName, lon, lat } = item;
    // 如果有经纬度则说明是点，直接绘制报警点，没有则在abelInfoMap中匹配去标签进行绘制新的报警标签
    if (lon && lat) {
      const alarmPointFeature = new Feature({
        geometry: new Point(fromLonLat([lon, lat]))
      });
      alarmPointFeature.set("type", "alarmPoint");
      alarmPointFeature.set("dataType", "1"); // 数据类型
      alarmPointFeature.set("code", equip); // 设备编码
      alarmPointFeature.set("name", equipName); // 设备名称
      alarmPointFeature.set("max", 1);
      alarmFeatures.push(alarmPointFeature);
    } else {
      // 点、文本 线、面、圆、矩形、环(匹配基础引擎标签）
      const matchedKey = Object.keys(relationMap).find(key => equip === relationMap[key]?.code);
      if (matchedKey) {
        const labelInfo = labelInfoMap[matchedKey];
        if (labelInfo) {
          // 绘制要素
          const labelFeature = new Feature({
            name: equipName, // 设备名称
            geometry: createGeometry(labelInfo?.labelData)
          });
          labelFeature.set("code", equip); // 设备编码
          labelFeature.set("type", "alarmPoint");
          labelFeature.set("dataType", labelInfo?.labelData?.style?.type);
          if (["1", "6"].includes(labelInfo?.labelData?.style?.type)) {
            labelFeature.set("max", 1);
          } else {
            labelFeature.set("visible", true);
          }
          alarmFeatures.push(labelFeature);
        }
      }
    }
  });
  // 先清空数据源
  layer?.getSource()?.clear();
  layer?.getSource()?.addFeatures(alarmFeatures);
  if (gisStore?.simulateAlarmTimer) {
    clearInterval(gisStore?.simulateAlarmTimer);
    gisStore.simulateAlarmTimer = null;
  }

  gisStore.simulateAlarmTimer = setInterval(() => {
    layer?.getSource().forEachFeature((feature: any) => {
      let dataType = feature.get("dataType");
      if (dataType == "1" || dataType == "6") {
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
