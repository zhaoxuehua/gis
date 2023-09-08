import { Feature } from "ol";
import { fromLonLat } from "ol/proj";
import { Point } from "ol/geom";
import { useGisStore } from "../../stores/modules/gis";
import { createGeometry } from "./createGeometry.js";
import type { VisualMap } from "../type";

export function initAlarmLayerAndCreateFeature(map: VisualMap, layer: any, data: any = []) {
  let gisStore = useGisStore();
  const relationMap = gisStore?.relationMap;
  let labelInfoMap = map?.get("labelInfoMap") || {};
  let alarmFeatures: any = []; // 报警图层要素
  data?.forEach((item: { [key: string]: any }) => {
    let { code, name, lon, lat } = item;
    // 如果有经纬度则说明是点，直接绘制报警点，没有则在abelInfoMap中匹配去标签进行绘制新的报警标签
    if (lon && lat) {
      const alarmPointFeature = new Feature({
        geometry: new Point(fromLonLat([lon, lat]))
      });
      alarmPointFeature.set("type", "alarmPoint");
      alarmPointFeature.set("code", code); // 是否显示标签
      alarmPointFeature.set("name", name); // 是否显示标签
      alarmPointFeature.set("max", 1);
      alarmFeatures.push(alarmPointFeature);
    } else {
      // 线、面、圆、矩形、环(匹配基础引擎标签）
      for (let key in relationMap) {
        if (code == relationMap[key]?.code) {
          // key是标签的code
          let labelInfo = labelInfoMap[key];
          if (labelInfo) {
            // 绘制要素
            const labelFeature = new Feature({
              geometry: createGeometry(labelInfo?.labelData)
            });
            labelFeature.set("type", "alarmPoint");
            labelFeature.set("code", code); // 是否显示标签
            labelFeature.set("name", name); // 是否显示标签
            labelFeature.set("originLabelType", labelInfo?.labelData?.style?.type);
            labelFeature.set("visible", true);
            alarmFeatures.push(labelFeature);
          }
          break;
        }
      }
    }
  });
  // 先清空数据源
  layer?.getSource()?.clear();
  layer?.getSource().addFeatures(alarmFeatures);

  if (gisStore?.simulateAlarmTimer) {
    clearInterval(gisStore?.simulateAlarmTimer);
    gisStore?.setSimulateAlarmTimer(null);
  }
  gisStore?.setSimulateAlarmTimer(
    setInterval(() => {
      layer?.getSource().forEachFeature((feature: any) => {
        let originLabelType = feature.get("originLabelType");
        if (originLabelType) {
          // 线面报警要素
          let visible = feature.get("visible");
          feature.set("visible", !visible);
        } else {
          // 点报警要素
          let max = feature.get("max");
          max = max < 3 ? max + 1 : 1;
          feature.set("max", max);
        }
      });
    }, 600)
  );
}
