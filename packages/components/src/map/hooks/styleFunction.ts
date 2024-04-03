import { SVG } from "@svgdotjs/svg.js";
import { Canvg } from "canvg";
import RBush from "rbush";
import { Fill, Stroke, Style, Circle as CircleStyle, Icon, Text, RegularShape, Circle } from "ol/style";
import { LineString, Point } from "ol/geom";
import { MAP_DATA_TYPE, DATA_TYPE_ARR } from "./createGeometry.js";
import selectImg from "../img/select.png";

// 选中样式(点、线、面)
export const styleAct = {
  lineStyAct: new Style({
    stroke: new Stroke({
      color: "rgba(0,150,255,0.5)",
      width: 3
    }),
    zIndex: 1
  }),

  polStyAct: new Style({
    fill: new Fill({
      color: "rgba(0,150,255,0.5)"
    }),
    stroke: new Stroke({
      color: "rgba(0,150,255,0.8)",
      width: 3
    })
  }),

  selectAct: new Style({
    // 选中样式  (点选中样式，一个红色外包框选)
    image: new Icon({
      src: selectImg,
      rotation: 0
    }),
    zIndex: 1
  })
};

// 报警样式（报警点、线、面）
export const styleAlarm = {
  pointAlarmSty: warnFault("rgba(255,0,0,1)"), // 报警点
  lineAlarmSty1: new Style({
    stroke: new Stroke({
      color: "rgba(255,0,0,0.7)",
      width: 2
    }),
    zIndex: 10
  }),
  // 报警线的动画样式1 2
  lineAlarmSty2: new Style({
    stroke: new Stroke({
      color: "rgba(255,255,255,0)",
      width: 2
    }),
    zIndex: 10
  }),
  // 报警面的动画样式1 2
  polAlarmSty1: new Style({
    fill: new Fill({
      color: "rgba(255,0,0,0.3)"
    }),
    zIndex: 10
  }),
  polAlarmSty2: new Style({
    fill: new Fill({
      color: "rgba(255,255,255,0)"
    }),
    zIndex: 10
  })
};

