// 请求响应参数（包含data）
export interface Result {
  code: string;
  msg: string;
}
export interface ResultData<T = any> extends Result {
  data: T;
}

/*****************************************轨迹列表数据****************************************/
export interface trackListDataParamsType {
  beginTime: string;
  endTime: string;
  pageNumber: number;
  pageSize: number;
  regions: string | any[];
  equipCodes?: string | null;
}

export interface trackListDataItemType {
  name: string;
  code: string;
  id: number;
  [key: string]: any;
}

export interface trackListDataResponseType {
  currentPage: number;
  pageSize: number;
  totalNum: number;
  totalPage: number;
  items: trackListDataItemType[];
}

// 轨迹数据格式
export interface shipTrackDataItemType {
  AISDATA: string;
  equipCode: string;
  equipName: string;
  position: string;
  [key: string]: any;
}

export interface trackDataByIdResponseType {
  currentPage: number;
  pageSize: number;
  totalNum: number;
  totalPage: number;
  items: shipTrackDataItemType[];
}

export interface getTrackDataFieldMapType {
  attributeCode: string;
}

export interface getTrackDataFieldMapResponseType {
  [key: string]: any;
}

export interface getLayerListParamsType {
  pageNumber: number;
  pageSize: number;
}
