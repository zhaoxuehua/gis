import { addLabel, deleteLabel } from "../../api/visconfig";
import { ElMessage } from "element-plus";
import Draw, { DrawEvent, createBox } from "ol/interaction/Draw";
import type { Type } from "ol/geom/Geometry";
import { ref } from "vue";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Circle } from "ol/geom";
import Overlay from "ol/Overlay";
import type { FeatureLike } from "ol/Feature";
import { isObject, find } from "lodash";
import { useGisStore } from "../../stores/modules/gis";
import type { LabelInfoData, VisualMap, LabelType, VisualDraw, VisualGeometry, LabelData } from "../type";
import { MAP_DATA_TYPE, getGeometryCenter, getCoordinate, getLonLatCoordinate } from "./createGeometry.js";
import { createStyle, selectBoxStyle } from "./styleFunction.js";
import { clearSelectionDrawInteraction } from "./clearSelectionDrawInteraction";
import { judgeIncludePolygon } from "./judgeIncludePolygonFun";
import { fromLonLat } from "ol/proj";
import moment from "moment";

// 创建标签(标签树、导航树新增标签  featureType 标签类型配置的数据)
export function createLabel(map: VisualMap, featureType: LabelType, isTagTreeAdd: boolean, callbackFn: Function) {
  ElMessage({
    message: "进入绘制模式，退出绘制请按 ESC 键",
    type: "success"
  });
  if (!map) return;
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
  const refLayer = map?.defaultOptions?.layers?.find((item: any) => item.id === featureType.layerConfigId);
  const layerMap = map?.get("layerMap") || {};
  const layer = layerMap[refLayer?.code];
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
    // 坐标转换：EPSG:3857转为EPSG:4326(绘制时投影=>经纬度)
    if (!featureCoordinates) return;
    featureCoordinates = getLonLatCoordinate(featureCoordinates);
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
      name: isTagTreeAdd ? `${featureType.name}_${moment().format("YYYYMMDDHHmmss")}` : featureType.name, // 标签类型名称(导航树取设备名、标签树取标签类型名+时间)
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
        // 同时删除关联关系(标签树中的删除可能有关联关系删除可能没，导航树中的删除一定有关联关系删除)
        removeRelation(label);
      }
    },
    (err: any) => {
      console.warn(err);
      // ElMessage.error("删除标签失败");
    }
  );
}

// 删除关联关系(导航树的删除一定存在关联关系的删除。标签树的删除可能存在可能不存在---提示都改成标签的提示且两个接口提示一次)
export function removeRelation(label: LabelInfoData) {
  let gisStore = useGisStore();
  const relationMap = gisStore?.relationMap;
  // 检查是否有关联关系
  const node = find(relationMap, (item: any) => {
    return item.associationInfo && item.associationInfo.associationObjectCode === label.code;
  });
  if (!node || !node.associationInfo) return ElMessage.success("删除标签成功"); // 纯标签的删除提示
  // 有关联关系的标签删除需要更新导航树及关联关系
  // 更新导航树及关联关系
  gisStore?.fetchNavigationTree();
  gisStore?.fetchCollectRelation();
  ElMessage.success("删除标签成功");
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
      opacity: originalData?.pellucidity,
      rotation: originalData?.displayRotate || 0
    },
    text: {
      text: originalData?.dataType == "6" ? originalData?.content : originalData?.name, // 文本内容（文本时取值配的值，其他默认显示标签名称时取值标签类型的name）
      font:
        (originalData?.isBold ? "bold" : "normal") +
        " " +
        ((originalData.fontSize || 12) + "px") +
        " " +
        (originalData.fontType || "MicrosoftYaHei"),
      fill: originalData?.fontColor || "rgba(0, 0, 0, 1)", // 字体颜色
      offsetX: 0, // 文本水平方向偏移量
      offsetY: 0, // 文本垂直方向偏移量
      maxAngle: 6.283185307179586, // placement 设置为 'line' 时，允许相邻字符之间的最大角度
      rotation: 0, // rotation旋转角度
      placement: "point", // 标注（文本）放置方式  point line
      fontStrokeWidth: 0, // 描边大小
      fontStrokeColor: "rgba(255, 255, 255, 0.5)", // 字体阴影填充色（描边颜色）有描边大小才有描边颜色
      backgroundFill: originalData?.backGroundColor, // 背景填充色（边框）
      backgroundStrokeWidth: originalData?.borderWidth, // 边框线宽
      backgroundStrokeColor: originalData?.borderColor // 边框颜色
    },
    // 矢量线
    lineVector: {
      path: originalData?.lineVectorPath || "",
      width: originalData?.lineVectorWidth || 10,
      height: originalData?.lineVectorHeight || 10
    }
  };
}