export function createStyle(
  data: { [key: string]: any } = {},
  typeStats: string = "",
  isDynamicLine: boolean = false,
  imgIndex: number = 0
): { [key: string]: any } {
  let GeometryType = {
    POINT: "Point", // 静态点、 动态点
    LINE_STRING: "LineString", // 静态线、闪烁线
    RING: "Ring", // 静态环、动态环

    POLYGON: "Polygon", // 面
    CIRCLE: "Circle", // 圆
    SQUARE: "Square", // 矩形
    TEXT: "Text" // 文本
  };
  let white = [255, 255, 255, 1]; // 白
  let blue = [0, 153, 255, 1]; // 蓝
  let width = 3;
  let styles: { [key: string]: any } = {};

  // LineString、MultiLineString（线宽 线色、线型） 线是虚线时有动画
  if (data.stroke) {
    styles[GeometryType.LINE_STRING] = [
      new Style({
        stroke: new Stroke({
          color: data.stroke.color,
          width: data.stroke.width,
          lineDash: data.stroke.lineDash === "dash" ? [10, 10] : undefined,
          lineDashOffset: (typeStats == "dynamicLine" || typeStats == "dynamicRing") && isDynamicLine ? 2 : 0 // 只有它是变化的
        })
      }),
      new Style({
        // 绘制线时的圆点样式
        image: new CircleStyle({
          radius: width * 2,
          fill: new Fill({
            color: blue
          }),
          stroke: new Stroke({
            color: white,
            width: width / 2
          })
        })
      })
    ];
  }

  // 线矢量（如何矢量线则使用矢量线样式函数，替换上面的线样式）
  if (data.lineVector?.path && /^(M|m).*$/.test(data.lineVector.path)) {
    // 矢量路径
    let pathSize = [data.lineVector.width, data.lineVector.height];
    let pathColor = data.stroke.color;
    let pathString = data.lineVector.path;
    // 创建canvas画布
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d");

    try {
      // svg.js，根据path创建svg
      let draw = SVG().size(pathSize[0], pathSize[1]);
      let path = draw.path(pathString);
      path.fill(pathColor);

      canvas.width = pathSize[0];
      canvas.height = pathSize[1];

      if (context) {
        context.save(); // 暂存状态
        // 平移
        context.translate(-0.5 * pathSize[0], -0.5 * pathSize[1]);
        let v = Canvg.fromString(
          context,
          '<svg width="' + pathSize[0] + '" height="' + pathSize[1] + '">' + draw.node.innerHTML + "</svg>"
        );
        v.start();
        context.restore(); // 恢复状态
      }
    } catch (error) {
      console.warn("绘制矢量路径出错", error);
    }

    // 矢量图层的styleFunction
    let styleFunction = function (feature: any, res: any) {
      //轨迹线图形
      let trackLine = feature.getGeometry();
      let styles = [
        new Style({
          stroke: new Stroke({
            color: "rgba(0,0,0,0)",
            width: 10
          })
        })
      ];
      //对segments建立btree索引
      let tree = new RBush(); //路段数
      if (Object.prototype.toString.call(trackLine.forEachSegment).slice(8, -1) !== "Function") {
        return;
      }
      trackLine.forEachSegment(function (start: any, end: any) {
        let dx = end[0] - start[0];
        let dy = end[1] - start[1];
        //计算每个segment的方向，即箭头旋转方向
        let rotation = Math.atan2(dy, dx);
        let geom = new LineString([start, end]);
        let extent = geom.getExtent();
        let item = {
          minX: extent[0],
          minY: extent[1],
          maxX: extent[2],
          maxY: extent[3],
          geom: geom,
          rotation: rotation
        };
        tree.insert(item);
      });
      //轨迹地理长度
      let length = trackLine.getLength();
      //像素间隔步长
      let stpes = pathSize[0]; //像素步长间隔
      //将像素步长转实际地理距离步长
      let geo_steps = stpes * res;
      //箭头总数
      let arrowsNum = Math.floor(length / geo_steps);
      for (let i = 1; i < arrowsNum; i++) {
        let arraw_coor = trackLine.getCoordinateAt((i * 1.0) / arrowsNum);
        let tol = 10; //查询设置的点的容差，测试地图单位是米。如果是4326坐标系单位为度的话，改成0.0001.
        let arraw_coor_buffer = [arraw_coor[0] - tol, arraw_coor[1] - tol, arraw_coor[0] + tol, arraw_coor[1] + tol];
        //进行btree查询
        let treeSearch: any = tree.search({
          minX: arraw_coor_buffer[0],
          minY: arraw_coor_buffer[1],
          maxX: arraw_coor_buffer[2],
          maxY: arraw_coor_buffer[3]
        });
        let arrow_rotation;
        //只查询一个，那么肯定是它了，直接返回
        if (treeSearch.length == 1) arrow_rotation = treeSearch[0].rotation;
        else if (treeSearch.length > 1) {
          let results = treeSearch.filter(function (item: any) {
            //箭头点与segment相交，返回结果。该方法实测不是很准，可能是计算中间结果
            //保存到小数精度导致查询有点问题
            // if(item.geom.intersectsCoordinate(arraw_coor))
            //   return true;

            //换一种方案，设置一个稍小的容差，消除精度问题
            let _tol = 1; //消除精度误差的容差
            if (
              item.geom.intersectsExtent([arraw_coor[0] - _tol, arraw_coor[1] - _tol, arraw_coor[0] + _tol, arraw_coor[1] + _tol])
            )
              return true;
          });
          if (results.length > 0) arrow_rotation = results[0].rotation;
        }
        styles.push(
          new Style({
            geometry: new Point(arraw_coor),
            image: new Icon({
              img: canvas,
              imgSize: pathSize,
              scale: 1,
              rotateWithView: true,
              rotation: -arrow_rotation
            })
          })
        );
      }
      return styles;
    };

    styles[GeometryType.LINE_STRING] = styleFunction;
  }

  // 环（同线）
  styles[GeometryType.RING] = styles[GeometryType.LINE_STRING];

  // Polygon MultiPolygon(面考虑：填充色及线的样式（线宽、线色、线型）)
  if (data.fill) {
    styles[GeometryType.POLYGON] = [
      new Style({
        fill: new Fill({
          color: data.fill.color
        })
      })
    ].concat(styles[GeometryType.LINE_STRING]);
  }

  // Circle(圆=面)
  styles[GeometryType.CIRCLE] = styles[GeometryType.POLYGON];

  // Square（矩形=面）
  styles[GeometryType.SQUARE] = styles[GeometryType.POLYGON];

  // Point（点） 动态变更（变更url）
  if (data.icon) {
    let srcImg = data.icon.src ? data.icon.src.split(",") : []; // data.icon.src为标签类型中配置的图片路径
    srcImg = srcImg.map((item: string) => {
      if (!item.includes("api/gis-service/equip/gisLabel/type/getAllPathByFileName")) {
        return `/api/gis-service/equip/gisLabel/type/getAllPathByFileName/${item}`;
      } else {
        return item;
      }
    });

    let isDynamicPoint = false;
    if (srcImg?.length > 1) {
      isDynamicPoint = true;
    }
    let index = imgIndex % srcImg?.length;
    styles[GeometryType.POINT] = [
      new Style({
        image: new Icon({
          crossOrigin: data.icon.crossOrigin || "anonymous",
          opacity: data.icon.opacity || 1,
          scale: data.icon.scale || 1,
          rotation: data.icon?.rotation ? (Number(data.icon.rotation) * Math.PI) / 180 : 0,
          src: isDynamicPoint
            ? srcImg[index] ||
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAZCAYAAADaILXQAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAArlJREFUeNqllt1LU3EYx49Nj5EmLdfWZtHM2XHM7eyssjIhh60ta8WMdmEhgrdR3nTRVQODqFisS/sDgiIoiYgwyKAiki6ySE2DmmZMZ9uqIfTCr+/vdAZy9lt78eJzsbfP8+x5nj3PuFAoxKl5bnKVAx2wPTVJXSNGZ/eDjY6u24ZmYchgr2V9hgVLLIBLYOLVZomMmZ3kDRgzS2QUj/H8C3AWbCpYrmR7AsxObZNIrL2DpIJBkurpIQmfj3xtaSGLdjv5bHWQiQYnDfIS7CtUfhr8/NK+n/wYGCDf+/tJwu2WhSw+CiINEAPu/8rxBh9ILnT6SToSIUm/n8RzSBkBpoGFKccLevAoKraQdDhMEh5PXulyphvlABHAs+Q069+p3l6SDASKElPizXYqXwImlvzilEUk3/r6ihZneFsvN7ibJb8XFXeShNdbslwpzVWWfGhmeytZFMWS5fSbw3OFKf8klC7OJ78fFRwrkmcmhiUfeG9ZWeZ0PcATZMk9r7dIJYsX/o1iItcomsBItMmxkpIMgspcP/8ASNMsihHPYok9M7nm7hrsDo7jKoAGrGItrmvF1J7uHoh/XdcJ5yBsAg2gDqwDPChbLjeCUfo1C5FPYu3e1NseGjT8EYh8wAs6wG5QD1arD4UVzM/kqf8HJIDLNCny1Sch8avoBHvB+qw1ibMWRIA/MVuOOiPwY6MzfrxKf4YhphwEO0BN9g7muPI7hubw+FZnlngeARF86bzWfJkhPQwOgF1gg9xchlzjqlxrxiEenlI1mAYc1Ak3VEJaBg9oAxZQTR3MAy13Gc04VVO3Z9gojmcaTO/mLb1tpFZTcQyvH1Ia6AYuZUqqlHEsy3n9lwXgL2jr254Ypbl3yBgNHDdq+KPKRLSCRqCVp0LJNO9fC3X9qQANJsqIWZV6rlFnyeIvmIDJtcarlTEAAAAASUVORK5CYII="
            : srcImg[0] ||
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABcAAAAZCAYAAADaILXQAAAACXBIWXMAAC4jAAAuIwF4pT92AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAArlJREFUeNqllt1LU3EYx49Nj5EmLdfWZtHM2XHM7eyssjIhh60ta8WMdmEhgrdR3nTRVQODqFisS/sDgiIoiYgwyKAiki6ySE2DmmZMZ9uqIfTCr+/vdAZy9lt78eJzsbfP8+x5nj3PuFAoxKl5bnKVAx2wPTVJXSNGZ/eDjY6u24ZmYchgr2V9hgVLLIBLYOLVZomMmZ3kDRgzS2QUj/H8C3AWbCpYrmR7AsxObZNIrL2DpIJBkurpIQmfj3xtaSGLdjv5bHWQiQYnDfIS7CtUfhr8/NK+n/wYGCDf+/tJwu2WhSw+CiINEAPu/8rxBh9ILnT6SToSIUm/n8RzSBkBpoGFKccLevAoKraQdDhMEh5PXulyphvlABHAs+Q069+p3l6SDASKElPizXYqXwImlvzilEUk3/r6ihZneFsvN7ibJb8XFXeShNdbslwpzVWWfGhmeytZFMWS5fSbw3OFKf8klC7OJ78fFRwrkmcmhiUfeG9ZWeZ0PcATZMk9r7dIJYsX/o1iItcomsBItMmxkpIMgspcP/8ASNMsihHPYok9M7nm7hrsDo7jKoAGrGItrmvF1J7uHoh/XdcJ5yBsAg2gDqwDPChbLjeCUfo1C5FPYu3e1NseGjT8EYh8wAs6wG5QD1arD4UVzM/kqf8HJIDLNCny1Sch8avoBHvB+qw1ibMWRIA/MVuOOiPwY6MzfrxKf4YhphwEO0BN9g7muPI7hubw+FZnlngeARF86bzWfJkhPQwOgF1gg9xchlzjqlxrxiEenlI1mAYc1Ak3VEJaBg9oAxZQTR3MAy13Gc04VVO3Z9gojmcaTO/mLb1tpFZTcQyvH1Ia6AYuZUqqlHEsy3n9lwXgL2jr254Ypbl3yBgNHDdq+KPKRLSCRqCVp0LJNO9fC3X9qQANJsqIWZV6rlFnyeIvmIDJtcarlTEAAAAASUVORK5CYII="
        }),
        zIndex: Infinity
      })
    ];
  }

  // Text（文本）
  if (data.text) {
    styles[GeometryType.TEXT] = [
      new Style({
        text: new Text({
          font: data.text.font,
          text: data.text.text,
          textBaseline: data.text.textBaseline || "middle",
          offsetX: data.text.offsetX || 0,
          offsetY: data.text.offsetY || 0,
          placement: data.text.placement,
          rotation: data.text.rotation ? Math.PI / (180 / data.text.rotation) : 0,
          maxAngle: 6.283185307179586,
          overflow: false,
          fill: new Fill({
            color: data.text.fill
          }),
          stroke: Number(data.text.fontStrokeWidth)
            ? new Stroke({
                color: data.text.fontStrokeColor,
                width: Number(data.text.fontStrokeWidth)
              })
            : undefined,
          backgroundFill:
            data.text.backgroundFill &&
            new Fill({
              color: data.text.backgroundFill
            }),
          backgroundStroke: Number(data.text.backgroundStrokeWidth)
            ? new Stroke({
                color: data.text.backgroundStrokeColor,
                width: Number(data.text.backgroundStrokeWidth)
              })
            : undefined,
          padding: [5, 5, 5, 5]
        })
      })
    ];
  }
  return styles;
}

