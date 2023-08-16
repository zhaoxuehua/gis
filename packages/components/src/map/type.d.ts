import { Draw } from "ol/interaction";
import { Geometry } from "ol/geom";
import { Feature } from "ol";
import { Style } from "ol/style.js";
import Point from "ol/geom/Point.js";
export type VisualMap = Map & { defaultOptions: { [key: string]: any }; popupInfo: function; closePopup: function };

// 标签类型
export type LabelType = {
  id?: number | null;
  code: string;
  name: string;
  layerConfigId: number | string;
  attribute: { [key: string]: any } | null;
  attributeId: number;
  equipType: { [key: string]: any } | null;
  equipTypeId: number;
  isDefaultDisplayLabelName: boolean | any;
  factor: string | null;
  labelLegendImagePath: string | null;
  labelLegendImageAllPath: string | null;
  dataType: string;
  displayScale: number;
  pellucidity: number;
  labelTypeImagePath: string | null;
  labelTypeImageAllPath: string | null;
  lineWidth: number;
  lineType: string;
  lineColor: string;
  polygonColor: string;
  lineVectorPath: string;
  lineVectorWidth: number;
  lineVectorHeight: number;
  lineVectorProportion: number;
  content: string;
  fontType: string;
  isBold: boolean;
  fontColor: string;
  fontSize: number;
  borderWidth: number;
  borderColor: string;
  backGroundColor: string;
  iconUrl?: string;
  animationSetting?: any;
  isHang?: boolean; // 是否挂载标签树
};

// 标签信息
export type LabelInfoData = {
  id?: number;
  code: string;
  name: string;
  labelData: LabelData;
  labelType: { [key: string]: any };
  labelTypeId: number;
  refLayer: { [key: string]: any };
  refLayerId: number;
};

// 标签信息中的labelData字段
export type LabelData = {
  isDefaultDisplayLabelName: boolean | null | any;
  radius?: number;
  coordinates: Coordinate | Coordinate[] | Coordinate[][];
  style: { [key: string]: any };
};

export type leftBoxData = {
  icon?: string;
  label?: string;
  isShow?: boolean;
  visible?: boolean;
  component?: any;
};

// 标签绘制
export type VisualDraw = Draw & { name: string | number };

export type VisualGeometry = Geometry & {
  getCoordinates: Function;
  getCenter: Function;
  getRadius: Function;
  getCoordinateAt: Function;
  getInteriorPoint: Function;
};

// 标签编辑表单
export type LabelForm = {
  id?: number | string | null;
  code: string;
  name: string;
  refLayer: { [key: string]: any };
  refLayerId: number | null;
  labelType: { [key: string]: any };
  labelTypeId: number | null;
  labelData: LabelData;
  font: { [key: string]: any };
};

// 导航树节点数据
export type NavigationTreeNodeData = {
  associationInfo: { [key: string]: any } | null;
  id: number;
  code: string;
  name: string;
  equipType: any;
  nodeType: any;
  nodeRelatedModel: string;
};

export type TableList = {
  loading: boolean;
  total: number;
  ids: Array<number>;
  data: Array<any>;
  getTableData: Function;
  onSelectionChange?: Function;
  onEdit?: Function;
};

// 创建要素
interface createdFeatureArgType {
  name: string;
  geometry: Point;
  extendsData?: any;
  [key: string]: any;
}

export type createdFeatureType = (data: createdFeatureArgType) => Feature;

// 创建轨迹回放
export interface trackLayerParamType {
  id: number | string;
  color: string;
  layerConfig: {
    code: string | number;
    name: string;
    layerLevel: number;
    layerMaxLevel: number;
    layerMinLevel: number;
    trackAggDistance: number;
  };
  data: any[];
}

// 显示隐藏轨迹
export type showHideTrackDataType = (id: number | string, isTrue: boolean) => void;

// 删除轨迹
export type delTrackDataType = (id: number | string) => void;

// 轨迹要素
export interface cashFeatureStyleType {
  [key: string]: Style;
}

//设置地图中心点
export interface setToMapCenterType {
  lon: number;
  lat: number;
  duration?: number;
  zoom?: number;
  callBack?: () => void;
}

// 返回多个要素的中心
export type backCenterByFeaturesType = (Features: Feature[]) => number[];
