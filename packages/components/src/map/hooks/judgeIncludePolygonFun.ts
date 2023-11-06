import {
  lineString as turfLineString,
  polygon as turfPolygon,
  booleanCrosses,
  booleanOverlap,
  booleanPointInPolygon,
  booleanContains
} from "@turf/turf";

import * as olCoordinate from "ol/coordinate";
import LineString from "ol/geom/LineString.js";
import { Feature } from "ol";
import { Point } from "ol/geom";

// 点 vs 线 => 最短距离和半径大小( true:叠加  false:无焦点)
function distanceVsRadius(lineFeature: any, pointGeometry: any, radius: number) {
  const lineGeometry = lineFeature?.getGeometry(); // 线几何
  const lineCoords = lineGeometry?.getCoordinates(); // 线坐标
  const pointCoords = pointGeometry?.getCoordinates(); // 点坐标
  const closestPoint = olCoordinate?.closestOnSegment(pointCoords, lineCoords); // 点到线段最近的点
  const distance = olCoordinate?.distance(closestPoint, pointCoords); // 两点间距离
  return radius > distance;
}

// 面 => 一组线要素数组
function polyToLines(polygonGeometry: any) {
  const coordinates = polygonGeometry?.getCoordinates()?.[0];
  const groupsLine = [];
  for (let i = 0; i < coordinates?.length - 1; i++) {
    const group = [coordinates[i], coordinates[i + 1]];
    const lineObj = new Feature({
      geometry: new LineString(group),
      name: i
    });
    groupsLine.push(lineObj);
  }
  return groupsLine;
}

// 点 => 是否在面内
function pointInPoly(pointGeometry: any, polygonGeometry: any) {
  const pointCoords = pointGeometry?.getCoordinates();
  return polygonGeometry?.intersectsCoordinate(pointCoords);
}

// 判断
function isTrue(pointGeometry: any, polygonGeometry: any, radius: number): Boolean {
  const isInside = pointInPoly(pointGeometry, polygonGeometry);
  if (isInside) {
    // 中心点在面内
    return isInside;
  } else {
    // 点到线段的最短距离与半径比
    const lineArr = polyToLines(polygonGeometry); // 线要素arr
    const flags = lineArr?.map(lineFeature => distanceVsRadius(lineFeature, pointGeometry, radius)); // 判断与多边形的各个线段是否有交叉[false,true]等值
    return flags.filter(Boolean)?.length > 0; // 判断数组 flags 中是否存在至少一个 true 值
  }
}

// polygon框选绘制的几何图形（矩形或多边形）geometry地图上的要素几何 type 要素类型
export function judgeIncludePolygon(polygon: any, geometry: any, type: string) {
  let isInclude = false;
  if (type == "1" || type == "6") {
    // 点 文本（包含）
    const pointCoordinate = geometry?.getCoordinates(); // 获取点的坐标[a,b]
    const polygonGeo = turfPolygon(polygon?.getCoordinates());
    isInclude = booleanPointInPolygon(pointCoordinate, polygonGeo);
  } else if (type == "2" || type == "7") {
    // 线 环（判断线和面是否相交及包含）
    const lineTurfGeo = turfLineString(geometry?.getCoordinates());
    let polygonTurfGeo = turfPolygon(polygon?.getCoordinates());
    isInclude = booleanCrosses(lineTurfGeo, polygonTurfGeo) || booleanContains(polygonTurfGeo, lineTurfGeo);
  } else if (type == "3" || type == "5") {
    // 面 矩形（相交及相互包含）
    const polygon1Geo = turfPolygon(geometry?.getCoordinates());
    const polygon2Geo = turfPolygon(polygon?.getCoordinates());
    isInclude =
      booleanOverlap(polygon1Geo, polygon2Geo) ||
      booleanContains(polygon1Geo, polygon2Geo) ||
      booleanContains(polygon2Geo, polygon1Geo);
  } else if (type == "4") {
    // 思路：// 圆心在面内及点到线距离与半斤大小比
    const circleRadius = geometry?.getRadius();
    const circleCenter = geometry?.getCenter();
    isInclude = !!isTrue(new Point(circleCenter), polygon, circleRadius);
  }
  return isInclude;
}
