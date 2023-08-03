import { addLabel, deleteLabel } from "../../api/visconfig";
import { ElMessage } from "element-plus";
import Draw, { DrawEvent, createBox } from "ol/interaction/Draw";
import type { Type } from "ol/geom/Geometry";
import { toLonLat } from "ol/proj";
import type { Coordinate } from "ol/coordinate";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Circle } from "ol/geom";
import { isObject, find } from "lodash";
import { useGisStore } from "../../stores/modules/gis";
import { deleteAssociation } from "../../api/gis";
import type { LabelInfoData, VisualMap, LabelType, VisualDraw, VisualGeometry, LabelData } from "../type";
import { MAP_DATA_TYPE, multiArray, getGeometryCenter } from "./createGeometry.js";
import { createStyle, clusterLayerStyle, selectBoxStyle } from "./styleFunction.js";

// 创建标签(标签树、导航树新增标签  featureType 标签类型配置的数据)
export function createLabel(map: VisualMap, featureType: LabelType, callbackFn: Function) {
  ElMessage({
    message: "进入绘制模式，退出绘制请按 ESC 键",
    type: "success"
  });
  // 移除绘制交互器
  let drawFeature = map.get("drawFeature");
  if (drawFeature) {
    map.removeInteraction(drawFeature);
    drawFeature = null;
    map.set("drawFeature", null);
  }
  const { dataType } = featureType; // 是数据类型中取出的（是数字型）

  // 将数据类型数字型=> 转为对应的字符串  1=>Point
  const dataTypeString = MAP_DATA_TYPE[dataType].value;
  let styleData = transformLabelType(featureType);

  let styleMap = createStyle(styleData);
  let currentStyle = styleMap[dataTypeString];
  const refLayer = map.defaultOptions.layers.find((item: any) => item.id === featureType.layerConfigId);

  const layerMap = map?.get("layerMap") || {};
  const layer = layerMap[refLayer.code];
  const isTagAgg = layer.get("isTagAgg"); // 是否聚合图层
  let source: any;
  if (isTagAgg) {
    const clusterDataSource = layer.getSource();
    source = clusterDataSource.getSource();
  } else {
    source = layer.getSource();
  }

  let geometryFunction; // 图形函数
  let type = dataTypeString; // 存储Draw的类型

  // 绘制矩形，类型应该是圆 指定中心点和半径就可以确定矩形（半径的计算基于矩形的宽高）
  if (dataTypeString === "Square") {
    type = "Circle";
    geometryFunction = createBox();
  }

  // 文本其实是Point类型
  if (dataTypeString === "Text") {
    type = "Point";
  }
  // 绘制环(线绘制)
  if (dataTypeString === "Ring") {
    type = "LineString";
  }

  // 创建绘制工具
  drawFeature = new Draw({
    source,
    type: type as Type,
    style: currentStyle,
    geometryFunction
  }) as VisualDraw;
  if (!drawFeature) return;
  drawFeature.name = Date.now();
  map.addInteraction(drawFeature);
  map.set("drawFeature", drawFeature);

  drawFeature.on("drawend", (event: DrawEvent) => {
    // 绘制完成后的事件
    const geometry = event.feature.getGeometry() as VisualGeometry;
    if (!geometry) return;
    let featureCoordinates = geometry.getCoordinates();
    let radius = null; // 圆的半径

    if (dataTypeString === "Circle") {
      featureCoordinates = geometry.getCenter();
      radius = geometry.getRadius();
    }

    // 坐标转换：EPSG:3857转为EPSG:4326
    const deep = multiArray(featureCoordinates);
    if (!featureCoordinates) return;
    if (deep === 3) {
      featureCoordinates = featureCoordinates.map((item: any) => item.map((coord: Coordinate) => toLonLat(coord)));
    } else if (deep === 2) {
      featureCoordinates = featureCoordinates.map((coord: any) => toLonLat(coord));
    } else {
      featureCoordinates = toLonLat(featureCoordinates);
    }

    // 要保存的标签数据，包括地理信息和图形信息(图层根据labelDate生成样式)
    let labelData: LabelData = {
      coordinates: featureCoordinates,
      radius: radius,
      style: { type: styleData.type }, // type数字型
      isDefaultDisplayLabelName: featureType.isDefaultDisplayLabelName
    };

    // 根据图形类型组装需要的style样式
    if (dataTypeString === "Point") {
      Object.assign(labelData.style, {
        icon: styleData.icon
      });
    } else if (dataTypeString === "Text") {
      Object.assign(labelData.style, {
        text: styleData.text
      });
    } else {
      Object.assign(labelData.style, {
        fill: styleData.fill,
        stroke: styleData.stroke,
        lineVector: styleData.lineVector // 矢量线
      });
    }

    // 如果需要显示标签标注
    if (featureType.isDefaultDisplayLabelName && dataTypeString !== "Text") {
      labelData.style.text = styleData.text;
    }

    let featureParams = {
      code: "GIS" + dataTypeString + +new Date(),
      name: featureType.name, // 标签类型名称
      labelTypeId: featureType.id,
      labelType: {
        // 标签类型
        code: featureType.code,
        id: featureType.id,
        name: featureType.name
      },
      refLayerId: refLayer.id,
      refLayer: {
        // 所属图层
        code: refLayer.code,
        id: refLayer.id,
        name: refLayer.name
      },
      labelData: JSON.stringify(labelData) // 标签数据
    };
    event.feature.setId(featureParams.code);
    event.feature.set("code", featureParams.code); // 是否显示标签
    event.feature.set("name", featureParams.name);
    event.feature.set("layerCode", featureParams.refLayer.code); // 所属图层编码
    event.feature.set("labelTypeCode", featureParams.labelType.code); // 所属标签类型编码
    event.feature.set("type", labelData?.style?.type); // 数字型
    event.feature.set("isShow", true); // 是否显示标签
    event.feature.set("labelData", labelData); // 标签绘制数据Json格式
    let typeStats = getTypeStatsByLabelType(featureType, dataType);
    event.feature.set("typeStats", typeStats); // 标签绘制数据
    // 如果是动态的话
    if (typeStats === "dynamicPoint" || typeStats === "dynamicLine" || typeStats === "dynamicRing") {
      let dynamicLayerCodes = map.get("dynamicLayerCodes") || [];
      if (!dynamicLayerCodes.includes(featureParams.refLayer?.code)) {
        dynamicLayerCodes.push(featureParams.refLayer.code);
        map.set("dynamicLayerCodes", dynamicLayerCodes);
      }
    }
    // 保存标签元素
    addLabel(featureParams).then(
      (res: any) => {
        let result = null;
        if (res.code === 200) {
          result = res.data;
          result.labelData = JSON.parse(result.labelData);
        }
        let drawFeature = map.get("drawFeature");
        if (drawFeature) {
          map.removeInteraction(drawFeature);
          drawFeature = null;
          map.set("drawFeature", null);
        }

        callbackFn && callbackFn(result, event.feature, drawFeature);
      },
      (err: any) => {
        console.warn(err);
        callbackFn && callbackFn();
      }
    );
  });
  drawFeature = map.set("drawFeature", drawFeature);
}

