// 封装测距功能（1、可以一次点击绘制一次或多次  2、可以配置是否显示部分块的距离 3、可以配置关闭按钮 4、可以修改测量要素）
import { styleGraph, labelStyle, modifyStyle, segmentStyle } from "./styleFunction";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Draw, Modify } from "ol/interaction";
import { getArea, getLength } from "ol/sphere";
import { Polygon } from "ol/geom";
import { LineString, Point } from "ol/geom.js";
import Overlay from "ol/Overlay";
import type { VisualMap } from "../type";

const segmentStyles = [segmentStyle];

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

// 样式函数 1、要素 2、单位  3、是否展示段测量  4、绘制类型（"Polygon" "LineString"）
function measureStyleFunction(feature: any, unit: string, segments: any, drawType?: any) {
  const styles = [];
  const geometry = feature.getGeometry();
  const type = geometry?.getType();
  let point, label, line;
  if (!drawType || drawType === type || type === "Point") {
    styles.push(styleGraph);
    if (type === "Polygon") {
      point = geometry?.getInteriorPoint();
      label = formatArea(geometry, unit);
      line = new LineString(geometry?.getCoordinates()[0]);
    } else if (type === "LineString") {
      point = new Point(geometry?.getLastCoordinate());
      label = formatLength(geometry, unit);
      line = geometry;
    }
  }
  // 测量：段样式（line为线或面图形）
  if (segments && line) {
    let count = 0;
    line.forEachSegment(function (a: any, b: any) {
      const segment = new LineString([a, b]);
      const label = formatLength(segment, "metric");
      if (segmentStyles.length - 1 < count) {
        segmentStyles.push(segmentStyle.clone());
      }
      const segmentPoint = new Point(segment.getCoordinateAt(0.5));
      segmentStyles[count].setGeometry(segmentPoint);
      segmentStyles[count].getText().setText(label);
      styles.push(segmentStyles[count]);
      count++;
    });
  }
  // 测量：具体展示样式（位置是线的末尾  面是中心点 ）
  if (label) {
    labelStyle.setGeometry(point);
    labelStyle.getText().setText(label);
    styles.push(labelStyle);
  }
  return styles;
}