const clearSelectFeatureTimer = ref<number>();
// 标签树、导航树选中label(是标签树或导航树的点击还是地图上的点击)
export function labelOnSelect(map: VisualMap, featureCode: string | number, isFeatureClick: boolean, isRealTimeData?: boolean) {
  if (!map || !featureCode) {
    return;
  }

  let labelInfo: any;
  if (!isRealTimeData) {
    let labelInfoMap = map?.get("labelInfoMap") || {};
    labelInfo = labelInfoMap[featureCode];
  } else {
    let labelInfoMap = map?.get("trackInfoMap") || [];
    labelInfo = labelInfoMap.filter((item: any) => item.code == featureCode)?.[0] || {}; // code后端可能数字可能字符串
  }
  if (!labelInfo) {
    return;
  }
  // 点击的不是要绘制节点
  if (Object.keys(labelInfo).length == 0) {
    ElMessage.warning("当前目标不在地图上!");
    return;
  }
  let layer: any = null;
  if (!isRealTimeData) {
    layer = map?.get("layerMap")[labelInfo.refLayer?.code];
  } else {
    layer = map?.get("layerMap")[labelInfo.layerCode];
  }

  const minZoom = Math.ceil(layer?.getMinZoom()); // 图层最小层级
  const maxZoom = Math.floor(layer?.getMaxZoom()); // 图层最大层级

  let zoom = minZoom;
  // 视图缩放策略（点（点文本）取值最大值  线（线、环）平均值  其他均值）  兼容外部对象(外部对象目前没存数据类型)
  let dataType = labelInfo?.labelType?.dataType || labelInfo?.dataType;
  if (["1", "6"].includes(dataType)) {
    zoom = maxZoom;
  }
  if (["2", "7"].includes(dataType)) {
    zoom = Math.ceil((maxZoom + minZoom) / 2);
  }

  let center: any = null;
  if (!isRealTimeData) {
    const labelData = isObject(labelInfo.labelData) ? labelInfo.labelData : JSON.parse(labelInfo.labelData);
    center = getGeometryCenter(labelData);
  } else {
    center = fromLonLat([labelInfo.lon, labelInfo.lat]);
  }

  // 对标签、导航树要素定位
  if (!isFeatureClick) {
    map.getView().animate(
      { zoom: zoom },
      { center: center },
      {
        // duration: 500
      },
      function () {
        setTimeout(() => {
          SelectFeatureAndPopData();
        }, 200);
      }
    );
  } else {
    SelectFeatureAndPopData();
  }

  // 选中及弹框
  function SelectFeatureAndPopData() {
    const isTagAgg = layer.get("isTagAgg"); // 是否聚合图层
    clearSelectedFeature(map);
    if (isTagAgg) {
      const clusterDataSource = layer?.getSource();
      // 当聚合图层不在首次视图层级时，首次获取不到聚合要素为clusterDataSource?.getFeatures()=[]
      clusterDataSource?.getFeatures()?.forEach(function (clusterFeature: any) {
        clusterFeature.get("features").forEach(function (originalFeature: any) {
          if (originalFeature.get("code") === featureCode) {
            // 分是否外部对象(实时数据绘制与基础引擎标签)
            originalFeature.set("selected", true); // 非聚合图层的可以这样实现
            originalFeature.changed();
            map.set("featureSelect", originalFeature);
          }
        });
      });
    } else {
      let source = layer.getSource();
      const selectFeature = source?.getFeatureById(featureCode);
      if (selectFeature) {
        selectFeature.set("selected", true); // 非聚合图层的可以这样实现
        selectFeature.changed();
        map.set("featureSelect", selectFeature);
      } else {
        ElMessage.warning("当前目标不在地图上!");
      }
    }
    let featureName = labelInfo?.name;
    // 地图上直接点击要素不需要走弹框弹出（因为地图上有的要素需要选中状态有的不需要所以直接根据需要调用弹框展示及要素显示）
    !isFeatureClick && map.popupInfo({ featureCode, featureName, center });
    clearSelectFeatureTimer.value = window.setTimeout(function () {
      // 3秒后清空选中状态
      clearSelectedFeature(map);
    }, 3000);
  }
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
  let geo = feature?.getGeometry();
  if (!geo) {
    return;
  }
  // 考虑坐标点的编辑(替换为新的经度和纬度值)
  // 如果是圆的话特殊处理
  if (dataType === "4") {
    if (feature.getGeometry() instanceof Circle) {
      geo?.setRadius(labelData.labelData?.radius);
      geo?.setCenter(getCoordinate(labelData.labelData.coordinates));
    }
  } else {
    geo.setCoordinates(getCoordinate(labelData.labelData.coordinates));
  }

  feature.setId(labelData.code);
  feature.set("code", labelData.code);
  feature.set("name", labelData.name);
  feature.set("layerCode", labelData.refLayer.code); // 所属图层编码
  feature.set("labelTypeCode", labelData.labelType.code); // 所属标签类型编码
  feature.set("type", labelData?.labelType?.dataType); // 数字型
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
  clearSelectFeatureTimer.value && clearTimeout(clearSelectFeatureTimer.value);
  // 处理聚合非聚合图层的选中状态
  let hasSelectFeature = map?.get("featureSelect");
  if (hasSelectFeature) {
    hasSelectFeature.set("selected", false);
    hasSelectFeature.changed(); // 触发要素样式的变化
    map.set("featureSelect", null);
  }
}