// 删除标签元素(label：是对象labelInfo结构)
export function removeLabel(label: LabelInfoData, map: any) {
  deleteLabel([label.id]).then(
    (res: any) => {
      if (res.code === 200) {
        // 从数据源中删除标签要素
        const layerMap = map?.get("layerMap") || {};
        const layer = layerMap[label.refLayer.code];
        const isTagAgg = layer.get("isTagAgg");
        let source: any;
        if (isTagAgg) {
          const clusterDataSource = layer.getSource();
          source = clusterDataSource.getSource();
        } else {
          source = layer.getSource();
        }
        const feature = source.getFeatureById(label.code);
        source.removeFeature(feature); // 从地图上移除要素

        let labelInfoMap = map?.get("labelInfoMap") || {};
        delete labelInfoMap[label.code];
        map.set("labelInfoMap", labelInfoMap);
        ElMessage.success("删除标签成功");
        // 同时删除关联关系(标签树中的删除可能有关联关系删除可能没，导航树中的删除一定有关联关系删除)
        removeRelation(label);
      } else {
        ElMessage.error("删除标签失败");
      }
    },
    (err: any) => {
      console.warn(err);
      ElMessage.error("删除标签失败");
    }
  );
}

// 删除关联关系(导航树的删除一定存在关联关系的删除。标签树的删除可能存在可能不存在)
export function removeRelation(label: LabelInfoData) {
  let gisStore = useGisStore();
  const relationMap = gisStore?.relationMap;
  // 检查是否有关联关系
  const node = find(relationMap, (item: any) => {
    return item.associationInfo && item.associationInfo.associationObjectCode === label.code;
  });
  if (!node || !node.associationInfo) return;
  deleteAssociation([node.associationInfo.id]).then(
    (res: any) => {
      if (res.code === 200) {
        gisStore?.fetchNavigationTree(); // 更新导航树及关联关系
        ElMessage.success("删除关联关系成功");
      } else {
        console.warn(res);
        ElMessage.error("删除关联关系失败");
      }
    },
    (err: any) => {
      console.warn(err);
      ElMessage.error("删除关联关系失败");
    }
  );
}