// 图层样式（点、动态点、线、面 、圆、矩形 环、文本） 线环分动态
export function layerStyle(features: any, isDynamicLine: boolean = false, imgIndex: number = 0) {
  let len = features.get("features")?.length;
  let feature = len ? features?.getProperties().features[0] : features; // 聚合要素取值第0项

  const isSelected = feature.get("selected"); // 是否选中
  let type = feature.get("type"); // 原标签类型
  const typeStats = feature.get("typeStats"); // 为了区分静态点、动态点、静态线、动态线、静态环、动态环增加的

  // 兼容type类型
  if (DATA_TYPE_ARR.includes(type)) {
    type = MAP_DATA_TYPE[type]?.value;
  }

  // 获取不同类型的样式，再根据是否选中及动态设置样式分类
  let labelData = feature.get("labelData");
  let code = feature.get("code");
  if (typeof labelData != "object") {
    console.warn(`解析标签数据出错, 标签id:${code}`);
    return;
  }

  // 获取样式
  let styleMap = createStyle(labelData.style, typeStats, isDynamicLine, imgIndex);
  let currentStyle = styleMap[type];

  // 特殊考虑矢量线的样式(currentStyle是一个函数)
  if (type === "LineString" && labelData.style.lineVector?.path) {
    feature.setStyle(currentStyle);
    return;
  }

  if (labelData.isDefaultDisplayLabelName) {
    currentStyle = currentStyle.concat(styleMap["Text"]);
  }
  if (typeStats == "dynamicPoint" || typeStats == "staticPoint" || type == "Text") {
    return isSelected ? currentStyle.concat(styleAct.selectAct) : currentStyle;
  } else if (typeStats == "staticLine" || typeStats == "dynamicLine" || typeStats == "staticRing" || typeStats == "dynamicRing") {
    return isSelected ? [styleAct.lineStyAct] : currentStyle;
  } else if (type == "Polygon" || type == "Circle" || type == "Square") {
    return isSelected ? currentStyle.concat(styleAct.polStyAct) : currentStyle;
  } else {
    return [];
  }
}