// 实现框选
export function selectionAddDrawInteraction(
  map: VisualMap,
  value: any, // 框选模式值
  callback: Function, // 框选完成后的回调
  isTrue: boolean, // 是否只能框选一次不能连续框
  closeBtnOverlayCallback?: Function // 关闭框选按钮的回调
) {
  if (!map) return;
  clearSelectionDrawInteraction(map);
  let boxSelectionSource: any = map?.get("boxSelectionSource"); // 框选图层数据源
  let boxSelectionVectorLayer = map?.get("boxSelectionVectorLayer"); // 框选图层
  let boxSelectionDrawInteraction = map?.get("boxSelectionDrawInteraction"); // 框选交互控件
  let closeBtnOverlay = map?.get("closeBtnOverlay"); // 框选附加信息关闭按钮

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
    geometryFunction: value === "Circle" ? createBox() : undefined, // 矩形
    condition: event => {
      // 鼠标右键:停止 当前操作  右击不开始绘制新的框选
      if (event.originalEvent && event.originalEvent.button === 2) {
        if (boxSelectionDrawInteraction) {
          boxSelectionDrawInteraction.finishDrawing();
          boxSelectionDrawInteraction.removeLastPoint();
        }
        return false;
      }
      return true;
    },
    style: selectBoxStyle
  });
  map.addInteraction(boxSelectionDrawInteraction);
  map?.set("boxSelectionDrawInteraction", boxSelectionDrawInteraction);

  boxSelectionDrawInteraction.on("drawstart", function () {
    boxSelectionSource?.clear(); //不写的话可以绘制多次框选，添加后只能绘制一个
    // 清空附加的关闭按钮
    if (map?.get("closeBtnOverlay")) {
      map?.removeOverlay(map?.get("closeBtnOverlay"));
      map?.set("closeBtnOverlay", null);
    }
    // 动态创建overLayer
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
      clearSelectionDrawInteraction(map);
      overDiv = null;
      closeBtnOverlayCallback && closeBtnOverlayCallback();
    };
  });

  boxSelectionDrawInteraction.on("drawend", function (evt: DrawEvent) {
    const polygon = evt.feature?.getGeometry();
    if (!polygon || !map) return;
    // 框选关闭按钮逻辑
    let cor = (polygon as any)?.getCoordinates();
    let closeBtnOverlay = map?.get("closeBtnOverlay");
    value == "Polygon" && closeBtnOverlay && closeBtnOverlay?.setPosition(cor[0][0]); // 多边形
    value == "Circle" && closeBtnOverlay && closeBtnOverlay?.setPosition(cor[0][1]); // 矩形

    // 框选要素或者区域
    const currentZoom = map?.getView()?.getZoom(); // 当前视图层级
    let selectionFeatures: any = []; // 框选的要素数组
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
          const clusterDataSource = layer?.getSource();
          let features = clusterDataSource?.getFeatures();
          features?.forEach((feature: any) => {
            if (!feature?.get("features")) {
              // 如果要素不是聚合要素，则为原始要素
              let geometry = feature?.getGeometry();
              let type = feature?.get("type");
              let isInclude = judgeIncludePolygon(polygon, geometry, type); //  判断是否在多边形区域内的判断方法
              if (isInclude) {
                selectionFeatures.push(feature);
              }
            } else {
              //如果要素是聚合要素，则进一步处理每个子要素
              let clusterFeatures = feature?.get("features"); // 聚合处的原始要素数组
              clusterFeatures?.forEach((originFeature: any) => {
                let geometry = originFeature?.getGeometry();
                let type = originFeature?.get("type");
                let isInclude = judgeIncludePolygon(polygon, geometry, type);
                if (isInclude) {
                  selectionFeatures.push(originFeature);
                }
              });
            }
          });
        } else {
          source = layer?.getSource();
          if (source instanceof VectorSource) {
            // 判断是否在框选区域内的判断方法
            let features = layer?.getSource()?.getFeatures(); // 获取图层数据源上的所有要素数组
            features?.forEach((feature: any) => {
              let geometry = feature?.getGeometry(); // 获取要素的几何对象
              let type = feature?.get("type"); // 获取之前存的点线面类型字段值
              let isInclude = judgeIncludePolygon(polygon, geometry, type);
              if (isInclude) {
                selectionFeatures.push(feature);
              }
            });
          }
        }
      }
    }
    // 调用方法将要素抛出去应用实现逻辑 isTrue是true只能框一次，回调函数参数是框选的坐标点数组
    !isTrue && callback(selectionFeatures);
    isTrue && callback((polygon as any).getCoordinates());
    isTrue && boxSelectionDrawInteraction.setActive(false); // isTrue是true时只能框选一次不能左击后继续框选
  });
}