export function transformLabelType(originalData: LabelType) {
  return {
    type: originalData?.dataType, // 数字的字符串型的 123
    fill: {
      color: originalData?.polygonColor || "rgba(255, 255, 255, 0.5)"
    },
    stroke: {
      color: originalData?.lineColor || "rgba(0, 153, 255, 1)",
      lineDash: originalData?.lineType || "solid",
      width: originalData?.lineWidth
    },
    // src应该是多个(但绘制样式时每次取一个数据源)
    icon: {
      src: originalData?.labelTypeImagePath,
      scale: originalData?.displayScale,
      opacity: originalData?.pellucidity
    },
    text: {
      text: originalData?.name,
      font:
        (originalData?.isBold ? "bold" : "normal") +
        " " +
        (originalData.fontSize || 12 + "px") +
        " " +
        (originalData.fontType || "MicrosoftYaHei"),
      fill: originalData?.fontColor || "rgba(0, 0, 0, 1)",
      offsetX: 0,
      offsetY: 0,
      maxAngle: 6.283185307179586,
      rotation: 0,
      placement: "point",
      fontStrokeWidth: 0,
      fontStrokeColor: "rgba(255, 255, 255, 0.5)",
      backgroundFill: originalData?.backGroundColor,
      backgroundStrokeWidth: originalData?.borderWidth,
      backgroundStrokeColor: originalData?.borderColor
    },
    // 矢量线
    lineVector: {
      path: originalData?.lineVectorPath || "",
      width: originalData?.lineVectorWidth || 10,
      height: originalData?.lineVectorHeight || 10
    }
  };
}

// 标签树、导航树选中label(是标签树或导航树的点击还是地图上的点击)
export function labelOnSelect(map: VisualMap, featureCode: string | number, isFeatureClick: boolean) {
  if (!map || !featureCode) {
    return;
  }
  let gisStore = useGisStore();
  let labelInfoMap = map?.get("labelInfoMap") || {};
  let labelInfo = labelInfoMap[featureCode];
  // 点击的不是要绘制节点
  if (!labelInfo) {
    return;
  }
  let layer = map?.get("layerMap")[labelInfo.refLayer?.code];
  const minZoom = Math.ceil(layer.getMinZoom()); // 图层最小层级
  const maxZoom = Math.floor(layer.getMaxZoom()); // 图层最大层级
  const currentZoom = map.getView().getZoom();
  let zoom = minZoom;
  // 如果在当前视图的层级则显示
  if (minZoom <= currentZoom && currentZoom <= maxZoom) {
    zoom = currentZoom;
  }
  let center = null;
  const labelData = isObject(labelInfo.labelData) ? labelInfo.labelData : JSON.parse(labelInfo.labelData);
  center = getGeometryCenter(labelData);
  // 对标签、导航树要素定位
  if (!isFeatureClick) {
    map.getView().animate({
      center: center,
      zoom: zoom,
      duration: 500
    });
  }
  const isTagAgg = layer.get("isTagAgg"); // 是否聚合图层
  clearSelectedFeature(map);

  if (isTagAgg) {
    const clusterDataSource = layer.getSource();
    clusterDataSource.getFeatures().forEach(function (clusterFeature: any) {
      clusterFeature.get("features").forEach(function (originalFeature: any) {
        if (originalFeature.get("code") === featureCode) {
          // 设置原始要素的样式以示选中
          clusterFeature.setStyle((feature: any) => clusterLayerStyle(feature, gisStore.isDynamicLine, gisStore.imgIndex, true));
          clusterFeature.changed();
          map.set("clusterSelectFeature", clusterFeature);
        }
      });
    });
    // 清除原非聚合图层的选中
  } else {
    let source = layer.getSource();
    const selectFeature = source.getFeatureById(featureCode);
    if (selectFeature) {
      selectFeature.set("selected", true); // 非聚合图层的可以这样实现
      selectFeature.changed();
      map.set("featureSelect", selectFeature);
    } else {
      console.log("未找到匹配的要素");
    }
  }
  let featureName = labelInfo?.name;
  map.popupInfo({ featureCode, featureName, center });
}

