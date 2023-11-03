import {
  lineString as turfLineString,
  polygon as turfPolygon,
  // point as turfPoint,
  // circle as turfCircle,
  booleanCrosses,
  booleanOverlap,
  booleanPointInPolygon,
  booleanContains
  // pointToLineDistance
} from "@turf/turf";

// import { getLonLatCoordinate } from "./createGeometry";

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
    //圆 判断圆与矩形或多边形是否有重叠(范围不精确)
    if (polygon?.intersectsExtent(geometry?.getExtent())) {
      isInclude = true;
    }

    // 利用turf也不准确
    // const circleCenter = geometry?.getCenter();
    // const circleRadius = geometry?.getRadius();
    // // 3857=>4326 再生成turf几何
    // let turfCircleGeo = turfCircle(getLonLatCoordinate(circleCenter), circleRadius / 1000);
    // let turfPolygonGeo = turfPolygon(getLonLatCoordinate(polygon?.getCoordinates()));
    // isInclude =
    //   booleanOverlap(turfCircleGeo, turfPolygonGeo) ||
    //   booleanContains(turfPolygonGeo, turfCircleGeo) ||
    //   booleanContains(turfCircleGeo, turfPolygonGeo);
    // console.log(
    //   booleanOverlap(turfCircleGeo, turfPolygonGeo),
    //   booleanContains(turfPolygonGeo, turfCircleGeo),
    //   booleanContains(turfCircleGeo, turfPolygonGeo)
    // );

    // 利用点到多线段的最短距离与圆半径的比较实现
    // const circleCenter = geometry?.getCenter();
    // const circleRadius = geometry?.getRadius();
    // let coordinates = polygon.getCoordinates()?.[0]; // [[lon,lat]]
    // const circleCenterTurf = turfPoint(getLonLatCoordinate(circleCenter));
    // let line = turfLineString(getLonLatCoordinate(coordinates));
    // let distance = pointToLineDistance(circleCenterTurf, line, { units: "miles" });
    // console.log(distance, circleRadius, 9999999);
    // if (distance <= circleRadius / 1000) {
    //   isInclude = true;
    // }
  }

  return isInclude;
}