// 显示label样式
export function publicLabelStyle(name: string = "") {
  const labelStyle = new Style({
    text: new Text({
      textAlign: "left",
      textBaseline: "top",
      font: "normal 15px 微软雅黑",
      text: name, // 文本内容
      fill: new Fill({ color: "rgba(0, 0, 0, 1)" }),
      stroke: new Stroke({ color: "#fff", width: 2 }),
      offsetX: -10,
      offsetY: -10
    })
  });
  return labelStyle;
}

export function warnFault(color: string) {
  let radius = 10;
  let point = new Style({
    // 中间圆点
    image: new RegularShape({
      // 用于创建规则要素的类
      fill: new Fill({ color: color }),
      radius: radius * 0.4,
      points: radius * 2,
      scale: 1
    }),
    zIndex: 10
  });
  let border1 = new Style({
    image: new RegularShape({
      stroke: new Stroke({
        color: color,
        width: 2,
        lineDash: [radius * 1.5, radius * 0.7]
      }),
      radius: radius * 0.7,
      points: 50,
      scale: 1,
      rotation: Math.PI / (180 / 30)
    }),
    zIndex: 10
  });
  let border2 = new Style({
    image: new RegularShape({
      stroke: new Stroke({
        color: color,
        width: 2,
        lineDash: [radius * 2.2, radius * 1.1]
      }),
      radius: radius * 1.1,
      points: 50,
      rotation: Math.PI / (180 / 45),
      scale: 1
    }),
    zIndex: 10
  });
  return [point, border1, border2];
}