// 根据labelData数据更新要素
export function featureUpdate(labelData: any, map: VisualMap) {
  const layerMap = map?.get("layerMap") || {};
  const layer = layerMap[labelData.refLayer.code];
  const isTagAgg = layer.get("isTagAgg");
  let source: any;
  if (isTagAgg) {
    const clusterDataSource = layer.getSource();
    source = clusterDataSource.getSource();
  } else {
    source = layer.getSource();
  }
  let feature = source.getFeatureById(labelData.code);
  let dataType = labelData.labelType?.dataType;
  // 如果是圆的话特殊处理
  if (dataType === "4") {
    if (feature.getGeometry() instanceof Circle) {
      let geo = feature.getGeometry();
      geo.setRadius(labelData.labelData?.radius);
    }
  }

  feature.setId(labelData.code);
  feature.set("code", labelData.code); // 是否显示标签
  feature.set("name", labelData.name);
  feature.set("layerCode", labelData.refLayer.code); // 所属图层编码
  feature.set("labelTypeCode", labelData.labelType.code); // 所属标签类型编码
  feature.set("type", labelData?.labelType?.dataType); // 数字型
  feature.set("isShow", true); // 是否显示标签
  feature.set("labelData", labelData.labelData); // 标签绘制数据Json格式
  let typeStats = getTypeStatsByLabelType(labelData.labelType, dataType);
  feature.set("typeStats", typeStats); // 标签绘制数据
  feature.changed();
  // 如果是矢量线实现动态更新
  if (labelData?.labelType?.dataType == "2" && labelData.labelData.style.lineVector?.path) {
    let styleMap = createStyle(labelData.labelData.style);
    let currentStyle = styleMap["LineString"];
    feature.setStyle(currentStyle);
  }
}

// 根据标签信息获取要素方法
export function getFeature(labelData: any, map: VisualMap) {
  const layerMap = map?.get("layerMap") || {};
  const layer = layerMap[labelData.refLayer.code];
  const isTagAgg = layer.get("isTagAgg");
  let source: any;
  if (isTagAgg) {
    const clusterDataSource = layer.getSource();
    source = clusterDataSource.getSource();
  } else {
    source = layer.getSource();
  }
  const feature = source.getFeatureById(labelData.code);
  return feature;
}

// 设置typeStatus (区分静态点、动态点、静态线、动态线、静态环、动态环) 根据标签类型
export function getTypeStatsByLabelType(labelType: any, dataType: any) {
  let typeStats = "";
  // 点(根据图片源数量)
  if (dataType == "1") {
    let imgSrc = labelType?.labelTypeImagePath ? labelType?.labelTypeImagePath.split(",") : [];
    if (imgSrc?.length > 1) {
      typeStats = "dynamicPoint";
    } else {
      typeStats = "staticPoint";
    }
  }
  // 线(虚线、有动画且不是矢量线才设置闪动)
  if (dataType == "2") {
    if (
      labelType?.lineType == "dash" &&
      labelType?.animationSetting &&
      labelType?.animationSetting === "animations" &&
      !labelType?.lineVectorPath
    ) {
      typeStats = "dynamicLine";
    } else {
      typeStats = "staticLine";
    }
  }
  // 若是环
  if (dataType == "7") {
    if (labelType?.lineType == "dash" && labelType?.animationSetting && labelType?.animationSetting === "animations") {
      typeStats = "dynamicRing";
    } else {
      typeStats = "staticRing";
    }
  }
  return typeStats;
}

