// GIS图层配置（详情）
export const GIS_LAYER_DETAIL = [
  {
    label: "图层编码",
    name: "code"
  },
  {
    label: "图层名称",
    name: "name"
  },
  {
    label: "默认显示层级",
    name: "layerLevel"
  },
  {
    label: "最低显示层级",
    name: "layerMinLevel"
  },
  {
    label: "最高显示层级",
    name: "layerMaxLevel"
  },
  {
    label: "标签聚合",
    name: "isTagAgg",
    slot: true
  },
  {
    label: "标签聚合距离",
    name: "tagAggDistance",
    slot: true
  },
  {
    label: "轨迹聚合",
    name: "isTrackDraw",
    slot: true
  },
  {
    label: "轨迹聚合距离",
    name: "trackAggDistance",
    slot: true
  }
];

// GIS标签信息
export const GIS_LABEL_DETAIL = [
  {
    label: "标签编码",
    name: "code"
  },
  {
    label: "标签名称",
    name: "name"
  },
  {
    label: "标签类型",
    name: "labelType",
    slot: true
  },
  {
    label: "所属图层",
    name: "refLayer",
    slot: true
  },
  {
    label: "标签数据",
    name: "labelData"
  }
];

//应用场景配置详情
export const GIS_MAPPARAMS_DETAIL = [
  {
    label: "场景编码",
    name: "appCode"
  },
  {
    label: "场景名称",
    name: "appName"
  },
  {
    label: "地图加载方式",
    name: "mapLoadMode",
    slot: true
  },
  {
    label: "离线电子地图",
    name: "normalUrl"
  },
  {
    label: "离线卫星地图",
    name: "sateUrl"
  },
  {
    label: "离线路网叠加层",
    name: "overlayUrl"
  },
  {
    label: "默认显示模式",
    name: "displayMode",
    slot: true
  },
  {
    label: "默认展示层级",
    name: "defaultDisplayLevel"
  },
  {
    label: "最低层级",
    name: "minLevel"
  },
  {
    label: "最高层级",
    name: "maxLevel"
  },
  {
    label: "中心点纬度",
    name: "defaultCenterPointLatitude"
  },
  {
    label: "中心点经度",
    name: "defaultCenterPointLongitude"
  },
  {
    label: "显示标签类型",
    name: "displayLabelInfoIds",
    slot: true
  },
  {
    label: "搜索标签类型",
    name: "displaySearchIds",
    slot: true
  },

  {
    label: "显示图层",
    name: "displayLayerIds",
    slot: true
  },
  {
    label: "显示控件",
    name: "displayControlIds",
    slot: true
  },
  {
    label: "显示图例",
    name: "displayLegend",
    slot: true
  },
  {
    label: "距离单位",
    name: "scaleLineUnit",
    slot: true
  },
  {
    label: "左键弹窗位置",
    name: "leftClickDialogPosition",
    slot: true
  },
  {
    label: "导航树",
    name: "customTreeType",
    slot: true
  },
  {
    label: "设备树",
    name: "customTreeCode",
    slot: true,
    optional: true
  },
  {
    label: "自定义配置",
    name: "externalCustomTree",
    slot: true,
    optional: true
  },
  {
    label: "关键词显示配置",
    name: "keywordConfig",
    slot: true
  },

  {
    label: "是否可编辑",
    name: "isEdit",
    slot: true
  }
];

// GIS标签类型配置详情  带有optional属性的，有值的时候才会显示
export const GIS_LABEL_TYPE_DETAIL = [
  {
    label: "标签类型编码",
    name: "code"
  },
  {
    label: "标签类型名称",
    name: "name"
  },
  {
    label: "所属图层",
    name: "layerConfigId",
    slot: true
  },
  {
    label: "对象关联配置",
    name: "reference",
    slot: true
  },
  {
    label: "默认显示标签名称",
    name: "isDefaultDisplayLabelName",
    slot: true
  },
  {
    label: "默认挂载标签树",
    name: "isHang",
    slot: true
  },
  {
    label: "标签图例",
    name: "labelLegendImagePath",
    slot: true
  },
  {
    label: "数据类型",
    name: "dataType",
    slot: true
  },
  {
    label: "数据来源",
    name: "dataSource",
    slot: true,
    optional: true
  },
  {
    label: "数据内容",
    name: "dataContent",
    slot: true,
    optional: true
  },
  {
    label: "样式",
    name: "selectStyle",
    slot: true,
    optional: true
  },
  {
    label: "内置样式对象",
    name: "styleObject",
    slot: true,
    optional: true
  },
  {
    label: "显示比例",
    name: "displayScale",
    slot: true,
    optional: true
  },
  {
    label: "标签类型图片",
    name: "labelTypeImagePath",
    slot: true,
    optional: true
  },
  {
    label: "轨迹设置",
    name: "isTrackSetting",
    slot: true,
    optional: true
  },
  {
    label: "线宽",
    name: "lineWidth",
    slot: true,
    optional: true
  },
  {
    label: "速度单位",
    name: "speedUnit",
    slot: true,
    optional: true
  },
  {
    label: "线色",
    name: "lineColor",
    slot: true,
    optional: true
  },
  {
    label: "线型",
    name: "lineType",
    slot: true,
    optional: true
  },
  // 线环数据类型下（线型是虚线特有）
  {
    label: "动画设置",
    name: "animationSetting",
    slot: true,
    optional: true
  },
  //线单独有的（矢量路径、矢量宽度、矢量高度、矢量显示比例）
  {
    label: "矢量路径",
    name: "lineVectorPath",
    // slot: true,
    optional: true
  },
  {
    label: "矢量宽度",
    name: "lineVectorWidth",
    // slot: true,
    optional: true
  },
  {
    label: "矢量高度",
    name: "lineVectorHeight",
    // slot: true,
    optional: true
  },
  {
    label: "矢量显示比例",
    name: "lineVectorProportion",
    // slot: true,
    optional: true
  },
  // 面圆矩形（有面填充色）
  {
    label: "面填充色",
    name: "polygonColor",
    slot: true,
    optional: true
  },
  // 文本特有
  {
    label: "文本内容",
    name: "content",
    slot: true,
    optional: true
  },
  {
    label: "字体",
    name: "fontType",
    slot: true,
    optional: true
  },
  {
    label: "是否加粗",
    name: "isBold",
    slot: true,
    optional: true
  },
  {
    label: "字体颜色",
    name: "fontColor",
    slot: true,
    optional: true
  },
  {
    label: "字体大小",
    name: "fontSize",
    slot: true,
    optional: true
  },
  {
    label: "边框线宽",
    name: "borderWidth",
    slot: true,
    optional: true
  },
  {
    label: "边框颜色",
    name: "borderColor",
    slot: true,
    optional: true
  },
  {
    label: "背景颜色",
    name: "backGroundColor",
    slot: true,
    optional: true
  }
];
