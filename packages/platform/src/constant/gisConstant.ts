export const GIS_CONTROLS = [
  {
    code: "zoom",
    name: "显示缩放控件"
  },
  {
    code: "fullScreen",
    name: "显示全屏控件"
  },

  {
    code: "scaleLine",
    name: "显示比例尺控件"
  },
  {
    code: "showOverlay",
    name: "显示路网叠加层"
  },
  {
    code: "mapTypeSwitch",
    name: "显示地图类型控件"
  },
  {
    code: "navigationTree",
    name: "显示导航树控件"
  },
  {
    code: "tagTree",
    name: "显示标签树控件"
  },
  {
    code: "quickCreate",
    name: "显示快速绘制控件"
  },
  {
    code: "trackPlayBack",
    name: "显示轨迹回放控件"
  },
  {
    code: "search",
    name: "显示搜索控件"
  },
  {
    code: "boxSelection",
    name: "显示框选控件"
  },
  {
    code: "tagSelection",
    name: "显示标签筛选控件"
  },
  {
    code: "toolBox",
    name: "显示工具箱控件"
  },
  {
    code: "imgLegend",
    name: "显示图例控件"
  },
  {
    code: "attentionList",
    name: "显示关注列表控件"
  },

  {
    code: "whiteList",
    name: "显示白名单控件"
  }
];

// 数据类型
export const LABEL_TYPE_DATA_TYPE = {
  "1": "点",
  "2": "线",
  "3": "面",
  "4": "圆",
  "5": "矩形",
  "6": "文本",
  "7": "环"
};

export const DATA_SOURCE = {
  draw: "绘制",
  dynamicQuery: "实时查询"
};

export const SELECT_STYLE = {
  customStyle: "自定义样式",
  builtInStyle: "内置样式"
};

export const STYLE_OBJECT = {
  person: "人",
  aisBoat: "船"
};

export const LINE_TYPE = {
  solid: "实线",
  dash: "虚线"
};

export const FONT_TYPE = {
  MicrosoftYaHei: "微软雅黑",
  SimSun: "宋体"
};
export const ANIMATION_SET = {
  animations: "有",
  no: "无"
};

interface CustomTreeConfig {
  code: string;
  name: string;
  gateway: string;
  method: string;
  route: string;
  enable: string;
  [key: string]: string; // 字符串索引签名
}

// 自定义树配置
export const CUSTOM_TREE_CONFIG: CustomTreeConfig = {
  code: "树编码",
  name: "树名称",
  gateway: "网关",
  method: "请求方法",
  route: "路径",
  enable: "启用状态"
};
