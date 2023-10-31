// import { intersects } from "ol/extent";
// import { LineString } from "ol/geom";

// polygon框选绘制的几何图形（矩形或多边形）geometry地图上的要素几何 type 要素类型
export function judgeIncludePolygon(polygon: any, geometry: any, type: string) {
  let isInclude = false;
  if (type == "1" || type == "6") {
    // 点 文本（包含）
    const pointCoordinate = geometry?.getCoordinates(); // 获取点的坐标
    isInclude = polygon?.intersectsCoordinate(pointCoordinate); // 几何图形包含指定的坐标，则返回true
  } else if (type == "2" || type == "7") {
    // 线 环（相交，构成线的点存在面里才可以）
    const lineCoordinates = geometry?.getCoordinates(); // 获取线的坐标数组
    for (const coordinate of lineCoordinates) {
      if (polygon?.intersectsCoordinate(coordinate)) {
        return true;
      }
    }
  } else if (type == "3") {
    // 面
    // 思路：A B判断相互顶点是否包含
    const coordinatesA = polygon?.getCoordinates()?.[0]; // 多边形 A 的第一个环线的坐标数组[[],[]]
    const coordinatesB = geometry?.getCoordinates()?.[0]; // 多边形 B的第一个环线的坐标数组
    // 判断地图要素多边形点在不在框选内
    for (let i = 0; i < coordinatesB?.length; i++) {
      const pointB = coordinatesB[i];
      // 判断点B是否在多边形A内部
      if (polygon?.intersectsCoordinate(pointB)) {
        return true;
      }
    }
    // 判断框选点在不在地图要素多边形内
    for (let i = 0; i < coordinatesA?.length; i++) {
      const pointA = coordinatesA[i];
      // 判断点A是否在多边形B内部
      if (geometry?.intersectsCoordinate(pointA)) {
        return true;
      }
    }
  } else if (type == "4") {
    // 圆
    // 判断圆与矩形或多边形是否有重叠(范围不精确)
    if (polygon?.intersectsExtent(geometry?.getExtent())) {
      isInclude = true;
    }
  } else if (type == "5") {
    // 矩形（范围）
    const extent = geometry?.getExtent(); // 获取地图矩形范围
    isInclude = polygon?.intersectsExtent(extent);
  }
  return isInclude;
}