// 点类型报警样式缓存(根据颜色绘制)
const pointAlarmStyMap: any = {};

// 报警点图层样式
export function alarmLayerStyle(feature: any) {
  let targetFeature = feature;
  if (Array.isArray(feature?.get("features"))) {
    targetFeature = feature.get("features")[0];
  }
  const type = targetFeature.get("type");
  if (type == "1" || type == "6") {
    // 点类型报警
    const max = targetFeature.get("max");
    const selected = targetFeature.get("selected");
    const color = targetFeature.get("color") || "red"; // 颜色
    let alarmImg: any;

    if (!pointAlarmStyMap[color]) {
      pointAlarmStyMap[color] = warnFault(color);
    }
    if (selected) {
      alarmImg = pointAlarmStyMap[color]?.slice(0, max).concat(styleAct.selectAct);
    } else {
      alarmImg = pointAlarmStyMap[color]?.slice(0, max); // 返回3个样式（通过控制数组样式个数）
    }
    return alarmImg;
  } else {
    // 其他类型报警
    const visible = targetFeature.get("visible");
    if (["2", "7"].includes(type)) {
      // 线样式的渲染(线环)
      if (visible) {
        return [styleAlarm.lineAlarmSty1];
      } else {
        return [styleAlarm.lineAlarmSty2];
      }
    }
    if (["3", "4", "5"].includes(type)) {
      // 面样式的渲染（面圆矩形）
      if (visible) {
        return [styleAlarm.polAlarmSty1];
      } else {
        return [styleAlarm.polAlarmSty2];
      }
    }
  }
}

