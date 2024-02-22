import type { Coordinate } from "ol/coordinate";
import { fromLonLat, toLonLat } from "ol/proj";
import { Circle as CircleGeom, LineString, Point, Polygon } from "ol/geom";
import { boundingExtent, getCenter } from "ol/extent";
import type { LabelData } from "../type";

// 简单获取数组维度（只根据第一个元素判断）
export function multiArray(array: any) {
  let deep = 1;
  let first = array[0];
  while (Array.isArray(first)) {
    deep++;
    first = first[0];
  }
  return deep;
}

export function createGeometry(labelData: LabelData) {
  let geometry;
  let type = labelData?.style?.type;
  if (DATA_TYPE_ARR.includes(type)) {
    type = MAP_DATA_TYPE[type]?.value;
  }

  let coordinates = labelData?.coordinates;
  let radius = labelData.radius;
  coordinates = getCoordinate(coordinates); // 坐标转换：EPSG:4326=>EPSG:3857
  switch (type) {
    case "Point":
      geometry = new Point(coordinates);
      break;
    case "LineString":
      geometry = new LineString(coordinates);
      break;
    case "Polygon":
      geometry = new Polygon(coordinates);
      break;
    case "Circle":
      geometry = new CircleGeom(coordinates, Number(radius));
      break;
    case "Square":
      geometry = new Polygon(coordinates);
      break;
    case "Text":
      geometry = new Point(coordinates);
      break;
    case "Ring":
      geometry = new LineString(coordinates);
      break;

    default:
      break;
  }
  return geometry;
}

// 数据类型(兼容老数据)
export const DATA_TYPE_ARR = ["1", "2", "3", "4", "5", "6", "7"];
// 数据类型常量映射
export const MAP_DATA_TYPE: { [key: string]: any } = {
  "1": {
    value: "Point",
    title: "点"
  },
  "2": {
    value: "LineString",
    title: "线"
  },
  "3": {
    value: "Polygon",
    title: "面"
  },
  "4": {
    value: "Circle",
    title: "圆"
  },
  "5": {
    value: "Square",
    title: "矩形"
  },
  "6": {
    value: "Text",
    title: "文本"
  },
  "7": {
    value: "Ring",
    title: "环"
  }
};

// 获取图形的中心点坐标
export function getGeometryCenter(labelData: LabelData) {
  let geometryCenter;
  let type = labelData.style.type;
  if (DATA_TYPE_ARR.includes(type)) {
    type = MAP_DATA_TYPE[type]?.value;
  }
  let coordinates = labelData.coordinates;
  let radius = labelData.radius;
  const deep = multiArray(coordinates);
  if (deep === 3) {
    if (coordinates[0][0][0] < 180) {
      coordinates = coordinates.map((item: any) => item.map((coord: Coordinate) => fromLonLat(coord)));
    }
  } else if (deep === 2) {
    if (coordinates[0][0] < 180) {
      coordinates = coordinates.map((coord: any) => fromLonLat(coord));
    }
  } else {
    if (coordinates[0] < 180) {
      coordinates = fromLonLat(coordinates);
    }
  }
  switch (type) {
    case "Point":
      geometryCenter = coordinates;
      break;
    case "Text":
      geometryCenter = coordinates;
      break;
    case "LineString":
      let geometryLine = new LineString(coordinates);
      geometryCenter = geometryLine.getCoordinateAt(0.5);
      break;
    case "Ring":
      let geometryRing = new LineString(coordinates);
      geometryCenter = geometryRing.getCoordinateAt(0.5);
      break;
    case "Polygon":
      let geometryPolygon = new Polygon(coordinates);
      let extentPolygon = geometryPolygon.getExtent();
      geometryCenter = getCenter(extentPolygon);
      break;
    case "Square":
      let geometrySquare = new Polygon(coordinates);
      let coordinatesSquare = geometrySquare.getCoordinates();
      let extent = boundingExtent(coordinatesSquare[0]);
      geometryCenter = getCenter(extent);
      break;
    case "Circle":
      geometryCenter = new CircleGeom(coordinates, radius).getCenter();
      break;
    default:
      break;
  }
  return geometryCenter;
}

//  坐标转换：EPSG:4326=>EPSG:3857  返回坐标值（坐标值=>地图   即经纬度坐标转为地图投影）
export function getCoordinate(positionCoordinates: any[]) {
  let coordinates = positionCoordinates;
  const deep = multiArray(coordinates);
  // 兼容老数据
  if (deep === 3) {
    if (coordinates[0][0][0] < 180) {
      coordinates = coordinates?.map((item: any) => item.map((coord: Coordinate) => fromLonLat(coord)));
    }
  } else if (deep === 2) {
    if (coordinates[0][0] < 180) {
      coordinates = coordinates?.map((coord: any) => fromLonLat(coord));
    }
  } else {
    if (coordinates[0] < 180) {
      coordinates = fromLonLat(coordinates);
    }
  }
  return coordinates;
}

// 坐标转换：EPSG:3857转为EPSG:4326  直接从地图要素上获取的坐标是3857（地图投影）=>经纬度
export function getLonLatCoordinate(positionCoordinates: any[]) {
  let coordinates = positionCoordinates;
  const deep = multiArray(coordinates);
  if (deep === 3) {
    coordinates = coordinates.map((item: any) => item.map((coord: any) => toLonLat(coord)));
  } else if (deep === 2) {
    coordinates = coordinates.map((coord: any) => toLonLat(coord));
  } else {
    coordinates = toLonLat(coordinates);
  }
  return coordinates;
}
