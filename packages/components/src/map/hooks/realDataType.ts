import { Style } from "ol/style";
interface configType {
  id?: number;
  code?: string;
  navSourceCode: string; // 导航树配置
  sessionId: string; //
  isCustomSearchDialog?: boolean;
}
type getInitMapExportDataType = (map: any) => void;

// 创建船函数
interface shipParamsType {
  lat: number;
  lon: number;
  name: string;
  isDefaultDisplayLabelName?: boolean;
  type?: string;
  color: string[];
  showHeadline?: boolean;
  angle: number;
  mmsi: number;
  sog: number;
  positionReportTicks: number;
}

interface shipStyCashType {
  [key: string]: Style;
}

// 塞入基础引擎的搜索数据
interface searchShipType {
  code: string | number;
  lat: number;
  lon: number;
  dataType: string | number;
  name: string;
  equipType: number;
  labelTypeId: number;
  isVisitObject: boolean;
  layerCode: string;
}
type searchShipDataType = searchShipType[];

interface shipColorParams {
  monitorTime: number;
  colorIndex: number | undefined;
  status: string;
}

export type { configType, getInitMapExportDataType, shipParamsType, shipStyCashType, searchShipDataType, shipColorParams };
