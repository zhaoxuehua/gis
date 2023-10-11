import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Draw } from "ol/interaction";
import Overlay from "ol/Overlay";
import { getArea, getLength } from "ol/sphere";
import { measureStyle } from "./styleFunction";
import { LineString, Polygon } from "ol/geom";
import { unByKey } from "ol/Observable";
import { shallowRef } from "vue";

// 计算长度
export function formatLength(line: LineString, unit: string) {
  let length = getLength(line); // 获取线的长度（每个部分长度和），默认米meters
  let output;
  if (length > 1000) {
    let outputKilometer: number = Math.round((length / 1000) * 1000) / 1000; // 千米 四舍五入
    output = unit == "metric" ? `${outputKilometer.toFixed(2)}千米` : `${(outputKilometer / 1.852).toFixed(2)}海里`; // 1海里=1.852千米;
  } else {
    let outputMetric: number = Math.round(length * 1000) / 1000; // 米
    output = unit == "metric" ? `${outputMetric.toFixed(2)}米` : `${(outputMetric / 1000 / 1.852).toFixed(2)}海里`; // 1海里=1.852千米;
  }
  return output;
}

// 计算面积的函数
export function formatArea(polygon: Polygon, unit: string) {
  let area = getArea(polygon); // 面积（以米为单位）
  let output;

  if (area > 10000) {
    let outputKilometer: number = Math.round((area / 1000000) * 100) / 100; // 平方千米
    output = unit == "metric" ? `${outputKilometer.toFixed(2)}平方千米` : `${(outputKilometer / 3.429904).toFixed(2)}平方海里`; // 1海里=1.852千米;
  } else {
    let outputMetric: number = Math.round(area * 100) / 100; // 平方米
    output = unit == "metric" ? `${outputMetric.toFixed(2)}平方米` : `${(outputMetric / 1000000 / 3.429904).toFixed(2)}平方海里`; // 1海里=1.852千米;
  }
  return output;
}

//  面积||长度弹框
let measureTooltipElement: HTMLElement; // overLayer的Dom
let measureTooltipOverLay: Overlay;
function createMeasureTooltip(map: any) {
  measureTooltipElement = document.createElement("div");
  measureTooltipElement.className = "ol-tooltip ol-tooltip-measure";
  document.body.appendChild(measureTooltipElement);
  measureTooltipOverLay = new Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: "bottom-center"
  });
  map.addOverlay(measureTooltipOverLay);
}

// 测量
const measureSource = shallowRef(); // source
measureSource.value = new VectorSource();
const measureVectorLayer = new VectorLayer({
  source: measureSource.value,
  style: measureStyle
}); // layer

let sketch: any = null;
let listener: any = null;

export function measureStartFun(map: any, measureType: string) {
  // 清除
  measureClearFun(map);

  // 判断是否存在测量layer
  const isTrue = map.getLayers().getArray().includes(measureVectorLayer);
  !isTrue && map.addLayer(measureVectorLayer);
  !isTrue && createMeasureTooltip(map);

  const unit = map?.defaultOptions?.scaleLineUnit; // "metric"米千米或者海里

  // 创建交互器
  let measureDrawInteraction: any; // 交互器
  measureDrawInteraction = new Draw({
    type: measureType == "area" ? "Polygon" : "LineString",
    source: measureSource.value,
    geometryName: "measureDrawInteraction",
    style: measureStyle
  });

  map["measureDrawInteraction"] = measureDrawInteraction;

  measureDrawInteraction.once("drawstart", function (evt: any) {
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
      measureTooltipElement.innerHTML = output + "";
      measureTooltipOverLay.setPosition(tooltipCoord); // 测量距离文字所在位置
    });
  });

  measureDrawInteraction.once("drawend", function () {
    measureDrawInteraction.setActive(false);
    map.removeInteraction(measureDrawInteraction);
    unByKey(listener);
  });

  map.addInteraction(measureDrawInteraction);
}

export function measureCloseFun(map: any) {
  map["measureDrawInteraction"].setActive(false);
  measureClearFun(map);
}

export function measureClearFun(map: any) {
  measureSource.value && measureSource.value.clear();
  measureTooltipElement && (measureTooltipElement.innerHTML = "");
  measureTooltipOverLay && measureTooltipOverLay.setPosition(undefined);
  map.removeInteraction(map["measureDrawInteraction"]);
  sketch = null;
  listener = null;
}
