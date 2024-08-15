import { Feature } from "ol";
import { fromLonLat } from "ol/proj";
import { Point } from "ol/geom";
import { useGisStore } from "../../stores/modules/gis";
import { createGeometry } from "./createGeometry.js";
import type { VisualMap } from "../type";

// 告警
export function initAlarmLayerAndCreateFeature(map: VisualMap, alarmOtherLayer: any, alarmPointLayer: any, data: any = []) {
  let gisStore = useGisStore();
  if (!map || !data?.length) {
    // 空数据时需要清空图层数据源及样式定时器，与有数据分开是因为减少中间空白
    alarmOtherLayer?.getSource()?.clear();
    alarmPointLayer?.getSource()?.getSource()?.clear();

    if (gisStore?.simulateAlarmTimer) {
      clearInterval(gisStore?.simulateAlarmTimer);
      gisStore?.setSimulateAlarmTimer(null);
    }
  }

  const relationMapKeyIsEquipCode = gisStore?.relationMapKeyIsEquipCode; // 设备code与标签code关联map
  let labelInfoMap = map?.get("labelInfoMap") || {};
  let pointAlarmFeatures: any = []; // 报警点要素
  let otherAlarmFeatures: any = []; // 报警线、面要素

  let alarmPointFeatureInfoArr: any = []; // 报警中点报警要素信息（用于labelOnSelect中报警点要素选中逻辑）

  data?.forEach((item: { [key: string]: any }) => {
    let { equip, equipName, lon, lat, mid } = item;
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
      alarmPointFeature.setId(mid);
      pointAlarmFeatures.push(alarmPointFeature);
      alarmPointFeatureInfoArr.push({
        name: equipName,
        code: equip,
        lon,
        lat,
        layerCode: "alarmPointLayer",
        dataType: "1",
        id: mid
      });
    } else {
      // 报警类型点（点、文本）、 线、面、圆、矩形、环(匹配基础引擎标签）
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
            labelFeature.setId(mid);
            alarmPointFeatureInfoArr.push({
              name: equipName,
              code: equip,
              lon,
              lat,
              layerCode: "alarmPointLayer",
              dataType: type,
              id: mid
            });
            pointAlarmFeatures.push(labelFeature);
          } else {
            labelFeature.set("visible", true);
            otherAlarmFeatures.push(labelFeature);
          }
        }
      }
    }
  });

  // 存储是点报警的信息
  map.set("alarmPointFeatureInfoArr", alarmPointFeatureInfoArr);

  // 清空报警标签
  alarmOtherLayer?.getSource()?.clear();
  alarmPointLayer?.getSource()?.getSource()?.clear();

  // 添加报警标签
  alarmPointLayer?.getSource()?.getSource()?.addFeatures(pointAlarmFeatures);
  alarmOtherLayer?.getSource()?.addFeatures(otherAlarmFeatures);

  if (gisStore?.simulateAlarmTimer) {
    clearInterval(gisStore?.simulateAlarmTimer);
    gisStore.simulateAlarmTimer = null;
  }

  // 样式动态变更
  gisStore.simulateAlarmTimer = setInterval(() => {
    alarmOtherLayer?.getSource().forEachFeature((feature: any) => {
      // 线面报警要素
      let visible = feature.get("visible");
      feature.set("visible", !visible);
    });
    alarmPointLayer
      ?.getSource()
      ?.getSource()
      .forEachFeature((feature: any) => {
        // 点报警要素
        let max = feature.get("max") || 1;
        max = max < 3 ? max + 1 : 1;
        feature.set("max", max);
      });
  }, 800);
}