// 参数 1、map  2、测量类型值  3、测距单位 4、是否展示段测量值 5、是否清除上次的测量(可左击继续绘制)  6、是否绘制一次就清除交互器（只能绘一次）
//      7、是否有关闭按钮 8、关闭按钮的回调（关闭后需切换测量按钮文字及布尔值）
// 注意绘制一次isOnceMeasured时再使用hasCloseBtnOverlay及回调，因为关闭按钮只添加一次
export function measureAddDrawInteraction(
  map: VisualMap,
  measureType: string,
  unit: string,
  isShowSegments?: boolean,
  isClearPreviousMeasure?: boolean,
  isOnceMeasured?: boolean,
  hasCloseBtnOverlay?: boolean,
  closeBtnOverlayCallback?: Function
) {
  if (!map) return;
  clearMeasureDrawInteraction(map); // 移除逻辑

  // 修改测量要素交互器
  const measureVectorSource = new VectorSource();
  let measureModifyInteraction: any = new Modify({ source: measureVectorSource, style: modifyStyle }); // 可以修改绘制的线段或面积
  map?.addInteraction(measureModifyInteraction);
  map?.set("measureModifyInteraction", measureModifyInteraction);

  // 测量图层及数据源
  const measureDistanceVectorLayer = new VectorLayer({
    source: measureVectorSource,
    style: function (feature) {
      return measureStyleFunction(feature, unit, isShowSegments);
    }
  });
  map?.addLayer(measureDistanceVectorLayer);
  map?.set("measureDistanceVectorLayer", measureDistanceVectorLayer);
  map?.set("measureDistanceVectorSource", measureVectorSource);

  // 测量交互器
  const drawType = measureType == "area" ? "Polygon" : "LineString";
  let measureDrawInteraction = new Draw({
    source: measureVectorSource,
    type: drawType,
    style: function (feature) {
      return measureStyleFunction(feature, unit, isShowSegments, drawType);
    }
  });
  map.addInteraction(measureDrawInteraction);
  map?.set("measureDrawInteraction", measureDrawInteraction);

  // 测量附加信息关闭按钮
  let closeBtnOverlay = map?.get("closeBtnOverlay");

  measureDrawInteraction.on("drawstart", function () {
    if (isClearPreviousMeasure) {
      measureVectorSource?.clear();
    }
    measureModifyInteraction?.setActive(false); // 绘制时不可修改测量要素

    // 清空附加的关闭按钮
    if (map?.get("closeBtnOverlay")) {
      map?.removeOverlay(map?.get("closeBtnOverlay"));
      map?.set("closeBtnOverlay", null);
    }
    // 动态创建overLayer
    if (hasCloseBtnOverlay) {
      let overDiv: any = document?.createElement("div"); // 创建div
      overDiv.id = "ol-over-close"; // 给div增加id
      overDiv.innerHTML = "X"; // div的内容是取消的x
      overDiv.style.display = "block"; // 样式
      document.body?.appendChild(overDiv); // 将动态div添加至document

      closeBtnOverlay = new Overlay({
        element: overDiv,
        autoPan: true,
        offset: [-10, -10]
      });
      map?.addOverlay(closeBtnOverlay);
      map?.set("closeBtnOverlay", closeBtnOverlay);
      // 关闭
      overDiv.onclick = function () {
        clearMeasureDrawInteraction(map);
        overDiv = null;
        closeBtnOverlayCallback && closeBtnOverlayCallback();
      };
    }
  });
  measureDrawInteraction.on("drawend", function (event: any) {
    measureModifyInteraction.setActive(true);
    // 是否只能绘制一次
    if (isOnceMeasured) {
      setTimeout(() => {
        measureDrawInteraction.setActive(false); //isOnceMeasured是true时只能测量一次不能左击后继续测量
        map?.removeInteraction(map?.get("measureDrawInteraction")); // 为了释放左击时可弹框
        map?.set("measureDrawInteraction", null);
      }, 0);
    }

    // 测量关闭按钮逻辑
    if (hasCloseBtnOverlay) {
      let cor = event.feature?.getGeometry()?.getCoordinates();
      let closeBtnOverlay = map?.get("closeBtnOverlay");
      drawType == "Polygon" && closeBtnOverlay?.setPosition(cor[0][0]);
      drawType == "LineString" && closeBtnOverlay?.setPosition(cor[0]);
    }
  });
}
// 清除测量逻辑的封装
export function clearMeasureDrawInteraction(map: VisualMap) {
  // 移除测量交互器
  if (map?.get("measureDrawInteraction")) {
    map?.removeInteraction(map?.get("measureDrawInteraction"));
    map?.set("measureDrawInteraction", null);
  }
  // 移除测量修改交互器(清除缓存)
  if (map?.get("measureModifyInteraction")) {
    map?.get("measureModifyInteraction")?.setActive(false);
    map?.removeInteraction(map?.get("measureModifyInteraction"));
    map?.set("measureModifyInteraction", null);
  }

  // 移除测量图层数据源
  if (map?.get("measureDistanceVectorSource")) {
    map?.get("measureDistanceVectorSource")?.clear();
    map?.set("measureDistanceVectorSource", null);
  }
  // 移除测量图层
  if (map?.get("measureDistanceVectorLayer")) {
    map?.removeLayer(map?.get("measureDistanceVectorLayer"));
    map?.set("measureDistanceVectorLayer", null);
  }

  // 清除overlay
  if (map?.get("closeBtnOverlay")) {
    map?.removeOverlay(map?.get("closeBtnOverlay"));
    map?.set("closeBtnOverlay", null);
  }
}