// 框选绘制图层的样式及绘制时图标样式;
export const selectBoxStyle = new Style({
  fill: new Fill({
    color: "rgba(255, 255, 255, 0.5)"
  }),
  stroke: new Stroke({
    color: "#ff3333",
    width: 2
  }),
  image: new Circle({
    radius: 7,
    stroke: new Stroke({
      color: "#ff3333"
    }),
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.2)"
    })
  })
});

// 原测量：测量绘制图层的样式及绘制时图标样式
export function measureStyle() {
  let style = new Style({
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.2)"
    }),
    stroke: new Stroke({
      color: "#ff3333",
      lineDash: [10, 10],
      width: 3
    }),
    image: new Circle({
      radius: 5,
      stroke: new Stroke({
        color: "#ff3333"
      }),
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.2)"
      })
    })
  });
  return style;
}

// 测距：圆圈及线条的样式
export const styleGraph = new Style({
  fill: new Fill({
    color: "rgba(255, 255, 255, 0.2)"
  }),
  stroke: new Stroke({
    color: "#ff3333",
    lineDash: [10, 10],
    width: 3
  }),
  image: new Circle({
    radius: 5,
    stroke: new Stroke({
      color: "#ff3333"
    }),
    fill: new Fill({
      color: "rgba(255, 255, 255, 0.2)"
    })
  })
});

// 测量：标签 完整测量的长度、面积展示的样式
export const labelStyle = new Style({
  text: new Text({
    font: "normal 14px 微软雅黑",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)"
    }),
    backgroundFill: new Fill({
      color: "#ff3333"
    }),
    padding: [3, 3, 3, 3],
    textBaseline: "bottom",
    offsetY: -15
  }),
  image: new RegularShape({
    radius: 5,
    points: 3,
    angle: Math.PI,
    displacement: [0, 10],
    fill: new Fill({
      color: "#ff3333"
    })
  })
});

// 测量：每段的样式
export const segmentStyle = new Style({
  text: new Text({
    font: "normal 11px 微软雅黑",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)"
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.8)"
    }),
    padding: [3, 3, 3, 3],
    textBaseline: "bottom",
    offsetY: -12
  }),
  // 三角箭头
  image: new RegularShape({
    radius: 6,
    points: 3,
    angle: Math.PI,
    displacement: [0, 8],
    fill: new Fill({
      color: "rgba(0, 0, 0, 0.8)"
    })
  })
});

// 测量：拖拽修改提示样式
export const modifyStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: "rgba(0, 0, 0, 0.7)"
    }),
    fill: new Fill({
      color: "rgba(0, 0, 0, 0.4)"
    })
  }),
  text: new Text({
    text: "拖动进行修改",
    font: "normal 12px 微软雅黑",
    fill: new Fill({
      color: "rgba(255, 255, 255, 1)"
    }),
    backgroundFill: new Fill({
      color: "rgba(0, 0, 0, 0.7)"
    }),
    padding: [2, 2, 2, 2],
    textAlign: "left",
    offsetX: 15
  })
});