// 地图穿透选择标签(左击、右击) map及像素点 要素需要存type
export function getSelectedFeature(map: VisualMap, pixel: any) {
  if (!map || !pixel) return;
  let typeMap: any = {
    point: [], // 1 6  (点)  取第一个
    line: [], // 2  7 线（环） 取第一个
    polygon: [], // 3 4 5  面（圆、矩形、面）  分取最小的面
    other: [] // 其他
  };
  map?.forEachFeatureAtPixel(
    pixel,
    function (feature: FeatureLike) {
      // 选中的各个要素
      let targetFeature: any;
      const { features } = feature?.getProperties(); // 针对聚合要素，聚合要素的话features是数组
      if (features && features?.length) {
        targetFeature = features?.[0]; // 取聚合要素的第一个原始要素
      } else {
        targetFeature = feature;
      }
      if (targetFeature) {
        const type = targetFeature.get("type");
        // 点 文本  轨迹圆圈
        if (type == "1" || type == "6" || type == "trackPoint") {
          typeMap["point"].push(targetFeature);
        } else if (type == "2" || type == "7") {
          typeMap["line"].push(targetFeature);
        } else if (type == "3" || type == "4" || type == "5") {
          typeMap["polygon"].push(targetFeature);
        } else {
          typeMap["other"].push(targetFeature);
        }
      }
    },
    { hitTolerance: 5 } // 设置捏合度为 5 像素
  );
  // 判断类型下要素优先级看选哪个
  let currentSelectFeature = null;
  if (typeMap.point.length) {
    // 如果有点 使用第一个
    currentSelectFeature = typeMap.point[0];
  } else if (typeMap.line.length) {
    // 如果有线: 使用第一个
    currentSelectFeature = typeMap.line[0];
  } else if (typeMap.polygon.length) {
    // 面和面叠加，找出最小面积的面
    let polygonArr: any[] = [];
    typeMap.polygon.forEach((polygonFeature: any) => {
      const polygonType = polygonFeature.get("type");
      const geometry = polygonFeature?.getGeometry();
      let area;
      if (polygonType == "3" || polygonType == "5") {
        area = geometry.getArea();
        polygonArr.push({ val: polygonFeature, area: area });
      } else {
        // 圆的面积的计算
        const radius = geometry?.getRadius();
        area = Math.PI * Math.pow(radius, 2);
        polygonArr.push({ val: polygonFeature, area: area });
      }
    });
    polygonArr.sort((a, b) => a.area - b.area);
    currentSelectFeature = polygonArr?.[0].val;
  } else {
    currentSelectFeature = typeMap.other?.[0];
  }
  return currentSelectFeature;
}

// 根据设备code查标签code（报警要素点击时需要查到对应设备的标签）
export function getFeatureCodeByEquipCode(equipCode: string, map: VisualMap) {
  let featureInfo: { [key: string]: any } = {};
  let labelInfoMap = map?.get("labelInfoMap") || {};
  let gisStore = useGisStore();
  let featureCode = gisStore?.relationMapKeyIsEquipCode?.[equipCode];
  if (featureCode) {
    featureInfo.featureLabelCode = featureCode;
    featureInfo.featureLabelType = labelInfoMap?.[featureCode]?.labelType?.code;
  }
  return featureInfo;
}