// 清空聚合图层与非聚合图层的选中
export function clearSelectedFeature(map: VisualMap) {
  let gisStore = useGisStore();
  let selectInteraction = map?.get("selectInteraction");
  if (selectInteraction) {
    selectInteraction.getFeatures().clear();
  }
  // 处理非聚合图层的选中状态
  let hasSelectFeature = map?.get("featureSelect");
  if (hasSelectFeature) {
    hasSelectFeature.set("selected", false);
    hasSelectFeature.changed(); // 触发要素样式的变化
    map.set("featureSelect", null);
  }
  // 处理聚合图层的选中状态
  let clusterSelectFeature = map?.get("clusterSelectFeature");
  if (clusterSelectFeature) {
    clusterSelectFeature.setStyle((feature: any) => clusterLayerStyle(feature, gisStore.isDynamicLine, gisStore.imgIndex, false));
    map.set("clusterSelectFeature", null);
  }
}

// 实现框选
export function selectionAddDrawInteraction(map: VisualMap, value: any, callback: Function) {
  let boxSelectionSource: any = map?.get("boxSelectionSource");
  let boxSelectionVectorLayer = map?.get("boxSelectionSource");
  let boxSelectionDrawInteraction = map?.get("boxSelectionDrawInteraction"); // 框选交互控件
  if (!map) return;
  if (boxSelectionDrawInteraction) {
    map?.removeInteraction(boxSelectionDrawInteraction);
    map?.set("boxSelectionDrawInteraction", null);
    boxSelectionDrawInteraction = null;
  }
  if (boxSelectionVectorLayer) {
    map?.removeLayer(boxSelectionVectorLayer);
    map?.set("selectionVectorLayer", null);
    boxSelectionVectorLayer = null;
  }
  if (boxSelectionSource) {
    boxSelectionSource?.clear();
    map?.set("boxSelectionSource", null);
    boxSelectionSource = null;
  }

  boxSelectionSource = new VectorSource();
  boxSelectionVectorLayer = new VectorLayer({
    source: boxSelectionSource,
    style: selectBoxStyle
  });

  map.addLayer(boxSelectionVectorLayer);
  map?.set("boxSelectionVectorLayer", boxSelectionVectorLayer);
  map?.set("boxSelectionSource", boxSelectionSource);

  boxSelectionDrawInteraction = new Draw({
    source: boxSelectionSource,
    type: value,
    geometryFunction: value === "Circle" ? createBox() : undefined,
    style: selectBoxStyle
  });
  map.addInteraction(boxSelectionDrawInteraction);
  map?.set("boxSelectionDrawInteraction", boxSelectionDrawInteraction);

  boxSelectionDrawInteraction.on("drawstart", function () {
    boxSelectionSource?.clear(); //不写的话可以绘制多次，添加后只能绘制一次
  });

  boxSelectionDrawInteraction.on("drawend", function (evt: DrawEvent) {
    const polygon = evt.feature?.getGeometry();
    if (!polygon || !map) return;
    const extent = polygon?.getExtent();
    const currentZoom = map?.getView()?.getZoom(); // 当前层级
    let selectionFeatures = [];

    // 框选的要素
    let layerMap = map?.get("layerMap");
    for (let key in layerMap) {
      let layer: any = layerMap[key]; // 每个图层
      if (layer && currentZoom) {
        // 所属图层不可见则忽略
        if (currentZoom < layer.getMinZoom() || currentZoom > layer.getMaxZoom()) continue;
        // 需要考虑聚合和非聚合图层，然后取出要素
        const isTagAgg = layer.get("isTagAgg");
        let source: any;
        if (isTagAgg) {
          const clusterDataSource = layer.getSource();
          clusterDataSource.forEachFeatureInExtent(extent, function (feature: any) {
            if (!feature.get("features")) {
              // 如果要素不是聚合要素，则为原始要素
              selectionFeatures.push(feature);
            } else {
              // 如果要素是聚合要素，则进一步处理每个子要素
              const clusterFeatures = feature.get("features");
              selectionFeatures.push(...clusterFeatures);
            }
          });
        } else {
          source = layer.getSource();
          if (source instanceof VectorSource) {
            const features = layer.getSource().getFeaturesInExtent(extent);

            selectionFeatures.push(...features);
          }
        }
      }
    }
    // 调用方法将要素抛出去应用实现逻辑
    callback(selectionFeatures);
  });
}
