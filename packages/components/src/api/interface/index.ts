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

/*****************************************单个的轨迹数据****************************************/
export interface trackDataByIdParamsType {
  equipCodes: string;
  ascDesc: string;
  isVisitObject: boolean;
  isHistory: boolean;
  beginTime: string;
  endTime: string;
  attributes?: string;
  pageNumber: 1;
  pageSize: 1000000;
}

// 轨迹数据格式
export interface shipTrackDataItemType {
  aisLocation: string;
  equipCode: string;
  equipName: string;
  position: string;
}

export interface trackDataByIdResponseType {
  currentPage: number;
  pageSize: number;
  totalNum: number;
  totalPage: number;
  items: shipTrackDataItemType[];
}
